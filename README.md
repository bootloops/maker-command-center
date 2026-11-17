# Maker Command Center

A local-first command center for makers, builders, and experimenters.

Track missions, tasks, ideas, hardware builds, revisions, test logs, parts, references, and attachments. Connect a local Ollama model for private, context-aware planning and debugging assistance.

## Features

- Projects, tasks, ideas, builds, test logs, parts, and references
- Project templates for hardware, web apps, music tools, AI experiments, and learning platforms
- Mission Control dashboard
- Responsive desktop and mobile interface
- Cyberpunk/terminal theme plus alternate themes
- IndexedDB local storage
- Image and file attachments
- JSON export and import
- Installable PWA with offline app-shell caching
- Ollama integration: model discovery, streaming chat, context packets, and approval-based action proposals
- AI can propose tasks; creation requires approval unless auto-actions are enabled in Settings

## Run locally

```bash
python3 -m http.server 8080
```

Open http://localhost:8080

# Connect Ollama

1. Start Ollama.
2. Open **AI Workspace → Settings**.
3. Set base URL: `http://localhost:11434`
4. Select **Test Connection** to discover models.
5. Choose a model and start a chat.

### CORS

A GitHub Pages site has a different origin from `localhost`. If the browser blocks Ollama requests, configure Ollama to allow your deployed app origin through `OLLAMA_ORIGINS`. Prefer the specific origin over a wildcard.

## Privacy

All records remain in your browser by default. AI requests go only to the provider you configure, and the app shows a context preview before sending project information.

## Backup

Use **Settings → Export Data** regularly. Use **Import Data** to restore or move your workspace.
