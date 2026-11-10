"""Clinic-owner knowledge editor. Only explicit, reviewed content reaches both channels."""
import uuid
import re
from datetime import datetime,timezone
from fastapi import Request, Depends, HTTPException

def published_owner_knowledge_snapshot():
    from app import db,decrypt
    with db() as con:
        rows=con.execute("SELECT * FROM owner_knowledge WHERE status IN ('published','draft') ORDER BY updated DESC LIMIT 80").fetchall()
        selected=[]
        for row in rows:
            if row["status"]=="published":
                selected.append(row)
            else:
                # Saving an edit should NOT unpublish the previously approved answer.
                published=con.execute("SELECT question,answer FROM owner_knowledge_history WHERE id=? AND status='published' ORDER BY revision DESC LIMIT 1",(row["id"],)).fetchone()
                if published:selected.append({"question":published["question"],"answer":published["answer"],"kind":row["kind"]})
    total=0;out=[]
    for row in selected:
        q=decrypt(row["question"]);a=decrypt(row["answer"])
        if total+len(q)+len(a)>9500:break
        out.append({"question":q,"answer":a,"type":row["kind"]})
        total+=len(q)+len(a)
    return out

def install(app, protect):
    from app import db, crypt, decrypt, authed, audit, PRIVATE_RE, check_scope
    with db() as con:
        con.executescript("""
        CREATE TABLE IF NOT EXISTS owner_knowledge(
          id TEXT PRIMARY KEY, question BLOB NOT NULL, answer BLOB NOT NULL,
          kind TEXT NOT NULL, status TEXT NOT NULL, revision INTEGER NOT NULL,
          created TEXT NOT NULL, updated TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS owner_knowledge_history(
          id TEXT NOT NULL, revision INTEGER NOT NULL, question BLOB NOT NULL,
          answer BLOB NOT NULL, status TEXT NOT NULL, changed TEXT NOT NULL,
          PRIMARY KEY(id,revision)
        );
        """)
    def listing():
        with db() as con:
            items=con.execute("SELECT * FROM owner_knowledge ORDER BY updated DESC LIMIT 200").fetchall()
        return [dict(id=r["id"],question=decrypt(r["question"]),
                     answer=decrypt(r["answer"]),kind=r["kind"],
                     status=r["status"],revision=r["revision"],
                     created=r["created"],updated=r["updated"]) for r in items]
    def published():
        with db() as con:
            items=con.execute("SELECT * FROM owner_knowledge WHERE status='published' ORDER BY updated DESC LIMIT 80").fetchall()
        out=[];length=0
        for r in items:
            q=decrypt(r["question"]);a=decrypt(r["answer"])
            if length+len(q)+len(a)>9500:break
            out.append({"question":q,"answer":a,"type":r["kind"]})
            length+=len(q)+len(a)
        return out
    def guarded(q,a):
        if not (8<=len(q)<=420 and 10<=len(a)<=2500):
            raise HTTPException(status_code=422,detail="Use 8–420 characters for the question and 10–2,500 for the answer.")
        if PRIVATE_RE.search(q) or PRIVATE_RE.search(a):
            raise HTTPException(status_code=422,detail="Remove personal identifiers before saving.")
        if re.search(r"\b(patient\s*(?:name|history|id|record)|medical\s*report|NRIC|passport\s*number|diagnos(?:e|is)|prescrib(?:e|ing))\b",q+" "+a,re.I):
            raise HTTPException(status_code=422,detail="Only public, non-clinical front-desk knowledge is allowed.")
    @app.post("/api/knowledge",dependencies=[Depends(protect)])
    async def knowledge_api(request:Request):
        authed(request,"admin")
        body=await request.json()
        if not isinstance(body,dict):raise HTTPException(status_code=400,detail="Invalid request")
        action=body.get("action")
        if action=="list":
            return {"ok":True,"items":listing()}
        if action=="save":
            q=str(body.get("question","")).strip();a=str(body.get("answer","")).strip()
            guarded(q,a)
            kind=body.get("kind","faq")
            if kind not in ("faq","conversation"):raise HTTPException(status_code=422,detail="Invalid knowledge type")
            ident=body.get("id") or str(uuid.uuid4())
            try: uuid.UUID(ident)
            except Exception:raise HTTPException(status_code=400,detail="Invalid record ID")
            stamp=datetime.now(timezone.utc).isoformat()
            with db() as con:
                old=con.execute("SELECT * FROM owner_knowledge WHERE id=?",(ident,)).fetchone()
                if old:
                    con.execute("INSERT OR IGNORE INTO owner_knowledge_history(id,revision,question,answer,status,changed) VALUES(?,?,?,?,?,?)",
                        (ident,old["revision"],old["question"],old["answer"],old["status"],stamp))
                    rev=old["revision"]+1
                    con.execute("UPDATE owner_knowledge SET question=?,answer=?,kind=?,status='draft',revision=?,updated=? WHERE id=?",
                        (crypt(q),crypt(a),kind,rev,stamp,ident))
                else:
                    count=con.execute("SELECT COUNT(*) FROM owner_knowledge").fetchone()[0]
                    if count>=150:raise HTTPException(status_code=429,detail="Knowledge limit reached. Archive unused entries.")
                    con.execute("INSERT INTO owner_knowledge VALUES(?,?,?,?,?,?,?,?)",
                        (ident,crypt(q),crypt(a),kind,"draft",1,stamp,stamp))
            audit("admin","knowledge_saved",ident[:8])
            return {"ok":True,"id":ident,"status":"draft"}
        if action in ("publish","archive","history","restore"):
            ident=str(body.get("id",""))
            try:uuid.UUID(ident)
            except Exception:raise HTTPException(status_code=400,detail="Invalid record ID")
            with db() as con:
                old=con.execute("SELECT * FROM owner_knowledge WHERE id=?",(ident,)).fetchone()
                if not old:raise HTTPException(status_code=404,detail="Knowledge entry missing")
                if action=="history":
                    rows=con.execute("SELECT revision,status,changed FROM owner_knowledge_history WHERE id=? ORDER BY revision DESC LIMIT 20",(ident,)).fetchall()
                    return {"ok":True,"versions":[dict(r) for r in rows]}
                if action=="restore":
                    try:rev=int(body.get("revision",0))
                    except Exception:rev=0
                    row=con.execute("SELECT * FROM owner_knowledge_history WHERE id=? AND revision=?",(ident,rev)).fetchone()
                    if not row:raise HTTPException(status_code=404,detail="Version missing")
                    con.execute("INSERT OR IGNORE INTO owner_knowledge_history(id,revision,question,answer,status,changed) VALUES(?,?,?,?,?,?)",
                        (ident,old["revision"],old["question"],old["answer"],old["status"],datetime.now(timezone.utc).isoformat()))
                    con.execute("UPDATE owner_knowledge SET question=?,answer=?,status='draft',revision=?,updated=? WHERE id=?",
                        (row["question"],row["answer"],old["revision"]+1,datetime.now(timezone.utc).isoformat(),ident))
                else:
                    if action=="publish" and body.get("attest") is not True:
                        raise HTTPException(status_code=422,detail="Confirm that the answer is correct and approved for public use.")
                    con.execute("UPDATE owner_knowledge SET status=?,updated=? WHERE id=?",
                        ("published" if action=="publish" else "archived",datetime.now(timezone.utc).isoformat(),ident))
            audit("admin","knowledge_"+action,ident[:8])
            return {"ok":True}
        raise HTTPException(status_code=400,detail="Unsupported action")
    return published
