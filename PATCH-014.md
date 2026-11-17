# Patch 014 — Creative direction and songwriting craft

Requires patches 008–013; leaves integrated navigation, ID repair/raw response recovery, section controls and protection logic untouched. Export a full backup first. Finish active generations before installation.

Install: extract CONTENTS into repository root. Run python apply-patch-014.py (or python3). Commit js/music/studio.js js/music/creative-direction.js service-worker.js. Close app tabs after deployment and reopen for the updated cache. Never clear site data/IndexedDB. Installer backs up original files as .patch014-backup; do not commit rollback files. Unexpected source stops before studio.js modifications.

Changes:
- Replaces the general songwriting system prompt with concrete lyricist/MC/DJ-arranger/producer responsibilities, short contrast examples and a final within-request quality instruction.
- Style field should describe audible roles, groove/delivery, texture, arrangement contrast and mix priority instead of only a genre label. Word/character limits still come from the destination profile.
- One coherent recommendation, default ZERO alternatives. At most two if explicitly requested. No extra model calls, automatic critics or regenerated drafts.
- Songwriter Settings gains Writing character (Direct/Image-led/Layered), Rhythmic delivery (Melodic/Percussive/Hybrid), Sonic adventure (Familiar/Fused/Experimental), and optional scene/tension/hook fields. Stored per song; creativeDesign is visible in the existing exact-context preview.
- Existing editable creative profile is NOT overwritten. No private conversation memories are imported. User preference fields remain independently editable.
- Optional collapsed local craft checks flag very brief style text and a small list of familiar phrases. These are transparent heuristics, not expertise scoring, originality detection or automatic rejection. No extra generation is triggered.

Use: open Settings in the dock, choose e.g. Image-led / Hybrid / Fused; optionally add an anchor or sonic intent. In Create/Refine describe the emotion and meaningful change. Protect sections/style you want unchanged. Review context and generate once. Inspect style and lyrics before acceptance. Existing saved results are not automatically regenerated or edited.

Performance: prompt is longer and may add prompt-processing time, especially on an old CPU. Response budget and timeout remain from transport patch 007; no context-window increase or automatic retry. Ask for a shorter song if it reaches the output cap. This improves direction, not guaranteed talent. A weak model can still produce generic output, or fail format compliance. Use the same short musical brief to compare installed models; no model download is required by this patch.

Limits: style/lyrics are text directions, not audio mixing or performance verification. No claims of healing/frequency effects, guaranteed originality or exactly counted syllables. Existing character counter is local; generator obedience is not assured. The final quality pass is an instruction, not proof of an independently verified evaluation.

Manual checks: new Settings controls save after blur/change and reload; exact context contains creativeDesign; generation produces one recommendation; a plain genre-only style gets an optional craft note; original profile and protected chorus remain intact; navigating away still leaves integrated generation running; raw response recovery and branch song remain accessible.

Validation in VALIDATION-014.json. No live browser/Ollama end-to-end test performed.
