# Patch 011 — Branch alternatives and simplify Studio controls

Requires Music Studio patch 008 + response recovery patch 010; retains transport 007 and task destinations 009.

INSTALL: export a backup. Extract CONTENTS into repo root. Run python apply-patch-011.py (or python3). Commit js/music/studio.js js/music/studio-ui.js styles/studio-dock.css service-worker.js. Deploy, close all app tabs, reopen. Never clear IndexedDB/all site data. Installer checks known source before modifying studio.js; custom versions need a matched patch. Local .patch011-backup files are rollback copies, not commits.

BRANCH: Make new song is available on the recommendation, each alternative and saved complete draft alternatives. Enter a title. Source is saved first; a new independent song ID is written with proposed style/lyrics and copied creative brief, settings and arrangement. Source lyrics, pending proposal, versions and alternatives remain unchanged. Branch starts a fresh version/alternative history with sourceSongId provenance. Opening is optional. Cancelling the title dialog creates nothing. Cancelling Open keeps the newly saved song but leaves your current document selected. Model is never called by branching. Old action-only alternatives without full song documents cannot branch directly.

STRUCTURE: compact selector, rename input, Move up/Move down, Add section and Remove. Selecting a section scrolls to its lyrics. Controls are above lyrics instead of buried below. Removing/reordering saves recovery versions. Empty names are rejected. No drag/drop requirement; buttons work on touch and keyboard. Songwriter protection toggles refresh after changes.

PARTNER: fixed bottom-right launcher, expandable prompt panel, separate Settings panel for model and creative profile; Close and Escape collapse it. Expanded state is retained across UI renders during this page session. The dock is non-modal and scrolls internally; it may cover part of the document when expanded. Collapse it to read/edit that area. Mobile uses a compact width and bounded panel. General AI Workspace is unchanged. App browser theme/config remains inherited.

RECOVERY: patch 010 validation/raw-response recovery is retained because only targeted parts of studio.js are modified. No database migration. Existing song records remain.

TESTS: module and generated-patch JS syntax, source signature/idempotence and branch-copy tests listed in validation report. No browser/Ollama end-to-end tests performed. Please test: alternative -> branch -> stay -> source unchanged; reopen branch and reload; rename/move/remove; prompt/settings toggling after generation; small-screen keyboard behavior.
