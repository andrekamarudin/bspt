import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const text=f=>readFileSync(new URL('../'+f,import.meta.url),'utf8');
test('separate public and protected routes exist',()=>{
 const home=text('index.html'),about=text('about/index.html'),chat=text('chat/index.html'),admin=text('admin/index.html'),dev=text('dev/index.html');
 assert.match(home,/url=\/about/);
 assert.match(about,/PRIVATE EVALUATION/);
 assert.match(chat,/chat\.mjs/);
 assert.match(admin,/data-console="admin"/);
 assert.match(dev,/data-console="dev"/);
 assert.doesNotMatch(chat,/type="password"/);
 assert.doesNotMatch(about,/type="password"/);
});
test('sensitive pages never embed secrets or localStorage auth tokens',()=>{
 for(const p of ['admin/index.html','dev/index.html','shared/console.mjs','api/_proxy.mjs','api/chat.mjs']){
 const s=text(p);
 assert.doesNotMatch(s,/(?:sk-|phx-api-key-|BEGIN PRIVATE KEY|service_role|Bearer [A-Za-z0-9]{30,})/i);
 assert.doesNotMatch(s,/localStorage\.setItem/);
 }
});
test('gateway calls run only after trusted preflight and always finalize',()=>{
 const s=text('api/chat.mjs');
 assert.ok(s.indexOf("'chat/preflight'")<s.indexOf('generateText('));
 assert.match(s,/context\.context\?\.decision/);
 assert.match(s,/system:preflightPolicy\(context\)/);
 assert.match(s,/chat\/finalize/);
 assert.match(s,/openai\/gpt-6-luna/);
});
test('secure proxy enforces project OIDC and same-origin writes',()=>{
 const s=text('api/_proxy.mjs');
 assert.match(s,/getVercelOidcToken/);
 assert.match(s,/x-requested-with/i);
 assert.match(s,/origin/);
 assert.match(s,/req\.headers\.cookie/);
});
test('Vercel hardens response and sends every route to the protected GreenCloud instance',()=>{
 const c=JSON.parse(text('vercel.json'));
 assert.ok(c.redirects.some(x=>x.source==='/'&&x.destination==='https://phoenix.bytesizeprotip.com/about'));
 assert.ok(c.redirects.some(x=>x.source==='/:path*'&&x.destination==='https://phoenix.bytesizeprotip.com/:path*'));
 const headerNames=c.headers.flatMap(x=>x.headers.map(h=>h.key));
 assert.ok(headerNames.includes('Content-Security-Policy'));
 assert.ok(headerNames.includes('X-Frame-Options'));
});

test('dashboard handlers are scoped correctly and developer setup supports manual enrollment',()=>{
 const script=text('shared/console.mjs');
 assert.match(script,/let loadAdmin=async\(\)=>\{\},loadDev=async\(\)=>\{\}/);
 assert.match(script,/loadAdmin=async function\(\)/);
 assert.match(script,/loadDev=async function\(\)/);
 assert.match(script,/totp-manual/);
 assert.match(text('dev/index.html'),/id="totp-manual"/);
});

test('owner-first admin teaches the same bot through reviewed drafts',()=>{
 const admin=text('admin/index.html');
 assert.match(admin,/data-tab="answers"/);
 assert.match(admin,/id="owner-answer-form"/);
 assert.match(admin,/id="owner-import"/);
 assert.match(admin,/shared\/owner.mjs/);
 const script=text('shared/owner.mjs');
 assert.match(script,/action:'publish'/);
 assert.match(script,/action:'save'/);
 assert.match(script,/action:'archive'/);
 assert.match(script,/phoenix-admin-ready/);
 assert.match(script,/anonymized/);
});

test('developer can copy GreenCloud Meta webhook verification token after secure unlock',()=>{
 const html=text('dev/index.html');
 const script=text('shared/console.mjs');
 assert.match(html,/id="wa-webhook-setup"/);
 assert.match(html,/id="wa-copy-verify"/);
 assert.match(html,/id="wa-verify"/);
 assert.match(script,/wa_webhook_info/);
 assert.match(script,/wa_generate_verify/);
 assert.match(script,/navigator\.clipboard\.writeText/);
});
