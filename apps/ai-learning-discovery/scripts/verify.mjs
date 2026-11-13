#!/usr/bin/env node
// Verify published survey branching, topic source, and accessible logic page.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
const root=path.resolve('apps/ai-learning-discovery/public');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const topic=read('chc-genai/topics.js'),ctx={window:{}};
vm.runInNewContext(topic,ctx,{filename:'topics.js'});
const {CHC_RECOMMEND:rec,CHC_MATRIX:M,CHC_TRACKS:A,CHC_ORIGINAL:B}=ctx.window;
const assert=(condition,message)=>{if(!condition)throw Error(message)};
const names=['beginner','intermediate','advanced'];
assert(JSON.stringify(M)===JSON.stringify([['beginner','intermediate','intermediate'],['intermediate','intermediate','advanced'],['intermediate','intermediate','advanced']]),'Matrix changed');
const exp=['new','casual','daily'],caps=[[],['files'],['agents']];
for(let i=0;i<3;i++)for(let j=0;j<3;j++)assert(rec(exp[i],caps[j])===M[i][j],`Routing ${i}/${j} failed`);
assert(rec('',[])==='intermediate','Skip frequency must default Intermediate');
assert(rec('new',['chat','agents','files'])==='intermediate','Highest selected tool must win');
assert(rec('casual',['chat','files','agents'])==='advanced','Agents must win over files');
assert(rec('daily',[])==='intermediate','Daily chat only must be Intermediate');
const counts=[6,8,6],ids=new Set();
for(let i=0;i<3;i++){const k=names[i];assert(B[k].topics.length===8,'Before '+k+' must preserve eight exact topics');assert(A[k].topics.length===counts[i],'After '+k+' count incorrect');for(const t of A[k].topics){assert(Array.isArray(t)&&t.length===4,'Malformed after topic');assert(t[0].startsWith('chc_'),'Topic must be prefixed to prevent collision');assert(!ids.has(t[0]),'Duplicate topic ID');ids.add(t[0]);}}
const base=read('app.js'),chc=read('chc-genai/app.js'),survey=read('chc-genai/index.html'),logic=read('chc-genai/logic/index.html'),logicJS=read('chc-genai/logic.js'),cfg=JSON.parse(read('vercel.json'));
new vm.Script(chc,{filename:'chc-genai/app.js'});
new vm.Script(logicJS,{filename:'chc-genai/logic.js'});
assert(base.includes('const tracks={'),'Original generic survey changed');
assert(chc.includes('const tracks=window.CHC_TRACKS;'),'CHC must load its own topics');
assert(chc.includes('window.CHC_RECOMMEND(state.experience,state.capabilities)'),'CHC logic and explainer must share matrix');
assert(chc.includes('ai-discovery-chc-genai-v1')&&!chc.includes('const storageKey="ai-discovery-v2"'),'Browser sessions must be separated');
assert(survey.includes('/chc-genai/topics.js')&&survey.includes('/chc-genai/app.js'),'CHC survey script loading incorrect');
assert(logic.includes('id="tab-before"')&&logic.includes('id="tab-after"')&&logic.includes('id="matrix-body"'),'Before/after interactive page missing');
assert(logic.includes('/chc-genai/logic.js')&&logic.includes('/chc-genai/topics.js'),'Logic page source mismatch');
const routes=cfg.rewrites||[];
for(const p of ['/chc-genai/','/chc-genai/logic'])assert(routes.some(x=>x.source===p),'Missing route '+p);
console.log('PASS: original preserved; exact 3x3 matrix; skip/priority; CHC topic mapping (6/8/6); isolated topic IDs; logic tabs; script syntax; public routes.');
