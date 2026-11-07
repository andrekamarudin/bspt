#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const logo=readFileSync('logos/brush-slash.svg','utf8');
const motion=readFileSync('motion/brush-slash-draw.svg','utf8');
const tokens=JSON.parse(readFileSync('brand/tokens.json','utf8'));
const css=readFileSync('components/hero-overlay.css','utf8');
assert.match(logo,/<svg/);assert.match(logo,/dry-grain/);
assert.match(logo,/<path/);assert.match(logo,/#FF6433/);
assert.match(motion,/paint-reveal/);assert.match(motion,/stroke-dashoffset/);
assert.equal(tokens.colors.coralOrange,'#FF6433');
assert.match(css,/mask-image:url\("\/brand-mark.svg"\)/);
assert.doesNotMatch(css,/clip-path|polygon\(/);
console.log('BSPT vector logo and brand tokens validated.');
