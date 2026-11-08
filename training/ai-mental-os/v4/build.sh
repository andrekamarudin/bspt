#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
python render_knowledge_frontier.py
node generate.js
python verify_build.py
python demo/check_register.py demo/candidate_corrected.json
if python demo/check_register.py demo/candidate_bad.json; then
  echo 'ERROR: bad fixture unexpectedly passed' >&2
  exit 1
else
  echo 'PASS: known-bad fixture failed as expected'
fi
