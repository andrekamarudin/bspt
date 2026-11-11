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
   assert.equal(await chat.locator('button[data-prompt]').count(),5,'Five clickable starter prompts including native booking visible');
   // Keep model/API calls disabled in UI QA. Verify interaction without posting to production.
   await chat.screenshot({path:resolve(output,size.name+'.png'),fullPage:true,animations:'disabled'});
   if(size.name==='iphone-portrait'||size.name==='desktop'){
     const about=await pageAt(context,'/about/');
     assert.ok(await about.getByText('Better conversations.').count());
     await about.screenshot({path:resolve(output,size.name+'-about.png'),fullPage:true,animations:'disabled'});
     const book=await pageAt(context,'/book/');
     assert.equal(await book.locator('#slot-form').count(),1,'Booking date/branch picker present');
     assert.equal(await book.locator('#booking-step-2.hidden').count(),1,'Demo checkout hidden until real slot chosen');
     await book.screenshot({path:resolve(output,size.name+'-booking.png'),fullPage:true,animations:'disabled'});
     const admin=await pageAt(context,'/admin/');
     assert.equal(await admin.locator('form#login-form input[type=password]').count(),1);
     assert.equal(await admin.locator('#console-panel:not(.hidden)').count(),0,'Admin console must remain locked');
     // Static browser UX check: reveal only the markup, not admin credentials.
     // No admin API actions are executed; real sessions are separately API-tested.
     await admin.evaluate(()=>{
       document.querySelector('#auth-panel').classList.add('hidden');
       document.querySelector('#console-panel').classList.remove('hidden');
     });
     assert.equal(await admin.locator('.workspaces button:visible').count(),4,
                  'Only four owner task workspaces visible');
     assert.equal(await admin.locator('.legacy-tabs:visible').count(),0,
                  'Internal routing must not appear to the clinic owner');
     assert.equal(await admin.locator('.owner-import-details:not([open])').count(),1,
                  'Bulk import hidden until expressly requested');
     await admin.locator('[data-workspace="review"]').click();
     await admin.locator('[data-workflow="testing"]').click();
     assert.equal(await admin.locator('[data-panel="testing"]:visible').count(),1,
                  'Testing reachable from Review & test');
     await admin.locator('[data-workspace="clinic"]').click();
     assert.equal(await admin.locator('[data-panel="schedule"]:visible').count(),1,
                  'Time-limited clinic notices reachable from Clinic setup');
     await admin.locator('[data-workspace="customers"]').click();
     assert.equal(await admin.locator('[data-panel="crm"]:visible').count(),1,
                  'Existing CRM reachable from Customers');
     await admin.locator('[data-workspace="teach"]').click();
     assert.equal(await admin.locator('[data-panel="answers"]:visible').count(),1,
                  'Teach opens uncluttered answer form');
     assert.equal(await admin.locator('.owner-import-details textarea:visible').count(),0,
                  'Secondary bulk form is collapsed');
     await admin.locator('.owner-import-details summary').click();
     assert.equal(await admin.locator('.owner-import-details textarea:visible').count(),1,
                  'Owner can expand bulk Q&A import on demand');
     await admin.locator('.owner-import-details summary').click();
     const adminWidth=await admin.evaluate(()=>({width:document.documentElement.scrollWidth,
                                                  viewport:innerWidth}));
     assert.ok(adminWidth.width<=adminWidth.viewport+2,
               size.name+' admin horizontal overflow: '+JSON.stringify(adminWidth));
     if(size.name==='desktop'||size.name==='iphone-portrait'){
       await admin.screenshot({path:resolve(output,size.name+'-owner-simplified.png'),
                               fullPage:true,animations:'disabled'});
     }
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
