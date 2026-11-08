#!/usr/bin/env node
/* Verify byte-exact Git-tracked assets declared by design/figma-asset-manifest.json.
 * This validates repository provenance only. It cannot prove remote Figma sync.
 */
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
const root=process.cwd(), file=path.join(root,'design/figma-asset-manifest.json');
const manifest=JSON.parse(fs.readFileSync(file,'utf8'));
const fail=(msg)=>{console.error('FAIL '+msg);process.exitCode=1};
if(manifest.policy?.code!=='GitHub')fail('code authority must be GitHub');
if(manifest.policy?.finishedCopies!=='OneDrive (distribution only)')fail('OneDrive must be distribution only');
if(!/^https:\/\/www\.figma\.com\/design\//.test(manifest.figma?.url||''))fail('Figma design URL missing');
if(!Array.isArray(manifest.assets)||manifest.assets.length<10)fail('asset inventory incomplete');
const seen=new Set();
for(const a of manifest.assets||[]){
 if(!/^[a-z0-9./_-]+$/i.test(a.path)||a.path.startsWith('/')||a.path.includes('..')){fail('unsafe path '+a.path);continue;}
 if(seen.has(a.path))fail('duplicate asset '+a.path); seen.add(a.path);
 const full=path.join(root,a.path);
 if(!fs.existsSync(full)){fail('missing '+a.path);continue;}
 const bytes=fs.readFileSync(full);
 const h=crypto.createHash('sha1').update(Buffer.from('blob '+bytes.length+'\\0').toString().replace('\\0','\0')).update(bytes).digest('hex');
 if(h!==a.gitBlobSha)fail('source changed without manifest refresh '+a.path);
 if(bytes.length!==a.byteCount)fail('size mismatch '+a.path);
}
for(const p of ['training/ai-mental-os/v5/generate.js','training/ai-mental-os/v5/build.sh','training/ai-mental-os/v5/verify_build.py','scripts/render_collaboration_motion.py','scripts/extract_collaboration_avatars.py','.github/workflows/build-ai-mental-os-v5.yml','logos/brush-slash.svg']){
 if(!fs.existsSync(path.join(root,p)))fail('missing rebuild dependency '+p);
}
if(manifest.figma?.syncStatus==='VERIFIED' && (!manifest.figma?.verifiedAt || !Array.isArray(manifest.figma?.verifiedNodes)||manifest.figma.verifiedNodes.length<1))fail('Figma claimed verified without readback evidence');
if(!process.exitCode)console.log('PASS: '+seen.size+' original/derived visual assets match pinned Git blobs; source/build dependency inventory present. Figma status: '+manifest.figma.syncStatus+' (NOT a remote readback).');
