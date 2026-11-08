#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
python extract_collaboration_frame.py
node generate.js
python verify_build.py
python ../v4/demo/check_register.py ../v4/demo/candidate_bad.json && { echo 'Known-bad fixture wrongly passed'; exit 1; } || status=$?
if [[ "${status:-0}" -ne 1 ]]; then echo "Unexpected bad fixture exit ${status:-0}"; exit 1; fi
python ../v4/demo/check_register.py ../v4/demo/candidate_corrected.json
