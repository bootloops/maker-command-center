# Patch 012 — Edit sections where you write
Requires patch 011; retains response recovery 010 and existing songwriter dock.

Extract contents into repo root, run python apply-patch-012.py (or python3). Commit js/music/studio.js js/music/sections-inline.js styles/section-inline.css service-worker.js. Close app tabs after deploying and reopen for cache activation. Export a backup first. Never clear IndexedDB/site data.

Each lyric section now has a clickable heading and Edit name button. Save/Cancel appear in place. Enter saves, Escape cancels. Empty names are rejected; renaming preserves the section ID and saves a recovery version. No generation is needed.

Each section has a Section options disclosure with Move up, Move down, Add section below and Remove section. Disabled boundary buttons prevent invalid moves. Removing asks for confirmation and saves a recovery version. Reordering also saves a recovery version.

The central selector/rename/move controls are removed. A small global Add section remains (appends) so empty songs can get their first section. Add section below inserts at that location. Both open a modal with Verse, Chorus, Hook, Pre-Chorus, Post-Chorus, Bridge, Intro, Outro, Instrumental, Breakdown, Drop, Interlude and Custom. Suggested names are editable. Cancelling does nothing. New verses get numbered; duplicate type names suggest numbered variants. Custom names may repeat if intentionally entered; section IDs remain unique.

Installer patches only known source seams. Re-running is safe; source mismatch stops before studio.js is modified. Local .patch012-backup files are for rollback only. New module loads scoped CSS automatically; no HTML edits or DB migration. Existing studio-ui.js stays installed for the floating dock.

Validation: syntax checks, installer idempotence and pure naming/reordering tests. Browser/modal/keyboard end-to-end tests not run. Test rename Save/Cancel/Enter/Escape, adding above/below via positions, moving first/last section and version recovery on mobile/desktop.
