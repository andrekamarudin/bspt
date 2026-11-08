#!/usr/bin/env python3
"""Known-fixture quality checker; does not prove arbitrary semantic truth."""
import json,sys
from pathlib import Path
base=Path(__file__).parent
if len(sys.argv)!=2:
    raise SystemExit("Usage: python check_register.py candidate_bad.json")
notes=json.loads((base/"meeting_notes.json").read_text())
out=json.loads(Path(sys.argv[1]).read_text())
source={row["id"]:row for row in notes["lines"]}
errors=[]
items=out.get("items",[])
if len(items)!=len(source): errors.append("row count mismatch")
seen=set()
for item in items:
    line_id=item.get("line_id")
    if line_id in seen: errors.append(f"duplicate line {line_id}")
    seen.add(line_id)
    line=source.get(line_id)
    if line is None:
        errors.append(f"no source line {line_id}");continue
    if not item.get("quote") or item["quote"] not in line["text"]:
        errors.append(f"source quote mismatch on line {line_id}")
    if item.get("classification")!=line["expected"]:
        errors.append(f"classification mismatch on line {line_id}")
if seen!=set(source):errors.append("source coverage incomplete")
if out.get("confirmed_approvals")!=0:errors.append("expected zero confirmed approvals")
print(json.dumps({"status":"FAIL" if errors else "PASS","errors":errors,
 "scope":"this three-line known-answer fictional fixture only"},indent=2))
sys.exit(bool(errors))
