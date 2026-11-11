/** Clinic owner's plain-language bot knowledge editor. No unsafe HTML insertion. */
const byId=id=>document.getElementById(id);
const entries=byId('owner-entries');
const preview=byId('owner-preview');
let saved=[];
const element=(tag,text,cls)=>{
 const n=document.createElement(tag);
 if(text!==undefined)n.textContent=text;
 if(cls)n.className=cls;
 return n;
};
async function api(body){
 const r=await fetch('/api/knowledge',{method:'POST',credentials:'same-origin',
  headers:{'Content-Type':'application/json','X-Requested-With':'XMLHttpRequest'},body:JSON.stringify(body)});
 const data=await r.json().catch(()=>({detail:'Please try again.'}));
 if(!r.ok||data.ok===false)throw Error(data.detail||data.error||'Unable to save');
 return data;
}
function notify(message,error=false){
 const n=byId('flash');n.className='status '+(error?'error':'success');n.textContent=message;
}
function clearForm(){
 byId('owner-edit-id').value='';
 byId('owner-answer-form').reset();
}
const button=(caption,onClick,cls='secondary')=>{
 const b=element('button',caption,cls);b.type='button';b.addEventListener('click',onClick);return b;
};
function render(){
 entries.replaceChildren();
 if(!saved.length){entries.append(element('p','No clinic answers yet. Add your first answer above.','muted'));return}
 for(const item of saved){
  const card=element('article',undefined,'owner-entry');
  const heading=element('strong',item.question);
  const status=element('span',item.status.toUpperCase(),'owner-state '+item.status);
  status.style.marginLeft='10px';
  const answer=element('p',item.answer,'muted');
  const action=element('div',undefined,'actions');
  action.append(button('Edit',()=>{
   byId('owner-edit-id').value=item.id;
   byId('owner-question').value=item.question;
   byId('owner-answer').value=item.answer;
   byId('owner-answer').focus();
   scrollTo({top:byId('owner-answer-form').getBoundingClientRect().top+scrollY-110,behavior:'smooth'});
  }));
  if(item.status==='draft')action.append(button('Publish answer',async()=>{
   if(!confirm('Confirm this contains approved public clinic information and no patient data?'))return;
   try{await api({action:'publish',id:item.id,attest:true});notify('Answer published to the shared bot knowledge.');await refresh()}
   catch(e){notify(e.message,true)}
  },'primary'));
  if(item.status!=='archived')action.append(button('Archive',async()=>{
   if(!confirm('Stop using this answer?'))return;
   try{await api({action:'archive',id:item.id});notify('Answer archived.');await refresh()}
   catch(e){notify(e.message,true)}
  }));
  if(item.revision>1)action.append(button('Version history',async()=>{
   try{
    const r=await api({action:'history',id:item.id});
    const versions=r.versions||[];
    if(!versions.length)return notify('No previous versions.');
    const chosen=prompt('Restore which earlier version? '+versions.map(v=>'v'+v.revision).join(', '));
    if(chosen===null)return;
    const rev=Number(chosen.toLowerCase().replace('v',''));
    if(!versions.some(v=>v.revision===rev))throw Error('Select an available version.');
    await api({action:'restore',id:item.id,revision:rev});
    notify('Earlier version restored as draft. Review and publish it.');await refresh();
   }catch(e){notify(e.message,true)}
  }));
  card.append(heading,status,answer,action);
  entries.append(card);
 }
}
async function refresh(){
 const r=await api({action:'list'});
 saved=r.items||[];
 render();
}
byId('owner-answer-form').addEventListener('submit',async e=>{
 e.preventDefault();
 try{
  const id=byId('owner-edit-id').value;
  const q=byId('owner-question').value.trim();
  const a=byId('owner-answer').value.trim();
  await api({action:'save',id:id||undefined,question:q,answer:a,kind:'faq'});
  clearForm();notify('Draft saved. Review it below, then publish.');await refresh();
 }catch(err){notify(err.message,true)}
});
byId('owner-cancel-edit').addEventListener('click',clearForm);
byId('owner-refresh').addEventListener('click',()=>refresh().catch(e=>notify(e.message,true)));
document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>{
 document.querySelector('[data-tab="'+b.dataset.go+'"]')?.click();
}));
function parseExamples(text){
 const parts=String(text).split(/(?=^Q:\s*)/im).filter(x=>/^Q:\s*/i.test(x));
 const items=[];
 for(const part of parts){
  const match=part.match(/^Q:\s*([\s\S]+?)\nA:\s*([\s\S]*?)(?=\n\s*$|$)/im);
  if(match){
   const q=match[1].trim(),a=match[2].trim();
   if(q.length>=8&&a.length>=10)items.push({question:q,answer:a});
  }
 }
 return items.slice(0,15);
}
byId('owner-import').addEventListener('click',()=>{
 const examples=parseExamples(byId('owner-examples').value);
 preview.replaceChildren();
 if(!examples.length){preview.append(element('p','Use separate Q: and A: lines, with no patient details.','muted'));return}
 preview.append(element('p',examples.length+' example(s) identified. Check each pair before importing.','muted'));
 for(const item of examples){
  const card=element('div',undefined,'owner-example');
  card.append(element('strong','Q: '+item.question),element('p','A: '+item.answer));
  preview.append(card);
 }
 preview.append(button('Import '+examples.length+' as drafts',async()=>{
  if(!confirm('I confirm all examples are anonymized and approved for internal review. Continue?'))return;
  let count=0;
  for(const item of examples){
   try{await api({...item,kind:'conversation',action:'save'});count++}
   catch(e){notify(count+' imported, then stopped: '+e.message,true);await refresh();return}
  }
  byId('owner-examples').value='';preview.replaceChildren();
  notify(count+' drafts created. Review and publish the appropriate answers.');await refresh();
 },'primary'));
});
window.addEventListener('phoenix-admin-ready',()=>refresh().catch(e=>notify(e.message,true)));
