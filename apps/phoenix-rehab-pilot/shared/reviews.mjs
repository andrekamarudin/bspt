/* Phoenix Admin QA. Each batch line is one separate model conversation.
 * No messages are sent to patients or WhatsApp.
 */
const find=id=>document.getElementById(id);
if(find('testing-panel')){
 let cases=[],examples=[],selected=null,running=false,stop=false;
 const notice=(s)=>{find('test-progress').textContent=s};
 const authRequest=async(body)=>{
  const res=await fetch('/api/reviews',{
   method:'POST',credentials:'same-origin',
   headers:{'Content-Type':'application/json','X-Requested-With':'XMLHttpRequest'},
   body:JSON.stringify(body)
  });
  const data=await res.json().catch(()=>({detail:'Invalid server response.'}));
  if(!res.ok||!data.ok)throw Error(data.detail||data.error||'Request failed.');
  return data;
 };
 const el=(tag,text,cls)=>{
  const n=document.createElement(tag);
  if(text!==undefined)n.textContent=text;
  if(cls)n.className=cls;
  return n;
 };
 const date=(value)=>new Date(value).toLocaleString('en-SG',{
  timeZone:'Asia/Singapore',day:'numeric',month:'short',hour:'numeric',minute:'2-digit'});
 const truncate=(s,max=118)=>(s||'').length<=max?(s||''):(s||'').slice(0,max-1)+'…';
 const status=(s)=>({queued:'Queued',running:'Running',done:'Answered',
                     reviewed:'Reviewed',error:'Failed'}[s]||s);
 async function fetchAll(){
  const data=await authRequest({action:'list'});
  cases=data.cases||[];examples=data.examples||[];
  renderTable();renderLibrary();
  if(selected){
   const refreshed=cases.find(c=>c.id===selected.id);
   if(refreshed)selected=refreshed;
  }
 }
 function renderTable(){
  const root=find('testing-rows');root.replaceChildren();
  find('test-count').textContent=cases.length+' test questions';
  if(!cases.length){
   const td=el('td','No tests yet. Paste questions above and generate the responses.');
   td.colSpan=5;const tr=el('tr');tr.append(td);root.append(tr);return
  }
  for(const c of cases){
   const tr=el('tr');if(c.id===selected?.id)tr.classList.add('review-selected');
   tr.append(el('td',truncate(c.question,100)),el('td',truncate(c.response||'Not generated',105)));
   const rating=el('td',c.rating?('★ '+c.rating+'/5'):'—');
   const state=el('td',status(c.status));
   const action=el('td');
   const btn=el('button',c.status==='queued'?'Run':'Review','secondary');
   btn.type='button';btn.disabled=c.status==='running';
   btn.addEventListener('click',async()=>{
    if(c.status==='queued'){
     try{notice('Generating response for '+c.question.slice(0,70)+'…');
      await authRequest({action:'run',id:c.id});await fetchAll();notice('Response generated.');
     }catch(err){notice('Test could not run: '+err.message)}
    }else openReview(c);
   });
   action.append(btn);tr.append(rating,state,action);root.append(tr);
  }
 }
 function openReview(c){
  selected=c;
  find('test-detail').classList.remove('hidden');
  find('detail-question').textContent=c.question;
  find('detail-answer').textContent=c.response||'No response was generated.';
  find('detail-model').textContent='Model: '+(c.model||'—')+' · '+status(c.status)+' · '+date(c.updated);
  find('test-rating').value=c.rating?String(c.rating):'';
  find('test-feedback').value=c.feedback||'';
  find('test-preferred').value=c.preferred||(c.rating>=4?c.response:'')||'';
  find('draft-fewshot').checked=true;
  find('retry-test').classList.toggle('hidden',c.status!=='error');
  renderTable();
  find('test-detail').scrollIntoView({behavior:'smooth',block:'start'});
 }
 // Place the selected response above the table, not after 240 potential rows.
 document.querySelector('.review-table-wrap').before(find('test-detail'));
 find('run-tests').addEventListener('click',async()=>{
  if(running)return;
  const lines=find('batch-questions').value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  if(!lines.length||lines.length>20){notice('Paste 1–20 questions, one per line.');return}
  running=true;stop=false;find('run-tests').disabled=true;
  find('stop-tests').classList.remove('hidden');
  try{
   const batch=await authRequest({action:'batch',messages:lines.join('\n')});
   await fetchAll();
   let success=0,errors=0;
   for(const [idx,id] of batch.ids.entries()){
    if(stop){notice('Stopped. Remaining questions are queued for this test batch.');break}
    notice('Generating '+(idx+1)+' of '+batch.ids.length+' · '+success+' answered');
    try{
     const result=await authRequest({action:'run',id});
     if(result.status==='done')success++;else errors++;
    }catch(err){errors++;notice('Question '+(idx+1)+' failed: '+err.message)}
    await fetchAll();
   }
   if(!stop)notice(success+' answered · '+errors+' failed. Click Review on each row to rate it.');
  }catch(err){notice('Could not create batch: '+err.message)}
  finally{
   running=false;find('run-tests').disabled=false;find('stop-tests').classList.add('hidden')
  }
 });
 find('stop-tests').addEventListener('click',()=>{stop=true;notice('Stopping after the current model response…')});
 find('refresh-tests').addEventListener('click',()=>fetchAll().catch(e=>notice(e.message)));
 find('close-test-detail').addEventListener('click',()=>{
  find('test-detail').classList.add('hidden');selected=null;renderTable()
 });
 find('save-test-review').addEventListener('click',async()=>{
  if(!selected)return;
  const rating=Number(find('test-rating').value);
  if(!rating){notice('Choose a quality rating before saving.');return}
  try{
   const result=await authRequest({action:'review',id:selected.id,rating,
    feedback:find('test-feedback').value,preferred:find('test-preferred').value,
    draft_example:find('draft-fewshot').checked});
   notice(result.example_id?'Review saved; an editable few-shot draft was created. Publish it from the Few-shot tab.':'Review saved without a few-shot draft.');
   await fetchAll();
   const next=cases.find(c=>c.status==='done' && !c.rating);
   if(next)openReview(next);
   else{
    selected=null;find('test-detail').classList.add('hidden');renderTable();
   }
  }catch(err){notice('Could not save review: '+err.message)}
 });
 find('delete-test').addEventListener('click',async()=>{
  if(!selected)return;
  if(!confirm('Delete this test question and generated response? Related published examples will remain unless archived separately.'))return;
  try{
   await authRequest({action:'case_delete',id:selected.id});
   selected=null;find('test-detail').classList.add('hidden');await fetchAll();
   notice('Test deleted. Historical model spending remains anonymized.');
  }catch(err){notice('Delete failed: '+err.message)}
 });
 find('retry-test').addEventListener('click',async()=>{
  if(!selected||selected.status!=='error')return;
  try{await authRequest({action:'run',id:selected.id});notice('Test rerun completed.');await fetchAll();const row=cases.find(c=>c.id===selected.id);if(row)openReview(row)}
  catch(err){notice('Could not rerun: '+err.message)}
 });
 function clearExample(){
  find('fewshot-id').value='';find('fewshot-question').value='';find('fewshot-ideal').value='';
  find('fewshot-edit-title').textContent='Create example';
 }
 function renderLibrary(){
  const root=find('fewshot-list');root.replaceChildren();
  const published=examples.filter(x=>x.status==='published').length;
  find('fewshot-count').textContent=published+' published · '+examples.length+' total';
  if(!examples.length){root.append(el('p','No examples yet. Review a test or create one manually.','muted'));return}
  for(const x of examples){
   const card=el('div',undefined,'review-example');
   const header=el('div',undefined,'review-example-header');
   header.append(el('strong',truncate(x.question,120)),
                 el('span',x.status.toUpperCase()+' · revision '+x.version,'review-status '+x.status));
   card.append(header,el('p',truncate(x.ideal,280),'review-ideal'));
   const controls=el('div',undefined,'actions');
   const edit=el('button','Edit','secondary');edit.type='button';
   edit.addEventListener('click',()=>{
    find('fewshot-id').value=x.id;find('fewshot-question').value=x.question;
    find('fewshot-ideal').value=x.ideal;
    find('fewshot-edit-title').textContent='Edit example · '+x.id.slice(0,8);
    find('fewshot-question').focus();
   });controls.append(edit);
   if(x.status!=='published'){
    const publish=el('button','Publish','primary');publish.type='button';
    publish.addEventListener('click',async()=>{
     if(!confirm('Approve this example for live model prompts? Check that every claim is accurate and contains no private data.'))return;
     try{await authRequest({action:'example_publish',id:x.id,attest:true});
      await fetchAll();notice('Example published; now available to the bot.')}
     catch(err){notice('Publish failed: '+err.message)}
    });controls.append(publish);
   }
   if(x.status!=='archived'){
    const archive=el('button','Archive','secondary');archive.type='button';
    archive.addEventListener('click',async()=>{
     try{await authRequest({action:'example_archive',id:x.id});
      await fetchAll();notice('Example archived and removed from active prompts.')}
     catch(err){notice('Archive failed: '+err.message)}
    });controls.append(archive);
   }
   if(x.status==='archived'){
    const del=el('button','Delete permanently','secondary');del.type='button';
    del.addEventListener('click',async()=>{
     if(!confirm('Permanently delete this archived example and its revision history?'))return;
     try{await authRequest({action:'example_delete',id:x.id});await fetchAll();
      notice('Archived example deleted.')}
     catch(err){notice('Delete failed: '+err.message)}
    });controls.append(del);
   }
   card.append(controls);root.append(card);
  }
 }
 find('fewshot-form').addEventListener('submit',async(event)=>{
  event.preventDefault();
  const id=find('fewshot-id').value;
  try{
   const result=await authRequest({action:'example_save',
    ...(id?{id}:{}),question:find('fewshot-question').value,
    ideal:find('fewshot-ideal').value});
   clearExample();await fetchAll();
   notice('Draft '+result.id.slice(0,8)+' saved. Publish it when approved.');
  }catch(err){notice('Example save failed: '+err.message)}
 });
 find('fewshot-clear').addEventListener('click',clearExample);
 find('refresh-fewshot').addEventListener('click',()=>fetchAll().catch(e=>notice(e.message)));
 for(const tab of ['testing','fewshot']){
  document.querySelector('[data-tab="'+tab+'"]').addEventListener('click',()=>{
   fetchAll().catch(e=>notice('Could not load reviews: '+e.message));
  });
 }
 window.addEventListener('phoenix-admin-ready',()=>{
  const active=document.querySelector('[data-tab].active')?.dataset.tab;
  if(active==='testing'||active==='fewshot')fetchAll().catch(e=>notice(e.message));
 });
}
