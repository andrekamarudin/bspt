#!/usr/bin/env node
// Non-mutating checks for the deployed BSPT brand system. No credentials needed.
const targets=[
  ["Homepage","https://www.bytesizeprotip.com/",true],
  ["About","https://about.bytesizeprotip.com/",true],
  ["Survey","https://ai-learning-discovery.vercel.app/",false]
];
let errors=[];
async function load(url){const r=await fetch(url,{redirect:"follow",signal:AbortSignal.timeout(12000)});if(!r.ok)throw Error(`HTTP ${r.status} ${url}`);return await r.text()}
for(const [name,url,marketing] of targets){
  try{
    const html=await load(url);
    for(const marker of ['brand-mark-animated.svg','brand-mark.svg','field-notes.css']){
      if(!html.includes(marker))errors.push(`${name}: missing markup ${marker}`);
    }
    if(marketing){
      for(const marker of ['bspt-notebook-brief','bspt-margin-note','bspt-hero-handnote']){
        if(!html.includes(marker)&&!(name==='About'&&marker==='bspt-hero-handnote')&&!(name==='Homepage'&&marker==='bspt-margin-note'))errors.push(`${name}: missing visual component ${marker}`);
      }
    }else if(!html.includes('bspt-survey'))errors.push('Survey: missing notebook theme wrapper');
    for(const asset of ['brand-mark.svg','brand-mark-animated.svg','field-notes.css','motifs/marker-swash.svg','motifs/hand-arrow.svg','motifs/paperclip.svg']){
      await load(new URL('/'+asset,url).href);
    }
    console.log('PASS',name);
  }catch(e){errors.push(`${name}: ${e.message}`)}
}
if(errors.length){console.error(errors.join('\n'));process.exitCode=1}else console.log('All three BSPT brand deployments passed.')
