# NYUAD Worker Planner (Hackathon MVP)

A full-stack web app for managing on-site workers at NYU Abu Dhabi with map status, fixed-time timelines, and AI-assisted task replanning.

## Highlights

- Live worker markers on the campus map with status colors:
  - `green`: on track
  - `yellow`: needs attention
  - `red`: losing focus
- Planner time is fixed to `2:00 PM` for deterministic testing.
- Right-side worker panel with:
  - worker profile/status
  - timeline (completed/current/upcoming)
  - upcoming tasks
- AI Focus Rebalancer for red workers:
  - considers task load, location, sun exposure, and crowd level
  - proposes a two-worker reassignment (red + green)
  - accept/reject workflow
  - on accept, both involved workers become `yellow`
- Prompt-based task editing:
  - write a custom prompt
  - generate one updated task with progress feedback
  - accept/reject workflow
- Separate modal window for all workers' plans.
- Button to open detailed worker information page (external URL).

## Architecture

- Backend: `server.js`
- Frontend entry: `public/js/main.mjs`
- API client: `public/js/api/client.mjs`
- Map module:
  - `public/js/map/workerOverlay.mjs`
- UI modules:
  - `public/js/ui/appShell.mjs`
  - `public/js/ui/dom.mjs`
  - `public/js/ui/controller.mjs`

## Environment

Use `.env`:

```bash
GROQ_API_KEY=YOUR_GROQ_API_KEY_HERE
GROQ_MODEL=llama-3.3-70b-versatile
PORT=3000
```

Notes:

- `GROQ_API_KEY` is required for AI reassignment and prompt-based task generation.
- Without `GROQ_API_KEY`, worker planning UI still works but AI actions are disabled.

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.
