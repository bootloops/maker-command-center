# Maker Command Center — Patch 006: Music Studio v1

Apply after patches 001–005. Copy this folder's CONTENTS into your existing repo root; do not nest another maker-command-center folder.

## Files
- music-studio.html (new)
- styles/music-studio.css (new)
- js/music/core.js (new)
- js/music/studio.js (new)
- js/main.js (replace: adds Music Studio navigation, preserves main app behavior)
- js/exportImport.js (replace: includes Music Studio records in backups, validates all imported collections before atomic replacement)
- service-worker.js (replace: versioned cache, precaches existing app plus studio, network-first updates)

## Entry point
Music Studio appears in the main navigation after reloading the updated app. You can also open music-studio.html beside index.html. It is a dedicated page, not a replacement for the existing AI chat route. Returning to Command Center is a normal link.

## Features
Song library; explicit creative brief and preferences; sonic palette; editable lyric sections; arrangement notes; reference-song opt-in; workflow prompts; exact editable context preview; Ollama JSON-schema responses; validated reviewable actions; section comparison; recovery versions before lyric/style changes; named versions and restoration; saved alternatives/style presets; project-task actions; character-limited copy export; Markdown and JSON exports; safe song JSON import as a new song; full backup support.

AI actions: create_song, propose_lyrics_revision, save_style_preset, add_arrangement_section, create_project_tasks, save_song_version, prepare_generator_export. Style preset actions save alternatives; prepare_generator_export proposes a change to the active style field. Audio generation, native tool-calling loops, automatic singing/rhythm analysis, word-level diff, multi-user sync and cloud providers are not implemented. Existing global chat auto-action settings do NOT auto-accept Studio edits. Optional auto-save creates alternatives only.

## Storage and recovery
Songs use namespaced records in the EXISTING meta object store; no database version change or destructive migration. Existing chat/projects remain unchanged. New full exports include meta. Old exports made before this patch excluded meta and therefore cannot contain new Studio songs. Full import replaces only collections explicitly present. Export backups regularly. Song content saves when fields lose focus; wait for Saved locally before closing. No encryption is added.

## Ollama
Uses the existing Settings base URL and user-selected model. Click Connect / refresh models. Requests use POST /api/chat with stream:false and a JSON-schema format. Processing may take time; timeout is five minutes. Unsupported/weak models may fail schema compliance; failures remain visible and no AI actions are applied. Choose an installed model suitable for structured output. CORS/browser restrictions are unchanged. No external library or CDN is required.

## Character limits
Profiles are user-configured, not claims about current provider limits. Counting uses Unicode code points and includes whitespace, section tags and separators. Platforms may count Unicode differently. Exports over configured limits are blocked from copy; song backup/Markdown export remains available. No silent truncation. Shortening is an AI proposal and counts are recalculated after acceptance.

## Deployment / cache
Commit and push all included files. The worker requires the files from patches 001–005 to be present. After deployment, close all app tabs and reopen to let the new worker activate. If the old cache persists, unregister the app's service worker and remove ONLY maker-command-center Cache Storage entries in DevTools. NEVER clear IndexedDB or all site data; export first.

## Manual acceptance test
1. Existing missions still load; navigation has Music Studio.
2. Create song, edit brief, blur fields, reload; song is retained.
3. Connect Ollama, select hook workflow and target section, review context, generate.
4. Accept one lyric revision; only selected section changes. Restore recovery version.
5. Save alternative without changing lyrics; reload and reopen review actions.
6. Create project task; acceptance disables repeat. Check mission task list.
7. Set low character limits; copy is blocked. Accept shorter revision, recheck.
8. Export/import song JSON into a new song. Full export includes meta/music records.
9. Test desktop/mobile rendering and offline loading after cache activation.

Automated validation is recorded in VALIDATION.json. Browser/Ollama end-to-end testing was not available during packaging. This is a first release, not a guarantee of model output quality.
