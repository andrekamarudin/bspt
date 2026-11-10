// Run after: npm i --no-save --no-package-lock playwright@1.57.0
// Static server listening on http://127.0.0.1:4179
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
const out=resolve('apps/phoenix-rehab-pilot/qa/screenshots');mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const sizes=[
 {name:'android-small',width:360,height:740},
 {name:'iphone-portrait',width:390,height:844},
 {name:'android-wide',width:430,height:932},
 {name:'tablet',width:768,height:1024},
 {name:'android-landscape',width:891,height:411},
 {name:'desktop',width:1440,height:900}
];
try{
 for(const item of sizes){
  const page=await browser.newPage({viewport:{width:item.width,height:item.height},deviceScaleFactor:1,reducedMotion:'reduce'});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const res=await page.goto('http://127.0.0.1:4179/',{waitUntil:'networkidle'});
  assert.equal(res.status(),200,item.name+' HTTP status');
  await page.locator('.bubble-row.assistant').first().waitFor();
  const m=await page.evaluate(()=>{
   const box=x=>{const r=document.querySelector(x).getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}};
   const brand=document.querySelector('.brand-symbol img');
   return {
    documentWidth:document.documentElement.scrollWidth,
    viewport:window.innerWidth,
    intro:box('.intro'),experience:box('.experience'),chat:box('.chat-shell'),
    inputFont:parseFloat(getComputedStyle(document.querySelector('#question')).fontSize),
    input:box('#question'),header:box('.masthead'),
    notebookVisible:getComputedStyle(document.querySelector('.notebook')).display!=='none',
    animatedBrandReady:brand.complete&&brand.naturalWidth>0,
    paperclipReady:document.querySelector('.notebook-clip').complete&&document.querySelector('.notebook-clip').naturalWidth>0
   };
  });
  assert.ok(m.documentWidth<=item.width+2,item.name+' horizontal overflow '+JSON.stringify(m));
  assert.ok(m.chat.left>=-1&&m.chat.right<=item.width+1,item.name+' clipped chat '+JSON.stringify(m.chat));
  assert.ok(m.notebookVisible,item.name+' notebook omitted');
  assert.ok(m.animatedBrandReady,item.name+' BSPT mark missing');
  assert.ok(m.paperclipReady,item.name+' paperclip missing');
  if(item.width<=980){
   assert.ok(m.experience.top < m.intro.top,item.name+' chat not prioritized');
   assert.ok(m.chat.top < item.height*0.44,item.name+' chat hidden below fold '+m.chat.top);
   assert.ok(m.inputFont>=16,item.name+' mobile input may trigger iOS zoom');
  }
  if(item.name==='android-landscape'){
   assert.ok(m.chat.bottom<=item.height+15,item.name+' composer is below phone landscape fold '+m.chat.bottom);
  }
  // Exercise a real state transition before capturing the screenshot.
  await page.getByRole('button',{name:'Do you issue MCs?'}).click();
  await page.getByText('A medical certificate (MC) must come from a doctor',{exact:false}).waitFor();
  await page.screenshot({path:resolve(out,item.name+'.png'),fullPage:true,animations:'disabled'});
  await page.getByRole('button',{name:/Give feedback/i}).click();
  await page.locator('#feedback-dialog').waitFor({state:'visible'});
  assert.deepEqual(errors,[],item.name+' browser errors');
  console.log('PASS',item.name,JSON.stringify(m));
  await page.close();
 }
}finally{await browser.close();}
