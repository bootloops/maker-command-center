# Patch 007 — Music Studio timeout and streaming fix

Requires patch 006. This is a targeted source patch, NOT a complete replacement of studio.js.

1. Extract the CONTENTS of maker-command-center into the existing repo root.
2. From that root run: python apply-patch-007.py (or python3).
3. Commit js/music/studio.js, js/music/transport.js and service-worker.js.
4. Deploy, close all app tabs and reopen to activate the worker update. If necessary unregister the worker and delete only the app Cache Storage cache. Do not clear IndexedDB/site data.

The installer preserves local copies as *.patch007-backup. It checks for the expected API call before writing the studio module. Already applied patches are safe to rerun. Custom source may need a matching patch.

Changes: stream:true with line-buffered NDJSON parsing; preserves the structured JSON schema; 20-minute total client deadline; visible elapsed-time / character progress; Stop button; keeps model resident for 10 minutes after the request; 3072 maximum output tokens by default; errors for incomplete/truncated responses; no partial song edits. Existing two-stage generate/approve workflow remains unchanged. keep_alive is not a generation timeout. No increase to context window or GPU memory settings.

Long prompts, cold loading, CPU inference, model/hardware mismatch, concurrent requests or a separate server issue may still make requests slow. Streaming does not speed up inference. First output can still be delayed by loading, prompt processing or reasoning. Request one section initially. If token cap is reached, simplify the request; raw partial JSON is deliberately not applied. There is no automatic retry that might duplicate work.

Validation: JavaScript syntax, streamed chunk assembly and bounded completion behavior checked with mocked responses. Installer tested on the patch-006 API-call/timeout signature and idempotence. No live Ollama or browser end-to-end test was performed.
