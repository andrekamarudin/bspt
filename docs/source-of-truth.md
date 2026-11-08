# BSPT: GitHub master, Figma editable mirror, OneDrive copies

**Effective 2026-11-08.** This is an enforceable *asset and implementation provenance* contract, not a claim that Figma was successfully updated.

## Ownership in three sentences

1. **GitHub is authoritative** for all production code, generators, original SVGs, approved AI-generated image inputs, character atlases, animations, build recipes, tests, workshop text and original asset bytes.
2. **Figma is the editable design workspace.** It mirrors the selected source vectors as editable paths and approved images as source-image fills, and displays a clear GitHub version reference. Figma is not the only copy of anything needed to reproduce the presentation.
3. **OneDrive is distribution only.** Uploaded PPTX/PNG are convenient snapshots. Never rebuild or revise source by treating OneDrive as authoritative.

## Exact current sources

- [Active v5 deck generator and scripts](../training/ai-mental-os/v5/README.md)
- [Canonical collaboration GIF](../motion/collaboration-with-ai.gif), [renderer](../scripts/render_collaboration_motion.py), [character atlas and extracted figures](../assets/collaboration-avatars/README.md)
- [Canonical logo](../logos/brush-slash.svg), [SVG motif folder](../motifs), [brand tokens](../brand/tokens.json)
- [Machine-readable pinned-source inventory](../design/figma-asset-manifest.json)
- [Figma existing brand design file](https://www.figma.com/design/hpKg4rZiyQJYwQ7TVBAnft)

The manifest pins each source's Git blob SHA. `node scripts/verify-figma-source.mjs` must succeed on a clean checkout and is run in CI. This protects against silent code/assets drift **inside GitHub**. It does not remotely verify Figma content.

## Synchronization and release gate

For a design or media change:
1. Update the original source and generator in a GitHub branch, including necessary tests. Do not paste an untracked final-only picture.
2. Render/rebuild and examine the actual result. Record source SHA and CI evidence.
3. Import the real canonical SVGs into the **existing BSPT Figma file** as editable vector paths. Import character PNG/atlas in their own labeled frames, preserving images as images. Provide an accurate still-frame reference and GitHub animation URL for GIF-based motion rather than pretending Figma's static frame reproduces a 49-second GIF.
4. Add or update Figma's design-library provenance annotations containing GitHub source paths and commit SHA. Verify Figma node IDs and visually inspect the result.
5. Update `design/figma-asset-manifest.json` with verified Figma node IDs and a readback date **only after successful connector verification**. Do not fabricate node IDs or mark synced from successful GitHub CI alone.
6. Publish delivery copies to OneDrive only after the GitHub source is committed and buildable. The Figma sync status must be reported accurately, including limitations.

**Current Figma status:** **UNVERIFIED.** On 2026-11-08 the connected account's Figma Starter plan returned an MCP call-limit error. The file previously used for brand specimens is known, but Figma was not inspected or modified in this task. Once access is available again, import/reconcile the 19 pinned visual assets from the manifest and read back actual node IDs. No change to OneDrive copies is needed to make source authoritative.

## Non-negotiable

**No claim of “GitHub + Figma synchronized” without an actual Figma readback.** If Figma is temporarily inaccessible, preserve all exact sources in GitHub, keep `syncStatus` as `NOT_VERIFIED_RATE_LIMIT`, and report the difference clearly. The generator must never require access to a temporary OneDrive URL.
