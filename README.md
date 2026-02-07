# Cool Routes UAE (Hackathon MVP)

A full-stack web app that builds a shade-optimized walk between A and B at current time, visualizes real-time shadows with ShadeMap, and auto-dispatches a micro-mobility pod when exposed distance becomes too long.

## Highlights

- Real-time shadow visualization via `leaflet-shadow-simulator` (ShadeMap API).
- Route optimization stays custom (`OSRM + OSM buildings + SunCalc`).
- Pod dispatch simulation when exposed remainder is `>= 500m`.
- Map click location picking for both `A` and `B` with reverse geocoding.
- Built-in shade controls: `-1h`, `+1h`, `Play`, `Stop`, and full-day sun exposure mode.
- Mobile-first responsive UI with floating service panels.

## Architecture

- Backend: `server.js`
- Frontend entry: `public/js/main.mjs`
- API client: `public/js/api/client.mjs`
- Map modules:
  - `public/js/map/shadeController.mjs`
  - `public/js/map/routeRenderer.mjs`
- UI modules:
  - `public/js/ui/dom.mjs`
  - `public/js/ui/controller.mjs`
- Utilities:
  - `public/js/utils/format.mjs`
  - `public/js/constants.mjs`

## Environment

Use `.env`:

```bash
SHADEMAP_API_KEY=YOUR_SHADEMAP_API_KEY_HERE
PORT=3000
```

Get key from: https://shademap.app/about/

After changing `.env`, restart the server.

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

If port 3000 is busy:

```bash
PORT=4311 npm run dev
```

## Notes

- The app uses public OSM services (`Nominatim`, `Overpass`, `OSRM`), so heavy usage may hit rate limits.
- Shadows can look sparse at low zoom; zoom in (`>= 14`) for dense building-shadow updates.
# attention
