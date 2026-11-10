import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
const output=resolve('apps/phoenix-rehab-pilot/qa/screenshots');
mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const origin='http://127.0.0.1:4179';
const sizes=[
 {name:'android-small',width:360,height:740},
 {name:'iphone-portrait',width:390,height:844},
 {name:'android-wide',width:430,height:932},
 {name:'tablet',width:768,height:1024},
 {name:'android-landscape',width:891,height:411},
 {name:'desktop',width:1440,height:900}
];
async function pageAt(context,path){
 const page=await context.newPage();
 const res=await page.goto(origin+path,{waitUntil:'domcontentloaded'});
 assert.equal(res.status(),200,path+' must load');
 await page.locator('.mark img').waitFor({state:'visible'});
 const healthy=await page.evaluate(()=>{
   const logo=document.querySelector('.mark img');
   return {width:document.documentElement.scrollWidth,viewport:innerWidth,
      logo:logo.complete&&logo.naturalWidth>0};
 });
 assert.ok(healthy.width<=healthy.viewport+2,path+' horizontal overflow: '+JSON.stringify(healthy));
 assert.ok(healthy.logo,path+' original BSPT logo did not load');
 return page;
}
try{
 for(const size of sizes){
   const context=await browser.newContext({viewport:{width:size.width,height:size.height},deviceScaleFactor:1,
                                          reducedMotion:'reduce'});
   const errors=[];
   const chat=await pageAt(context,'/chat/');
   chat.on('pageerror',e=>errors.push(e.message));
   const metrics=await chat.evaluate(()=>{
     const element=document.querySelector('.chat-window');
     const r=element.getBoundingClientRect();
     const field=document.querySelector('#question');
     return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,
       font:parseFloat(getComputedStyle(field).fontSize)};
   });
   assert.ok(metrics.left>=-1&&metrics.right<=size.width+1,size.name+' clipped chat '+JSON.stringify(metrics));
   assert.ok(metrics.font>=16,size.name+' small input font');
   if(size.width<=940){
     assert.ok(metrics.top<size.height*.44,size.name+' chatbot below fold');
     if(size.name==='android-landscape')assert.ok(metrics.bottom<=size.height+15,'Landscape composer clipped');
   }
   assert.equal(await chat.locator('.turn.bot').count(),1,'Welcome message visible');
   assert.equal(await chat.locator('button[data-prompt]').count(),4,'Four clickable starter prompts visible');
   // Keep model/API calls disabled in UI QA. Verify interaction without posting to production.
   await chat.screenshot({path:resolve(output,size.name+'.png'),fullPage:true,animations:'disabled'});
   if(size.name==='iphone-portrait'||size.name==='desktop'){
     const about=await pageAt(context,'/about/');
     assert.ok(await about.getByText('Better conversations.').count());
     await about.screenshot({path:resolve(output,size.name+'-about.png'),fullPage:true,animations:'disabled'});
     const admin=await pageAt(context,'/admin/');
     assert.equal(await admin.locator('form#login-form input[type=password]').count(),1);
     assert.equal(await admin.locator('#console-panel:not(.hidden)').count(),0,'Admin console must remain locked');
     const dev=await pageAt(context,'/dev/');
     assert.equal(await dev.locator('form#login-form input[type=password]').count(),1);
     assert.equal(await dev.locator('input#otp').count(),1);
     assert.equal(await dev.locator('#console-panel:not(.hidden)').count(),0,'Dev console must remain locked');
     await dev.screenshot({path:resolve(output,size.name+'-dev.png'),fullPage:true,animations:'disabled'});
   }
   assert.deepEqual(errors,[],size.name+' script errors');
   console.log('PASS',size.name,JSON.stringify(metrics));
   await context.close();
 }
}finally{await browser.close();}
