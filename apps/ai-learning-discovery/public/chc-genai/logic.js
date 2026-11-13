"use strict";
(function(){
 const tracks=window.CHC_TRACKS,matrix=window.CHC_MATRIX,recommend=window.CHC_RECOMMEND;
 if(!tracks||!matrix||!recommend)throw Error("CHC source missing");
 const $=id=>document.getElementById(id);
 const labels={beginner:"Beginner",intermediate:"Intermediate",advanced:"Advanced"};
 const levels=["beginner","intermediate","advanced"];
 const tabOrder=["before","after","final"];
 const startTab=window.location.hash.slice(1).toLowerCase();
 let active=tabOrder.includes(startTab)?startTab:"final",manualBefore=null,afterChoice=null,finalChoice=null;
 const finalRatings={};
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

 function renderFinal(){
  const area=$("final-levels");area.replaceChildren();
  levels.forEach(id=>{
   const course=tracks[id],on=id===finalChoice;
   const button=el("button","after-level"+(on?" selected":""));
   button.type="button";button.dataset.finalCourse=id;button.setAttribute("aria-pressed",String(on));
   const heading=el("span","after-level-heading");
   heading.append(el("strong","",course.short),el("span","after-level-check",on?"✓ Selected":"Choose"));
   button.append(heading,el("span","after-level-about",course.about),el("span","after-list-label","Topics included"));
   const list=el("span","after-topic-list");
   course.topics.forEach(topic=>list.append(el("span","after-topic",topic[2])));
   button.append(list);area.append(button);
  });
  const target=$("final-interest");target.replaceChildren();
  if(!finalChoice){
   target.append(el("p","final-empty","Choose a level in Q1 to see the topics to rate."));
   return;
  }
  const course=tracks[finalChoice];
  target.append(el("h4","","Topics for "+course.short));
  const intro=el("p","final-rating-intro","Select one interest level for each topic. This is a preview, not a response submission.");
  target.append(intro);
  const list=el("div","rating-list");
  course.topics.forEach((topic,i)=>{
   const field=el("fieldset","rating-card"),legend=el("legend");
   legend.append(el("span","rating-num",String(i+1).padStart(2,"0")),document.createTextNode(topic[2]));
   field.append(legend,el("p","rating-detail",topic[3]));
   const choices=el("div","rating-options");
   ["Not interested","Interested","Very interested"].forEach((value,j)=>{
    const label=el("label","rating-option"),input=el("input");
    input.type="radio";input.name="final-rating-"+topic[0];input.value=String(j+1);
    input.checked=finalRatings[topic[0]]===j+1;
    input.addEventListener("change",()=>{finalRatings[topic[0]]=j+1;});
    label.append(input,el("span","",value));choices.append(label);
   });
   field.append(choices);list.append(field);
  });
  target.append(list);
 }
 function render(){
  const before=active==="before";
  $("before-flow").hidden=!before;
  $("after-flow").hidden=active!=="after";
  $("final-flow").hidden=active!=="final";
  document.querySelector(".formula").hidden=!before;
  document.querySelectorAll("[data-version]").forEach(btn=>{
   const on=btn.dataset.version===active;
   btn.setAttribute("aria-selected",String(on));btn.tabIndex=on?0:-1;
  });
  if(before)renderBefore();else if(active==="after")renderAfter();else renderFinal();
 }
 document.querySelectorAll("[data-version]").forEach(btn=>btn.addEventListener("click",()=>{
  active=btn.dataset.version;render();window.location.hash=active;btn.focus();
 }));
 document.querySelector(".tabs").addEventListener("keydown",event=>{
  if(!["ArrowLeft","ArrowRight","Home","End"].includes(event.key))return;
  event.preventDefault();
  const position=tabOrder.indexOf(active);
  active=event.key==="Home"?tabOrder[0]:event.key==="End"?tabOrder[tabOrder.length-1]:tabOrder[(position+(event.key==="ArrowRight"?1:tabOrder.length-1))%tabOrder.length];
  render();window.location.hash=active;$("tab-"+active).focus();
 });
 ["frequency","capability"].forEach(id=>$(id).addEventListener("change",()=>{manualBefore=null;renderBefore();}));
 document.querySelectorAll("[data-level]").forEach(btn=>btn.addEventListener("click",()=>{manualBefore=btn.dataset.level;renderBefore();}));
 $("reset-level").addEventListener("click",()=>{manualBefore=null;renderBefore();});
 $("after-levels").addEventListener("click",event=>{
  const button=event.target.closest("[data-course]");if(!button)return;
  afterChoice=button.dataset.course;renderAfter();
 });
 $("final-levels").addEventListener("click",event=>{
  const button=event.target.closest("[data-final-course]");if(!button)return;
  finalChoice=button.dataset.finalCourse;renderFinal();
 });
 window.addEventListener("hashchange",()=>{
  const route=window.location.hash.slice(1).toLowerCase();
  if(tabOrder.includes(route)&&route!==active){active=route;render();}
 });
 render();
})();
