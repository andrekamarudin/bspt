"use strict";
(function(){
 const tracks=window.CHC_TRACKS,matrix=window.CHC_MATRIX,recommend=window.CHC_RECOMMEND;
 if(!tracks||!matrix||!recommend)throw Error("CHC source missing");
 const $=id=>document.getElementById(id);
 const labels={beginner:"Beginner",intermediate:"Intermediate",advanced:"Advanced"};
 const levels=["beginner","intermediate","advanced"];
 let active="after",manualBefore=null,afterChoice=null;
 function el(tag,cls,value){const node=document.createElement(tag);if(cls)node.className=cls;if(value!==undefined)node.textContent=value;return node;}
 function beforeSuggestion(){
  const exp=$("frequency").value,cap=$("capability").value;
  return recommend(exp,cap==="agents"?["agents"]:cap==="files"?["files"]:["chat"]);
 }
 function renderBefore(){
  const body=$("matrix-body");body.replaceChildren();
  const exp=$("frequency").value,cap=$("capability").value;
  const row=exp==="daily"?2:exp==="casual"?1:exp==="new"?0:-1;
  const column=cap==="agents"?2:cap==="files"?1:0;
  ["Rarely or never","Sometimes","Most days"].forEach((name,i)=>{
   const tr=el("tr"),th=el("th","",name);th.scope="row";tr.append(th);
   for(let j=0;j<3;j++){
    const cell=el("td","",labels[matrix[i][j]]);cell.dataset.result=matrix[i][j];
    if(i===row&&j===column){cell.classList.add("active");cell.setAttribute("aria-current","true");}
    tr.append(cell);
   }
   body.append(tr);
  });
  const suggested=beforeSuggestion(),selected=manualBefore||suggested,bundle=tracks[selected];
  $("suggestion").textContent=labels[suggested];
  $("suggestion-note").textContent=row<0?"Step 1 skipped: previous flow defaults to Intermediate.":"Outlined cell matches the two answers.";
  document.querySelectorAll("[data-level]").forEach(btn=>btn.setAttribute("aria-pressed",String(btn.dataset.level===selected)));
  $("chosen-level").textContent=labels[selected]+(manualBefore?" (chosen manually)":" (recommended)");
  $("reset-level").hidden=manualBefore===null;
  $("topic-heading").textContent="Step 4 · "+bundle.name+" topics";
  $("topic-intro").textContent=bundle.about;
  const list=$("topic-list");list.replaceChildren();
  bundle.topics.forEach((topic,i)=>{
   const item=el("li"),heading=el("strong");
   heading.append(el("span","num",String(i+1).padStart(2,"0")),document.createTextNode(topic[2]));
   item.append(heading,el("small","",topic[3]));list.append(item);
  });
  $("topic-conclusion").textContent="Before: Steps 1–2 recommend a level, Step 3 lets staff override it, Step 4 asks for individual topic ratings.";
 }
 function renderAfter(){
  const area=$("after-levels");area.replaceChildren();
  levels.forEach(id=>{
   const course=tracks[id],on=id===afterChoice;
   const button=el("button","after-level"+(on?" selected":""));
   button.type="button";button.dataset.course=id;button.setAttribute("aria-pressed",String(on));
   const heading=el("span","after-level-heading");
   heading.append(el("strong","",course.short),el("span","after-level-check",on?"✓ Selected":"Choose"));
   button.append(heading,el("span","after-level-about",course.about),el("span","after-list-label","Topics included"));
   const list=el("span","after-topic-list");
   course.topics.forEach(topic=>list.append(el("span","after-topic",topic[2])));
   button.append(list);area.append(button);
  });
  $("after-choice").textContent=afterChoice?"Selected: "+labels[afterChoice]+". This is the only course choice Formstack needs.":"Choose a level to see the new selection.";
 }
 function render(){
  const before=active==="before";
  $("before-flow").hidden=!before;$("after-flow").hidden=before;
  document.querySelector(".formula").hidden=!before;
  document.querySelectorAll("[data-version]").forEach(btn=>{
   const on=btn.dataset.version===active;
   btn.setAttribute("aria-selected",String(on));btn.tabIndex=on?0:-1;
  });
  if(before)renderBefore();else renderAfter();
 }
 document.querySelectorAll("[data-version]").forEach(btn=>btn.addEventListener("click",()=>{
  active=btn.dataset.version;render();btn.focus();
 }));
 document.querySelector(".tabs").addEventListener("keydown",event=>{
  if(!["ArrowLeft","ArrowRight","Home","End"].includes(event.key))return;
  event.preventDefault();
  active=event.key==="Home"?"before":event.key==="End"?"after":active==="before"?"after":"before";
  render();$("tab-"+active).focus();
 });
 ["frequency","capability"].forEach(id=>$(id).addEventListener("change",()=>{manualBefore=null;renderBefore();}));
 document.querySelectorAll("[data-level]").forEach(btn=>btn.addEventListener("click",()=>{manualBefore=btn.dataset.level;renderBefore();}));
 $("reset-level").addEventListener("click",()=>{manualBefore=null;renderBefore();});
 $("after-levels").addEventListener("click",event=>{
  const button=event.target.closest("[data-course]");if(!button)return;
  afterChoice=button.dataset.course;renderAfter();
 });
 render();
})();
