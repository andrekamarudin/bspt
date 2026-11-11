"""Private admin evaluation and explicitly approved few-shot examples.

Evaluation does not open public chat sessions, book appointments, or send WhatsApp.
Unpublished corrections are NEVER part of the answering prompt. Text is encrypted.
"""
from __future__ import annotations
import re
import uuid
from datetime import datetime,timezone
from fastapi import Request,Depends,HTTPException

MAX_BATCH=20
MAX_EXAMPLES=120

def published_examples_snapshot():
    """Only human-published examples (or the previous approved revision during edits)."""
    from app import db,decrypt
    with db() as con:
        rows=con.execute("SELECT * FROM qa_examples WHERE status IN ('published','draft') ORDER BY updated DESC LIMIT 80").fetchall()
        chosen=[]
        for row in rows:
            if row["status"]=="published":
                chosen.append((row["question"],row["ideal"]))
            else:
                prior=con.execute("""SELECT question,ideal FROM qa_example_history
                              WHERE example_id=? AND status='published'
                              ORDER BY version DESC LIMIT 1""",(row["id"],)).fetchone()
                if prior:chosen.append((prior["question"],prior["ideal"]))
    answer=[];chars=0
    for question,ideal in chosen:
        q,a=decrypt(question),decrypt(ideal)
        if chars+len(q)+len(a)>6800:continue
        answer.append({"question":q,"answer":a})
        chars+=len(q)+len(a)
        if len(answer)>=12:break
    return answer

def install(app,protect):
    from app import (db,crypt,decrypt,authed,audit,PRIVATE_RE,now,
                     public_context,COST_CONTEXT,active_model,
                     generate_clinic_answer,count_and_limit,ip_key)
    with db() as con:
        con.executescript("""
        CREATE TABLE IF NOT EXISTS qa_cases(
            id TEXT PRIMARY KEY,batch_id TEXT NOT NULL,
            question BLOB NOT NULL,response BLOB,
            status TEXT NOT NULL,rating INTEGER,
            feedback BLOB,preferred BLOB,
            model TEXT,verdict TEXT,
            created TEXT NOT NULL,updated TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS qa_cases_created_idx ON qa_cases(created);
        CREATE TABLE IF NOT EXISTS qa_examples(
            id TEXT PRIMARY KEY,case_id TEXT UNIQUE,
            question BLOB NOT NULL,ideal BLOB NOT NULL,
            status TEXT NOT NULL,version INTEGER NOT NULL,
            created TEXT NOT NULL,updated TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS qa_example_history(
            example_id TEXT NOT NULL,version INTEGER NOT NULL,
            question BLOB NOT NULL,ideal BLOB NOT NULL,
            status TEXT NOT NULL,changed TEXT NOT NULL,
            PRIMARY KEY(example_id,version)
        );
        """)
    def fail(code,reason):
        raise HTTPException(status_code=code,detail=reason)
    def identifier(raw):
        try:return str(uuid.UUID(str(raw)))
        except (ValueError,TypeError,AttributeError):fail(400,"Invalid record identifier.")
    def check(text,minimum,maximum,what):
        if not isinstance(text,str):fail(422,"Invalid "+what+".")
        text=text.strip()
        if not minimum<=len(text)<=maximum:fail(422,what+" must contain "+str(minimum)+"–"+str(maximum)+" characters.")
        if PRIVATE_RE.search(text):
            fail(422,"Remove personal identifiers from "+what+" before saving.")
        return text
    def cases():
        with db() as con:
            rows=con.execute("SELECT * FROM qa_cases ORDER BY created DESC LIMIT 240").fetchall()
            return [dict(id=r["id"],batch_id=r["batch_id"],
               question=decrypt(r["question"]),response=decrypt(r["response"]) if r["response"] else "",
               status=r["status"],rating=r["rating"],feedback=decrypt(r["feedback"]) if r["feedback"] else "",
               preferred=decrypt(r["preferred"]) if r["preferred"] else "",
               model=r["model"],verdict=r["verdict"],created=r["created"],updated=r["updated"])
               for r in rows]
    def examples():
        with db() as con:
            rows=con.execute("SELECT * FROM qa_examples ORDER BY updated DESC LIMIT 160").fetchall()
            return [dict(id=r["id"],case_id=r["case_id"],question=decrypt(r["question"]),
                         ideal=decrypt(r["ideal"]),status=r["status"],version=r["version"],
                         created=r["created"],updated=r["updated"])
                    for r in rows]
    def store_example(question,ideal,case_id=None,ident=None):
        question=check(question,4,1600,"Question")
        ideal=check(ideal,10,2500,"Preferred answer")
        stamp=now()
        with db() as con:
            old=con.execute("SELECT * FROM qa_examples WHERE id=?",(ident,)).fetchone() if ident else None
            if old:
                con.execute("""INSERT OR IGNORE INTO qa_example_history
                   (example_id,version,question,ideal,status,changed) VALUES (?,?,?,?,?,?)""",
                   (old["id"],old["version"],old["question"],old["ideal"],old["status"],stamp))
                con.execute("""UPDATE qa_examples SET question=?,ideal=?,status='draft',
                   version=?,updated=? WHERE id=?""",
                   (crypt(question),crypt(ideal),old["version"]+1,stamp,ident))
                return ident
            if case_id:
                old=con.execute("SELECT id FROM qa_examples WHERE case_id=?",(case_id,)).fetchone()
                if old:
                    return store_example_update(con,old["id"],question,ideal,stamp)
            if con.execute("SELECT COUNT(*) FROM qa_examples").fetchone()[0]>=MAX_EXAMPLES:
                fail(429,"Few-shot library is full; archive and remove unused examples.")
            ident=str(uuid.uuid4())
            con.execute("""INSERT INTO qa_examples(id,case_id,question,ideal,status,version,created,updated)
                           VALUES (?,?,?,?,?,?,?,?)""",
                        (ident,case_id,crypt(question),crypt(ideal),"draft",1,stamp,stamp))
            return ident
    def store_example_update(con,ident,question,ideal,stamp):
        old=con.execute("SELECT * FROM qa_examples WHERE id=?",(ident,)).fetchone()
        if not old:fail(404,"Example missing.")
        con.execute("""INSERT OR IGNORE INTO qa_example_history
           (example_id,version,question,ideal,status,changed) VALUES (?,?,?,?,?,?)""",
           (ident,old["version"],old["question"],old["ideal"],old["status"],stamp))
        con.execute("""UPDATE qa_examples SET question=?,ideal=?,status='draft',
           version=?,updated=? WHERE id=?""",
           (crypt(question),crypt(ideal),old["version"]+1,stamp,ident))
        return ident

    @app.post("/api/reviews",dependencies=[Depends(protect)])
    async def reviews_api(request:Request):
        authed(request,"admin")
        body=await request.json()
        if not isinstance(body,dict):fail(400,"Invalid request.")
        action=body.get("action")
        if action=="list":
            return {"ok":True,"cases":cases(),"examples":examples(),
                    "published_count":len(published_examples_snapshot())}
        if action=="batch":
            raw=body.get("messages","")
            if not isinstance(raw,str) or len(raw)>35000:fail(422,"Batch is too large.")
            prompts=[line.strip() for line in raw.splitlines() if line.strip()]
            if not 1<=len(prompts)<=MAX_BATCH:fail(422,"Paste 1–20 questions, one per line.")
            prompts=[check(q,1,1600,"Test question") for q in prompts]
            allowed,_=count_and_limit("qa-batches:"+ip_key(request),8,86400)
            if not allowed:fail(429,"Daily testing batch limit reached.")
            stamp=now();batch_id=str(uuid.uuid4());ids=[]
            with db() as con:
                con.execute("BEGIN IMMEDIATE")
                if con.execute("SELECT COUNT(*) FROM qa_cases").fetchone()[0]>1000:
                    fail(429,"Test history limit reached.")
                for q in prompts:
                    ident=str(uuid.uuid4());ids.append(ident)
                    con.execute("""INSERT INTO qa_cases
                       (id,batch_id,question,status,created,updated) VALUES (?,?,?,?,?,?)""",
                       (ident,batch_id,crypt(q),"queued",stamp,stamp))
            audit("admin","test_batch_created",str(len(ids))+" questions")
            return {"ok":True,"ids":ids,"batch_id":batch_id}
        if action=="run":
            ident=identifier(body.get("id"))
            allowed,_=count_and_limit("qa-model-calls:"+ip_key(request),100,86400)
            if not allowed:fail(429,"Daily test model-call limit reached.")
            with db() as con:
                con.execute("BEGIN IMMEDIATE")
                row=con.execute("SELECT * FROM qa_cases WHERE id=?",(ident,)).fetchone()
                if not row:fail(404,"Test case missing.")
                if row["status"] not in ("queued","error"):
                    fail(409,"This test already ran or is running.")
                con.execute("UPDATE qa_cases SET status='running',updated=? WHERE id=?",(now(),ident))
            question=decrypt(row["question"])
            # Each question is its OWN stateless conversation, matching the same
            # inference helper as /api/chat. Only public read-only calendar access.
            token=COST_CONTEXT.set({"channel":"testing","session_id":None,"turn_id":ident})
            try:
                response,status,verdict,usage=await generate_clinic_answer(question,public_context(),[])
            except Exception:
                response,status,verdict="Model unavailable; retry this test.","error","unavailable"
            finally:COST_CONTEXT.reset(token)
            with db() as con:
                con.execute("""UPDATE qa_cases SET response=?,status=?,model=?,verdict=?,updated=?
                               WHERE id=?""",
                     (crypt(response),status,active_model(),verdict,now(),ident))
            audit("admin","test_case_run",ident[:8])
            return {"ok":True,"id":ident,"status":status,"response":response,
                    "model":active_model(),"verdict":verdict}
        if action=="case_delete":
            ident=identifier(body.get("id"))
            with db() as con:
                row=con.execute("SELECT id FROM qa_cases WHERE id=?",(ident,)).fetchone()
                if not row:fail(404,"Test case missing.")
                # An explicitly published few-shot can outlive its source test.
                con.execute("UPDATE qa_examples SET case_id=NULL WHERE case_id=?",(ident,))
                con.execute("UPDATE model_usage SET turn_id=NULL WHERE channel='testing' AND turn_id=?",(ident,))
                con.execute("DELETE FROM qa_cases WHERE id=?",(ident,))
            audit("admin","test_case_deleted",ident[:8])
            return {"ok":True}
        if action=="review":
            ident=identifier(body.get("id"))
            try:rating=int(body.get("rating",0))
            except (TypeError,ValueError):rating=0
            if rating not in range(1,6):fail(422,"Choose a rating from 1 to 5.")
            feedback=check(str(body.get("feedback","")),0,1300,"Review feedback")
            ideal=check(str(body.get("preferred","")),0,2500,"Preferred answer")
            with db() as con:
                row=con.execute("SELECT * FROM qa_cases WHERE id=?",(ident,)).fetchone()
            if not row:fail(404,"Test case missing.")
            if row["status"] not in ("done","reviewed"):fail(409,"Run the test before reviewing.")
            candidate=None
            if body.get("draft_example") is True:
                candidate=ideal or (decrypt(row["response"]) if rating>=4 and row["response"] else "")
                if not candidate:fail(422,"For lower ratings, write the corrected ideal answer before creating a draft.")
                if rating<=3 and candidate==decrypt(row["response"]):
                    fail(422,"Correct the answer before drafting a low-rated example.")
                # Validate before updating the review to avoid half-completed approval.
                check(decrypt(row["question"]),4,1600,"Question")
                check(candidate,10,2500,"Preferred answer")
            with db() as con:
                con.execute("UPDATE qa_cases SET rating=?,feedback=?,preferred=?,status='reviewed',updated=? WHERE id=?",
                            (rating,crypt(feedback) if feedback else None,crypt(ideal) if ideal else None,now(),ident))
            new_example=store_example(decrypt(row["question"]),candidate,case_id=ident) if candidate else None
            audit("admin","test_review_saved",ident[:8])
            return {"ok":True,"example_id":new_example}
        if action=="example_save":
            ident=identifier(body.get("id")) if body.get("id") else None
            question=check(body.get("question",""),4,1600,"Question")
            ideal=check(body.get("ideal",""),10,2500,"Preferred answer")
            new_id=store_example(question,ideal,ident=ident)
            audit("admin","fewshot_draft_saved",new_id[:8])
            return {"ok":True,"id":new_id,"status":"draft"}
        if action=="example_delete":
            ident=identifier(body.get("id"))
            with db() as con:
                row=con.execute("SELECT status FROM qa_examples WHERE id=?",(ident,)).fetchone()
                if not row:fail(404,"Example missing.")
                if row["status"]!="archived":fail(409,"Archive the example before deleting it.")
                con.execute("DELETE FROM qa_example_history WHERE example_id=?",(ident,))
                con.execute("DELETE FROM qa_examples WHERE id=?",(ident,))
            audit("admin","example_deleted",ident[:8])
            return {"ok":True}
        if action in ("example_publish","example_archive"):
            ident=identifier(body.get("id"))
            if action=="example_publish" and body.get("attest") is not True:
                fail(422,"Confirm the answer is correct, anonymized and approved for model use.")
            with db() as con:
                row=con.execute("SELECT id,status FROM qa_examples WHERE id=?",(ident,)).fetchone()
                if not row:fail(404,"Example missing.")
                status="published" if action=="example_publish" else "archived"
                con.execute("UPDATE qa_examples SET status=?,updated=? WHERE id=?",(status,now(),ident))
            audit("admin",action,ident[:8])
            return {"ok":True,"status":status}
        fail(400,"Unsupported review action.")
