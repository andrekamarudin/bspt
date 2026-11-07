#!/usr/bin/env node
// Dependency-free integrity checks for the paid AI Mental OS curriculum.
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const dir=join(root,'content/paid-training');
const docs=['README.md','five-mental-upgrades.md','technical-essentials.md','session-plans.md','transfer-assessment.md','evidence.md','slide-storyboard.md'];
function check(ok,msg){if(!ok)throw new Error(msg)}
function read(path){check(existsSync(join(dir,path)),'Missing '+path);return readFileSync(join(dir,path),'utf8')}
const files=Object.fromEntries(docs.map(x=>[x,read(x)]));
const guide=files['README.md'];
check(guide.includes('Human ABOVE the loop')&&guide.includes('provable by design'), 'Missing two teaching pillars');
check(guide.includes('Outcome + Proof + Boundaries'),'Missing portable memory hook');
check(guide.includes('No participant results')&&guide.includes('24 use cases'),'Misstates evidence or product tier');
const plan=files['session-plans.md'];
const rows=plan.split('\n').filter(x=>x.startsWith('|')&&x.includes(' | ')&&/\|\s*[0-9]{1,3}\s*\|/.test(x));
const cells=rows.map(line=>line.split('|').slice(1,-1).map(x=>x.trim()));
const all=cells.filter(x=>/^\d+$/.test(x[1])&&/^\d+$/.test(x[2])&&/^\d+$/.test(x[3]));
const timed=all.filter(x=>x[0]!=='**Total**');
for(let i=1;i<=3;i++){const total=timed.reduce((sum,x)=>sum+Number(x[i]),0);check(total===[120,150,180][i-1],'Duration '+i+' adds to '+total);}
for(const key of ['Outcome + Proof + Boundaries','Proof','Autonomy','BOUNDARIES'])check(files['five-mental-upgrades.md'].toLowerCase().includes(key.toLowerCase()), 'Missing execution rule '+key);
for(const key of ['PASS','FAIL','UNKNOWN','Critical failures','rubric'])check(files['transfer-assessment.md'].toLowerCase().includes(key.toLowerCase()),'Missing assessment item '+key);
check(files['technical-essentials.md'].includes('model')&&files['technical-essentials.md'].includes('tools'),'Missing technical foundations');
check(files['evidence.md'].includes('human')&&files['evidence.md'].includes('OpenAI'),'No sourcing or oversight');
check(files['slide-storyboard.md'].includes('Proof')&&files['slide-storyboard.md'].includes('Participation'),'Story arc incomplete');
for(const document of docs)check(files[document].length>700,'Document too thin: '+document);
console.log('PASS: 7 curriculum docs; two pillars; timed 120/150/180 plans; transfer, proof and approval rules');
