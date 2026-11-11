/* Private clinic Admin: usage and cost metrics only, never transcripts. */
const $=id=>document.getElementById(id);
const number=value=>Number(value||0).toLocaleString('en-SG');
const money=value=>{
 if(!Number.isFinite(value))return 'Unpriced';
 const decimals=value>=10?2:value>=.1?4:value>=.001?5:value>=.00001?6:8;
 return 'US$'+value.toLocaleString('en-US',{minimumFractionDigits:decimals,maximumFractionDigits:decimals});
};
function element(tag,content,className){
 const node=document.createElement(tag);
 if(content!==undefined)node.textContent=content;
 if(className)node.className=className;
 return node;
}
if($('costs-panel')){
 let conversations=[],offset=0,busy=false;
 const dayLabel=date=>{
  try{return new Date(date+'T00:00:00+08:00').toLocaleDateString('en-SG',
   {timeZone:'Asia/Singapore',day:'numeric',month:'short',year:'numeric'})}
  catch{return date}
 };
 function renderDays(days){
  const root=$('costs-days');root.replaceChildren();
  if(!days.length){root.append(element('p','No model usage recorded yet.','muted'));return}
  const max=Math.max(...days.map(row=>row.cost_usd||0),0);
  for(const row of days){
   const container=element('div',undefined,'costs-day-row');
   const heading=element('div',undefined,'costs-day-head');
   const date=element('time',dayLabel(row.day));date.dateTime=row.day;
   heading.append(date,element('strong',money(row.cost_usd)));
   const bar=element('div',undefined,'costs-track');
   const fill=element('div',undefined,'costs-fill');
   fill.style.width=(max>0?Math.min(100,(row.cost_usd||0)/max*100):0)+'%';
   bar.append(fill);
   container.append(heading,bar,element('span',number(row.requests)+' model calls'+
    (row.unpriced_requests?' · '+number(row.unpriced_requests)+' unpriced':''),'costs-muted'));
   root.append(container);
  }
 }
 function renderChannels(channels){
  const root=$('costs-channels');root.replaceChildren();
  if(!channels.length){root.append(element('p','No usage by channel yet.','muted'));return}
  const names={web:'Web chat',whatsapp:'WhatsApp',dev:'Developer tests',testing:'Admin testing',unattributed:'Unattributed'};
  for(const row of channels){
   const item=element('div',undefined,'costs-channel-row');
   const label=element('div',undefined,'costs-channel-label');
   label.append(element('strong',names[row.channel]||row.channel),
    element('span',number(row.requests)+' calls · '+number(row.input_tokens+row.output_tokens)+' tokens','costs-muted'));
   item.append(label,element('strong',money(row.cost_usd),'costs-channel-amount'));
   root.append(item);
  }
 }
 function showConversationPage(){
  const root=$('costs-conversations');
  for(const row of conversations.slice(offset,offset+20)){
   const item=element('button',undefined,'costs-conversation-row costs-conversation-link');item.type='button';
   item.title='Open this transcript in Conversation audit';
   item.setAttribute('aria-label','Open transcript and AI costs for conversation '+row.id.slice(0,8));
   item.addEventListener('click',()=>window.dispatchEvent(new CustomEvent('phoenix-open-conversation',{detail:{id:row.id}})));
   const summary=element('div',undefined,'costs-conversation-main');
   const date=new Date(row.last_at).toLocaleString('en-SG',{
    timeZone:'Asia/Singapore',month:'short',day:'numeric',year:'numeric',
    hour:'numeric',minute:'2-digit'});
   summary.append(element('strong','Conversation '+row.id.slice(0,8)),
    element('span',date+' · '+number(row.requests)+' AI calls · '+number(row.input_tokens)+' in / '+number(row.output_tokens)+' out','costs-muted'));
   summary.append(element('span',row.models.join(' · '),'costs-models'));
   const amount=element('div',undefined,'costs-conversation-amount');
   amount.append(element('strong',money(row.cost_usd)));
   const qualifier=row.unpriced_requests?number(row.unpriced_requests)+' unpriced call(s)':
    row.historical_requests?'Historical model assumed':'Catalog estimate / reported cost';
   amount.append(element('span',qualifier,'costs-muted'));
   item.append(summary,amount);root.append(item);
  }
  offset=Math.min(offset+20,conversations.length);
  $('costs-more').classList.toggle('hidden',offset>=conversations.length);
 }
 function render(data){
  const total=data.summary;
  $('costs-total').textContent=money(total.cost_usd);
  $('costs-calls').textContent=number(total.requests);
  $('costs-coverage').textContent=total.requests?
   Math.round(100*total.costed_requests/total.requests)+'%':'—';
  $('costs-accuracy').textContent=number(total.costed_requests)+' priced · '+
   number(total.historical_requests)+' legacy estimates';
  $('costs-tokens').textContent=number(total.input_tokens)+' input · '+
   number(total.output_tokens)+' output tokens';
  $('costs-unknown').textContent=number(total.unpriced_requests)+' unpriced call(s)';
  $('costs-notice').textContent='Included: '+money(total.estimated_usd)+' estimated using list prices; '+
   money(total.actual_usd)+' reported as charge by API. Not a verified invoice or full account balance.';
  $('costs-methodology').textContent=data.assumptions||'Current list prices are not an invoice.';
  renderDays(data.days||[]);renderChannels(data.channels||[]);
  conversations=data.conversations||[];offset=0;
  $('costs-conversation-count').textContent=number(conversations.length)+' conversations';
  $('costs-conversations').replaceChildren();
  if(conversations.length)showConversationPage();
  else{
   $('costs-conversations').append(element('p','No recorded web conversation usage.','muted'));
   $('costs-more').classList.add('hidden');
  }
 }
 async function load(){
  if(busy)return;
  busy=true;$('refresh-costs').disabled=true;
  $('costs-notice').textContent='Loading model usage…';
  try{
   const response=await fetch('/api/admin',{
    method:'POST',credentials:'same-origin',
    headers:{'Content-Type':'application/json','X-Requested-With':'XMLHttpRequest'},
    body:JSON.stringify({action:'costs'})
   });
   const result=await response.json();
   if(!response.ok||result.ok!==true)throw Error(result.detail||result.error||'Unable to load costs');
   render(result);
  }catch(err){$('costs-notice').textContent='Unable to load model usage: '+err.message}
  finally{busy=false;$('refresh-costs').disabled=false}
 }
 document.querySelector('[data-tab="costs"]').addEventListener('click',load);
 $('refresh-costs').addEventListener('click',load);
 $('costs-more').addEventListener('click',showConversationPage);
}
