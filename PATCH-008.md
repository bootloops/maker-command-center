# Patch 008 — Song-first Music Studio

Requires the initial app and patches 001–007, including transport.js from patch 007. Replace only the files in this archive. No installer command is required. No database migration.

Changed: js/music/studio.js, styles/music-studio.css, service-worker.js. Added: js/music/songflow.js. Documentation and validation report included.

## Workflow
Open Music Studio from existing navigation. The main document contains title, style and lyrics. Create/Refine produces ONE recommended draft. Other ideas are collapsed, default zero and maximum two alternatives. No production-task cards appear in the normal flow.

Enter the idea/refinement, set Preserve / protect if needed, review exact context and generate. One request only. Use this revision accepts the package and saves a recovery version. Keep current dismisses without editing. Save alternative keeps the current document. Preview changes compares current/proposed text side by side (not a word-level diff). If you manually edit the document after generating a proposal, acceptance is blocked to prevent overwriting new work; save the proposal as an alternative and refine again.

## Data and preferences
Existing songs, arrangements, versions and alternatives remain in the existing meta-store namespace. Pre-008 task proposals remain stored but are not displayed in the simplified flow. Existing named versions are available. New complete draft alternatives can be reviewed later; older action alternatives remain readable. Existing style presets remain readable in saved alternatives. No automatic import of private chat history or memories: the visible creative profile is an editable starting point. Song-specific preferences and avoid fields remain separate. Defaults are guidance, not a genre lock.

Song edits save on field change (blur); wait for Saved locally. This is not per-keystroke crash recovery. Do not clear browser site data. Export a full backup before deployment.

## Preserving work
Protection checkboxes are local and frozen into each proposed revision. The application restores protected title/style/sections even if the model ignores the request. Unprotected sections may still be rewritten by a weak model: always preview. Structure is not independently locked. New requests produce complete resulting song JSON, not native tool calls. One coherent package may span multiple sections. Recovery versions are local.

## Low-overhead behavior
No automatic model calls on open/accept/reject/copy. Connect fetches installed model names only. One generation uses patch-007 streaming, 20-minute timeout, Stop and the existing output cap. Output count/limits, snapshots, comparisons and exact repeated-line checks are local JavaScript. Repetition check is not plagiarism detection or full semantic analysis. Flow does not implement accurate phonetic scanning, music/audio generation, singing evaluation or guaranteed platform compliance.

## Export
Copy style/lyrics/complete package, Markdown and song JSON export; configurable style/lyrics/combined limits. Unicode code-point counting includes whitespace/tags/separators; providers may differ. Copy is blocked when configured limits are exceeded. Full workspace backup continues using patch 006 exportImport.js.

## Advanced
Section editing, destination limits, versions, alternatives and arrangement notes are collapsed. Production task planning links to the general AI Workspace; specialized multi-workflow Music Studio controls are intentionally replaced with Create/Refine, not duplicated behind another menu. Audio remains external.

## Deploy
Copy archive CONTENTS over repository root. Commit js/music/studio.js js/music/songflow.js styles/music-studio.css service-worker.js and patch notes. Push, close all app tabs, reopen. The worker precaches all files from 001–008; missing prerequisites prevent cache installation. If needed, unregister the worker and remove only app Cache Storage, NEVER IndexedDB/all site data.

## Manual acceptance checks
1. Open an existing song; lyrics/style unchanged. Versions still accessible.
2. Create a draft: one recommendation; alternatives collapsed.
3. Protect chorus/style, refine verses; accept and verify protected text unchanged.
4. Manually edit after proposal: acceptance must be blocked.
5. Save alternative, reload and review from Saved alternatives.
6. Restore recovery version; inspect original lyrics.
7. Test character limits and copy.
8. Confirm model is not called for accept, reject, compare or export.
9. Confirm Stop and progress still work with your local Ollama.

Validation: JS syntax and deterministic unit assertions documented in VALIDATION.json. No live browser/Ollama end-to-end tests were possible here. Local models can produce invalid JSON or unwanted rewrites; errors do not auto-apply changes.
