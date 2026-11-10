const $=id=>document.getElementById(id);
const log=$('conversation'),message=$('question'),sendButton=$('send'),state=$('connection');
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
  if(!response.ok){row('bot',data.error||'The service is unavailable. Please try again.');state.textContent='Service unavailable';return}
  row('bot',data.reply||'Unable to answer right now.',data.links||[],data.status==='declined'?'Out of pilot scope':'GPT-6 Luna · test response');
  state.textContent=data.status==='declined'?'Outside supported scope':'Model response received';
 }catch{row('bot','The connection failed. Nothing was submitted to the clinic. Please try later.');state.textContent='Connection failed'}
 finally{waiting=false;sendButton.disabled=false;message.focus({preventScroll:true})}
}
$('chat-form').addEventListener('submit',e=>{e.preventDefault();submit(message.value)});
document.querySelectorAll('[data-prompt]').forEach(b=>b.addEventListener('click',()=>submit(b.dataset.prompt)));
$('clear-chat').addEventListener('click',()=>{sid=crypto.randomUUID();turns=[];log.replaceChildren();row('bot','New test conversation started. Ask a clinic question or select a suggestion.');state.textContent='Ready to test'});
$('copy-conversation').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(turns.map(t=>(t.role==='user'?'Tester: ':'Assistant: ')+t.text).join('\n\n'));state.textContent='Transcript copied'}catch{state.textContent='Copy unavailable in this browser'}});
row('bot','Hello. I can help with clinic hours, prices, appointment guidance and general policies. What would you like to know?');
state.textContent='Ready to test · conversation audited';
