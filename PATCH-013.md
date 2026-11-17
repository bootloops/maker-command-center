# Patch 013 — Persistent Studio navigation, progress and music dashboard

REQUIRES patches 007–012 and their files. Export a full backup first. IMPORTANT: let any current generation finish and save/copy its result before installing or reloading.

Install: copy archive contents to repo root; run python apply-patch-013.py (or python3). Commit js/main.js js/music/studio.js js/music/transport.js js/music/integration.js service-worker.js. Close app tabs after deployment; reopen to activate updated worker. Do not clear IndexedDB/site data. Local .patch013-backup files are rollback files; do not commit them. Installer checks source signatures before modifying app modules.

Architecture: Main navigation now opens a same-origin, persistent Music Studio iframe at index.html#/music. Switching to Mission Control/AI Workspace hides the frame rather than removing/reloading it. A pending local model request remains in the loaded Studio instance. This is persistent app navigation, NOT a durable server job. Browser refresh, closing the main tab, browser eviction, computer sleep/network loss can still interrupt it. A before-unload warning is best effort, not a guarantee. Do not suspend your old laptop during generation.

Existing direct music-studio.html URLs still work independently; use Open integrated Command Center to enter the host BEFORE starting a generation. A standalone request cannot migrate into another document. Inside the integrated Studio, Command Center links route the parent app without unloading the Studio. Modified/Ctrl-click/new-tab behavior is left alone.

Progress: the transport status panel is now in normal flow at the top of the songwriter dock body, not a fixed overlay. It does not cover the dock toolbar. Main app shows generation status while Studio is hidden. Completed/failed request produces a persistent app banner with View result and Dismiss. Native OS notifications are not requested. Stream completion first reports Checking/saving; success is reported only after Studio saves the proposal. Error banner preserves Studio response-recovery behavior.

Dashboard: Music projects card appears on Mission Control and AI Workspace. These are saved songs, not duplicated project records. Default sort is Newest created; Recently edited and Title A–Z available. Open a song by its stable ID. Polls locally every 5 seconds on those routes; no model/network requests for song listing. Sorting is page-session state. Large libraries are not virtualized.

Security: parent/frame messages check same origin and expected window source. No third-party frame/CDN involved. Studio iframe is deliberately same-origin to use the current browser database. It is not a security isolation boundary.

Manual tests: open integrated Studio, generate, switch to AI Workspace -> visible progress -> Mission Control -> music card -> return to Studio, same active request/content. Finish -> completion banner -> View result. Stop -> error/stopped notice. Duplicate song titles -> correct song opens by ID. Check dock Settings remains clickable during generation. Reload only when generation is done.

Validation report covers syntax and installer checks only; live browser/iframe/Ollama integration not exercised here. This patch is an integration layer; existing renderers and song storage remain intact.
