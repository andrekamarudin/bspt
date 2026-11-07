#!/usr/bin/env node
// Validate BSPT GenAI nugget vault. Dependency-free; no network calls.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const vault = join(root, 'content/nuggets');
const list = JSON.parse(readFileSync(join(vault, 'catalog.json'), 'utf8'));
function requireThat(ok, msg) { if (!ok) throw Error(msg); }
function field(front, key) {
  const match = front.match(new RegExp('^' + key + ':\\s*(.+)$', 'm'));
  requireThat(match, 'missing frontmatter field ' + key);
  return match[1].trim();
}
function listField(v) { requireThat(/^\\[.*\\]$/.test(v), 'expected YAML inline list: '+v);return v.slice(1,-1).split(',').map(x=>x.trim()).filter(Boolean); }
requireThat(Array.isArray(list) && list.length === 24, 'Expected 24 launch nuggets');
const ids = new Set(), files = new Set(), cats = {learn:0,work:0,decide:0,build:0};
for (const n of list) {
  requireThat(/^BSPT-\\d{3}$/.test(n.id), 'Bad ID ' + n.id);
  requireThat(!ids.has(n.id), 'Duplicate ID ' + n.id); ids.add(n.id);
  requireThat(['learn','work','decide','build'].includes(n.category), 'Unknown category ' + n.category);
  cats[n.category]++;
  requireThat(n.file === 'content/nuggets/cards/' + n.id + '.md', 'Unexpected file '+n.id);
  requireThat(!files.has(n.file), 'Duplicate file ' + n.file); files.add(n.file);
  const full = join(root, n.file); requireThat(existsSync(full), 'Missing card ' + n.file);
  const txt=readFileSync(full,'utf8');
  const m=txt.match(/^---\\r?\\n([\\s\\S]*?)\\r?\\n---\\r?\\n/);
  requireThat(m, 'Missing YAML front matter ' + n.id);
  const f=m[1];
  for (const key of ['id','title','category','audiences','level','duration_minutes','showcase_score','human_driver','status','access','tags','connects_to'])field(f,key);
  requireThat(field(f,'id')===n.id,'ID mismatch '+n.id);
  requireThat(JSON.parse(field(f,'title'))===n.title,'Title mismatch '+n.id);
  requireThat(field(f,'category')===n.category,'Category mismatch '+n.id);
  requireThat(field(f,'level')===n.level, 'Level mismatch '+n.id);
  requireThat(field(f,'human_driver')===n.human_driver,'Driver mismatch '+n.id);
  requireThat(Number(field(f,'duration_minutes'))===n.duration_minutes && n.duration_minutes>=4 && n.duration_minutes<=20, 'Time mismatch '+n.id);
  requireThat(Number(field(f,'showcase_score'))===n.showcase_score && n.showcase_score>=1 && n.showcase_score<=5, 'Score mismatch '+n.id);
  for(const [key,arr] of [['audiences',n.audiences],['tags',n.tags],['connects_to',n.connects_to]])
    requireThat(JSON.stringify(listField(field(f,key)))===JSON.stringify(arr),key+' mismatch '+n.id);
  requireThat(field(f,'status')==='hypothesis' && n.status==='hypothesis','Unverified demand promoted: '+n.id);
  const mandatory=['**Tell a friend:**','**Human problem:**','**Byte-size ProTip:**',
    '## The before → after moment','**Safe fictional setup:**','**Copy/paste demo prompt**',
    '## Now let them try','**Evidence of learning:**','**Integrity guardrail:**','**LEGO links:**'];
  for(const item of mandatory)requireThat(txt.includes(item),'Missing '+item+' in '+n.id);
  requireThat(txt.includes('```text\\n'),'No runnable text prompt in '+n.id);
  requireThat(txt.length>1450,'Too thin for live delivery: '+n.id);
}
for (const n of list) for(const id of n.connects_to) {
  requireThat(ids.has(id),'Broken LEGO link '+n.id+' -> '+id);
  const txt=readFileSync(join(root,n.file),'utf8');
  requireThat(txt.includes('](./'+id+'.md)'), 'Missing rendered LEGO link '+n.id+' -> '+id);
}
const disk=readdirSync(join(vault,'cards')).filter(x=>x.endsWith('.md'));
requireThat(disk.length===list.length, 'Catalog/card file mismatch');
for(const file of disk)requireThat(files.has('content/nuggets/cards/'+file),'Orphan card: '+file);
for(const [key,count] of Object.entries(cats))requireThat(count===6,'Category '+key+' has '+count+' rather than 6');
const required=['README.md','CATALOG.md','selection-recipes.md','nugget-template.md','evidence-and-demo-safety.md'];
for(const file of required)requireThat(existsSync(join(vault,file)), 'Missing docs: '+file);
const index=readFileSync(join(vault,'CATALOG.md'),'utf8');
for(const id of ids)requireThat(index.includes('['+id+'](cards/'+id+'.md)'), 'Missing catalog link '+id);
console.log('PASS: 24 independent nuggets, 4 balanced categories, schema, demo, practice, ethics and links');
