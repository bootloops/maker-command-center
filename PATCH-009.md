# Patch 009 — Task destinations without switching conversations

Requires AI Workspace from patch 005 (Music Studio patches do not replace it). Works alongside 006–008. This is a targeted installer, not a complete AI Workspace replacement.

Install:
1. Export a workspace backup.
2. Copy archive CONTENTS into your existing repo root.
3. Run python apply-patch-009.py (or python3).
4. Commit js/features/aiWorkspace.js, js/ai/taskDestination.js and service-worker.js.
5. Deploy, close app tabs and reopen. Do not clear site data/IndexedDB. If necessary unregister the worker and remove only app Cache Storage.

The installer checks known source signatures before modifying aiWorkspace.js. If it reports a mismatch, share the current file for an exact patch. Backup copies ending .patch009-backup are local rollback files, not intended for Git.

Behavior:
- In General Conversation, Create task asks for an existing mission or a new mission.
- New mission creation requires a name, allows an optional purpose, creates a basic active mission without template tasks, then continues the originally requested task action.
- Creation is explicit: Create mission & use it confirms making the mission; it does not navigate or switch the chat.
- Destination is saved per suggested-action group in the saved thread, separate from thread.projectId.
- Remaining tasks in that group reuse the destination. Other groups may choose different missions.
- Choose / change destination is available before or after action creation. Changing it does NOT move previously created tasks.
- Create remaining tasks prompts once when needed. Cancel stops the bulk operation, not a cascade of dialogs.
- Project-specific chats retain their existing project as task destination.
- Existing per-action deduplication is retained. Restored action cards use saved destinations.
- Archived missions are omitted from the new picker; no deletion or moving of existing records occurs.

Manual acceptance checks:
General chat -> generate tasks -> Create task -> choose existing -> task appears in that project while chat stays General.
Repeat using New mission, and using Create remaining tasks.
Cancel picker -> no new task and chat unchanged.
Navigate away/back -> action card retains destination.
Change destination -> remaining tasks go to new destination; existing tasks do not move.
Project chat -> existing direct task creation continues.

Validation report describes source-patching and syntax tests. No live browser/Ollama test was performed. The patch fixes task routing, not conversation selector behavior: explicitly switching conversation still loads the selected mission's thread.
