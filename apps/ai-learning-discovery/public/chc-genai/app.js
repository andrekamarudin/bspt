"use strict";
(function(){
const config=window.TRAINING_CONFIG||{}, ENDPOINT=config.url,KEY=config.key;
const tracks=window.CHC_TRACKS;
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
const giftPrompt="Explain this idea in plain English, show me an example, and ask one question to check my understanding.";
const state={step:0,experience:"",capability:"none",capabilities:[],track:"",changed:false,votes:{},cursor:0,hurdle:"",hurdles:[],hurdleOther:"",feedback:"",valuableProblem:"",sending:false,error:""};
const main=document.getElementById("main"),nav=document.getElementById("nav"),fill=document.getElementById("fill"),stage=document.getElementById("stage"),fraction=document.getElementById("fraction");
function safe(v){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function tag(v){return '<div class="kicker">'+v+'</div>';}
function intro(){return '<h1>Which GenAI course is right for you?</h1><p class="lede">See what you will learn at each level, then choose the one that interests you most. No test or scoring needed.</p><p class="progress-disclosure">We keep unfinished survey answers for up to 30 days. If you register, we keep your answers and contact details for up to 12 months. Please leave out confidential information.</p>';}
function levels(){
 return tag("Step 1 · Choose your course level")+'<h2>Choose the level that fits you</h2><p class="lede">All topics are shown below, so you can make an informed choice. Choose one level.</p>'+
 '<div class="course-levels" role="group" aria-label="Course levels">'+Object.entries(tracks).map(([id,t])=>{
  const on=state.track===id;
  return '<button type="button" data-track="'+id+'" class="course-level '+(on?"selected":"")+'" aria-pressed="'+on+'">'+
   '<span class="course-level-heading"><strong>'+safe(t.short)+'</strong><span class="level-check">'+(on?"✓ Selected":"Choose level")+'</span></span>'+
   '<span class="course-level-description">'+safe(t.about)+'</span>'+
   '<span class="course-level-topic-title">Topics covered</span>'+
   '<span class="course-level-topic-list">'+t.topics.map(topic=>'<span class="course-level-topic">'+safe(topic[2])+'</span>').join("")+'</span></button>';
 }).join("")+'</div>';
}
function hurdlePanel(){
 return '<div class="hurdles"><h3>What makes AI difficult to use?</h3><p>Select all that apply. Optional.</p><div class="hurdle-grid">'+hurdles.map(([id,t])=>'<button class="hurdle '+(state.hurdles.includes(id)?"selected":"")+'" data-hurdle="'+id+'" type="button" aria-pressed="'+state.hurdles.includes(id)+'"><span class="hurdle-check" aria-hidden="true">'+(state.hurdles.includes(id)?"✓":"+")+'</span><span>'+safe(t)+'</span></button>').join("")+'</div>'+
 '<label class="hurdle-other"><span>Other (optional)</span><input name="hurdle_other" maxlength="300" placeholder="Anything else?" value="'+safe(state.hurdleOther)+'"></label></div>';
}
function thoughtPanel(){return '<div class="thoughts"><span>Examples:</span><div class="thought-grid">'+ideas.map((v,i)=>'<button type="button" data-idea="'+i+'">'+safe(v)+'</button>').join("")+'</div></div>';}
function signup(){
 return tag("Step 2 · Register interest")+'<h2>Register your interest</h2><p class="lede">Only your name, email and permission to contact you are required. Everything else is optional.</p><form id="signup" novalidate>'+hurdlePanel()+
 '<label class="field"><span class="field-label">What work problem would you, your boss or your company pay to solve with AI? (optional)</span><textarea name="valuable_problem" data-grow rows="1" maxlength="1600" placeholder="A task that takes too much time...">'+safe(state.valuableProblem)+'</textarea></label>'+
 '<label class="field feedback-field"><span class="field-label">What would make this course worth attending? (optional)</span><textarea name="feedback" data-grow rows="1" maxlength="1600" placeholder="I want to learn how to...">'+safe(state.feedback)+'</textarea></label>'+thoughtPanel()+
 '<div class="two-fields"><label class="field"><span class="field-label">First name *</span><input name="first_name" maxlength="80" required autocomplete="given-name" placeholder="First name"></label><label class="field"><span class="field-label">Email address *</span><input type="email" name="email" maxlength="254" required autocomplete="email" placeholder="you@example.com"></label></div>'+
 '<label class="check"><input type="checkbox" name="consent" required><span><strong>Contact me about this course *</strong> I agree that ByteSize ProTip may use my name, email and any survey answers to contact me about this course.</span></label>'+
 '<label class="check"><input type="checkbox" name="marketing"><span><strong>Other AI course updates (optional)</strong> I would also like occasional updates about future training and resources. I can opt out later.</span></label>'+
 '<label class="honey" aria-hidden="true">Do not fill <input name="website" autocomplete="off" tabindex="-1"></label><div id="form-error" role="alert"></div><span id="signup-end" aria-hidden="true"></span></form>';
}
function thankyou(){return tag("Registration received")+'<div class="success"><h2>Thanks. We have your details.</h2><p>We will contact you when we have an update about the course.</p></div><section class="gift"><div class="small-label">A PROMPT TO TRY</div><h3>A prompt to try</h3><p>If an AI explanation did not make sense, send this in the same chat:</p><blockquote>'+safe(giftPrompt)+'</blockquote><button type="button" data-copy="1">Copy prompt</button><span class="copy-result" id="copy-result" role="status"></span></section>';}

function navigation(){
 if(state.step===0)return '<button type="button" class="btn primary" data-next="1">Choose your level</button>';
 if(state.step===3)return '<button type="button" class="btn primary" data-restart="1">Start again</button>';
 if(state.step===2)return '<button type="button" class="btn secondary" data-back="1" '+(state.sending?"disabled":"")+'>← Back</button><button type="button" class="btn registration-cta" data-registration-action="1" '+(state.sending?"disabled":"")+'>Register interest</button>';
 return '<button type="button" class="btn secondary" data-back="1">← Back</button><button class="btn primary" type="button" data-next="1" '+(!state.track?"disabled":"")+'>Continue with '+(state.track?safe(tracks[state.track].short):"my level")+'</button>';
}
function isMobileRegistration(){return window.matchMedia("(max-width:610px)").matches;}
function registrationAtBottom(){
 return window.scrollY+window.innerHeight>=Math.max(document.documentElement.scrollHeight,document.body.scrollHeight)-36;
}
function syncRegistrationCta(){
 if(state.step!==2)return;
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
const storageKey="ai-discovery-chc-genai-v2";
let sessionId="", lastSnapshot="", progressChain=Promise.resolve(), progressTimer=0;
try {
  let saved=JSON.parse(sessionStorage.getItem(storageKey)||"null");
  if(saved && typeof saved==="object" && saved.session_id && saved.state){
    sessionId=saved.session_id;
    for(const key of ["step","experience","capability","capabilities","track","changed","votes","cursor","hurdle","hurdles","hurdleOther","feedback","valuableProblem"]){
      if(Object.hasOwn(saved.state,key))state[key]=saved.state[key];
    }
    if(!Number.isInteger(state.step)||state.step<0||state.step>3)state.step=0;
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
   is_complete:state.step===3
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
function render(){
 main.innerHTML=[intro,levels,signup,thankyou][state.step]();
 resizeComposers();nav.innerHTML=navigation();syncRegistrationCta();
 fill.style.width=(state.step===0?4:state.step===1?45:state.step===2?85:100)+"%";
 stage.textContent=state.step===3?"COMPLETE":"CHC GENAI SURVEY";
 fraction.textContent=state.step===0?"START":state.step===3?"COMPLETE":"STEP "+state.step+" OF 2";
 capture();
}
function go(n){
 if(n===2&&!state.track)return;
 state.step=Math.max(0,Math.min(3,n));
 state.error="";render();
 window.scrollTo({top:0,behavior:"smooth"});
}
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
try{const result=await fetch(ENDPOINT,{method:"POST",headers:{"apikey":KEY,"Content-Type":"application/json","Prefer":"return=minimal"},body:JSON.stringify(payload)});if(!result.ok)throw new Error("Submission failed: "+result.status);go(3);}catch(e){err("We could not save your registration. Please try again.");}finally{state.sending=false;if(state.step===2)nav.innerHTML=navigation();}}
document.addEventListener("click",function(e){
 if(e.target.closest("[data-registration-action]")){
  const form=document.getElementById("signup");
  if(state.step!==2||!form)return;
  if(!isMobileRegistration()||registrationAtBottom())submit(form);else nextRegistrationQuestion();
  return;
 }
 const course=e.target.closest("[data-track]");
 if(course){
   if(state.track!==course.dataset.track)state.votes={};
   state.track=course.dataset.track;state.changed=true;render();scheduleCapture();return;
 }
 const hurdle=e.target.closest("[data-hurdle]");
 if(hurdle){
  const id=hurdle.dataset.hurdle;
  state.hurdles=state.hurdles.includes(id)?state.hurdles.filter(x=>x!==id):[...state.hurdles,id];
  state.hurdle=state.hurdles[0]||"";capture();
  document.querySelectorAll("[data-hurdle]").forEach(el=>{
   const on=state.hurdles.includes(el.dataset.hurdle);
   el.classList.toggle("selected",on);el.setAttribute("aria-pressed",String(on));
   const check=el.querySelector(".hurdle-check");if(check)check.textContent=on?"✓":"+";
  });return;
 }
 const idea=e.target.closest("[data-idea]");
 if(idea){
  const area=document.querySelector('textarea[name="feedback"]');
  if(area){
   const phrase=ideas[Number(idea.dataset.idea)];
   area.value=area.value?(area.value.trimEnd()+"\n"+phrase).slice(0,1600):phrase;
   state.feedback=area.value;resizeComposers();capture();area.focus();
  }return;
 }
 if(e.target.closest("[data-copy]")){
  const status=document.getElementById("copy-result");
  if(navigator.clipboard?.writeText)navigator.clipboard.writeText(giftPrompt).then(()=>status.textContent="Copied.",()=>status.textContent="Select the text above to copy it.");
  else if(status)status.textContent="Select the text above to copy it.";
  return;
 }
 if(e.target.closest("[data-next]")){if(state.step===1&&!state.track)return;go(state.step+1);return;}
 if(e.target.closest("[data-back]")){go(state.step-1);return;}
 if(e.target.closest("[data-restart]")){reset();return;}
});
document.addEventListener("input",e=>{
 if(e.target.getAttribute("aria-invalid")==="true"){
  e.target.removeAttribute("aria-invalid");const wrapper=e.target.closest("label");
  wrapper?.classList.remove("field-invalid");wrapper?.querySelector(".field-error")?.remove();
 }
 if(e.target.name==="feedback"){state.feedback=e.target.value;scheduleCapture();}
 if(e.target.name==="valuable_problem"){state.valuableProblem=e.target.value;scheduleCapture();}
 if(e.target.name==="hurdle_other"){state.hurdleOther=e.target.value;scheduleCapture();}
 if(e.target.matches("textarea[data-grow]"))resizeComposers();
});
document.addEventListener("submit",e=>{
 if(e.target.id==="signup"){
  e.preventDefault();
  if(!isMobileRegistration()||registrationAtBottom())submit(e.target);else nextRegistrationQuestion();
 }
});
render();
})();
