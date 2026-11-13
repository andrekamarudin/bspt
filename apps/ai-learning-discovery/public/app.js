"use strict";
(function(){
const config=window.TRAINING_CONFIG||{}, ENDPOINT=config.url,KEY=config.key;
const tracks={
 beginner:{name:"AI basics",short:"Beginner",icon:"🌱",about:"Use AI for everyday tasks and learn when to check its answers.",outcomes:["Draft clear messages and turn notes into a task list.","Check important claims before relying on AI answers.","Know what personal information not to share with AI."],
 topics:[["b1","💬","Ask better questions","Get useful answers with a clear question and some context."],["b2","✉️","Draft and edit emails","Make a draft, then adjust its tone and detail."],["b3","🎯","Write a useful prompt","Describe the task, context and limits."],["b4","🔍","Check AI answers","Spot incorrect claims and check sources."],["b5","🔒","Keep personal details private","Decide what is safe to share with an AI tool."],["b6","🗂️","Turn notes into tasks","Summarise a discussion and list the next actions."],["b7","🎤","Work with voice, images and files","Ask questions about an image, file or spoken note."],["b8","🗓️","Plan a task or event","Make a plan and check the details."]]},
 intermediate:{name:"AI at work",short:"Intermediate",icon:"⚡",about:"Use AI with documents, work tools and repeat tasks.",outcomes:["Turn a file into a useful report or tracker.","Understand how AI can use tools and follow repeatable instructions.","Automate a task while keeping a person in control."],
 topics:[["i1","🤖","Chatbots and agents","Know when AI can take actions, not just answer questions."],["i2","🧩","Coding agents","See how Codex or Claude Code handles a small task."],["i3","📊","Reports from files","Use AI to analyse a spreadsheet and make a report."],["i4","🔌","Connect AI to your tools","Learn what plugins and MCP connections let AI do."],["i5","📚","Reusable AI instructions","Make AI follow the same steps and checks each time."],["i6","🛡️","Manage access safely","Control what AI can read and change."],["i7","🛠️","Build a simple tool","Try building a small app without writing code."],["i8","🔄","Automate routine tasks","Handle repeat follow-ups, updates and reports."]]},
 advanced:{name:"AI for teams",short:"Advanced",icon:"🚀",about:"Decide where AI is useful for a team and test it safely.",outcomes:["Identify work that may be worth automating.","Help colleagues use AI without needing to code.","Run a small AI pilot and measure the results."],
 topics:[["a1","💸","Review software costs","Decide what is worth keeping, buying or building."],["a2","👥","Help teams use AI","Give colleagues useful tools with appropriate safeguards."],["a3","🕸️","Work with multiple AI agents","Divide work between agents and review what they produce."],["a4","🏗️","Build reliable AI workflows","Combine instructions, tools and checks in one workflow."],["a5","🧪","Test and recover safely","Check the results and prepare a way to undo changes."],["a6","📈","Improve reporting workflows","Check data and automate repeat reporting work."],["a7","⏱️","Run AI projects efficiently","Break down work, run tasks in parallel and check results."],["a8","📐","Measure costs and benefits","Compare saved effort with costs and ongoing work."]]}
};
const hurdles=[
 ["possibilities","I don't know where to start"],
 ["trust","I don't trust the answers"],
 ["setup","Setting up the tools looks difficult"],
 ["privacy","I'm concerned about privacy"],
 ["time","I don't have time to learn"],
 ["approval","My workplace limits AI use"],
 ["results","I can't get useful results"],
 ["roi","I'm not sure it's worth the cost"]
];
const ideas=["Show me how to use AI on a task I do every week.","I'd like hands-on practice, not a product demo.","Show me how to handle sensitive information safely.","Help me build a small tool without coding.","Show me a workflow my team could use."];
const giftPrompt="What was the last concept you taught me that I struggled to understand. This time succinct ELI15 for a ADHD CEO.";
const state={step:0,experience:"",capability:"none",capabilities:[],track:"",changed:false,votes:{},cursor:0,hurdle:"",hurdles:[],hurdleOther:"",feedback:"",valuableProblem:"",sending:false,error:""};
const main=document.getElementById("main"),nav=document.getElementById("nav"),fill=document.getElementById("fill"),stage=document.getElementById("stage"),fraction=document.getElementById("fraction");const pending={};
function safe(v){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function tag(v){return '<div class="kicker">'+v+'</div>';}
function proposed(){if(!state.experience)return "intermediate";const a=state.experience==="daily"?"C":state.experience==="casual"?"B":"A";const b=state.capabilities.includes("agents")?"C":state.capabilities.includes("files")?"B":"A";const levels={AA:"beginner",AB:"intermediate",AC:"intermediate",BA:"intermediate",BB:"intermediate",BC:"advanced",CA:"intermediate",CB:"intermediate",CC:"advanced"};return levels[a+b];}
function selected(){return tracks[state.track||proposed()].topics.filter(t=>["like","love"].includes(state.votes[t[0]])).sort((a,b)=>Number(state.votes[b[0]]==="love")-Number(state.votes[a[0]]==="love"));}
function proceed(step){if(step===3&&!state.changed)state.track=proposed();state.step=step;state.error="";render();window.scrollTo({top:0,behavior:"smooth"});}
function intro(){return '<h1>What would you like to learn about AI?</h1><p class="lede">Tell us what you have tried and what you would like help with. We will suggest a course level and show you possible topics.</p><p class="progress-disclosure">We keep unfinished survey answers for up to 30 days. If you register, we keep your answers and contact details for up to 12 months. Please leave out confidential information.</p>';}
function option(group,value,icon,title,desc){const on=state[group]===value;return '<button class="choice '+(on?"selected":"")+'" type="button" data-group="'+group+'" data-value="'+value+'" aria-pressed="'+on+'"><span class="choice-body"><span class="choice-title">'+title+'</span><span class="choice-desc">'+desc+'</span></span><span class="radio"></span></button>';}
function experience(){return tag("Step 1 · Your experience")+'<h2>How often do you use AI?</h2><p class="lede">Choose one or skip this question.</p><div class="option-list">'+option("experience","new","","Rarely or never","I have not tried AI much, if at all.")+option("experience","casual","","Sometimes","I use it to ask questions, get ideas or draft text.")+option("experience","daily","","Most days","I already use AI for work or personal tasks.")+'</div>';}
function multiOption(id,icon,title,detail){const yes=state.capabilities.includes(id);return '<button class="choice '+(yes?"selected":"")+'" type="button" data-capability="'+id+'" aria-pressed="'+yes+'"><span class="choice-body"><span class="choice-title">'+title+'</span><span class="choice-desc">'+detail+'</span></span><span class="multi-check">'+(yes?"✓":"")+'</span></button>';}
function capability(){return tag("Step 2 · Your experience")+'<h2>What have you used AI for?</h2><p class="lede">Select all that apply. You can skip this question.</p><div class="option-list">'+multiOption("chat","","Chat and everyday questions","Ask questions, brainstorm, translate or write.")+multiOption("files","","Documents, reports and spreadsheets","Read, analyse or create files with AI.")+multiOption("agents","","Coding tools or task agents","Use Codex, Claude Code, Copilot or automated workflows.")+'</div><p class="small-label" style="margin-top:22px">You can change the suggested course level on the next page.</p>';}
function level(){const t=tracks[state.track||proposed()];return tag("Step 3 · Course level")+'<h2>Suggested course level</h2><p class="lede">Based on your answers, this is a good place to start.</p><div class="level-highlight"><div class="overline">Suggested level</div><div class="level-name">'+t.name+'</div><p>'+t.about+'</p></div><p class="lede">Prefer a different level? Choose it below.</p><div class="level-choices">'+Object.keys(tracks).map(id=>'<button type="button" data-track="'+id+'" class="level-option '+(state.track===id?"selected":"")+'" aria-pressed="'+(state.track===id)+'">'+tracks[id].short+'</button>').join("")+'</div>';}
function topicDeck(){
 const all=tracks[state.track].topics,i=state.cursor,t=all[i];if(!t)return review();
 return tag("Step 4 · Course topics")+
 '<h2>Which topics would you like covered?</h2><p class="lede">Swipe a card or use the buttons. You can skip topics.</p>'+
 '<div class="deck-stats"><span>TOPIC '+(i+1)+' OF '+all.length+'</span><span>'+Object.keys(state.votes).length+' RATED</span></div>'+
 '<div class="deck-stripes">'+all.map((it,j)=>'<i class="'+(j<i?(state.votes[it[0]]||""):"")+'"></i>').join("")+'</div>'+
 '<div class="swipe-directions" aria-label="Swipe directions"><span class="dir-no">← Not for me</span><span class="dir-yes">↑ Somewhat interested</span><span class="dir-love">♥ Love to know more →</span></div>'+
 '<div class="swipe" data-topic="'+t[0]+'" tabindex="0" role="group" aria-label="'+safe(t[2])+'. Swipe left for Not for me, up for Somewhat interested, or right for Love to know more. Use arrow keys or the three buttons as an alternative."><span class="swipe-direction-badge" aria-hidden="true"></span><h3>'+safe(t[2])+'</h3><p>'+safe(t[3])+'</p></div>'+
 '<div class="vote-row"><button type="button" class="vote no" data-vote="nope" aria-label="Not for me"><b>×</b><span>Not for me</span><small>LEFT</small></button><button type="button" class="vote yes" data-vote="like" aria-label="Somewhat interested"><b>✓</b><span>Somewhat interested</span><small>UP</small></button><button type="button" class="vote love" data-vote="love" aria-label="Love to know more"><b>♥</b><span>Love to know more</span><small>RIGHT</small></button></div>'+
 '<div class="aux"><button type="button" data-undo="1" '+(i===0?"disabled":"")+'>Undo last choice</button><button type="button" data-skip-topic="1">Skip this topic</button></div>';
}
function favoriteList(limit){const items=selected(),shown=limit?items.slice(0,limit):items;if(!shown.length)return '<p class="empty">No topics selected. You can change your choices or continue.</p>';return '<div class="favorites">'+shown.map(t=>'<div class="favorite"><span class="favorite-title">'+safe(t[2])+'</span><span class="favorite-tag '+(state.votes[t[0]]==="love"?"love":"")+'">'+(state.votes[t[0]]==="love"?"Love it":"Interested")+'</span></div>').join("")+'</div>'+(shown.length<items.length?'<p class="lede">'+(items.length-shown.length)+' more topics selected</p>':"");}
function review(){
 const list=tracks[state.track].topics;
 const groups=[["love","Love to know more"],["like","Somewhat interested"],["nope","Not for me"],["unrated","Not rated"]];
 const count=list.filter(t=>Object.hasOwn(state.votes,t[0])).length;
 const sections=groups.map(([key,label])=>{
  const matches=list.filter(t=>key==="unrated"?!Object.hasOwn(state.votes,t[0]):state.votes[t[0]]===key);
  if(!matches.length)return "";
  return '<section class="review-group review-'+key+'"><h3><span class="review-symbol" aria-hidden="true">'+({love:"♥",like:"✓",nope:"×",unrated:"–"}[key])+'</span>'+label+' <span class="review-count">('+matches.length+')</span></h3><div class="review-items">'+matches.map(t=>'<div class="review-item">'+safe(t[2])+'</div>').join("")+'</div></section>';
 }).join("");
 return tag("Step 5 · Check your choices")+'<h2>Review your topics</h2><p class="lede">'+count+' of '+list.length+' topics rated. Check your choices before continuing.</p>'+sections+'<button type="button" class="redo" data-redo="1">Start topic choices again</button>';
}
function outcomes(){return '<section class="outcomes"><div class="overline">Possible course content</div><h3>What you could learn</h3>'+tracks[state.track].outcomes.map(t=>'<div class="outcome"><b>✓</b><span>'+safe(t)+'</span></div>').join("")+'</section>';}
function hurdlePanel(){
 return '<div class="hurdles"><h3>What makes AI difficult to use?</h3><p>Select all that apply. Optional.</p><div class="hurdle-grid">'+hurdles.map(([id,t])=>'<button class="hurdle '+(state.hurdles.includes(id)?"selected":"")+'" data-hurdle="'+id+'" type="button" aria-pressed="'+state.hurdles.includes(id)+'"><span class="hurdle-check" aria-hidden="true">'+(state.hurdles.includes(id)?"✓":"+")+'</span><span>'+safe(t)+'</span></button>').join("")+'</div>'+
 '<label class="hurdle-other"><span>Other (optional)</span><input name="hurdle_other" maxlength="300" placeholder="Anything else?" value="'+safe(state.hurdleOther)+'"></label></div>';
}
function thoughtPanel(){return '<div class="thoughts"><span>Examples:</span><div class="thought-grid">'+ideas.map((v,i)=>'<button type="button" data-idea="'+i+'">'+safe(v)+'</button>').join("")+'</div></div>';}
function signup(){
 return tag("Step 6 · Register interest")+'<h2>Register your interest</h2><p class="lede">Only your name, email and permission to contact you are required. Everything else is optional.</p><form id="signup" novalidate>'+hurdlePanel()+
 '<label class="field"><span class="field-label">What work problem would you, your boss or your company pay to solve with AI? (optional)</span><textarea name="valuable_problem" data-grow rows="1" maxlength="1600" placeholder="A task that takes too much time...">'+safe(state.valuableProblem)+'</textarea></label>'+
 '<label class="field feedback-field"><span class="field-label">What would make this course worth attending? (optional)</span><textarea name="feedback" data-grow rows="1" maxlength="1600" placeholder="I want to learn how to...">'+safe(state.feedback)+'</textarea></label>'+thoughtPanel()+
 '<div class="two-fields"><label class="field"><span class="field-label">First name *</span><input name="first_name" maxlength="80" required autocomplete="given-name" placeholder="First name"></label><label class="field"><span class="field-label">Email address *</span><input type="email" name="email" maxlength="254" required autocomplete="email" placeholder="you@example.com"></label></div>'+
 '<label class="check"><input type="checkbox" name="consent" required><span><strong>Contact me about this course *</strong> I agree that ByteSize ProTip may use my name, email and any survey answers to contact me about this course.</span></label>'+
 '<label class="check"><input type="checkbox" name="marketing"><span><strong>Other AI course updates (optional)</strong> I would also like occasional updates about future training and resources. I can opt out later.</span></label>'+
 '<label class="honey" aria-hidden="true">Do not fill <input name="website" autocomplete="off" tabindex="-1"></label><div id="form-error" role="alert"></div><span id="signup-end" aria-hidden="true"></span></form>';
}
function thankyou(){return tag("Registration received")+'<div class="success"><h2>Thanks. We have your details.</h2><p>We will contact you when we have an update about the course.</p></div><section class="gift"><div class="small-label">A PROMPT TO TRY</div><h3>A prompt to try</h3><p>If an AI explanation did not make sense, send this in the same chat:</p><blockquote>'+safe(giftPrompt)+'</blockquote><button type="button" data-copy="1">Copy prompt</button><span class="copy-result" id="copy-result" role="status"></span></section>';}

function navigation(){
 if(state.step===0)return '<button type="button" class="btn primary" data-next="1">Start survey</button><button type="button" class="btn secondary skip-cta" data-skip="1">Skip to registration</button>';
 if(state.step===7)return '<button type="button" class="btn primary" data-restart="1">Start again</button>';
 if(state.step===4)return '<button type="button" class="btn secondary" data-back="1">← Back</button><button type="button" class="btn secondary skip-cta" data-skip="1">Skip to registration</button><span class="swipe-hint">← Not for me · ↑ Somewhat interested · Love to know more →</span>';
 if(state.step===6)return '<button type="button" class="btn secondary" data-back="1" '+(state.sending?"disabled":"")+'>← Back</button><button type="button" class="btn registration-cta" data-registration-action="1" '+(state.sending?"disabled":"")+'>Next question</button>';
 const label=state.step===3?"Choose topics":state.step===5?"Continue to registration":"Continue";
 return '<button type="button" class="btn secondary" data-back="1">← Back</button><button type="button" class="btn secondary skip-cta" data-skip="1">Skip to registration</button><button class="btn primary" type="button" data-next="1">'+label+'</button>';
}
function isMobileRegistration(){return window.matchMedia("(max-width:610px)").matches;}
function registrationAtBottom(){
 return window.scrollY+window.innerHeight>=Math.max(document.documentElement.scrollHeight,document.body.scrollHeight)-36;
}
function syncRegistrationCta(){
 if(state.step!==6)return;
 const button=nav.querySelector("[data-registration-action]");
 if(!button)return;
 const ready=!isMobileRegistration()||registrationAtBottom();
 button.textContent=state.sending?"Saving...":ready?"Register interest":"Next question";
 button.classList.toggle("submit-ready",ready);
 button.setAttribute("aria-label",ready?"Register interest":"Scroll to next question");
}
function registrationMarkers(){
 const form=document.getElementById("signup");if(!form)return [];
 const selectors=[".hurdles",'[name="valuable_problem"]','[name="feedback"]','[name="first_name"]','[name="email"]','[name="consent"]','[name="marketing"]',"#signup-end"];
 return selectors.map(sel=>form.querySelector(sel)).filter(Boolean).map(el=>el.closest("label")||el);
}
function nextRegistrationQuestion(){
 const threshold=Math.max(85,Math.min(145,window.innerHeight*.19));
 const next=registrationMarkers().find(el=>el.getBoundingClientRect().top>threshold+18);
 const reduced=window.matchMedia("(prefers-reduced-motion:reduce)").matches;
 if(next)next.scrollIntoView({behavior:reduced?"auto":"smooth",block:"start"});
 else window.scrollTo({top:document.documentElement.scrollHeight,behavior:reduced?"auto":"smooth"});
}
window.addEventListener("scroll",syncRegistrationCta,{passive:true});
window.addEventListener("resize",syncRegistrationCta);
window.visualViewport?.addEventListener("resize",syncRegistrationCta);

const PROGRESS_URL="https://jgkmjeorlkdpsptatuhc.supabase.co/functions/v1/genai-course-progress";
const storageKey="ai-discovery-v2";
let sessionId="", lastSnapshot="", progressChain=Promise.resolve(), progressTimer=0;
try {
  let saved=JSON.parse(sessionStorage.getItem(storageKey)||"null");
  if(saved && typeof saved==="object" && saved.session_id && saved.state){
    sessionId=saved.session_id;
    for(const key of ["step","experience","capability","capabilities","track","changed","votes","cursor","hurdle","hurdles","hurdleOther","feedback","valuableProblem"]){
      if(Object.hasOwn(saved.state,key))state[key]=saved.state[key];
    }
    if(!Number.isInteger(state.step)||state.step<0||state.step>7)state.step=0;
    if(!Array.isArray(state.capabilities))state.capabilities=[];
    if(!state.votes||typeof state.votes!=="object")state.votes={};
    if(!Array.isArray(state.hurdles))state.hurdles=state.hurdle?[state.hurdle]:[];
    state.hurdles=Array.from(new Set(state.hurdles.filter(id=>hurdles.some(([k])=>k===id))));
    state.hurdle=state.hurdles[0]||"";
  }
}catch{}
if(!/^[0-9a-f-]{36}$/i.test(sessionId))sessionId=crypto.randomUUID();
function capture(){
 try{sessionStorage.setItem(storageKey,JSON.stringify({session_id:sessionId,state:{
   step:state.step,experience:state.experience,capability:state.capability,
   capabilities:state.capabilities,track:state.track,changed:state.changed,
   votes:state.votes,cursor:state.cursor,hurdle:state.hurdles[0]||"",hurdles:state.hurdles,hurdleOther:state.hurdleOther,
   feedback:state.feedback,valuableProblem:state.valuableProblem
 }}));}catch{}
 if(state.step<1)return progressChain;
 const payload={
   session_id:sessionId,capture_consent:true,step:state.step,
   track:state.track,experience:state.experience,capabilities:state.capabilities,
   topic_preferences:state.votes,biggest_hurdle:state.hurdles[0]||"",biggest_hurdles:state.hurdles,hurdle_other:state.hurdleOther,
   valuable_problem:state.valuableProblem,feedback:state.feedback,
   is_complete:state.step===7
 };
 const serial=JSON.stringify(payload);
 if(serial===lastSnapshot)return progressChain;
 lastSnapshot=serial;
 progressChain=progressChain.catch(()=>{}).then(async()=>{
   const resp=await fetch(PROGRESS_URL,{method:"POST",headers:{"content-type":"application/json"},body:serial,keepalive:true});
   if(!resp.ok)throw new Error("Progress not saved: "+resp.status);
 }).catch(()=>{lastSnapshot="";});
 return progressChain;
}
function scheduleCapture(){clearTimeout(progressTimer);progressTimer=setTimeout(capture,500);}
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="hidden"){clearTimeout(progressTimer);capture();}});
function resizeComposers(){document.querySelectorAll("textarea[data-grow]").forEach(el=>{el.style.height="auto";el.style.height=Math.max(52,el.scrollHeight)+"px";});}
function render(){main.innerHTML=[intro,experience,capability,level,topicDeck,review,signup,thankyou][state.step]();resizeComposers();nav.innerHTML=navigation();syncRegistrationCta();fill.style.width=(state.step===0?4:state.step===7?100:Math.round(state.step/6*100))+"%";stage.textContent=state.step===7?"COMPLETE":"AI COURSE SURVEY";fraction.textContent=state.step===0?"START":state.step===7?"COMPLETE":"STEP "+state.step+" OF 6";capture();}
function go(n){if((n===3&&!state.changed)||(n>=4&&!tracks[state.track]))state.track=proposed();state.step=n;state.error="";render();window.scrollTo({top:0,behavior:"smooth"});}
function skipTopic(){if(state.step!==4)return;state.cursor++;if(state.cursor>=tracks[state.track].topics.length)go(5);else render();}
function vote(mode){if(state.step!==4)return;const list=tracks[state.track].topics,t=list[state.cursor];if(!t)return;for(const id of Object.keys(pending)){clearTimeout(pending[id].timer);delete pending[id];}state.votes[t[0]]=mode;state.cursor++;if(state.cursor>=list.length)go(5);else render();}
function reset(){state.step=0;state.experience="";state.capability="none";state.capabilities=[];state.track="";state.changed=false;state.votes={};state.cursor=0;state.hurdle="";state.hurdles=[];state.hurdleOther="";state.feedback="";state.valuableProblem="";state.sending=false;sessionId=crypto.randomUUID();lastSnapshot="";render();}
async function submit(form){if(state.sending)return;const f=new FormData(form);const first=String(f.get("first_name")||"").trim(),email=String(f.get("email")||"").trim().toLowerCase();state.feedback=String(f.get("feedback")||"").trim();const valuableProblem=String(f.get("valuable_problem")||"").trim();state.valuableProblem=valuableProblem;state.hurdleOther=String(f.get("hurdle_other")||"").trim();const box=document.getElementById("form-error");const err=(v,field)=>{
 form.querySelectorAll(".field-error").forEach(el=>el.remove());
 form.querySelectorAll(".field-invalid").forEach(el=>el.classList.remove("field-invalid"));
 if(box)box.textContent="";
 const label=field?.closest("label");
 const target=label||box;
 if(label){
   label.classList.add("field-invalid");
   const message=document.createElement("span");
   message.className="field-error";message.textContent=v;message.setAttribute("role","alert");label.append(message);
   field.setAttribute("aria-invalid","true");
 }else if(box){box.innerHTML='<div class="error">'+safe(v)+'</div>';}
 if(target){if(field)field.focus({preventScroll:true});target.scrollIntoView({behavior:"smooth",block:"center"});}
};
if(f.get("website"))return;
if(!first||first.length>80){err("Enter your first name.",form.elements.namedItem("first_name"));return;}if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)){err("Enter a valid email address.",form.elements.namedItem("email"));return;}
if(f.get("consent")!=="on"){err("Please agree to be contacted about the course.",form.elements.namedItem("consent"));return;}
if(state.feedback.length>1600||valuableProblem.length>1600||state.hurdleOther.length>300){err("Please shorten your answer.");return;}
if(!ENDPOINT||!KEY){err("Signup is temporarily unavailable. Please try again later.");return;}
const payload={first_name:first,email,experience:state.experience==="casual"?"sometimes":state.experience==="daily"?"frequent":state.experience==="new"?"new":null,capability:state.capabilities.length?state.capability:null,capabilities:state.capabilities.map(x=>x==="files"?"documents":x),track:state.track,topic_preferences:state.votes,biggest_hurdle:state.hurdles[0]||"",biggest_hurdles:state.hurdles,hurdle_other:state.hurdleOther,feedback:state.feedback,valuable_problem:valuableProblem,essential_consent:true,marketing_consent:f.get("marketing")==="on"};
state.sending=true;nav.innerHTML=navigation();err("");
try{const result=await fetch(ENDPOINT,{method:"POST",headers:{"apikey":KEY,"Content-Type":"application/json","Prefer":"return=minimal"},body:JSON.stringify(payload)});if(!result.ok)throw new Error("Submission failed: "+result.status);go(7);}catch(e){err("We could not save your registration. Please try again.");}finally{state.sending=false;if(state.step===6)nav.innerHTML=navigation();}}
document.addEventListener("click",function(e){
if(e.target.closest("[data-skip]")){state.track=state.track||proposed();go(6);return;}
if(e.target.closest("[data-skip-topic]")){skipTopic();return;}
if(e.target.closest("[data-registration-action]")){const form=document.getElementById("signup");if(state.step!==6||!form)return;if(!isMobileRegistration()||registrationAtBottom())submit(form);else nextRegistrationQuestion();return;}
const reaction=e.target.closest("[data-vote]");if(reaction){vote(reaction.dataset.vote);return;}
if(e.target.closest("[data-undo]")){if(state.cursor>0){state.cursor--;delete state.votes[tracks[state.track].topics[state.cursor][0]];render();}return;}
if(e.target.closest("[data-redo]")){state.votes={};state.cursor=0;go(4);return;}
const track=e.target.closest("[data-track]");if(track){if(state.track!==track.dataset.track){state.votes={};state.cursor=0;}state.track=track.dataset.track;state.changed=true;render();return;}
const multi=e.target.closest("[data-capability]");if(multi){const id=multi.dataset.capability;state.capabilities=state.capabilities.includes(id)?state.capabilities.filter(v=>v!==id):[...state.capabilities,id];state.capability=state.capabilities.includes("agents")?"agents":state.capabilities.includes("files")?"documents":state.capabilities.includes("chat")?"chat":"none";render();return;}
const group=e.target.closest("[data-group]");if(group){state[group.dataset.group]=group.dataset.value;render();return;}
const hurdle=e.target.closest("[data-hurdle]");if(hurdle){const id=hurdle.dataset.hurdle;state.hurdles=state.hurdles.includes(id)?state.hurdles.filter(x=>x!==id):[...state.hurdles,id];state.hurdle=state.hurdles[0]||"";capture();document.querySelectorAll("[data-hurdle]").forEach(el=>{const on=state.hurdles.includes(el.dataset.hurdle);el.classList.toggle("selected",on);el.setAttribute("aria-pressed",String(on));const check=el.querySelector(".hurdle-check");if(check)check.textContent=on?"✓":"+";});return;}
const idea=e.target.closest("[data-idea]");if(idea){const area=document.querySelector('textarea[name="feedback"]');if(area){const phrase=ideas[Number(idea.dataset.idea)];area.value=area.value?(area.value.trimEnd()+"\n"+phrase).slice(0,1600):phrase;state.feedback=area.value;resizeComposers();capture();area.focus();}return;}
if(e.target.closest("[data-copy]")){const status=document.getElementById("copy-result");if(navigator.clipboard?.writeText)navigator.clipboard.writeText(giftPrompt).then(()=>status.textContent="Copied.",()=>status.textContent="Select the text above to copy it.");else if(status)status.textContent="Select the text above to copy it.";return;}
if(e.target.closest("[data-next]")){go(state.step+1);return;}
if(e.target.closest("[data-back]")){if(state.step===5)state.cursor=tracks[state.track].topics.length-1;go(state.step-1);return;}
if(e.target.closest("[data-restart]")){reset();return;}
});
document.addEventListener("input",e=>{if(e.target.getAttribute("aria-invalid")==="true"){e.target.removeAttribute("aria-invalid");const wrapper=e.target.closest("label");wrapper?.classList.remove("field-invalid");wrapper?.querySelector(".field-error")?.remove();}if(e.target.name==="feedback"){state.feedback=e.target.value;scheduleCapture();}if(e.target.name==="valuable_problem"){state.valuableProblem=e.target.value;scheduleCapture();}if(e.target.name==="hurdle_other"){state.hurdleOther=e.target.value;scheduleCapture();}if(e.target.matches("textarea[data-grow]"))resizeComposers();});
document.addEventListener("submit",e=>{if(e.target.id==="signup"){e.preventDefault();if(!isMobileRegistration()||registrationAtBottom())submit(e.target);else nextRegistrationQuestion();}});
document.addEventListener("keydown",e=>{if(state.step!==4)return;if(["ArrowLeft","ArrowRight","ArrowUp"].includes(e.key)&&!["INPUT","TEXTAREA"].includes(document.activeElement?.tagName)){e.preventDefault();vote(e.key==="ArrowLeft"?"nope":e.key==="ArrowRight"?"love":"like");}});
let drag=null,ignoreClick=false;
document.addEventListener("pointerdown",e=>{const el=e.target.closest(".swipe");if(el)drag={x:e.clientX,y:e.clientY,id:el.dataset.topic};});
document.addEventListener("pointermove",e=>{if(!drag)return;const el=document.querySelector(".swipe");if(el){const dx=e.clientX-drag.x,dy=e.clientY-drag.y;el.dataset.direction=Math.abs(dx)>22&&Math.abs(dx)>Math.abs(dy)*1.1?(dx<0?"nope":"love"):(dy< -22&&Math.abs(dy)>Math.abs(dx)*1.1?"like":"");el.style.transform="translate("+Math.max(-65,Math.min(65,dx))*.4+"px,"+Math.min(0,dy)*.18+"px) rotate("+Math.max(-5,Math.min(5,dx/25))+"deg)";}});
document.addEventListener("pointerup",e=>{if(!drag)return;const old=drag;drag=null;const el=document.querySelector(".swipe");if(el){el.style.transform="";delete el.dataset.direction;}const dx=e.clientX-old.x,dy=e.clientY-old.y;let mode=null;if(Math.abs(dx)>65&&Math.abs(dx)>Math.abs(dy)*1.1)mode=dx<0?"nope":"love";else if(dy< -65&&Math.abs(dy)>Math.abs(dx)*1.1)mode="like";if(mode){ignoreClick=true;vote(mode);setTimeout(()=>ignoreClick=false,400);}});
document.addEventListener("pointercancel",()=>{drag=null;const el=document.querySelector(".swipe");if(el){el.style.transform="";delete el.dataset.direction;}});
render();
})();