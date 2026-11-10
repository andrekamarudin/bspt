const $=id=>document.getElementById(id);
const scope=document.body.dataset.console,route=scope==='admin'?'/api/admin':'/api/dev';
const flash=$('flash');const stamp=(value)=>{try{return new Date(value).toLocaleString('en-SG',{timeZone:'Asia/Singapore',dateStyle:'medium',timeStyle:'short'})}catch{return String(value||'')}};
function report(text,good=true){flash.className='status '+(good?'success':'error');flash.textContent=text||''}
function ensureData(result){if(!result||typeof result!=='object')throw Error('Unexpected server response.');return result}
async function request(path,body){const resp=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json','X-Requested-With':'XMLHttpRequest'},credentials:'same-origin',body:JSON.stringify(body)});const data=ensureData(await resp.json().catch(()=>({error:'Invalid server response.'})));if(!resp.ok||data.ok===false)throw Error(data.error||'Operation failed.');return data}
function el(tag,text,cls){const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(cls)node.className=cls;return node}
let loadAdmin=async()=>{},loadDev=async()=>{};
function showConsole(){ $('auth-panel').classList.add('hidden');$('totp-panel')?.classList.add('hidden');$('console-panel').classList.remove('hidden');$('logout').classList.remove('hidden');scope==='admin'?loadAdmin():loadDev() }
function showLogin(){$('auth-panel').classList.remove('hidden');$('console-panel').classList.add('hidden');$('totp-panel')?.classList.add('hidden');$('logout').classList.add('hidden')}
async function showTotpSetup(){
 $('auth-panel').classList.add('hidden');$('console-panel').classList.add('hidden');$('totp-panel').classList.remove('hidden');
 const data=await request('/api/auth',{action:'totp_setup',role:'dev'});
 if(!data.qr||!data.qr.startsWith('data:image/png;base64,'))throw Error('TOTP QR unavailable. Contact the developer.');
 $('totp-qr').src=data.qr;
 if(!/^[A-Z2-7]+=*$/.test(data.manual||''))throw Error('Manual setup code unavailable.');
 $('totp-manual').textContent=data.manual;
}
$('login-form').addEventListener('submit',async e=>{
 e.preventDefault();const password=$('password').value;const otp=$('otp')?.value||'';
 try{const result=await request('/api/auth',{action:'login',role:scope,password,otp});$('password').value='';if($('otp'))$('otp').value='';
   if(result.status==='setup_required'){report('Password verified. Scan your new TOTP QR to activate second factor.');await showTotpSetup()}
   else if(result.status==='totp_required'){report('Enter the six-digit authenticator code.',false)}
   else{report('Access granted.');showConsole()}
 }catch(err){report(err.message,false)}
});
$('logout').addEventListener('click',async()=>{try{await request('/api/auth',{action:'logout',role:scope});report('Console locked.')}catch(err){report(err.message,false)}showLogin()});
if(scope==='dev')$('copy-totp').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('totp-manual').textContent);report('Setup code copied.')}catch{report('Select the code and copy manually.',false)}});
if(scope==='dev')$('totp-form').addEventListener('submit',async e=>{e.preventDefault();try{const r=await request('/api/auth',{action:'totp_confirm',role:'dev',otp:$('totp-code').value});if(r.status!=='ok')throw Error('TOTP not verified');$('totp-code').value='';report('Authenticator enabled. Developer console unlocked.');showConsole()}catch(err){report(err.message,false)}});
(async()=>{try{const r=await request('/api/auth',{action:'session',role:scope});if(r.status==='ok')showConsole();else if(r.status==='setup_required')await showTotpSetup();else showLogin()}catch{showLogin()}})();
if(scope==='admin'){
 let config={schedules:[],docs:[]};
 const panels=[...document.querySelectorAll('[data-panel]')];
 document.querySelectorAll('[data-tab]').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b===button));panels.forEach(p=>p.classList.toggle('hidden',p.dataset.panel!==button.dataset.tab));if(button.dataset.tab==='audit')loadAudit()}));
 const activeOpts=()=>config.schedules.filter(s=>!s.end_at||new Date(s.end_at)>new Date());
 loadAdmin=async function(){try{const data=await request(route,{action:'state'});config=data;$('tone').value=data.tone||'warm-professional';$('special').value=data.special||'';renderDocs(data.docs||[]);renderSchedules(data.schedules||[]);report('Clinic settings loaded.')}catch(err){report(err.message,false)}}
 $('settings-form').addEventListener('submit',async e=>{e.preventDefault();try{await request(route,{action:'save_settings',tone:$('tone').value,special:$('special').value});report('Clinic instructions saved.')}catch(err){report(err.message,false)}});
 $('upload-form').addEventListener('submit',async e=>{e.preventDefault();const file=$('file').files[0];if(!file)return;if(!$('attest').checked)return report('You must confirm there is no patient data.',false);if(file.size>1024*1024)return report('File exceeds 1 MB limit.',false);
 try{const encoded=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result).split(',')[1]);r.onerror=()=>reject(Error('File read failed'));r.readAsDataURL(file)});
 await request(route,{action:'upload',filename:file.name,data:encoded,attest:true});$('upload-form').reset();report('Uploaded as draft. Approval is required before the model can use it.');await loadAdmin()}catch(err){report(err.message,false)}});
 $('schedule-form').addEventListener('submit',async e=>{e.preventDefault();try{const start=$('starts').value,end=$('ends').value;if(!start||!end||new Date(end)<=new Date(start))throw Error('End must be after start.');
 const toIso=x=>new Date(x).toISOString();
 await request(route,{action:'schedule',text:$('announcement').value,start_at:toIso(start),end_at:toIso(end)});
 $('schedule-form').reset();report('Timed instruction scheduled. It will expire automatically.');await loadAdmin()}catch(err){report(err.message,false)}});
 function renderDocs(items){
  const list=$('docs-list');list.replaceChildren();if(!items.length){list.append(el('p','No documents uploaded yet.','muted'));return}
  items.forEach(doc=>{const item=el('div',undefined,'data-entry');const title=el('strong',doc.name);item.append(title,el('span','Uploaded '+stamp(doc.created_at)+(doc.approved?' · APPROVED':' · DRAFT')+' · '+(doc.characters||0)+' chars'));
   const buttons=el('div',undefined,'actions');if(!doc.approved){const b=el('button','Approve for answers','secondary');b.type='button';b.addEventListener('click',async()=>{if(!confirm('Approve this document for public chatbot answers? Ensure it contains no patient or confidential details.'))return;try{await request(route,{action:'approve',id:doc.id});report('Document approved.');await loadAdmin()}catch(err){report(err.message,false)}});buttons.append(b)}
   const remove=el('button','Delete','danger');remove.type='button';remove.addEventListener('click',async()=>{if(!confirm('Permanently delete this uploaded context?'))return;try{await request(route,{action:'remove',id:doc.id});report('Document deleted.');await loadAdmin()}catch(err){report(err.message,false)}});buttons.append(remove);
   item.append(buttons);list.append(item)});
 }
 function renderSchedules(items){
  const list=$('scheduled-list');list.replaceChildren();const future=items.filter(s=>new Date(s.end_at)>new Date());
  if(!future.length){list.append(el('p','No active or upcoming announcements.','muted'));return}
  future.forEach(entry=>{const item=el('div',undefined,'data-entry');item.append(el('strong',entry.text));item.append(el('span',stamp(entry.start_at)+' → '+stamp(entry.end_at)));const del=el('button','Remove','danger');del.type='button';del.addEventListener('click',async()=>{try{await request(route,{action:'unschedule',id:entry.id});report('Announcement removed.');await loadAdmin()}catch(err){report(err.message,false)}});const bar=el('div',undefined,'actions');bar.append(del);item.append(bar);list.append(item)})
 }
 async function loadAudit(){try{const r=await request(route,{action:'audit'});const list=$('audit-list');list.replaceChildren();if(!(r.sessions||[]).length){list.append(el('p','No conversations yet.','muted'));return}
 for(const session of r.sessions){const item=el('button',undefined,'data-entry');item.type='button';item.style.textAlign='left';item.append(el('strong',session.id.slice(0,8)+' · '+session.count+' messages'),el('span',stamp(session.last_at)+' · '+(session.status||'reviewable')));item.addEventListener('click',()=>loadTranscript(session.id));list.append(item)}}catch(err){report(err.message,false)}}
 async function loadTranscript(id){try{const r=await request(route,{action:'transcript',id});const thread=$('audit-thread');thread.replaceChildren();thread.append(el('h3','Transcript · '+id.slice(0,8)));for(const msg of r.messages||[]){const p=el('p',(msg.role==='user'?'TESTER · ':'ASSISTANT · ')+stamp(msg.at)+'\n'+msg.text);p.style.whiteSpace='pre-wrap';p.style.overflowWrap='anywhere';p.style.borderBottom='1px solid #d5dfd5';p.style.paddingBottom='13px';thread.append(p)}}catch(err){report(err.message,false)}}
 $('refresh-audit').addEventListener('click',loadAudit);
}else{
 loadDev=async function(){try{const data=await request(route,{action:'state'});const s=data.settings||{};$('decision').checked=s.decision!==false;$('max-day').value=s.max_day||80;$('max-ip').value=s.max_ip||12;$('max-tokens').value=s.max_tokens||460;$('extra-policy').value=s.extra_policy||'';$('policy').textContent=data.baseline||'Baseline unavailable';$('model').textContent=data.model||'openai/gpt-6-luna';report('Developer guardrails loaded.')}catch(err){report(err.message,false)}}
 $('dev-form').addEventListener('submit',async e=>{e.preventDefault();try{await request(route,{action:'save',decision:$('decision').checked,max_day:Number($('max-day').value),max_ip:Number($('max-ip').value),max_tokens:Number($('max-tokens').value),extra_policy:$('extra-policy').value});report('Developer controls saved and audited.')}catch(err){report(err.message,false)}});
 $('test-form').addEventListener('submit',async e=>{e.preventDefault();try{const r=await request(route,{action:'test',message:$('test-prompt').value});$('test-result').textContent=(r.allowed?'ALLOWED: ':'REJECTED: ')+(r.reason||'Accepted by deterministic checks');$('test-result').className='status '+(r.allowed?'success':'error')}catch(err){report(err.message,false)}});
}
