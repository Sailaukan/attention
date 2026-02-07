# NYUAD Worker Planner (Hackathon MVP)

A full-stack web app for managing on-site workers at NYU Abu Dhabi with live map status, shift timelines, and AI-assisted task replanning.

## Highlights

- Live worker markers on the campus map with status colors:
  - `green`: on track
  - `yellow`: needs attention
  - `red`: losing focus
- Right-side worker panel with:
  - current time
  - timeline (completed/current/upcoming)
  - upcoming tasks
- AI Focus Rebalancer for red workers:
  - considers task load, location, sun exposure, and crowd level
  - proposes two-worker reassignment (red + green)
  - accept/reject workflow
- Prompt-based task editing:
  - type a prompt
  - generate one updated task with progress steps
  - accept/reject workflow
- Separate "All Workers Daily Plan" window with all schedules.
- Real-time shadow visualization via `leaflet-shadow-simulator`.

## Architecture

- Backend: `server.js`
- Frontend entry: `public/js/main.mjs`
- API client: `public/js/api/client.mjs`
- Map modules:
  - `public/js/map/shadeController.mjs`
  - `public/js/map/workerOverlay.mjs`
- UI modules:
  - `public/js/ui/appShell.mjs`
  - `public/js/ui/dom.mjs`
  - `public/js/ui/controller.mjs`

## Environment

Use `.env`:

```bash
SHADEMAP_API_KEY=YOUR_SHADEMAP_API_KEY_HERE
GROQ_API_KEY=YOUR_GROQ_API_KEY_HERE
GROQ_MODEL=llama-3.3-70b-versatile
PORT=3000
```

Notes:

- `GROQ_API_KEY` is required for AI reassignment and prompt-based task generation.
- If `GROQ_API_KEY` is missing, map and worker planning still work, but AI features are disabled.

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.
