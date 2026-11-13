"use strict";
(function(){
 const original=window.CHC_ORIGINAL, after=window.CHC_TRACKS, matrix=window.CHC_MATRIX, recommend=window.CHC_RECOMMEND;
 if(!original||!after||!matrix||!recommend)throw Error("CHC topic source missing");
 let version="before",manualLevel=null;
 const $=id=>document.getElementById(id);
 const labels={beginner:"Beginner",intermediate:"Intermediate",advanced:"Advanced"};
 const current=()=>({experience:$("frequency").value,capability:$("capability").value});
 const suggested=()=>{const {experience,capability}=current();return recommend(experience,capability==="agents"?["agents"]:capability==="files"?["files"]:capability==="chat"?["chat"]:[])};
 function make(tag,cls,text){const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el}
 function renderMatrix(){
  const tbody=$("matrix-body");tbody.replaceChildren();
  const pick=current(),row=pick.experience==="daily"?2:pick.experience==="casual"?1:pick.experience==="new"?0:-1;
  const col=pick.capability==="agents"?2:pick.capability==="files"?1:0;
  ["Rarely or never","Sometimes","Most days"].forEach((name,r)=>{
   const tr=make("tr");const th=make("th","",name);th.scope="row";tr.append(th);
   for(let c=0;c<3;c++){const td=make("td","",labels[matrix[r][c]]);td.dataset.result=matrix[r][c];if(r===row&&c===col){td.classList.add("active");td.setAttribute("aria-current","true")}tr.append(td)}tbody.append(tr);
  });
  $("suggestion").textContent=labels[suggested()];
  $("suggestion-note").textContent=row<0?"Step 1 was skipped, so the original logic defaults to Intermediate.":"The outlined cell matches the two answers above.";
 }
 function renderTopics(){
  const lvl=manualLevel||suggested(),bundle=(version==="before"?original:after)[lvl],isAfter=version==="after";
  $("chosen-level").textContent=labels[lvl]+(manualLevel?" (chosen manually)":" (recommended)");
  $("choice-caption").textContent="Step 3 selected level";
  $("reset-level").hidden=manualLevel===null;
  document.querySelectorAll("[data-level]").forEach(btn=>btn.setAttribute("aria-pressed",String(btn.dataset.level===lvl)));
  $("topic-heading").textContent="Step 4 · "+bundle.name+" topics";
  $("topic-intro").textContent=isAfter?bundle.about:"These are the exact titles from the original topic list.";
  const list=$("topic-list");list.replaceChildren();const topics=bundle.topics;
  topics.forEach((topic,i)=>{const li=make("li");const title=make("strong");title.append(make("span","num",String(i+1).padStart(2,"0")));title.append(document.createTextNode(isAfter?topic[2]:topic));li.append(title);if(isAfter)li.append(make("small","",topic[3]));list.append(li)});
  $("topic-conclusion").textContent=isAfter?"After: these questions reveal which outcomes and decisions employees value, rather than simply which technologies sound interesting.":"Before: these topics mix tools, examples and technical terms. Knowing which ones employees like does not tell us as clearly which decisions training should improve.";
 }
 function render(){
  const afterMode=version==="after";
  document.querySelectorAll("[data-version]").forEach(btn=>btn.setAttribute("aria-selected",String(btn.dataset.version===version)));
  $("panel").setAttribute("aria-labelledby","tab-"+version);
  $("version-eyebrow").textContent=afterMode?"After · Recommended for CHC":"Before · Existing survey";
  $("version-title").textContent=afterMode?"Make each topic a decision worth learning":"Mostly names of tools and tasks";
  $("version-desc").textContent=afterMode?"Keep the same level-routing logic. Combine overlapping beginner and advanced topics, keep the intermediate core, and ask which transferable capabilities matter.":"Useful for discovering AI features, but less useful for choosing what capability the training should develop.";
  $("version-stamp").textContent=afterMode?"20 decision-oriented topics":"24 tool / task topics";
  renderMatrix();renderTopics();
 }
 $("frequency").addEventListener("change",()=>{manualLevel=null;render()});
 $("capability").addEventListener("change",()=>{manualLevel=null;render()});
 document.querySelectorAll("[data-version]").forEach(btn=>btn.addEventListener("click",()=>{version=btn.dataset.version;render();btn.focus()}));
 document.querySelectorAll("[data-level]").forEach(btn=>btn.addEventListener("click",()=>{manualLevel=btn.dataset.level;render()}));
 $("reset-level").addEventListener("click",()=>{manualLevel=null;render()});
 document.querySelector(".tabs").addEventListener("keydown",event=>{
   if(!["ArrowLeft","ArrowRight"].includes(event.key))return;
   event.preventDefault();version=version==="before"?"after":"before";render();$("tab-"+version).focus();
 });
 render();
})();
