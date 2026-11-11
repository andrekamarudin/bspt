import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
const repo=resolve(import.meta.dirname,'../../..');
const read=p=>readFileSync(resolve(repo,p),'utf8');
test('all four published motif files match canonical BSPT bytes',()=>{
 for(const [source,copy] of [
  ['logos/brush-slash.svg','brush-slash.svg'],
  ['motion/brush-slash-draw.svg','brand-mark-animated.svg'],
  ['motifs/marker-swash.svg','marker-swash.svg'],
  ['motifs/paperclip.svg','paperclip.svg']
 ])assert.equal(read(source),read('apps/phoenix-rehab-pilot/'+copy));
});
test('shared header uses original animation once with reduced-motion fallback',()=>{
 const js=read('apps/phoenix-rehab-pilot/shared/header.mjs');
 assert.match(js,/brand-mark-animated\.svg/);
 assert.match(js,/prefers-reduced-motion: reduce/);
 assert.match(js,/brush-slash\.svg/);
});
test('About uses notebook and editable handwriting rather than flattening artwork',()=>{
 const html=read('apps/phoenix-rehab-pilot/about/index.html');
 assert.match(html,/class="paper"/);
 assert.match(html,/paperclip\.svg/);
 assert.match(html,/class="hand"/);
 assert.match(html,/class="highlight"/);
 assert.match(html,/family=Caveat/);
});
test('responsive chat has native input, viewport and landscape rules',()=>{
 const html=read('apps/phoenix-rehab-pilot/chat/index.html');
 const css=read('apps/phoenix-rehab-pilot/chat/chat.css');
 assert.match(html,/name="viewport"/);
 assert.match(html,/chat-form/);
 assert.match(css,/font-size:16px/);
 assert.match(css,/@media\(max-width:560px\)/);
 assert.match(css,/@media\(max-height:560px\) and \(max-width:940px\)/);
});
