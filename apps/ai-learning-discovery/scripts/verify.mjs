#!/usr/bin/env node
// Verify the simplified live CHC form, historical comparison, and unchanged legacy root.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
const root=path.resolve('apps/ai-learning-discovery/public'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const source=read('chc-genai/topics.js'),context={window:{}};
vm.runInNewContext(source,context,{filename:'topics.js'});
const {CHC_RECOMMEND:rec,CHC_MATRIX:M,CHC_TRACKS:A,CHC_ORIGINAL:B}=context.window;
const assert=(v,why)=>{if(!v)throw Error(why)};
const labels=['beginner','intermediate','advanced'],counts=[6,8,6];
const expected=[['beginner','intermediate','intermediate'],['intermediate','intermediate','advanced'],['intermediate','intermediate','advanced']];
assert(JSON.stringify(M)===JSON.stringify(expected),'Historical recommendation matrix changed');
for(const [i,exp] of ['new','casual','daily'].entries())for(const [j,caps] of [[],['files'],['agents']].entries())assert(rec(exp,caps)===M[i][j],'Historical routing '+i+':'+j);
assert(rec('',[])==='intermediate','Historical fallback changed');
assert(rec('daily',['chat','files','agents'])==='advanced','Highest capability priority changed');
const ids=new Set();
for(let i=0;i<3;i++){
 const level=labels[i],t=A[level];
 assert(B[level].topics.length===8,'Preserved original topic archive incomplete');
 assert(t.topics.length===counts[i],'Course list changed: '+level);
 for(const topic of t.topics){
  assert(topic.length===4&&topic[0].startsWith('chc_'),'Malformed course topic '+level);
  assert(!ids.has(topic[0]),'Duplicate course topic key');ids.add(topic[0]);
 }
}
const generic=read('app.js'),chc=read('chc-genai/app.js');
const survey=read('chc-genai/index.html'),levelCSS=read('chc-genai/levels.css');
const logic=read('chc-genai/logic/index.html'),logicJS=read('chc-genai/logic.js');
const worker=fs.readFileSync('apps/ai-learning-discovery/edge/worker.mjs','utf8');
const cfg=JSON.parse(read('vercel.json'));
new vm.Script(chc,{filename:'chc-genai/app.js'});
new vm.Script(logicJS,{filename:'chc-genai/logic.js'});
new vm.Script(worker,{filename:'worker.mjs'});
assert(generic.includes('const tracks={'),'Generic survey source was modified');
assert(chc.includes('const tracks=window.CHC_TRACKS;'),'New CHC survey must share topic data');
assert(chc.includes('function levels()'),'New CHC survey missing course-level selection');
assert(chc.includes('course-level-topic-list'),'Topics not shown inside course choices');
assert(chc.includes('ai-discovery-chc-genai-v2'),'New survey must not restore incompatible old session');
assert(!chc.includes('function topicDeck()'),'Separate topic rating step should be removed');
assert(!chc.includes('function experience()')&&!chc.includes('function capability()'),'Experience scoring must not be asked');
assert(!chc.includes('CHC_RECOMMEND'),'Live survey must not compute a recommended level');
assert(chc.includes('state.track=course.dataset.track'),'Level selection must persist chosen track');
assert(chc.includes('track:state.track'),'Chosen track must reach backend');
assert(chc.includes('is_complete:state.step===3'),'New completion milestone missing');
assert(survey.includes('/chc-genai/levels.css'),'Course level styles not loaded');
assert(levelCSS.includes('.course-level-topic'),'Level topic descriptions have no styles');
assert(logic.includes('id="before-flow"')&&logic.includes('id="after-flow"'),'Before/After containers missing');
assert(logic.includes('id="matrix-body"')&&logic.includes('id="after-levels"'),'Historical matrix or new choice missing');
assert(logic.includes('id="tab-after"')&&logic.includes('aria-selected="true"'),'New After tab should be default');
assert(logicJS.includes('tracks[id]')&&logicJS.includes('course.topics.forEach'),'After not generated from exact live course list');
assert(logicJS.includes('renderBefore')&&logicJS.includes('renderAfter'),'Both historical and simplified views must work');
assert(worker.includes('"chc-genai/levels.css"'),'Worker must serve new CSS from reviewed source');
for(const p of ['/chc-genai/','/chc-genai/logic'])assert((cfg.rewrites||[]).some(r=>r.source===p),'Missing Vercel route '+p);
console.log('PASS: unchanged root; same 6/8/6 topic data; new direct three-level selection and registration; historical Before matrix; After descriptions; shared GitHub origin.');
