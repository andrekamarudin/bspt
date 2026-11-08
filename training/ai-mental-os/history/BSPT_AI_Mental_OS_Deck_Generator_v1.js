const pptxgen = require('pptxgenjs');
const pptx = new pptxgen();
pptx.layout = 'LAYOUT_WIDE';
pptx.author = 'ByteSize ProTip';
pptx.subject = 'Paid AI Mental OS training | first editable 150-minute facilitator draft';
pptx.title = 'Stop Babysitting AI | The AI Mental OS';
pptx.company = 'ByteSize ProTip';
pptx.lang='en-SG';
pptx.theme = { headFontFace: 'Inter', bodyFontFace: 'Inter', lang:'en-SG' };
const ST=pptx.ShapeType;
const C={forest:'082E24',deep:'051C17',orange:'FF6433',cream:'F7F2E8',yellow:'FFD65A',sage:'8DAB99',stone:'E8DED0',ink:'17372C',muted:'65746C',white:'FFFFFF',gray:'DEE4DB',red:'C95143',green:'24785B',line:'D6DACF'};
const W=13.333,H=7.5, M=0.75;
const slides=[];
function rect(s,x,y,w,h,fill=C.cream,line='none',r=0){s.addShape(r?ST.roundRect:ST.rect,{x,y,w,h,rectRadius:r||undefined,line:line==='none'?{color:fill,transparency:100}:{color:line,width:1},fill:{color:fill},radius:r||undefined});}
function txt(s,str,x,y,w,h,opt={}){const q={x,y,w,h,fontFace:opt.serif?'Georgia':'Inter',fontSize:opt.size||20,bold:!!opt.bold,color:opt.color||C.ink,margin:0,breakLine:false,fit:'shrink',valign:opt.valign||'mid',align:opt.align||'left',transparency:opt.transparency||0,...opt}; delete q.serif; delete q.size; return s.addText(str,q);}
function line(s,x1,y1,x2,y2,color=C.stone,width=1,dash){s.addShape(ST.line,{x:x1,y:y1,w:x2-x1,h:y2-y1,line:{color,width,dashType:dash}})}
function rrect(s,x,y,w,h,fill=C.cream,border=null,r=0.18){s.addShape(ST.roundRect,{x,y,w,h,rectRadius:r,fill:{color:fill},line:border?{color:border,width:1.2}:{color:fill,transparency:100},radius:r});}
function dot(s,x,y,fill=C.orange,r=0.12){s.addShape(ST.ellipse,{x,y,w:r,h:r,fill:{color:fill},line:{color:fill,transparency:100}})}
function tag(s,text,x,y,w,fill=C.orange,color=C.deep){rrect(s,x,y,w,0.36,fill,null,0.08);txt(s,text,x+0.12,y+0.035,w-0.24,0.27,{size:10,bold:true,color,characterSpacing:0.5});}
function header(s,label,num,dark=false){const col=dark?C.cream:C.muted;txt(s,'BSPT  /  AI MENTAL OS',M,0.26,4.2,0.22,{size:10,bold:true,color:col,charSpacing:1});txt(s,label,8.2,0.26,4.2,0.22,{size:10,bold:true,color:col,align:'right'});}
function footer(s,num,dark=false){const c=dark?C.sage:C.muted;txt(s,'KNOW WHAT MATTERS.  DO WHAT WORKS.',M,7.05,7.5,0.22,{size:9,bold:true,color:c});line(s,M,6.92,12.55,6.92,dark?'315349':C.stone,0.9);txt(s,'FACILITATOR DRAFT  •  v1',9.0,7.05,3.1,0.2,{size:9,color:c,align:'right'});if(num)txt(s,String(num).padStart(2,'0'),12.47,7.05,0.3,0.2,{size:9,color:c,align:'right'});}
function base(title,section='WORKSHOP',dark=false){const s=pptx.addSlide();s.background={color:dark?C.forest:C.cream};const n=slides.length+1;slides.push({s,title,n});header(s,section,n,dark);footer(s,n,dark);if(title){txt(s,title,M,0.77,11.9,1.0,{size:35,bold:true,color:dark?C.cream:C.ink,breakLine:false})}return s;}
function notes(s,body){s.addNotes(body);}
function block(s,title,body,x,y,w,h,opts={}){rrect(s,x,y,w,h,opts.bg||C.white,opts.border||null); if(opts.tag)tag(s,opts.tag,x+0.24,y+0.2,opts.tagw||1.4,opts.tagfill||C.yellow);txt(s,title,x+0.25,y+(opts.tag?0.72:0.26),w-0.5,0.52,{size:opts.titleSize||19,bold:true,color:opts.titleColor||C.ink});txt(s,body,x+0.25,y+(opts.tag?1.34:0.95),w-0.5,h-(opts.tag?1.57:1.17),{size:opts.size||16,color:opts.bodyColor||C.muted,valign:'top',breakLine:false});}
function chevron(s,text,x,y,w,h,color=C.sage,tc=C.deep){rrect(s,x,y,w,h,color,null);txt(s,text,x+0.15,y+0.1,w-0.3,h-0.2,{size:15,bold:true,color:tc,align:'center'})}
function bigNumber(s,n,x,y,color=C.orange,size=75){txt(s,n,x,y,1.2,0.93,{size,bold:true,color})}
function slideNotes(label,time,script,activity='',checker=''){return `FACILITATOR NOTES | ${label} | ${time} min\n\n${script}\n${activity?'\nPARTICIPANT ACTIVITY\n'+activity:''}${checker?'\nCHECK / EXPECTED RESPONSE\n'+checker:''}\n\nAll cases are fictional. Model outputs shown are examples to discuss, not recordings of actual live systems. No private/company data in public AI tools.`}

// 01 Cover
{
let s=base('', 'PAID TRAINING  ·  150 MINUTES',true);
rrect(s,9.75,1.16,2.5,4.87,C.orange);txt(s,'AI',9.98,1.45,2.10,2.0,{size:119,bold:true,color:C.deep,align:'center'});txt(s,'OS',9.98,3.49,2.10,1.40,{size:83,bold:true,color:C.deep,align:'center'});
 tag(s,'THE PAID MASTERCLASS',M,1.1,2.6,C.yellow);
 txt(s,'STOP\nBABYSITTING\nAI.',M,1.68,8.75,3.62,{size:59,bold:true,color:C.cream,breakLine:false,lineSpacingMultiple:0.85});
 txt(s,'Human above the loop.  Outcomes you can prove.',M,5.65,9.0,0.53,{size:21,color:C.sage});
 notes(s,slideNotes('Promise',2,'Open with the human value: this is not a tour of 24 prompts. The goal is to stop editing AI drafts repeatedly by specifying good work and its verification in advance. Ask participants to think of one recurring task they would love to stop babysitting.'));
}
// 02 Hook
{
let s=base('A plausible answer can create more work.','HUMAN PROBLEM');tag(s,'FICTIONAL SCENARIO',M,1.76,2.05,C.yellow);
block(s,'5:43 PM  •  Mei','“AI, summarize these meeting notes.”',M,2.28,5.5,2.64,{titleSize:24,size:25});
block(s,'5:44 PM  •  AI','“Done. Everyone agreed; Alex owns the rollout.”',6.59,2.28,5.98,2.64,{titleSize:22,size:22,bg:'FCE7DB'});
rect(s,M,5.20,11.83,1.03,C.forest);txt(s,'Mei now checks every line.  Who is doing the work?',M+0.27,5.35,11.3,0.67,{size:24,bold:true,color:C.cream});
notes(s,slideNotes('Human friction',4,'Fictional story, not a case study. Describe the familiar experience of asking AI for a quick summary and then verifying every decision, deadline and name. The work moved from drafting to vetting. Do not say this always happens; ask if the scenario feels familiar.'));
}
// 03 Opening challenge
{
let s=base('The product is a new way of thinking.','WHY THIS IS PAID TRAINING');
block(s,'FREE NUGGETS','Here are 24 useful things AI can do.\nTry one today.',M,1.92,5.45,3.72,{tag:'DISCOVER',tagw:1.32,titleSize:27,size:22});
block(s,'MENTAL OS','Learn to invent the 25th.\nThen design how AI can prove it worked.',6.49,1.92,6.06,3.72,{tag:'TRANSFER',tagw:1.38,titleSize:27,size:22,bg:'F0F2E6'});
txt(s,'What would you stop doing by hand if you trusted the process?',M,5.93,11.8,0.45,{size:21,bold:true,color:C.orange});
notes(s,slideNotes('Audience outcome',2,'Explain freemium vs paid training distinction. The value is not the prompt itself but the ability to identify a new useful task, define its outcome and check the result. Invite attendees to hold one real low-risk problem in mind.'));
}
// 04 2 rules
{
let s=base('Two rules replace dozens of magic prompts.','THE PIVOT');
block(s,'A  |  HUMAN ABOVE THE LOOP','Own the purpose and boundaries.\nDelegate routine execution and checking.',M,1.95,5.75,3.55,{bg:C.forest,titleColor:C.cream,bodyColor:'B8D1C4',titleSize:24,size:22});
block(s,'B  |  PROOF BY DESIGN','Define “done” with observable tests\nso success is cheap to inspect.',6.72,1.95,5.84,3.55,{bg:C.orange,titleColor:C.deep,bodyColor:C.deep,titleSize:23,size:22});
txt(s,'Less babysitting.  More ownership.',M,5.8,11.85,0.58,{size:27,bold:true,color:C.ink});
notes(s,slideNotes('Governing model',2,'These are the two philosophies of the entire training. Human above loop does not mean unconditional autonomy. Outcome proof means pass criteria and evidence appear in the initial task specification, not as an afterthought.'));
}
// 05 baseline exercise
{
let s=base('Name the task that keeps coming back.','QUICK BASELINE  ·  3 MIN');
rect(s,M,1.9,11.85,3.87,C.forest);
txt(s,'“I want to stop manually __________\nso that __________.”',M+0.55,2.42,10.74,1.76,{size:38,bold:true,color:C.cream});
tag(s,'WRITE IT DOWN',M+0.58,4.82,2.0,C.yellow);
txt(s,'No AI product names.  Describe a human outcome.',M,6.06,11.8,0.47,{size:20,color:C.muted});
notes(s,slideNotes('Baseline exercise',3,'Give learners a private 3-minute writing exercise. They choose a low-risk task or a fictional scenario. The job must be stated in human terms, not as “use ChatGPT”. Do not ask anyone to disclose confidential material.','Write the task and why it matters.','An acceptable answer names an observable human change.'));
}
// 06 tech model
{
let s=base('A model is only one part of reliable AI work.','TECHNICAL TRUTH');
const nodes=[['MODEL','Generates and reasons'],['CONTEXT','What it can access'],['TOOLS','What it can do'],['CHECKS','How we know']];
nodes.forEach(([a,b],i)=>{let x=M+i*3.0;rrect(s,x,2.2,2.78,2.63,i===3?C.forest:C.white);txt(s,String(i+1).padStart(2,'0'),x+0.22,2.4,0.58,0.37,{size:18,bold:true,color:i===3?C.yellow:C.orange});txt(s,a,x+0.22,3.05,2.35,0.43,{size:22,bold:true,color:i===3?C.cream:C.ink});txt(s,b,x+0.22,3.6,2.38,0.78,{size:16,color:i===3?C.sage:C.muted});});
txt(s,'The human defines the purpose and the permission boundary above all four.',M,5.47,11.75,0.61,{size:21,bold:true,color:C.ink});
notes(s,slideNotes('Minimal tech model',4,'No transformer equations needed. Explain that model capability, context, available tools and validation are different. A system may have none of the extra tools, and may not see private files unless explicitly connected and permitted.'));
}
// 07 proof distinction
{
let s=base('Sounding certain is not the same as being right.','TECHNICAL TRUTH');
block(s,'WHAT AI CAN SAY','“I checked. It all looks accurate.”',M,1.94,5.52,3.48,{bg:'FBE8E0',titleColor:C.red,size:23});
block(s,'WHAT A CHECK CAN SHOW','9 rows expected → 9 rows found.\nAll decisions linked to source lines.',6.55,1.94,6.0,3.48,{bg:'E6EFE8',titleColor:C.green,size:22});
txt(s,'Self-critique helps find doubts.  Independent checks establish stronger evidence.',M,5.78,11.8,0.7,{size:20,color:C.muted});
notes(s,slideNotes('Hallucination and checks',3,'AI can hallucinate in an eloquent tone. Asking it to critique its own output is a useful diagnostic, not independent proof. Show a source-backed check or known-answer fixture as a stronger form of evidence.'));
}
// 08 Human above loop diagram
{
let s=base('Own the destination. Delegate the route.','PILLAR A  ·  HUMAN ABOVE LOOP');
block(s,'HUMAN IN EACH STEP','“Try again.”\n“Wrong format.”\n“Who owns this?”\n“Check that number.”',M,1.9,5.4,3.67,{bg:'FBE5DC',titleColor:C.red,size:20});
block(s,'HUMAN ABOVE THE LOOP','Defines: outcome + boundaries.\nAI: executes + checks + repairs.\nHuman: judges exceptions.',6.5,1.9,6.04,3.67,{bg:'E6EFE8',titleColor:C.green,size:21});
txt(s,'Move supervision to the decision points that matter.',M,5.89,11.75,0.5,{size:22,bold:true,color:C.ink});
notes(s,slideNotes('Above-loop',8,'Contrast micro-managing each model step with setting direction once and using bounded checks. Human owns goals, risk, empathy, quality taste and exception choices. This does NOT remove approval at protected, external or irreversible boundaries. Ask learners to point to the burden currently on the human.'));
}
// 09 risk ladder
{
let s=base('Autonomy follows risk, not excitement.','PILLAR A  ·  PERMISSION');
const rows=[{c:'24785B',bg:'E4F0E8',h:'ROUTINE',txt:'Formatting, reversible drafts, known-answer checks',who:'AI + automated proof'},{c:'A1771F',bg:'FFF3D7',h:'JUDGMENT',txt:'Subjective quality, ambiguous sources, external consequences',who:'Human resolves exception'},{c:'C95143',bg:'FBE9E5',h:'CONSEQUENTIAL',txt:'Payment, delete, publish, sensitive send or protected data',who:'Exact approval before action'}];
rows.forEach((z,i)=>{const y=1.88+i*1.47;rrect(s,M,y,11.8,1.23,z.bg);rect(s,M,y,0.2,1.23,z.c);txt(s,z.h,M+0.37,y+0.20,2.22,0.40,{size:16,bold:true,color:z.c});txt(s,z.txt,M+2.73,y+0.15,5.62,0.8,{size:16,color:C.ink});txt(s,z.who,9.2,y+0.28,3.01,0.48,{size:14,bold:true,color:z.c,align:'right'});});
notes(s,slideNotes('Permission design',12,'Let learners place activities in green, amber or red zones. Explicit approval is required for exact consequential operations; a notification does not grant consent. Prompt wording alone cannot enforce security. A workflow can use tools with actual permission checks.','Ask: Can the AI independently send a client email simply because it drafted one? What about calculating a fictional total?','Sending requires exact authorization and tools; a reversible toy calculation can be self-checked.'));
}
// 10 contract
{
let s=base('Three words: Outcome. Proof. Boundaries.','PILLAR B  ·  THE CONTRACT');
const q=[['OUTCOME','What human result should exist?','Human value'],['PROOF','What would demonstrate success?','Inspectable receipt'],['BOUNDARIES','What cannot happen?','Permission + limits']];
q.forEach(([h,b,c],i)=>{const x=M+i*4.0;rrect(s,x,1.99,3.7,3.55,i===1?C.orange:(i===2?C.forest:C.white));txt(s,'0'+(i+1),x+0.25,2.25,0.8,0.45,{size:25,bold:true,color:i===2?C.yellow:C.orange});txt(s,h,x+0.25,3.05,3.22,0.56,{size:23,bold:true,color:i===2?C.cream:C.ink});txt(s,b,x+0.25,3.72,3.15,0.8,{size:19,color:i===2?C.sage:C.ink});txt(s,c.toUpperCase(),x+0.25,5.13,3.1,0.25,{size:10,bold:true,color:i===2?C.yellow:C.muted});});
notes(s,slideNotes('Three-part contract',7,'This is the one memory hook people should be able to tell friends. Outcome tells AI the destination. Proof builds acceptance into delivery. Boundaries decide what AI may do and where to stop. Each is short, but each prevents a different class of failure.'));
}
// 11 weak brief
{
let s=base('“Summarize these notes.”  Then what?','PILLAR B  ·  BAD BRIEF');
rect(s,M,1.97,11.82,1.0,C.forest);txt(s,'SUMMARIZE THE MEETING.',M+0.35,2.16,11.1,0.57,{size:31,bold:true,color:C.cream});
const a=[['NO DEFINITION','What counts as a decision?'],['NO EVIDENCE','How do we prove the owner agreed?'],['NO STOP RULE','What happens when a fact is missing?']];
a.forEach(([h,b],i)=>block(s,h,b,M+i*4.0,3.46,3.68,2.08,{titleSize:18,size:17,bg:i===1?'FFF0DA':C.white}));
notes(s,slideNotes('Uncheckable request',5,'Ask participants to identify the hidden human review burden in the vague task. They may say AI could fabricate owners, confuse suggestions with commitments, or omit unresolved questions. Do not imply every AI would make those mistakes; the problem is the task lacks inspectable acceptance criteria.'));
}
// 12 good brief example
{
let s=base('Make every claimed decision carry a receipt.','PILLAR B  ·  WORKED EXAMPLE');
const notesList=[['1','Maya: “Pilot with 10 users.”'],['2','Dan: “Could we do 20?”'],['3','Maya: “Ten first, agreed.”'],['4','Dan: “I’ll draft the invite Tuesday.”'],['5','Maya: “Budget still awaiting finance.”']];
rrect(s,M,1.85,5.42,4.42,C.white);tag(s,'FICTIONAL NOTES',M+0.25,2.05,2.0,C.yellow);
notesList.forEach((a,i)=>{const y=2.63+i*0.58;txt(s,a[0],M+0.25,y,0.35,0.32,{size:15,bold:true,color:C.orange});txt(s,a[1],M+0.68,y,4.42,0.42,{size:16,color:C.ink});});
rrect(s,6.46,1.85,6.1,4.42,'E6EFE8');tag(s,'CHECKABLE OUTPUT',6.71,2.05,2.15,C.orange,C.deep);
const out=[['DECISION','Pilot 10 users  →  line 3'],['ACTION','Dan drafts invite  →  line 4'],['UNKNOWN','Budget approval  →  line 5']];
out.forEach((a,i)=>{const y=2.79+i*1.0;txt(s,a[0],6.73,y,1.30,0.3,{size:13,bold:true,color:i===2?C.red:C.green});txt(s,a[1],8.0,y,4.18,0.53,{size:18,bold:true,color:C.ink});if(i<2)line(s,6.75,y+0.67,12.27,y+0.67,'CADDD0',1);});
notes(s,slideNotes('Evidence-embedded output',8,'Source and output are synthetic. Ask learners where the evidence is and why budget remains UNKNOWN. Show that citations to the supplied source lines can be checked mechanically for existence, but semantic correctness may still need review. This is richer than asking the model to promise accuracy.','Ask the room to find one unsupported inference in a bad summary: “Alex owns rollout”.','No Alex exists in the source; cannot declare a rollout owner.'));
}
// 13 full brief
{
let s=base('A great brief is a miniature work contract.','PILLAR B  ·  REUSABLE METHOD');
const a=[['01','HUMAN OUTCOME','Who is helped?'],['02','SOURCE INPUTS','What facts exist?'],['03','DONE WHEN','Pass / fail conditions'],['04','PROOF','What receipt or test?'],['05','BOUNDARIES','Permissions and anti-goals'],['06','STOP','When to escalate?']];
a.forEach((x,i)=>{const xx=M+(i%3)*4.0,yy=1.9+Math.floor(i/3)*2.15;rrect(s,xx,yy,3.7,1.87,i===2||i===3?'E6EFE8':C.white);txt(s,x[0],xx+0.20,yy+0.20,0.58,0.42,{size:18,bold:true,color:C.orange});txt(s,x[1],xx+0.90,yy+0.20,2.51,0.44,{size:17,bold:true,color:C.ink});txt(s,x[2],xx+0.20,yy+1.02,3.26,0.39,{size:17,color:C.muted});});
notes(s,slideNotes('Work brief pattern',5,'Do not teach incantations. This is an information contract, not a mandatory six-line prompt format. State the source, what good looks like, a negative case, approval boundaries and stop rule once. Ask what essential facts remain missing, then proceed on stated assumptions for low-risk work.'));
}
// 14 guided exercise
{
let s=base('Practice 1: turn an ambition into acceptance tests.','YOU DO IT  ·  18 MIN');
rect(s,M,1.92,11.82,0.91,C.forest);txt(s,'WEAK ASK:  “Build me a great onboarding plan.”',M+0.28,2.12,11.25,0.49,{size:24,bold:true,color:C.cream});
const steps=[['1','Choose the person and outcome'],['2','Supply safe facts and constraints'],['3','Write THREE pass conditions'],['4','Add ONE must-not-happen'],['5','Name one check and a stop rule']];
steps.forEach((z,i)=>{const y=3.1+i*0.57;txt(s,z[0],M+0.2,y,0.45,0.38,{size:18,bold:true,color:C.orange});txt(s,z[1],M+0.8,y,10.4,0.4,{size:19,color:C.ink});});
notes(s,slideNotes('Guided partner exercise',18,'Pair up. Let the learner choose the original task or the fictional onboarding example. Give 6 min to draft an outcome contract, 7 min for partners to challenge missing pass criteria and boundaries, and 5 min to revise. Insist on at least one source requirement and an explicit definition of done.','Ask a partner to point to any line that needs interpretation before a checker can decide PASS/FAIL.','A usable contract would let a different operator make the same basic completion decision.'));
}
// 15 break
{
let s=base('', '10-MINUTE BREAK',true);tag(s,'REFRESH  ·  10 MINUTES',M,1.25,2.9,C.yellow);
txt(s,'The magic is not\nthe prompt.',M,2.04,11.7,2.1,{size:57,bold:true,color:C.cream});
txt(s,'It is knowing what “done” means.',M,4.78,11.75,0.81,{size:31,bold:true,color:C.orange});
notes(s,slideNotes('Break',10,'Pause. Restore synthetic data, verify the next AI demo is available, and prepare a no-network fallback. Use the break to collect any anonymous questions about source access, approval or examples.'));
}
// 16 correct check
{
let s=base('Don’t ask AI if it is right. Give it a test.','PROOF BY DESIGN');
block(s,'CIRCULAR CHECK','“Are you sure?”\n“Yes, I am.”',M,1.91,5.52,3.48,{bg:'FBE8E0',titleColor:C.red,size:24});
block(s,'OBSERVABLE CHECK','“Expected 3 rows. Did all 3 survive?”\n“Quote the source for this decision.”',6.55,1.91,6.0,3.48,{bg:'E6EFE8',titleColor:C.green,size:20});
txt(s,'The proof should be inspectable without believing the model.',M,5.85,11.8,0.62,{size:22,bold:true,color:C.ink});
notes(s,slideNotes('Check design',4,'Use a synthetic data transformation with a known expected row count. Explain independent check versus AI critique. In a no-network setting, ask participants to write the checks before anyone demonstrates the result.'));
}
// 17 checker menu
{
let s=base('Pick the checker that matches the failure.','EVIDENCE LADDER');
const checks=[['ARITHMETIC','Fixture + reconciliation','2 × 0.5 h × $20 = $20'],['FACTUAL CLAIM','Primary source + uncertainty','Quote passage and inspect it'],['CODE / DECK','Run test + render + inspect','Screenshot or passing fixture'],['HUMAN JUDGMENT','Rubric + accountable reviewer','Brand tone and real impact']];
checks.forEach((z,i)=>{const y=1.9+i*1.1;rrect(s,M,y,11.82,0.92,i%2?C.white:'ECF0E8');txt(s,z[0],M+0.2,y+0.24,2.3,0.36,{size:16,bold:true,color:C.orange});txt(s,z[1],M+2.6,y+0.18,4.15,0.50,{size:18,bold:true,color:C.ink});txt(s,z[2],M+7.4,y+0.18,4.12,0.54,{size:16,color:C.muted});});
notes(s,slideNotes('Choose the right checker',6,'Different failure modes need different evidence. A model can suggest a test, but a source check, arithmetic fixture, runtime output, or human value judgment may be necessary. Some subtle errors are not fully automatable.'));
}
// 18 bounded loop
{
let s=base('Good loops repair failures without nagging you.','BOUNDED EXECUTION');
const labs=[['DEFINE','Contract'],['PRODUCE','Candidate'],['TEST','Evidence'],['REPAIR','If failed'],['DELIVER','With receipt']];
labs.forEach((z,i)=>{let x=M+i*2.42;rrect(s,x,2.25,2.16,1.62,i===2?C.orange:(i===4?C.forest:C.white));txt(s,z[0],x+0.11,2.59,1.94,0.37,{size:18,bold:true,color:i===4?C.cream:C.ink,align:'center'});txt(s,z[1],x+0.11,3.15,1.94,0.37,{size:15,color:i===4?C.sage:C.muted,align:'center'});if(i<4)txt(s,'→',x+2.14,2.7,0.28,0.45,{size:23,bold:true,color:C.orange,align:'center'});});
rrect(s,3.0,4.50,7.35,0.94,'E6EFE8');txt(s,'If test fails: return the mismatch, retry within limits.',3.21,4.71,6.9,0.45,{size:19,bold:true,color:C.ink});
txt(s,'Stop on uncertainty, budget or permission boundary.',M,5.86,11.7,0.52,{size:20,color:C.muted});
notes(s,slideNotes('Repair loop',7,'Teach an evaluator/optimizer loop bounded by observations and stopping rules. Emphasize that a successful loop needs checks that correlate with the desired result; infinite self-rewrites are neither safe nor cheap.'));
}
// 19 failure message
{
let s=base('A useful correction contains an observation.','HOW TO DEBUG AI WORK');
block(s,'VAGUE RETRY','“Try harder. This is still wrong.”',M,1.92,5.52,3.55,{bg:'FBE8E0',titleColor:C.red,size:23});
block(s,'TEST-DRIVEN RETRY','“Found 8 rows; expected 9.\nRestore the missing source row,\nthen rerun the row-count check.”',6.55,1.92,6.0,3.55,{bg:'E6EFE8',titleColor:C.green,size:20});
txt(s,'Observed failure → targeted repair → rerun affected checks.',M,5.82,11.9,0.53,{size:22,bold:true,color:C.ink});
notes(s,slideNotes('Targeted feedback',5,'This slide shows why grounding the feedback in an observable mismatch improves the next action and cuts cycles. Do not invent an actual benchmark claiming fewer model calls until measured. Ask learners to rewrite a vague “try again” message with a specific failure.'));
}
// 20 practical ledger
{
let s=base('Practice 2: design PASS, FAIL and UNKNOWN.','YOUR CHECKING ENGINE  ·  5 MIN');
const x=[['PASS','All 3 fictional input rows remain','24785B'],['FAIL','Expected 3 rows; only 2 returned','C95143'],['UNKNOWN','Source of one claimed decision is absent','A1771F']];
x.forEach((z,i)=>{const y=1.94+i*1.36;rrect(s,M,y,11.8,1.13,i===0?'E4F0E8':i===1?'FBE9E5':'FFF3D7');txt(s,z[0],M+0.2,y+0.32,2.15,0.42,{size:23,bold:true,color:z[2]});txt(s,z[1],M+2.5,y+0.27,8.8,0.53,{size:20,color:C.ink});});
notes(s,slideNotes('Practice ledger',5,'Ask learners to define at least one PASS/FAIL/UNKNOWN result for their own contract. A PASS requires evidence. FAIL can trigger a bounded repair. UNKNOWN must not be disguised as success; seek the missing source or escalate.','Have a peer identify what real checker produces each status.','UNKNOWN is the honest state when source or judgment is missing.'));
}
// 21 autonomy ladder
{
let s=base('Agents are optional. Reliable work is the goal.','KEEP IT SIMPLE');
const r=[['1','CHAT','One-off useful draft'],['2','TEMPLATE','Repeat the same brief'],['3','WORKFLOW','Tools + checks + approval'],['4','AGENT','Dynamic steps + guardrails']];
r.forEach((z,i)=>{const yy=1.9+i*1.13;rrect(s,M+0.35*i,yy,11.2-0.35*i,0.92,i===3?C.forest:(i===2?'E6EFE8':C.white));txt(s,z[0],M+0.25+0.35*i,yy+0.17,0.5,0.51,{size:24,bold:true,color:i===3?C.yellow:C.orange});txt(s,z[1],M+1.1+0.35*i,yy+0.25,3.1,0.37,{size:18,bold:true,color:i===3?C.cream:C.ink});txt(s,z[2],M+4.5+0.35*i,yy+0.25,6.1-0.35*i,0.37,{size:17,color:i===3?C.sage:C.muted});});
notes(s,slideNotes('Automation ladder',5,'An agent is not automatically superior. Most beginners need a chat plus a checklist or reusable template. Advance to tools or dynamic agents only when recurrence, access and cost justify the complexity. The human-above-loop philosophy applies even in a simple manual workflow.'));
}
// 22 exception workflow
{
let s=base('Build approval into the workflow, not a reminder.','GOVERN EXCEPTIONS');
rrect(s,M,1.85,11.85,4.55,C.white);
const cells=[['GREEN','Draft + check','24785B','E4F0E8'],['AMBER','Interpret conflicts','A1771F','FFF3D7'],['RED','Send / spend / delete','C95143','FBE9E5']];
cells.forEach((z,i)=>{let x=M+0.29+i*3.90;rrect(s,x,2.35,3.57,2.15,z[3]);txt(s,z[0],x+0.22,2.58,2.98,0.42,{size:23,bold:true,color:z[2]});txt(s,z[1],x+0.21,3.24,3.08,0.84,{size:19,color:C.ink});});
txt(s,'A tool may execute only what its actual permissions allow.',M+0.31,5.14,11.18,0.52,{size:21,bold:true,color:C.ink});
notes(s,slideNotes('Approval boundary',5,'Ask participants to locate the irreversible point in a fictional newsletter workflow. Draft/format may proceed. Ambiguity in the recipients or source calls for review. External send requires authorization; another AI reviewer cannot grant that authority.'));
}
// 23 capstone launch
{
let s=base('Capstone: invent the 25th nugget.','TRANSFER TEST  ·  20 MIN',true);
txt(s,'NOT A PROMPT FROM THE VAULT.',M,2.2,11.85,0.49,{size:18,bold:true,color:C.yellow});
txt(s,'A new human problem.\nYour own AI work contract.',M,2.99,11.86,1.73,{size:42,bold:true,color:C.cream});
txt(s,'Your goal: a result that can be checked without babysitting each step.',M,5.4,11.75,0.69,{size:21,color:C.sage});
notes(s,slideNotes('Capstone launch',2,'No demonstration copy. Offer new safe cases: community-event delay; conflicting onboarding answers; volunteer priority; hobby habit. Learners can instead pick a harmless, non-sensitive task. They have twenty minutes across slides 23–25 to create and defend a contract.'));
}
// 24 blueprint
{
let s=base('Write the contract. Show the proof.','UNSEEN PROBLEM  ·  WORKSHEET');
const a=[['HUMAN','Who needs what?'],['DELIVERABLE','What exists when done?'],['DONE WHEN','Three pass conditions'],['MUST NOT','One unacceptable failure'],['RECEIPT','What checks each condition?'],['AUTONOMY','What can AI do alone?'],['STOP / APPROVAL','When does a human step in?'],['RETURN','PASS / FAIL / UNKNOWN']];
a.forEach((z,i)=>{const yy=1.77+i*0.56;txt(s,z[0],M+0.1,yy,2.8,0.34,{size:14,bold:true,color:C.orange});line(s,M+2.98,yy+0.33,12.46,yy+0.33,C.stone,1);txt(s,z[1],M+3.07,yy,9.15,0.31,{size:15,color:C.muted});});
notes(s,slideNotes('Capstone drafting',15,'Give 10 min to create the contract, then 5 min peer challenge. Learners must not claim a PASS from model assertion only. Ask: “What is the cheapest independent receipt?” and “Where do you stop and ask?” No sensitive real data. The worksheet mirrors content/paid-training/transfer-assessment.md.'));
}
// 25 payoff
{
let s=base('Leave able to delegate, not just to prompt.','THE PAYOFF',true);
const s0=['I can name the human outcome.','I can write the acceptance test.','I can delegate bounded checking.','I know exactly when to step in.'];
s0.forEach((q,i)=>{dot(s,M+0.18,1.88+i*0.82,C.orange,0.18);txt(s,q,M+0.58,1.74+i*0.82,11.0,0.58,{size:25,bold:true,color:C.cream});});
rrect(s,M,5.65,11.83,0.8,C.orange);txt(s,'KEEP THE WHY.   DELEGATE THE HOW.   MAKE DONE PROVABLE.',M+0.26,5.85,11.34,0.39,{size:21,bold:true,color:C.deep});
notes(s,slideNotes('Capstone debrief and close',3,'Ask 1–2 volunteers to explain a new use case and one concrete independent check. Emphasize that low-risk independence is the first goal, not maximal autonomy. Invite each learner to try one safe, voluntary task within 48 hours. Do not invent efficacy results.'));
}
// 26 sources appendix
{
let s=base('Instructor reference | first-draft sources','APPENDIX');
const refs=[['Anthropic','Building effective agents (2024)','anthropic.com/research/building-effective-agents'],['OpenAI','A practical guide to building AI agents (2026)','openai.com/business/guides-and-resources/a-practical-guide-to-building-ai-agents/'],['OpenAI API','Guardrails and human review','developers.openai.com/api/docs/guides/agents/guardrails-approvals'],['NIST','AI RMF: Generative AI Profile','nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence'],['National Academies','How People Learn: Learning and Transfer','nationalacademies.org/read/9853/chapter/6']];
refs.forEach((z,i)=>{const y=1.75+i*0.89;txt(s,z[0],M,y,2.2,0.38,{size:18,bold:true,color:C.orange});txt(s,z[1],3.0,y,5.95,0.39,{size:17,bold:true,color:C.ink});txt(s,z[2],3.0,y+0.40,9.2,0.32,{size:12,color:C.muted});});
notes(s,'Instructor-only sources. These support mechanisms and controls, not measured performance of this proposed training. The two-pillar taxonomy is an original BSPT teaching synthesis; no survey responses were used. Sources and detailed cautions are recorded in content/paid-training/evidence.md.');
}

pptx.defineSlideMaster({title:'BSPT-CREAM',background:{color:C.cream},objects:[],slideNumber:{x:12.5,y:7.1,color:C.muted}});
// Export requested artifact.
pptx.writeFile({fileName:'/mnt/data/BSPT_AI_Mental_OS_Training_v1.pptx'}).then(()=>{console.log('WROTE 26-SLIDE DECK', slides.length);}).catch(e=>{console.error(e); process.exit(1)});
