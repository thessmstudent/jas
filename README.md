# J.A.S. — Jedi Alert System

> **CLASSIFICATION: STUDENT-EYES-ONLY**  
> Know where he is. Stay safe.

Crowdsourced campus tracking system for NCSSM (Durham, NC). Students submit real-time sightings of the campus figure known as "Jedi." The system aggregates reports into a live surveillance map with heat overlays, threat classification, and operational intelligence dashboards.

---

## Requirements

- **Node.js 22.5+** (uses the built-in `node:sqlite` module — no native compilation needed)
- npm

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Seed the database with sample campus sightings
npm run seed

# 3. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — the map will load with seeded data immediately.

---

## Pages

| Route | Description |
|---|---|
| `/` | Live map — pulsing last-known position, heat overlay, 5-report sidebar |
| `/sightings` | Full report feed — filterable by threat level and location |
| `/stats` | Intel dashboard — JAI score, hourly chart, location ranking |

## API Routes

| Method | Route | Description |
|---|---|---|
| GET | `/api/sightings` | Sightings from the last 48h |
| GET | `/api/sightings?all=true` | All-time sightings |
| GET | `/api/sightings/latest` | Most recent sighting |
| POST | `/api/sightings` | Submit a new sighting (multipart/form-data) |

### POST /api/sightings — fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `location_name` | string | yes | e.g. "Main Building" |
| `lat` | number | yes | Latitude |
| `lng` | number | yes | Longitude |
| `description` | string | no | Max 280 chars |
| `reporter_name` | string | no | Default: "Anonymous Witness" |
| `threat_level` | string | yes | `Spotted` / `Approaching` / `RUN` |
| `photo` | file | no | Stored in `/public/uploads/` |

---

## Project Structure

```
app/
  page.tsx                   # Map dashboard page
  sightings/page.tsx         # Filterable report feed
  stats/page.tsx             # Activity dashboard
  api/sightings/
    route.ts                 # GET (list) + POST (submit)
    latest/route.ts          # GET latest sighting
  globals.css                # Dark theme + Leaflet overrides
  layout.tsx                 # Root layout

components/
  MapDashboard.tsx           # Leaflet map, heat layer, sidebar, live polling
  ReportModal.tsx            # Submission form with mini-map pin and photo upload

lib/
  db.ts                      # node:sqlite database singleton + query helpers

scripts/
  seed.ts                    # Populates data/jas.db with 10 campus sightings

public/
  uploads/                   # Uploaded evidence photos stored here

data/
  jas.db                     # SQLite database (created at runtime)
```

---

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| Map | Leaflet.js + react-leaflet |
| Heat map | leaflet.heat |
| Database | SQLite via Node.js built-in `node:sqlite` |
| Image storage | Local filesystem (`/public/uploads`) |
| Language | TypeScript |

---

## Jedi Activity Index (JAI)

The JAI is a computed threat score (0–100) combining:

- **Weighted threat distribution** — RUN (7pts), Approaching (3pts), Spotted (1pt), normalized to max possible
- **Recency bonus** — sightings in the last 24h boost the index by up to 20 points

| Score | Status |
|---|---|
| 0–39 | LOW |
| 40–69 | ELEVATED |
| 70–100 | CRITICAL |

---

## Notes

- `npm run seed` clears and repopulates the database — safe to run any time
- The map uses a dark filter over OpenStreetMap tiles for the surveillance aesthetic
- Heat map overlay can be toggled via the "Show/Hide Density Map" button
- All times displayed in local timezone
- Photo uploads accept any image format; stored as-is in `/public/uploads/`
