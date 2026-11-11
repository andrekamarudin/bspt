/** Real SGiMED slot inventory, simulated checkout. Never transmits patient fields. */
const el=id=>document.getElementById(id);
const stages=[1,2,3,4];
const all={draft:null,selected:null,finished:false};
const formatDate=(offset=0)=>{
  const date=new Date(Date.now()+offset*86400000);
  const segments=new Intl.DateTimeFormat('en-GB',{
    timeZone:'Asia/Singapore',year:'numeric',month:'2-digit',day:'2-digit'
  }).formatToParts(date);
  const get=k=>segments.find(x=>x.type===k)?.value||'';
  return get('year')+'-'+get('month')+'-'+get('day');
};
const branches={Orchard:'orchard',Tampines:'tampines',Serangoon:'serangoon','Tanjong Pagar':'tanjongpagar','Jurong East':'jurong'};
const fallbackLink=el('early-fallback');
function updateFallback(){
 const slug=branches[el('booking-branch').value];
 fallbackLink.href='https://phoenixrehabgroup.com/calendar/'+(slug?slug+'/clinic-page':'');
 fallbackLink.textContent=slug?'Open this branch on the official booking site':'Open the official Phoenix Rehab booking calendars';
}
el('booking-branch').addEventListener('change',updateFallback);
updateFallback();
const date=el('booking-date');
date.min=formatDate();date.max=formatDate(30);date.value=formatDate(1);
const linkedDate=new URLSearchParams(location.search).get('date');
if(linkedDate && /^20\d{2}-\d{2}-\d{2}$/.test(linkedDate) && linkedDate>=date.min && linkedDate<=date.max){
 date.value=linkedDate;
}

function notice(text,error=false){
 const container=el('booking-feedback');
 container.textContent=text;
 container.classList.toggle('error',error);
}
const show=(stage)=>{
 for(const i of stages){
  el('booking-step-'+i).classList.toggle('hidden',i!==stage);
 }
 el('booking-complete').classList.toggle('hidden',stage!=='completed');
 document.querySelectorAll('.booking-steps .step').forEach((part,i)=>{
  part.classList.toggle('current',i+1===stage||(stage==='completed'&&i===3));
  part.classList.toggle('done',i+1<stage||stage==='completed');
 });
 notice('');
 window.scrollTo({top:0,behavior:'smooth'});
};
async function call(route,body){
 const r=await fetch(route,{
  method:'POST',credentials:'same-origin',cache:'no-store',
  headers:{'Content-Type':'application/json','X-Requested-With':'XMLHttpRequest'},
  body:JSON.stringify(body)
 });
 const data=await r.json().catch(()=>({detail:'Unexpected response from server'}));
 if(!r.ok||!data.ok)throw Error(data.detail||data.error||'Could not complete test step');
 return data;
}
async function getJSON(route){
 const r=await fetch(route,{cache:'no-store',credentials:'same-origin'});
 const data=await r.json().catch(()=>({detail:'Server returned an invalid response'}));
 if(!r.ok||!data.ok)throw Error(data.detail||data.error||'Unable to check openings');
 return data;
}
function slotText(item){
 return item.branch+' · '+item.service+' · '+item.start.slice(0,16)+'–'+item.end.slice(11,16)+' SGT';
}
function markBusy(button,busy){
 button.disabled=busy;
 button.setAttribute('aria-busy',busy?'true':'false');
}
function clearFields(){
 el('sample-name').value='Demo Patient';
 el('sample-email').value='test.patient@example.com';
 el('sample-phone').value='00000000';
 el('demo-otp').value='';
 el('test-confirm').checked=false;
}
function renderSlot(node,item){
 node.replaceChildren();
 const strong=document.createElement('strong');
 strong.textContent=item.branch+' · '+item.service;
 const line=document.createElement('div');
 line.textContent=item.start+' to '+item.end.slice(11)+' (Singapore time)';
 node.append(strong,line);
}
async function loadSlots(){
 const button=el('fetch-slots');
 markBusy(button,true);
 notice('Checking Phoenix Rehab live calendar inventory…');
 el('slot-results').replaceChildren();
 try{
  const when=date.value;
  if(!/^20\d{2}-\d{2}-\d{2}$/.test(when)||when<date.min||when>date.max){
   throw Error('Choose a valid date within the next 30 days');
  }
  const branch=el('booking-branch').value;
  const data=await getJSON('/api/booking/slots?date='+encodeURIComponent(when)+'&branch='+encodeURIComponent(branch));
  const blocks=data.openings||[];
  const checkedAt=new Date(data.checked_at).toLocaleTimeString('en-SG',{timeZone:'Asia/Singapore'});
  el('slot-info').textContent='Checked '+checkedAt+' SGT · '+(data.checked_branches||[]).length+' branches reached. No slot is held.';
  if(!blocks.length){
   notice('No confirmed open blocks for that date and location. Try another date or branch.');
   return;
  }
  notice('');
  for(const item of blocks.slice(0,70)){
   const div=document.createElement('article');
   div.className='slot-item';
   div.setAttribute('role','listitem');
   const data=document.createElement('div');
   const title=document.createElement('strong');title.textContent=item.branch+' · '+item.start.slice(11,16)+'–'+item.end.slice(11,16);
   const desc=document.createElement('div');desc.className='subtle';desc.textContent=item.service+' · '+item.minutes+' minutes';
   const meta=document.createElement('div');meta.className='slot-meta';meta.textContent='Availability shown by SGiMED · not reserved';
   data.append(title,desc,meta);
   const button=document.createElement('button');
   button.type='button';button.className='secondary';button.textContent='Choose this time';
   button.setAttribute('aria-label','Choose '+slotText(item));
   button.addEventListener('click',()=>selectSlot(item,when,button));
   div.append(data,button);el('slot-results').append(div);
  }
  if(blocks.length>70){
   notice('Showing the first 70 verified options. Narrow by branch for more times.');
  }
 }catch(error){notice(error.message||'Cannot retrieve openings right now',true)}
 finally{markBusy(button,false)}
}
async function selectSlot(item,when,button){
 markBusy(button,true);
 notice('Rechecking this opening with SGiMED…');
 try{
  const result=await call('/api/booking',{
    action:'draft',date:when,
    branch:item.branch,service:item.service,start:item.start,end:item.end
  });
  all.draft=result;all.selected=result.slot;
  renderSlot(el('chosen-slot'),result.slot);
  renderSlot(el('verified-slot'),result.slot);
  show(2);
 }catch(error){notice(error.message||'Opening no longer available',true)}
 finally{markBusy(button,false)}
}
el('slot-form').addEventListener('submit',event=>{
 event.preventDefault();loadSlots();
});
function checkSampleInputs(){
 const name=el('sample-name').value.trim();
 const email=el('sample-email').value.trim().toLowerCase();
 const phone=el('sample-phone').value.trim();
 if(!/\b(demo|test|sample)\b/i.test(name)||name.length>60){
  throw Error('Use a fictional name containing Demo or Test, not a real patient name.');
 }
 if(!(/@example\.com$/.test(email)||/\.test$/.test(email))){
  throw Error('Use a synthetic email such as test.patient@example.com.');
 }
 if(!/^(0{8,12}|9{8,12})$/.test(phone)){
  throw Error('Use the placeholder 00000000, not a real mobile number.');
 }
 // Do not include these three fields in any network call.
}
el('review-form').addEventListener('submit',event=>{
 event.preventDefault();
 try{checkSampleInputs();show(3)}
 catch(error){notice(error.message,true)}
});
el('otp-form').addEventListener('submit',async event=>{
 event.preventDefault();
 const button=el('otp-form').querySelector('button[type=submit]');
 markBusy(button,true);
 notice('Verifying the demo code; no SMS is sent…');
 try{
  if(!all.draft?.draft_id)throw Error('Choose a slot first.');
  const result=await call('/api/booking',{
   action:'verify',id:all.draft.draft_id,otp:el('demo-otp').value
  });
  if(result.state!=='verified'&&result.state!=='completed')throw Error('Demo verification not completed.');
  show(4);
 }catch(error){notice(error.message,true)}
 finally{markBusy(button,false)}
});
el('complete-form').addEventListener('submit',async event=>{
 event.preventDefault();
 const button=el('complete-form').querySelector('button[type=submit]');
 markBusy(button,true);
 try{
  if(!el('test-confirm').checked)throw Error('Confirm this is only a test run.');
  const data=await call('/api/booking',{action:'complete',id:all.draft?.draft_id,accept_test_only:true});
  if(data.real_booking_created!==false||data.status!=='simulated_only'||data.external_booking_id!==null){
   throw Error('Unsafe confirmation response rejected.');
  }
  el('simulation-ref').textContent=data.simulation_id;
  renderSlot(el('finished-slot'),data.slot);
  const fallback=el('fallback-booking');
  const target=new URL(data.public_booking_url);
  if(target.protocol!=='https:'||target.hostname!=='phoenixrehabgroup.com'){
   throw Error('Official fallback link failed its safety check');
  }
  fallback.href=target.href;
  all.finished=true;show('completed');
  clearFields();
 }catch(error){notice(error.message||'Could not complete test',true)}
 finally{markBusy(button,false)}
});
el('back-to-slots').addEventListener('click',()=>show(1));
el('back-to-review').addEventListener('click',()=>show(2));
el('back-to-otp').addEventListener('click',()=>show(3));
el('start-over').addEventListener('click',()=>{
 all.draft=null;all.selected=null;all.finished=false;
 clearFields();show(1);loadSlots();
});
async function boot(){
 try{
  const info=await getJSON('/api/booking/capabilities');
  if(info.mode!=='simulation'||info.real_booking_enabled!==false||info.payment_collected!==false){
   throw Error('Booking safety mode cannot be verified. Contact the pilot administrator.');
  }
  await loadSlots();
 }catch(error){notice(error.message||'The booking pilot is not available.',true)}
}
boot();
