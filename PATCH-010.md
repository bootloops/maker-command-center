# Patch 010 — Repair song IDs and preserve completed responses
Requires patch 008 Music Studio; compatible with main AI patch 009.

Install: export backup, copy archive contents into repo root (songflow.js replaces the old validator), run python apply-patch-010.py or python3, commit js/music/songflow.js js/music/studio.js service-worker.js. Close app tabs after deployment to activate the new cache. Never clear IndexedDB/site data.

Metadata recovery:
- Missing/duplicate section IDs get unique deterministic IDs.
- Unambiguous existing section names are matched to the current song's IDs.
- A copied ID is not allowed to impersonate a differently named current section.
- Creative text is not rewritten by ID normalization. Protected fields are enforced separately, as before.
- Invalid optional alternatives no longer discard a usable recommended draft.
- Structural/content errors still block acceptance, not silently coerce missing lyrics.

Response recovery:
A completed model response is saved on the song before JSON parsing or validation. Keep / export > Response recovery shows raw responses with Copy, Download and Recover as proposal. You can edit the recovery textarea locally to repair JSON before recovery. Recovery calls no model; acceptance is still explicit. Raw records are included in song exports and full backups. Records are not automatically pruned: export regularly and watch storage growth. If IndexedDB writes fail, response remains in memory only; copy/download it before closing.

This captures complete responses delivered by patch-007 transport. It does not recover output already lost before installation, partial streams rejected by transport, browser crashes before checkpoint, or server-side output never received. The error you already encountered was not stored by patch 008; if you still have its response body in DevTools you can save it externally. This patch prevents repeating that loss for future completed responses.

Installer checks exact patch-008 signatures before editing studio.js and is safe to rerun. Unexpected source: share current studio.js for a matching patch. Modified files have *.patch010-backup rollback copies (do not commit).

Test: duplicate/missing section IDs should produce a recommendation plus a metadata-repair note. Protected chorus must remain unchanged when accepted. Deliberately invalid schema should leave a recoverable raw response. Recover as proposal must not request Ollama. Repeated recovery should not edit the live song until accepted.

Validation: syntax and deterministic repair/protection tests run; no live Ollama/browser end-to-end testing. Ambiguous names cannot reveal creative intent: always review the proposed document. This is robust metadata handling, not guaranteed interpretation of every malformed response.
