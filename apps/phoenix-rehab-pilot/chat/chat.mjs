const $=id=>document.getElementById(id);
const log=$('conversation'),message=$('question'),sendButton=$('send'),state=$('connection');
const slotDate=$('slot-date');
function singaporeDate(offset=0){
 const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Singapore',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(Date.now()+offset*86400000));
 const get=name=>parts.find(p=>p.type===name)?.value||'';
 return get('year')+'-'+get('month')+'-'+get('day');
}
slotDate.min=singaporeDate(0);slotDate.max=singaporeDate(30);slotDate.value=singaporeDate(1);

let sid=crypto.randomUUID(),waiting=false,turns=[];
function row(role,text,links=[],category=''){
 const outer=document.createElement('div');outer.className='turn '+(role==='user'?'user':'bot');
 const body=document.createElement('div');body.className='turn-body';
 const bubble=document.createElement('div');bubble.className='text';bubble.textContent=text;body.append(bubble);
 if(links.length){const list=document.createElement('div');list.className='links';links.forEach(link=>{try{const u=new URL(link.url);if(u.protocol!=='https:')return;const a=document.createElement('a');a.href=u.href;a.target='_blank';a.rel='noopener noreferrer';a.textContent=link.label+' ↗';list.append(a)}catch{}});body.append(list)}
 if(category){const label=document.createElement('div');label.className='meta';label.textContent=category;body.append(label)}
 outer.append(body);log.append(outer);log.scrollTop=log.scrollHeight;turns.push({role,text});return outer;
}
async function submit(raw){
 if(waiting)return;const text=String(raw||'').trim();if(!text)return;
 if(text.length>1600){state.textContent='Please shorten your message to 1,600 characters.';return}
 message.value='';row('user',text);waiting=true;sendButton.disabled=true;state.textContent='Checking request safely…';
 try{
  const response=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json','X-Requested-With':'XMLHttpRequest'},body:JSON.stringify({message:text,sessionId:sid}),credentials:'same-origin'});
  const data=await response.json().catch(()=>({error:'The server returned an invalid response.'}));
  if(!response.ok){row('bot',data.error||'The service is unavailable. Please try again.');state.textContent='Unable to reach assistant';return}
  row('bot',data.reply||'Unable to answer right now.',data.links||[],data.status==='declined'?'Out of pilot scope':'GPT-6 Luna · test response');
  state.textContent=data.status==='declined'?'Outside supported scope':'Model response received';
 }catch{row('bot','The connection failed. Nothing was submitted to the clinic. Please try later.');state.textContent='Connection failed'}
 finally{waiting=false;sendButton.disabled=false;message.focus({preventScroll:true})}
}
$('chat-form').addEventListener('submit',e=>{e.preventDefault();submit(message.value)});
document.querySelectorAll('[data-prompt]').forEach(b=>b.addEventListener('click',()=>submit(b.dataset.prompt)));
$('live-openings').addEventListener('click',async()=>{
 if(waiting)return;
 waiting=true;$('send').disabled=true;state.textContent='Checking real clinic calendars…';
 const when=slotDate.value;
 try{
  if(!/^20\d{2}-\d{2}-\d{2}$/.test(when)||when<slotDate.min||when>slotDate.max)throw Error('Choose a date in the next 30 days');
  const res=await fetch('/api/availability?date='+encodeURIComponent(when),{credentials:'same-origin',cache:'no-store'});
  const data=await res.json();
  if(!res.ok||!data.ok)throw Error(data.error||data.detail||'No verified schedule returned');
  const shown=(data.openings||[]).slice(0,18);
  const summary=shown.map(s=>s.branch+' · '+s.service+' · '+s.start.slice(11)+'–'+s.end.slice(11)+' ('+s.minutes+' min)').join('\n');
  const unresolved=(data.unavailable_branches||[]).length?'\nOther branches could not be checked: '+data.unavailable_branches.join(', '):'';
  row('bot',shown.length?('Live openings for '+when+' (Singapore time):\n'+summary+unresolved+'\n\nThese are not reserved. Confirm the appointment in the clinic booking calendar.'):('No open blocks were returned for '+when+' in the '+(data.checked_branches||[]).join(', ')+' calendars.'+unresolved),[{label:'Try booking journey (test only)',url:'https://phoenix.bytesizeprotip.com/book?date='+encodeURIComponent(when)}].concat(Object.entries({'Orchard':'orchard','Tampines':'tampines','Serangoon':'serangoon','Tanjong Pagar':'tanjongpagar','Jurong East':'jurong'}).filter(([name])=>shown.some(x=>x.branch===name)).map(([name,slug])=>({label:name+' online calendar',url:'https://phoenixrehabgroup.com/calendar/'+slug+'/clinic-page'}))),'Read-only SGiMED calendar · checked '+new Date(data.checked_at).toLocaleTimeString('en-SG',{timeZone:'Asia/Singapore'}));
  state.textContent='Live calendars checked';
 }catch(err){row('bot','Could not verify clinic openings right now. Please use the clinic calendar or try another date.');state.textContent='Calendar temporarily unavailable'}
 finally{waiting=false;$('send').disabled=false}
});
$('clear-chat').addEventListener('click',()=>{sid=crypto.randomUUID();turns=[];log.replaceChildren();row('bot','New test conversation started. Ask a clinic question or select a suggestion.');state.textContent='Ready to test'});
$('copy-conversation').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(turns.map(t=>(t.role==='user'?'Tester: ':'Assistant: ')+t.text).join('\n\n'));state.textContent='Transcript copied'}catch{state.textContent='Copy unavailable in this browser'}});
row('bot','Hello. I can help with clinic hours, prices, appointment guidance and general policies. What would you like to know?');
state.textContent='Ready for your clinic questions';

// Identity is never guessed from free-text. A one-use administrator invite
// can bind this browser's existing private pilot session to a DEMO CRM profile.
let linkedProfile=null;
async function crmRequest(body){
 const response=await fetch('/api/crm/visitor',{
  method:'POST',credentials:'same-origin',cache:'no-store',
  headers:{'Content-Type':'application/json','X-Requested-With':'XMLHttpRequest'},
  body:JSON.stringify(body)
 });
 const result=await response.json().catch(()=>({detail:'Unable to read identity response'}));
 if(!response.ok||!result.ok)throw Error(result.detail||result.error||'Identity request failed');
 return result;
}
function describeProfile(profile){
 if(!profile)return '';
 const demo=(profile.appointments||[]).filter(x=>x.status==='demo_only').slice(0,3);
 const lines=demo.map(x=>{
  const when=new Date(x.starts_at).toLocaleString('en-SG',{
   timeZone:'Asia/Singapore',dateStyle:'medium',timeStyle:'short'
  });
  return x.location+' · '+x.service+' · '+when+' (fictional)';
 });
 return 'Demo CRM linked as '+profile.name+'.'+
   (lines.length?'\nYour sample appointments:\n'+lines.join('\n'):'')+
   '\nThese are not real SGiMED bookings.';
}
function displayIdentity(profile,announce=false){
 linkedProfile=profile||null;
 const label=$('crm-identity-status');
 const panel=$('crm-link-panel');
 label.replaceChildren();
 if(profile){
  label.textContent='Recognized demo tester: '+profile.name+' · fictional CRM records';
  const unlink=document.createElement('button');
  unlink.type='button';unlink.textContent='Unlink';
  unlink.className='crm-unlink';
  unlink.addEventListener('click',async()=>{
   try{
    await crmRequest({action:'unlink'});
    displayIdentity(null);
    row('bot','Demo profile unlinked. Your next messages will not use personal test CRM context.');
   }catch(err){state.textContent=err.message}
  });
  label.append(unlink);
  panel.hidden=true;
  if(announce)row('bot',describeProfile(profile));
 }else{
  label.textContent='Demo CRM profile not linked';
  panel.hidden=false;
 }
}
$('crm-link-form')?.addEventListener('submit',async e=>{
 e.preventDefault();
 const field=$('crm-invite-code');
 const code=field.value.trim();field.value='';
 try{
  if(!/^[A-Za-z0-9_-]{30,96}$/.test(code))throw Error('Use the complete one-time code from your administrator.');
  const result=await crmRequest({action:'claim',token:code});
  displayIdentity(result.profile,true);
 }catch(err){state.textContent=err.message}
});
async function crmBoot(){
 // Hash fragments are not sent to Caddy, Cloudflare, or referrer URLs.
 const claimMatch=location.hash.match(/^#claim=([A-Za-z0-9_-]{30,96})$/);
 if(location.hash)history.replaceState(null,'',location.pathname+location.search);
 try{
  if(claimMatch){
   const linked=await crmRequest({action:'claim',token:claimMatch[1]});
   displayIdentity(linked.profile,true);
   return;
  }
  const current=await crmRequest({action:'state'});
  displayIdentity(current.profile,Boolean(current.profile));
 }catch(err){
  displayIdentity(null);
  if(claimMatch)state.textContent='CRM link expired or invalid. Ask the clinic administrator for a new link.';
 }
}
crmBoot();
