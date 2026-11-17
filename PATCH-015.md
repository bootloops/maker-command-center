# Patch 015 — Top-left progress and partner dock restoration

Requires patches 011–014. Finish/save any running generation before installing. Export a backup.

Extract contents into repo root; run python apply-patch-015.py (or python3). Commit js/music/studio.js js/music/integration.js js/music/progress-panel.js js/music/dock-recovery.js service-worker.js. Close app tabs after deployment and reopen for new worker. Never clear IndexedDB/site data. Installer checks integration signatures before edits and retains local .patch015-backup files for rollback.

Progress now lives in a fixed top-left collapsible widget inside the Studio viewport. It starts collapsed; expand for detailed progress and Stop generation. It is no longer placed in the songwriter dock. Main-app running/completion banners remain unchanged. The widget disappears when the transport finishes; checking/saving and final notifications are still handled by the existing integrated host. Progress is not persisted across page reloads.

Partner recovery: host sends a same-origin visibility message when showing the persistent Studio iframe. Studio keeps a reference to the actual partner node and checks that its dock is attached. If the dock is missing, it mounts a replacement shell and reattaches the retained partner rather than recreating Studio or reissuing generation. Opening state is retained where observed. Structural DOM changes and visibility events also trigger the check. No AI calls are added.

LIMITS: this repairs detached/missing dock UI; it cannot restore an iframe/document that was actually destroyed, a crashed browser or a lost network request. The exact cause of the reported disappearance was not established from a screenshot in this turn. If it persists, send a screenshot plus the iframe Console and whether returning via the Music Studio nav vs a song link. Do not reload during generation expecting recovery.

Manual tests: start generation in integrated Studio, collapse/expand top-left progress, verify Settings and prompt stay accessible. Navigate to Mission Control then return using Music Studio. Repeat with dock initially open and initially collapsed. Verify existing request is still running and only one dock exists. Stop a test generation and verify status/error notice. Test on narrow screen.

Validation covers JS syntax, installer idempotence and non-reload source assertions. No browser/Ollama end-to-end run was performed. A live navigation test is necessary to confirm the disappearance is resolved in your environment.
