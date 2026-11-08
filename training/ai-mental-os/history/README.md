# AI Mental OS training build history

All presentation-producing source is versioned here. **The v4 folder is the active production source.**

| Delivered version | Source | Recovery |
|---|---|---|
| v1 | [Original PptxGenJS generator](BSPT_AI_Mental_OS_Deck_Generator_v1.js) | Run with Node.js and `pptxgenjs`; original deck was a text/shape-only prototype. |
| v2 | [Complete self-contained source ZIP](BSPT_AI_Mental_OS_v2_Source.zip) | Unzip, install `pptxgenjs` from its `package.json`, run `node generate.js` in the extracted source directory. Includes the generated fictional Mei/cover art. |
| v3 | [Complete self-contained source ZIP](BSPT_AI_Mental_OS_v3_Source.zip) | Unzip, install `pptxgenjs` from its `package.json`, run `node generate.js` in the extracted source directory. Includes the source-derived brush animation, notebook motifs and illustrations. |
| v4 | [Full tracked build tree](../v4/README.md) | `cd training/ai-mental-os/v4 && bash build.sh`; current GitHub Actions validates the same recipe. |

This preserves *rebuild inputs* for every slide version delivered in this conversation. Historical ZIPs are binary containers of source code and input assets and do not replace the browsable, versioned v4 source tree.

**Honest limitations:** Rebuilding in a different software/font environment may alter pixel layout, ZIP timestamps or GIF rendering. These outputs are first workshop drafts, not validated learning outcomes. The recorded final v4 PPTX is also available in the owner's OneDrive; the build from GitHub is authoritative for source changes.
