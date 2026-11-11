/** Four human-task workspaces, preserving existing secured feature routes. */
if(document.body.dataset.console==='admin'){
 const map={
  answers:'teach',context:'teach',
  audit:'review',testing:'review',fewshot:'review',costs:'review',
  schedule:'clinic',settings:'clinic',
  crm:'customers'
 };
 const first={teach:'answers',review:'audit',clinic:'schedule',customers:'crm'};
 const $all=(s)=>[...document.querySelectorAll(s)];
 const workspaces=$all('[data-workspace]');
 const taskMenus=$all('[data-tasks]');
 const tasks=$all('[data-workflow]');
 const legacy=$all('[data-tab]');
 let active='answers';
 function sync(screen){
  if(!(screen in map))return;
  active=screen;
  const group=map[screen];
  for(const b of workspaces){
   const on=b.dataset.workspace===group;
   b.classList.toggle('active',on);
   b.setAttribute('aria-pressed',String(on));
  }
  for(const el of taskMenus)el.classList.toggle('hidden',el.dataset.tasks!==group);
  for(const b of tasks){
   if(b.dataset.workflow===screen)b.setAttribute('aria-current','page');
   else b.removeAttribute('aria-current');
  }
 }
 function navigate(screen,{focus=false}={}){
  const control=legacy.find(x=>x.dataset.tab===screen);
  if(!control)return;
  control.click();
  sync(screen);
  if(focus){
   const el=document.querySelector('[data-panel="'+screen+'"] h2');
   if(el){el.setAttribute('tabindex','-1');el.focus({preventScroll:true})}
  }
 }
 for(const b of workspaces)b.addEventListener('click',()=>{
  const group=b.dataset.workspace;
  navigate(first[group],{focus:true});
 });
 for(const b of tasks)b.addEventListener('click',()=>{
  navigate(b.dataset.workflow,{focus:true});
 });
 // All existing buttons and scripts keep routing through the original feature
 // triggers. Synchronise visible navigation when any of them is activated.
 for(const b of legacy)b.addEventListener('click',()=>sync(b.dataset.tab));
 window.addEventListener('phoenix-open-conversation',()=>sync('audit'));
 sync(active);
}
