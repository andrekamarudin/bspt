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

test('Meta credential submission is available only in the developer console',()=>{
 const html=text('dev/index.html');
 const js=text('shared/console.mjs');
 assert.match(html,/id="wa-credentials-form"/);
 assert.match(html,/id="wa-app-secret"/);
 assert.match(html,/id="wa-access-token"/);
 assert.match(js,/wa_credentials_store/);
});


test('developer model selection is searchable and uses validated catalog save',()=>{
 const html=text('dev/index.html'),js=text('shared/console.mjs'),css=text('shared/console.css');
 assert.match(html,/id="model-search"[^>]*role="combobox"/);
 assert.match(html,/id="model-list"[^>]*role="listbox"/);
 assert.match(html,/id="model-hint"/);
 assert.match(js,/action:'models'/);
 assert.match(js,/gatewayModels\.filter/);
 assert.match(js,/ArrowDown/);
 assert.match(js,/aria-activedescendant/);
 assert.match(js,/model:chosenModel/);
 assert.match(js,/modelInput\.value\.trim\(\)!==chosenModel/);
 assert.match(css,/\.model-list/);
});


test('developer OTP form exposes standard autofill-compatible semantics',()=>{
 const html=text('dev/index.html');
 assert.match(html,/<label for="otp">One-time password \(2FA\)<\/label>/);
 assert.match(html,/<input id="otp" name="otp" type="text"[^>]*autocomplete="one-time-code"/);
 assert.match(html,/<input id="password" name="password" type="password"[^>]*autocomplete="current-password"/);
 assert.match(html,/<input id="totp-code" name="otp" type="text"[^>]*autocomplete="one-time-code"/);
 assert.match(html,/<input id="otp"[^>]*pattern="\[0-9\]\{6\}"/);
});

test('model picker loads cache-busted theme and uses structured separated rows',()=>{
 const html=text('dev/index.html');
 const js=text('shared/console.mjs'),css=text('shared/console.css');
 assert.match(html,/console\.css\?v=20261111-modelpicker-v2/);
 assert.match(html,/console\.mjs\?v=20261111-modelpicker-v2/);
 assert.match(html,/autocorrect="off"/);
 assert.match(html,/id="model-search" type="search"/);
 assert.match(js,/model-list-heading/);
 assert.match(js,/model-identity/);
 assert.match(js,/model-prices/);
 assert.match(js,/model-price-row/);
 assert.match(css,/grid-template-columns:minmax\(0,1fr\) auto/);
 assert.match(css,/\.model-list \.model-option/);
});

test('booking pilot is separate and cannot be presented as a live reservation',()=>{
 const html=text('book/index.html');
 const script=text('book/book.mjs');
 const nav=text('shared/header.mjs');
 assert.match(nav,/\['Book','\/book'\]/);
 assert.match(html,/SIMULATION COMPLETE/);
 assert.match(html,/No appointment created/);
 assert.match(html,/sample-name/);
 assert.match(script,/real_booking_created!==false/);
 assert.match(script,/status!=='simulated_only'/);
 assert.match(script,/action:'verify'/);
 assert.match(script,/action:'complete'/);
 assert.match(script,/action:'draft'/);
 assert.doesNotMatch(script,/fetch\(['"]https:\/\/api\.hb\.sgimed\.com/);
 assert.match(text('chat/index.html'),/href="\/book"/);
});

test('clinic admin costs tab uses separate authenticated usage endpoint',()=>{
 const html=text('admin/index.html'),js=text('shared/costs.mjs'),css=text('shared/costs.css');
 assert.match(html,/data-tab="costs"/);
 assert.match(html,/data-panel="costs"/);
 assert.match(html,/id="costs-total"/);
 assert.match(html,/id="costs-days"/);
 assert.match(html,/id="costs-conversations"/);
 assert.match(html,/id="costs-channels"/);
 assert.match(html,/costs\.mjs\?v=20261111-costs-v1/);
 assert.match(js,/action:'costs'/);
 assert.match(js,/credentials:'same-origin'/);
 assert.match(js,/timeZone:'Asia\/Singapore'/);
 assert.match(js,/unpriced_requests/);
 assert.match(js,/showConversationPage/);
 assert.match(css,/costs-kpis/);
});
