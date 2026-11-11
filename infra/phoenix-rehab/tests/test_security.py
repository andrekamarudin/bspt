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
  self.assertIn('OUT_OF_SCOPE',DECISION_PROMPT)
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
                if 'Output only ANSWER, ASK or OUT_OF_SCOPE' in messages[0]['content']:
                    return 'ANSWER',{'prompt_tokens':12,'completion_tokens':1}
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
                if 'Output only ANSWER, ASK or OUT_OF_SCOPE' in messages[0]['content']:
                    return 'ANSWER',{'prompt_tokens':12,'completion_tokens':1}
                return 'Standard 45-minute consultation: S$230 nett.',{'prompt_tokens':26,'completion_tokens':10}
            with patch('app.luna_call',side_effect=stub):
                r=c.post('/api/chat',json={'message':'Pricing?','sessionId':session})
            self.assertEqual(r.status_code,200,r.text[:170])
            self.assertEqual(r.json().get('status'),'answered')
            self.assertIn('S$230',r.json()['reply'])
            self.assertEqual(len(calls),2)
            self.assertIn('Pricing?',calls[0][-1]['content'])
            self.assertIn('PRELIMINARY',calls[0][0]['content'])

    def test_typos_and_out_of_scope_use_luna_not_regex(self):
        with db() as con:
            con.execute("DELETE FROM counters WHERE identifier LIKE 'pilot-login:%'")
        with self.client() as c:
            self.pilot(c)
            for msg,verdict,expected in (
                ('hw much 4 1hr??','ANSWER','answered'),
                ('Pls evalute my MRI results','ANSWER','answered'),
                ('Tell me a joke about crypto','OUT_OF_SCOPE','answered'),
                ('pryce?','ASK','answered'),
            ):
                calls=[]
                async def stub(messages,tokens=500):
                    calls.append(messages)
                    if 'Output only ANSWER, ASK or OUT_OF_SCOPE' in messages[0]['content']:
                        return verdict,{'prompt_tokens':12,'completion_tokens':1}
                    return 'Synthetic clinic answer.',{'prompt_tokens':18,'completion_tokens':7}
                with patch('app.luna_call',side_effect=stub):
                    response=c.post('/api/chat',json={'sessionId':str(uuid.uuid4()),'message':msg})
                self.assertEqual(response.status_code,200,response.text[:180])
                self.assertEqual(response.json()['status'],expected,msg)
                self.assertEqual(len(calls),2,msg)

    def test_three_paths_are_advisory_and_answerer_can_override(self):
        from app import set_setting
        before=setting('dev')
        try:
            set_setting('dev',{**before,'decision':True})
            with self.client() as c:
                self.pilot(c)
                for choice,response_text in (
                    ('ANSWER','Standard consultation pricing is listed by the clinic.'),
                    ('ASK','Which clinic branch did you mean?'),
                    ('OUT_OF_SCOPE','Phoenix offers physiotherapy at several locations.'),
                ):
                    calls=[]
                    async def stub(messages,tokens=500):
                        calls.append(messages)
                        return (choice if len(calls)==1 else response_text),{}
                    with patch('app.luna_call',side_effect=stub):
                        response=c.post('/api/chat',json={'sessionId':str(uuid.uuid4()),
                                                         'message':'could you help with that?'})
                    self.assertEqual(response.json()['status'],'answered')
                    self.assertEqual(response.json()['reply'],response_text)
                    self.assertEqual(len(calls),2)
                    self.assertIn('PRELIMINARY ROUTING ADVICE',calls[1][0]['content'])
                    self.assertIn(choice,calls[1][0]['content'])
                    self.assertIn('Override this preliminary decision',calls[1][0]['content'])
        finally:
            set_setting('dev',before)

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
                self.assertIn('separate model decision is disabled',calls[0][0]['content'])
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
                    return ('ANSWER' if len(calls)==1 else 'What would you like to know?'),{}
                with patch('app.luna_call',side_effect=stub):
                    response=c.post('/api/chat',json={'sessionId':str(uuid.uuid4()),'message':'huh for tmrw??'})
                self.assertEqual(response.json()['status'],'answered')
                self.assertEqual(len(calls),2)
                self.assertIn('OUT_OF_SCOPE',calls[0][0]['content'])
                self.assertNotIn('separate model decision is disabled',calls[1][0]['content'])
        finally:
            set_setting('dev',prior)

    def test_model_catalog_filters_nonchat_and_training_models(self):
        from app import supported_chat_models,_MODEL_CATALOG_CACHE
        import asyncio
        class Reply:
            def raise_for_status(self):return None
            def json(self):
                def entry(identifier,kind='language',training='all',output=('text',)):
                    return {'id':identifier,'name':identifier.split('/')[-1],
                        'owned_by':identifier.split('/')[0],'type':kind,
                        'no_training':training,'modalities':{'input':['text'],'output':list(output)},
                        'supported_specifications':['v2'],'supported_parameters':['max_tokens'],
                        'pricing':{'input':'0.000001','output':'0.000002'}}
                return {'data':[
                    entry('openai/gpt-6-luna'),entry('anthropic/claude-sonnet-5.5'),
                    entry('openai/gpt-6-luna-batch'),entry('bad/image',kind='image'),
                    entry('bad/training-risk',training='some'),
                    entry('bad/tts',output=('audio',))]}
        class Client:
            async def __aenter__(self):return self
            async def __aexit__(self,*args):return False
            async def get(self,url):return Reply()
        before=dict(_MODEL_CATALOG_CACHE)
        try:
            _MODEL_CATALOG_CACHE.update({'checked':0,'models':None})
            with patch('app.httpx.AsyncClient',return_value=Client()):
                items=asyncio.run(supported_chat_models())
            self.assertEqual([m['id'] for m in items],
                             ['anthropic/claude-sonnet-5.5','openai/gpt-6-luna'])
            self.assertEqual(items[0]['input_per_m'],1)
            self.assertEqual(items[0]['output_per_m'],2)
        finally:
            _MODEL_CATALOG_CACHE.update(before)

    def test_developer_model_selector_save_and_rollback(self):
        from app import set_setting,active_model,public_context
        prior=setting('dev')
        catalog=[{'id':'openai/gpt-6-luna','name':'Luna'},
                 {'id':'anthropic/claude-sonnet-5.5','name':'Sonnet'}]
        try:
            with self.client() as c:
                self.pilot(c)
                with patch('app.authed',return_value=True),patch(
                    'app.supported_chat_models',new=AsyncMock(return_value=catalog)):
                    available=c.post('/api/dev',json={'action':'models'})
                    self.assertEqual(available.status_code,200)
                    self.assertEqual(len(available.json()['models']),2)
                    current=c.post('/api/dev',json={'action':'state'})
                    self.assertEqual(current.json()['model'],'openai/gpt-6-luna')
                    payload={'action':'save','model':'anthropic/claude-sonnet-5.5',
                             'decision':False,'max_day':80,'max_ip':12,
                             'max_tokens':460,'extra_policy':''}
                    saved=c.post('/api/dev',json=payload)
                    self.assertEqual(saved.status_code,200,saved.text)
                    self.assertEqual(active_model(),'anthropic/claude-sonnet-5.5')
                    self.assertEqual(public_context()['model'],'anthropic/claude-sonnet-5.5')
                    self.assertFalse(setting('dev')['decision'])
                    invalid=c.post('/api/dev',json={**payload,'model':'not-there/nope'})
                    self.assertEqual(invalid.status_code,422)
                    self.assertEqual(active_model(),'anthropic/claude-sonnet-5.5')
                    revert=c.post('/api/dev',json={**payload,'model':'openai/gpt-6-luna'})
                    self.assertEqual(revert.status_code,200)
                    self.assertEqual(active_model(),'openai/gpt-6-luna')
        finally:
            set_setting('dev',prior)

    def test_active_model_is_used_in_gateway_requests(self):
        from app import set_setting,luna_call
        import asyncio
        prior=setting('dev')
        seen=[]
        class Reply:
            status_code=200
            def json(self):
                return {'choices':[{'message':{'content':'Synthetic response'}}],
                        'usage':{'prompt_tokens':10,'completion_tokens':3}}
        class Client:
            async def __aenter__(self):return self
            async def __aexit__(self,*args):return False
            async def post(self,url,headers,json):
                seen.append(json)
                return Reply()
        try:
            for id in ('anthropic/claude-sonnet-5.5','openai/gpt-6-luna'):
                set_setting('dev',{**prior,'model':id})
                with patch('app.httpx.AsyncClient',return_value=Client()):
                    result,usage=asyncio.run(luna_call([{'role':'user','content':'Test'}]))
                self.assertEqual(result,'Synthetic response')
                self.assertEqual(seen[-1]['model'],id)
            self.assertNotIn('reasoning_effort',seen[0])
            self.assertEqual(seen[1].get('reasoning_effort'),'minimal')
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
    def test_cost_reporting_tracks_calls_and_labels_estimates(self):
        import asyncio
        from app import record_model_call,COST_CONTEXT,build_cost_report
        session_id=str(uuid.uuid4());turn_id=str(uuid.uuid4())
        old_id=str(uuid.uuid4())
        now_date='2026-11-11T01:20:00+00:00'
        with db() as con:
            con.execute("INSERT INTO sessions(id,started,last_at,request_count,ip_hash) VALUES (?,?,?,?,?)",
                        (session_id,now_date,now_date,1,'a'*64))
            con.execute("""INSERT INTO turns (id,session_id,status,question,reply,verdict,
                         usage_in,usage_out,created,finished) VALUES (?,?,?,?,?,?,?,?,?,?)""",
                        (turn_id,session_id,'done',crypt('Synthetic Q'),crypt('Synthetic A'),
                         'answer',0,0,now_date,now_date))
        fake_prices=[
          {'id':'openai/gpt-6-luna','input_per_m':0.1,'output_per_m':0.5},
          {'id':'anthropic/claude-sonnet-5.5','input_per_m':2.0,'output_per_m':10.0}
        ]
        try:
            token=COST_CONTEXT.set({'channel':'web','session_id':session_id,'turn_id':turn_id})
            try:
                record_model_call('openai/gpt-6-luna',
                                  {'prompt_tokens':10000,'completion_tokens':1000},{})
                record_model_call('anthropic/claude-sonnet-5.5',
                                  {'prompt_tokens':1000,'completion_tokens':200},
                                  {'usage':{'cost':0.003}})
            finally:COST_CONTEXT.reset(token)
            with patch('app.supported_chat_models',new=AsyncMock(return_value=fake_prices)):
                report=asyncio.run(build_cost_report())
            convo=next(r for r in report['conversations'] if r['id']==session_id)
            self.assertEqual(convo['requests'],2)
            self.assertEqual(convo['cost_usd'],0.0045)
            self.assertEqual(convo['models'],
                             ['anthropic/claude-sonnet-5.5','openai/gpt-6-luna'])
            self.assertEqual(report['currency'],'USD')
            self.assertTrue(any(r['day']=='2026-11-11' for r in report['days']))
            self.assertGreaterEqual(report['summary']['actual_usd'],0.003)
            self.assertNotIn('Synthetic Q',str(report))
            self.assertNotIn('Synthetic A',str(report))
            with db() as con:
                rows=con.execute("SELECT model,input_tokens,output_tokens FROM model_usage WHERE turn_id=?",(turn_id,)).fetchall()
            self.assertEqual(len(rows),2)
        finally:
            with db() as con:
                con.execute("DELETE FROM model_usage WHERE turn_id=?",(turn_id,))
                con.execute("DELETE FROM turns WHERE session_id=?",(session_id,))
                con.execute("DELETE FROM sessions WHERE id=?",(session_id,))

    def test_cost_report_legacy_unknown_usage_and_admin_protection(self):
        import asyncio
        from app import build_cost_report
        session_id=str(uuid.uuid4());turn_id=str(uuid.uuid4())
        stamp='2026-11-10T23:20:00+00:00'
        with db() as con:
            con.execute("INSERT INTO sessions(id,started,last_at,request_count,ip_hash) VALUES (?,?,?,?,?)",
                        (session_id,stamp,stamp,1,'f'*64))
            con.execute("""INSERT INTO turns (id,session_id,status,question,reply,
                            usage_in,usage_out,created,finished) VALUES (?,?,?,?,?,?,?,?,?)""",
                        (turn_id,session_id,'done',crypt('Synthetic prior question'),
                         crypt('Synthetic response'),0,0,stamp,stamp))
        try:
            with patch('app.supported_chat_models',new=AsyncMock(return_value=[
                {'id':'openai/gpt-6-luna','input_per_m':0.1,'output_per_m':0.5}])):
                result=asyncio.run(build_cost_report())
            row=next(r for r in result['conversations'] if r['id']==session_id)
            self.assertEqual(row['cost_usd'],0)
            self.assertEqual(row['unpriced_requests'],1)
            self.assertEqual(row['historical_requests'],1)
            self.assertTrue(any(r['day']=='2026-11-11' for r in result['days']))
            with self.client() as c:
                self.pilot(c)
                response=c.post('/api/admin',json={'action':'costs'})
                self.assertEqual(response.status_code,401)
                login=c.post('/api/auth',json={'role':'admin', 'action':'login',
                                               'password':'A'*40})
                self.assertEqual(login.status_code,200)
                with patch('app.supported_chat_models',new=AsyncMock(return_value=[])):
                    response=c.post('/api/admin',json={'action':'costs'})
                self.assertEqual(response.status_code,200)
                self.assertIn('summary',response.json())
                self.assertNotIn('question',str(response.json()))
        finally:
            with db() as con:
                con.execute("DELETE FROM turns WHERE session_id=?",(session_id,))
                con.execute("DELETE FROM sessions WHERE id=?",(session_id,))

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
