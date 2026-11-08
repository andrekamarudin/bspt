# BSPT source-of-truth rules for every agent

**This repository must contain the source needed to reproduce every BSPT deliverable.**

## Before starting
- Read the owning directory's README and relevant canonical brand/skill instructions.
- Inspect existing source, history and changes before generating a replacement.
- Identify the human outcome, exact deliverable, verification criteria and any approval boundary.
- Work on a branch/PR for substantive changes; keep unrelated changes out.

## Before saying 'done'
1. **Commit source first.** Check in all generators, scripts, template/data files, source illustrations/graphics, authored text, configurations, manifests, dependency versions, tests and build instructions. Do not leave the only copy in ChatGPT `/mnt/data`, OneDrive, Figma, an ephemeral container, or a ZIP that is not committed.
2. **Binary rule.** Commit small required binaries and original media assets. A generated, fully rebuildable large binary may be ignored when the repository contains all sources, has an automated build, and publishes the result as a named CI artifact. If external storage is unavoidable, record a versioned stable URL, checksum and retrieval step in Git. Never ignore the *only* copy of an irreplaceable input.
3. **Build and verify from committed sources.** Run a local clean build when possible and a GitHub Action build on PR. For presentations verify slide count, notes, duration, animated media and rendered slide appearance; a successful compilation or overflow test alone does not prove visual quality.
4. **Commit, push and read back.** Ensure GitHub contains the exact generator and required assets. Confirm PR/merge and workflow result. Report the commit SHA, source path and actual artifact URL. **No deferred promise or private-only output counts as completion.**
5. **Be candid about unknowns.** Do not call native PowerPoint GIF playback, learner impact or pixel-perfect branding tested when only a static render or mechanical check was performed.
6. **Approval gates remain.** Do not publish, send to others, deploy production changes, delete shared assets or move money without required user authorization.

## Current deck ownership
- v4: `training/ai-mental-os/v4/`, build with `bash build.sh`.
- Earlier versions: `training/ai-mental-os/history/`.
- Current story and research claims: `content/paid-training/`.
- Canonical BSPT brand: `brand/`, `logos/`, `motifs/`, `motion/`.

**Default delivery contract:** GitHub source commit + reproducible build + QA evidence + accessible delivery link. The user should not need to ask where the source was kept.
