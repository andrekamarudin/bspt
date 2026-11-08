#!/usr/bin/env python3
"""Independent, limited fixture checker for a fictional 3-line meeting case.

This is NOT a general semantic verifier. The expected classifications are
human-provided fixture values. Its useful lesson: source alignment and an
explicitly defined set of checks permit automatic FAIL/PASS instead of asking
an LLM to grade itself.
"""
import json,sys
from pathlib import Path
here=Path(__file__).resolve().parent
if len(sys.argv)!=2:
    raise SystemExit('Usage: python demo/check_register.py demo/candidate_bad.json')
notes=json.loads((here/'meeting_notes.json').read_text())
result=json.loads(Path(sys.argv[1]).read_text())
line_by_id={x['id']:x for x in notes['lines']}
checks=[]
if len(result.get('items',[]))!=len(line_by_id):checks.append('row count mismatch')
seen=set()
for item in result.get('items',[]):
    key=item.get('line_id')
    if key in seen:checks.append(f'duplicate line id {key}')
    seen.add(key)
    ref=line_by_id.get(key)
    if not ref:
        checks.append(f'missing source line {key}')
        continue
    if item.get('quote','') not in ref['text'] or not item.get('quote'):
        checks.append(f'quote does not match line {key}')
    if item.get('classification')!=ref['expected']:
        checks.append(f'classification mismatch on line {key}: expected {ref["expected"]}, got {item.get("classification")}')
if result.get('confirmed_approvals')!=0:
    checks.append(f'confirmed approvals expected 0, got {result.get("confirmed_approvals")}')
if seen!=set(line_by_id):checks.append('source coverage incomplete')
ledger={'status':'FAIL' if checks else 'PASS','checked':len(line_by_id),'errors':checks,
        'scope':'Only this known-answer fictional fixture, not universal semantic truth'}
print(json.dumps(ledger,indent=2))
sys.exit(1 if checks else 0)
