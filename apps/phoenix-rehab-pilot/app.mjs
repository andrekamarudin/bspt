import {respond} from "./engine.mjs";
const $=(id)=>document.getElementById(id);
const messages=$("messages"),suggestions=$("suggestions"),input=$("question");
const transcript=[];
let state={branch:null,therapist:null,intent:null};
let toastTimer=0;
function notify(s){const el=$("toast");el.textContent=s;el.classList.add("visible");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("visible"),2800)}
function h(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e}
function safeLink(item){try{const u=new URL(item.url);if(u.protocol!=="https:")return null;const a=h("a","answer-link",item.label+" ↗");a.href=u.href;a.target="_blank";a.rel="noopener noreferrer";return a}catch{return null}}
function buttons(options){
 suggestions.replaceChildren();
 for(const option of (options||[]).slice(0,8)){
   const btn=h("button","suggestion",option.label);btn.type="button";btn.addEventListener("click",()=>send(option.prompt));suggestions.append(btn);
 }
}
function append(role,text,detail){
 const wrap=h("div","bubble-row "+role);
 if(role==="assistant")wrap.append(h("div","bubble-avatar","P"));
 const content=h("div","bubble-content");
 const message=h("div","bubble",text);content.append(message);
 if(detail?.links?.length){
   const links=h("div","response-links");
   for(const a of detail.links){const link=safeLink(a);if(link)links.append(link)}
   content.append(links);
 }
 if(detail?.source&&role==="assistant"){
   const attribution=h("span","citation","Based on Phoenix's published information");
   content.append(attribution);
 }
 wrap.append(content);messages.append(wrap);messages.scrollTop=messages.scrollHeight;
 transcript.push({role,text,at:new Date().toISOString(),category:detail?.category});
}
function send(raw){
 const msg=String(raw||"").trim();
 if(!msg)return;
 input.value="";append("user",msg);
 const answer=respond(msg,state);
 state=answer.state;
 append("assistant",answer.text,answer);
 buttons(answer.buttons);
 input.focus({preventScroll:true});
}
function reset(){
 state={branch:null,therapist:null,intent:null};transcript.length=0;messages.replaceChildren();
 const hello="Hello! I can help you find a Phoenix Rehab clinic, understand common appointment questions, and reach real booking calendars. What would you like to do?";
 append("assistant",hello);
 buttons([{label:"Book an appointment",prompt:"I'd like to book"},{label:"How much is a visit?",prompt:"How much does it cost?"},{label:"Do you issue MCs?",prompt:"Can you issue an MC?"},{label:"Talk to someone",prompt:"Speak to a person"}]);
}
function transcriptText(){return transcript.map(m=>(m.role==="assistant"?"Assistant":"Tester")+": "+m.text).join("\n\n")}
async function clipboard(text){
 if(navigator.clipboard?.writeText){try{await navigator.clipboard.writeText(text);notify("Copied to clipboard");return true}catch{}}
 notify("Clipboard is unavailable; use the email option instead.");return false;
}
function noteText(){
 const feedback=$("tester-feedback").value.trim();
 if(!feedback){$("feedback-status").textContent="Write a short note first.";return null}
 const includes=$("include-transcript").checked;
 return "Phoenix Rehab web pilot feedback\n\n"+feedback+(includes?"\n\n--- DEMO TRANSCRIPT ---\n"+transcriptText():"");
}
function mailFeedback(){
 const note=noteText();if(!note)return;
 const subject=encodeURIComponent("Phoenix Rehab chatbot pilot – testing feedback");
 const body=encodeURIComponent(note);
 // Mailto is deliberately user-mediated; this app never sends email automatically.
 const href="mailto:contact@bytesizeprotip.com?subject="+subject+"&body="+body;
 if(href.length>1900){$("feedback-status").textContent="Feedback is too long for a mail link. Please use Copy feedback instead.";return}
 window.location.href=href;
 $("feedback-status").textContent="Email draft requested; send it from your mail app when ready.";
}
function showFeedback(){$("feedback-dialog").showModal();$("tester-feedback").focus()}
$("chat-form").addEventListener("submit",e=>{e.preventDefault();send(input.value)});
$("reset-chat").addEventListener("click",()=>{reset();notify("New conversation started")});
$("copy-chat").addEventListener("click",()=>clipboard(transcriptText()));
$("open-feedback").addEventListener("click",showFeedback);
$("open-feedback-bottom").addEventListener("click",showFeedback);
$("close-feedback").addEventListener("click",()=>$("feedback-dialog").close());
$("feedback-dialog").addEventListener("click",e=>{if(e.target===$("feedback-dialog"))$("feedback-dialog").close()});
$("copy-feedback").addEventListener("click",async()=>{const note=noteText();if(note){const ok=await clipboard(note);if(ok)$("feedback-status").textContent="Copied. Share it with the pilot owner when ready."}});
$("email-feedback").addEventListener("click",mailFeedback);
reset();
