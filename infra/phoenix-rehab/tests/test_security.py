"""Unit-only, synthetic secrets: production secrets are NEVER accessed."""
import os,sys,tempfile,unittest
from pathlib import Path
sandbox=tempfile.TemporaryDirectory()
os.environ.update({
 'PHOENIX_DB_PATH':str(Path(sandbox.name)/'test.db'),
 'PHOENIX_TEST_PASSWORD':'F'*40,'AI_GATEWAY_API_KEY':'G'*48,
 'PHOENIX_ADMIN_PASSWORD':'A'*40,'PHOENIX_DEV_PASSWORD':'B'*40,
 'PHOENIX_ENCRYPTION_SEED':'C'*64,'PHOENIX_SESSION_SECRET':'D'*64,
 'PHOENIX_TOTP_KEY':'E'*48,
})
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from app import crypt,decrypt,count_and_limit,setting,db,totp_counter,now,luna_decide
class SecurityTests(unittest.TestCase):
 def test_encryption(self):
  raw='Private test example';cipher=crypt(raw)
  self.assertNotIn(raw.encode(),cipher)
  self.assertEqual(decrypt(cipher),raw)
 def test_scope_is_semantic_and_decision_optional(self):
  from app import DECISION_PROMPT, SCOPE_GUARDRAILS
  self.assertIn('OBVIOUSLY',DECISION_PROMPT)
  self.assertIn('clarifying question',SCOPE_GUARDRAILS)
  self.assertNotIn('check_scope',Path(__file__).resolve().parents[1].joinpath('app.py').read_text())
 def test_rate_limit(self):
  results=[count_and_limit('unit-test',2,3600)[0] for _ in range(3)]
  self.assertEqual(results,[True,True,False])
 def test_2fa_requires_six_digits(self):
  self.assertIsNone(totp_counter('12345'))
  self.assertIsNone(totp_counter('ABCDEF'))
 def test_defaults(self):
  self.assertTrue(setting('dev')['decision'])
  self.assertFalse(setting('totp_active'))
if __name__=='__main__':unittest.main()


# Full synthetic HTTP integration checks; never use production credentials or patient data.
from fastapi.testclient import TestClient
from unittest.mock import patch,AsyncMock
from app import APP
import uuid
class APIFlows(unittest.TestCase):
    def client(self):
        return TestClient(APP,base_url='https://testserver',
                          headers={'origin':'https://testserver',
                                   'x-requested-with':'XMLHttpRequest'})
    def pilot(self,client):
        # Login attempts are isolated between synthetic tests; production limits remain intact.
        with db() as con:
            con.execute("DELETE FROM counters WHERE identifier LIKE 'pilot-login:%'")
        response=client.post('/api/access',json={'password':'F'*40})
        self.assertEqual(response.status_code,200,response.text[:150])
        return client
    def test_private_access_is_not_bypassable(self):
        with self.client() as c:
            self.assertEqual(c.get('/chat',follow_redirects=False).status_code,303)
            self.assertEqual(c.get('/dev',follow_redirects=False).status_code,303)
            self.assertEqual(c.get('/admin',follow_redirects=False).headers.get('location'),'/access?next=/admin')
            self.assertEqual(c.post('/api/admin',json={'action':'state'}).status_code,401)
            self.assertIn(c.post('/api/access',json={'password':'wrong'}).status_code,(401,429))
    def test_independent_admin_and_dev_auth(self):
        with self.client() as c:
            self.pilot(c)
            self.assertEqual(c.post('/api/admin',json={'action':'state'}).status_code,401)
            self.assertEqual(c.post('/api/auth',json={'role':'admin','action':'login',
                         'password':'A'*40}).status_code,200)
            state=c.post('/api/admin',json={'action':'state'})
            self.assertEqual(state.status_code,200)
            self.assertIn('docs',state.json())
        with self.client() as c:
            self.pilot(c)
            self.assertEqual(c.post('/api/dev',json={'action':'state'}).status_code,401)
            response=c.post('/api/auth',json={'role':'dev','action':'login',
                         'password':'B'*40})
            self.assertEqual(response.status_code,200)
            if setting('totp_active') is False:
                self.assertEqual(response.json()['status'],'setup_required')
                self.assertEqual(c.post('/api/dev',json={'action':'state'}).status_code,401)
                qr=c.post('/api/auth',json={'role':'dev','action':'totp_setup'})
                self.assertEqual(qr.status_code,200)
                self.assertTrue(qr.json()['qr'].startswith('data:image/png;base64,'))
                self.assertRegex(qr.json()['manual'],r'^[A-Z2-7]+=*$')
                self.assertEqual(qr.headers.get('cache-control'),'no-store, private')
    def test_chat_gate_and_audit(self):
        with self.client() as c:
            self.pilot(c)
            session=str(uuid.uuid4())
            async def stub(messages,tokens=500):
                if 'ALLOW or DENY' in messages[0]['content']:
                    return 'ALLOW',{'prompt_tokens':12,'completion_tokens':1}
                return 'Our synthetic test fee is S$230.',{'prompt_tokens':26,'completion_tokens':10}
            with patch('app.luna_call',side_effect=stub):
                r=c.post('/api/chat',json={'message':'What is the standard consultation fee?',
                                           'sessionId':session})
            self.assertEqual(r.status_code,200,r.text[:170])
            self.assertEqual(r.json().get('status'),'answered')
            self.assertIn('S$230',r.json()['reply'])
            with db() as con:
                row=con.execute('SELECT status,reply FROM turns WHERE session_id=?',(session,)).fetchone()
            self.assertEqual(row['status'],'done')
            self.assertNotIn(b'230',row['reply'])
    def test_short_clinic_pricing_question_end_to_end(self):
        # Independent synthetic test login, not affected by prior test clients.
        with db() as con:
            con.execute("DELETE FROM counters WHERE identifier LIKE 'pilot-login:%'")
        with self.client() as c:
            self.pilot(c)
            session=str(uuid.uuid4())
            calls=[]
            async def stub(messages,tokens=500):
                calls.append(messages)
                if 'Return only ALLOW or DENY' in messages[0]['content']:
                    return 'ALLOW',{'prompt_tokens':12,'completion_tokens':1}
                return 'Standard 45-minute consultation: S$230 nett.',{'prompt_tokens':26,'completion_tokens':10}
            with patch('app.luna_call',side_effect=stub):
                r=c.post('/api/chat',json={'message':'Pricing?','sessionId':session})
            self.assertEqual(r.status_code,200,r.text[:170])
            self.assertEqual(r.json().get('status'),'answered')
            self.assertIn('S$230',r.json()['reply'])
            self.assertEqual(len(calls),2)
            self.assertIn('Pricing?',calls[0][-1]['content'])
            self.assertIn('even if unclear',calls[0][0]['content'])

    def test_typos_and_out_of_scope_use_luna_not_regex(self):
        with db() as con:
            con.execute("DELETE FROM counters WHERE identifier LIKE 'pilot-login:%'")
        with self.client() as c:
            self.pilot(c)
            for msg,verdict,expected in (
                ('hw much 4 1hr??','ALLOW','answered'),
                ('Pls evalute my MRI results','ALLOW','answered'),
                ('Tell me a joke about crypto','DENY','declined'),
                ('pryce?','ALLOW','answered'),
            ):
                calls=[]
                async def stub(messages,tokens=500):
                    calls.append(messages)
                    if 'Return only ALLOW or DENY' in messages[0]['content']:
                        return verdict,{'prompt_tokens':12,'completion_tokens':1}
                    return 'Synthetic clinic answer.',{'prompt_tokens':18,'completion_tokens':7}
                with patch('app.luna_call',side_effect=stub):
                    response=c.post('/api/chat',json={'sessionId':str(uuid.uuid4()),'message':msg})
                self.assertEqual(response.status_code,200,response.text[:180])
                self.assertEqual(response.json()['status'],expected,msg)
                self.assertEqual(len(calls),2 if verdict=='ALLOW' else 1,msg)

    def test_bad_model_result_does_not_fall_through(self):
        with db() as con:
            con.execute("DELETE FROM counters WHERE identifier LIKE 'pilot-login:%'")
        with self.client() as c:
            self.pilot(c)
            calls=[]
            async def stub(messages,tokens=500):
                calls.append(messages)
                return 'not sure',{'prompt_tokens':12,'completion_tokens':2}
            with patch('app.luna_call',side_effect=stub):
                response=c.post('/api/chat',json={'sessionId':str(uuid.uuid4()),'message':'How about this?'})
            self.assertEqual(response.status_code,200)
            self.assertEqual(response.json()['status'],'error')
            self.assertEqual(len(calls),1)

    def test_decision_off_single_call_with_scope_guidance(self):
        from app import set_setting
        prior=setting('dev')
        try:
            set_setting('dev',{**prior,'decision':False})
            with self.client() as c:
                self.pilot(c)
                calls=[]
                async def stub(messages,tokens=500):
                    calls.append(messages)
                    return 'Can you clarify which service you mean?',{}
                with patch('app.luna_call',side_effect=stub):
                    response=c.post('/api/chat',json={'sessionId':str(uuid.uuid4()),'message':'Pryce?'})
                self.assertEqual(response.json()['status'],'answered')
                self.assertEqual(len(calls),1)
                self.assertIn('separate Luna decision is disabled',calls[0][0]['content'])
        finally:
            set_setting('dev',prior)

    def test_decision_on_two_calls_for_unclear_request(self):
        from app import set_setting
        prior=setting('dev')
        try:
            set_setting('dev',{**prior,'decision':True})
            with self.client() as c:
                self.pilot(c)
                calls=[]
                async def stub(messages,tokens=500):
                    calls.append(messages)
                    return ('ALLOW' if len(calls)==1 else 'What would you like to know?'),{}
                with patch('app.luna_call',side_effect=stub):
                    response=c.post('/api/chat',json={'sessionId':str(uuid.uuid4()),'message':'huh for tmrw??'})
                self.assertEqual(response.json()['status'],'answered')
                self.assertEqual(len(calls),2)
                self.assertIn('OBVIOUSLY',calls[0][0]['content'])
                self.assertNotIn('separate Luna decision is disabled',calls[1][0]['content'])
        finally:
            set_setting('dev',prior)

    def test_knowledge_approval_and_announcement_expiry(self):
        import base64
        from datetime import datetime,timezone,timedelta
        from app import public_context
        with self.client() as c:
            self.pilot(c)
            self.assertEqual(c.post('/api/auth',json={'role':'admin','action':'login',
                             'password':'A'*40}).status_code,200)
            payload='Synthetic public clinic FAQ for test purposes only.'
            uploaded=c.post('/api/admin',json={'action':'upload','attest':True,
                         'filename':'synthetic-faq.txt',
                         'data':base64.b64encode(payload.encode()).decode()})
            self.assertEqual(uploaded.status_code,200,uploaded.text[:160])
            state=c.post('/api/admin',json={'action':'state'}).json()
            row=next(item for item in state['docs'] if item['name']=='synthetic-faq.txt')
            self.assertFalse(row['approved'])
            self.assertEqual(c.post('/api/admin',json={'action':'approve',
                             'id':row['id']}).status_code,200)
            self.assertIn(payload,str(public_context()['references']))
            start=(datetime.now(timezone.utc)-timedelta(minutes=1)).isoformat()
            end=(datetime.now(timezone.utc)+timedelta(minutes=3)).isoformat()
            scheduled=c.post('/api/admin',json={'action':'schedule',
                            'text':'Synthetic holiday closure instruction for test',
                            'start_at':start,'end_at':end})
            self.assertEqual(scheduled.status_code,200)
            self.assertIn('Synthetic holiday closure',str(public_context()['announcements']))
            state=c.post('/api/admin',json={'action':'state'}).json()
            item=next(x for x in state['schedules'] if 'Synthetic holiday' in x['text'])
            self.assertEqual(c.post('/api/admin',json={'action':'unschedule',
                             'id':item['id']}).status_code,200)
            self.assertNotIn('Synthetic holiday closure',str(public_context()['announcements']))
            self.assertEqual(c.post('/api/admin',json={'action':'remove',
                             'id':row['id']}).status_code,200)
            self.assertNotIn(payload,str(public_context()['references']))
    def test_calendar_projection_cannot_book(self):
        with self.client() as c:
            self.pilot(c)
            fake={'date':'2026-12-01','timezone':'Asia/Singapore','openings':[],
                  'checked_branches':['Orchard'],'unavailable_branches':[],
                  'transactional':False}
            with patch('app.get_availability',new=AsyncMock(return_value=fake)):
                r=c.get('/api/availability?date=2026-12-01')
            self.assertEqual(r.status_code,200)
            self.assertIs(r.json()['transactional'],False)
            self.assertEqual(c.post('/api/availability',json={'date':'2026-12-01'}).status_code,405)
