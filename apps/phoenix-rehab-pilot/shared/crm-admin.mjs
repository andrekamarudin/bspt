/** Clinic-owner CRM dashboard. Private, demo-only; never displays full phone numbers. */
const at=id=>document.getElementById(id);
const host=at('crm-customers'),status=at('crm-invite-output');
function add(tag,text,parent,cls){
 const node=document.createElement(tag);
 node.textContent=text||'';
 if(cls)node.className=cls;
 (parent||host).append(node);
 return node;
}
async function request(body){
 const response=await fetch('/api/crm/admin',{
  method:'POST',credentials:'same-origin',cache:'no-store',
  headers:{'Content-Type':'application/json','X-Requested-With':'XMLHttpRequest'},
  body:JSON.stringify(body)
 });
 const result=await response.json().catch(()=>({detail:'Invalid server response'}));
 if(!response.ok||!result.ok)throw Error(result.detail||result.error||'CRM request failed');
 return result;
}
async function load(){
 if(!host)return;
 host.replaceChildren();
 add('p','Loading demo customers…',host,'muted');
 try{
  const result=await request({action:'state'});
  host.replaceChildren();
  if(!result.customers?.length){
   add('p','The private pilot database is not seeded yet.',host,'muted');
   return;
  }
  for(const item of result.customers){
   const card=add('section','',host,'panel crm-customer-card');
   card.style.marginBottom='12px';
   add('h3',item.name+' · '+(item.demo_role==='clinic_owner'?'Clinic owner':'Tester'),card);
   add('p','Contact: '+item.phone_masked+' · Pilot only · No real SGiMED patient ID',card,'muted');
   const appts=add('div','',card,'data-list');
   for(const appointment of item.appointments||[]){
    const date=new Date(appointment.starts_at).toLocaleString('en-SG',{timeZone:'Asia/Singapore',
     dateStyle:'medium',timeStyle:'short'});
    add('p','DEMO ONLY · '+date+' · '+appointment.location+' · '+appointment.service,appts);
   }
   const actions=add('div','',card,'actions');
   const invite=add('button','Create one-use web link',actions);
   invite.type='button';invite.className='secondary';
   invite.addEventListener('click',async()=>{
    invite.disabled=true;status.replaceChildren();
    try{
     const issued=await request({action:'invite',customer:item.id.replace(/^demo-/,'')});
     const label=add('p',item.name+' web identity link, single use, expires in 15 minutes:',status);
     label.style.fontWeight='700';
     const input=add('input','',status);
     input.type='text';input.readOnly=true;input.value=issued.invite_url;
     input.style.width='100%';input.setAttribute('aria-label',item.name+' test identity link');
     const copy=add('button','Copy private link',status);
     copy.type='button';copy.className='secondary';
     copy.addEventListener('click',async()=>{
      try{await navigator.clipboard.writeText(input.value);copy.textContent='Link copied'}
      catch{input.select();copy.textContent='Select link and copy'}
     });
     add('p','This link is a temporary identity credential. Share privately with the intended tester only.',status,'muted');
    }catch(error){add('p',error.message,status,'muted')}
    finally{invite.disabled=false}
   });
   const revoke=add('button','Revoke web links',actions);
   revoke.type='button';revoke.className='secondary';
   revoke.addEventListener('click',async()=>{
    if(!confirm('Revoke existing web CRM profile links for '+item.name+'?'))return;
    try{
     await request({action:'revoke',customer:item.id.replace(/^demo-/,'')});
     status.textContent=item.name+' web links revoked.';
    }catch(error){status.textContent=error.message}
   });
  }
 }catch(error){
  host.replaceChildren();add('p','Unlock the clinic administrator before loading CRM. '+error.message,host,'muted');
 }
}
if(host){
 window.addEventListener('phoenix-admin-ready',load);
 at('crm-refresh')?.addEventListener('click',load);
 document.querySelector('[data-tab="crm"]')?.addEventListener('click',load);
}
