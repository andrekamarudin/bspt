#!/usr/bin/env node
// Public-only GET smoke tests: no registration, no personal data, no side effects.
const base=process.env.CHC_SURVEY_ORIGIN||'https://training.bytesizeprotip.com';
const cases=[
 ['/', 'AI course survey | ByteSize ProTip',false,'text/html'],
 ['/chc-genai/','CHC GenAI training survey',true,'text/html'],
 ['/chc-genai/logic','id="tab-before"',true,'text/html'],
 ['/chc-genai/logic','id="tab-after"',true,'text/html'],
 ['/chc-genai/topics.js','CHC_RECOMMEND',true,'javascript'],
 ['/chc-genai/app.js','ai-discovery-chc-genai-v2',true,'javascript'],
 ['/chc-genai/logic.css','.after-levels',true,'text/css'],
 ['/chc-genai/levels.css','.course-levels',true,'text/css']
];
for(const [p,content,isNew,type] of cases){
 const r=await fetch(base+p,{redirect:'follow',signal:AbortSignal.timeout(20000)});
 if(r.status!==200)throw Error(p+' HTTP '+r.status);
 const src=r.headers.get('x-bspt-source');
 if(isNew&&src!=='github-main')throw Error(p+' not served from reviewed GitHub origin');
 if(!isNew&&src)throw Error('Legacy root unexpectedly routed via CHC Worker');
 if(!(r.headers.get('content-type')||'').includes(type))throw Error(p+' wrong content type');
 const body=await r.text();
 if(!body.includes(content))throw Error(p+' missing expected content');
 console.log('PASS '+p+' 200 '+type);
}
console.log('PASS: deployed CHC survey and before/after page accessible; old survey intact');
