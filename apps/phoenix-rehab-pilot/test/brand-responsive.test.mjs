import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'../../..');
const app=resolve(root,'apps/phoenix-rehab-pilot');
const read=p=>readFileSync(resolve(root,p),'utf8');
test('canonical BSPT motifs are unmodified source copies',()=>{
 for(const [master,local] of [
  ['logos/brush-slash.svg','brush-slash.svg'],
  ['motion/brush-slash-draw.svg','brand-mark-animated.svg'],
  ['motifs/marker-swash.svg','marker-swash.svg'],
  ['motifs/paperclip.svg','paperclip.svg']]){
   assert.equal(read(master),read('apps/phoenix-rehab-pilot/'+local),master+' does not match');
 }
});
test('brand motion has reduced-motion static fallback',()=>{
 const html=read('apps/phoenix-rehab-pilot/index.html');
 assert.match(html,/<picture>/);
 assert.match(html,/prefers-reduced-motion: reduce/);
 assert.match(html,/brand-mark-animated\.svg/);
 assert.match(html,/brush-slash\.svg/);
 assert.match(html,/family=Caveat/);
 assert.match(html,/responsive-brand\.css/);
});
test('notebook, handwriting and actual clipped paper use semantic content',()=>{
 const html=read('apps/phoenix-rehab-pilot/index.html');
 assert.match(html,/class="notebook bspt-notebook-brief"/);
 assert.match(html,/class="notebook-clip" src="\.\/paperclip\.svg"/);
 assert.match(html,/class="notebook-hand"/);
 assert.match(html,/class="intro-scribble"/);
 assert.match(html,/class="highlighted"/);
 assert.doesNotMatch(html,/hand-arrow\.svg/); // No unanchored decorative arrows.
});
test('mobile-first chat flows before marketing section and rescues landscape',()=>{
 const css=read('apps/phoenix-rehab-pilot/responsive-brand.css');
 assert.match(css,/@media\(max-width:980px\)/);
 assert.match(css,/\.experience\{order:0/);
 assert.match(css,/\.intro\{order:1/);
 assert.match(css,/@media\(max-height:590px\) and \(max-width:980px\)/);
 assert.match(css,/\.notebook\.bspt-notebook-brief\{display:block/);
 assert.match(css,/font-size:16px/); // iOS focus zoom prevention.
 assert.match(css,/max-height:calc\(100dvh - 24px\)/);
});
