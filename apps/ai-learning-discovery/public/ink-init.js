/* BSPT Ink installations. Change a message or target, not asset coordinates.
 * Keep annotations sparse: at most one handwritten note per distinct hero/section.
 */
(function(document){
'use strict';
function start(){
 if (!window.BSPTInk) return;
 if (document.querySelector('.hero .hero-person')) {
   window.BSPTInk.mount({stage:'.hero', annotations:[
     {id:'hero-leverage',kind:'note',target:'.hero h1',text:'Less to learn.\nMore to gain.',
      color:'cream',size:31,rotation:-6,placement:'above-right',
      fallback:['above-left','left-top'],gap:23,
      avoid:['.hero .eyebrow','.hero .lead','.hero .buttons'],
      minWidth:1250,motion:'reveal'}
   ]});
 }
 if(document.querySelector('[data-bspt-ink="about-leverage"]')){
   window.BSPTInk.mount({stage:'.bspt-paper-section .two-col', annotations:[
     {id:'about-leverage',kind:'note',target:'[data-bspt-ink="about-leverage"]',
      text:'Less to learn.\nMore to gain.',color:'orange',size:27,rotation:-5,
      placement:'below-left',fallback:['below-right'],gap:18,
      avoid:['.bspt-notebook-brief'],minWidth:750},
     {id:'about-keyphrase',kind:'underline',target:'[data-bspt-ink="critical-few"]',
      color:'orange',width:3,distance:4,mobile:true}
   ]});
 }
 if(document.body.classList.contains('bspt-survey')){
   window.BSPTInk.mount({stage:'.shell', annotations:[
     {id:'survey-question-underline',kind:'underline',target:'#main > h1:first-child',
      lastLineFraction:.42,align:'left',color:'yellow',width:7,distance:1,mobile:true}
   ]});
 }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
else start();
})(document);
