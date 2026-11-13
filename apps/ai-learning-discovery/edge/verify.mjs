import fs from 'node:fs';
const s=fs.readFileSync('apps/ai-learning-discovery/edge/worker.mjs','utf8');
for(const id of ['/chc-genai','chc-genai/logic/index.html','chc-genai/topics.js','chc-genai/app.js','chc-genai/logic.js','chc-genai/logic.css']){
 if(!s.includes(id))throw Error('Missing Worker allowlisted route '+id);
}
if(s.includes('/admin.js')||s.includes('/admin.html'))throw Error('Admin paths must not be proxied');
if(!s.includes('githubusercontent.com/andrekamarudin/bspt/main/'))throw Error('GitHub source missing');
console.log('PASS: CHC static origin path allowlist, no admin routing, GitHub-source only');
