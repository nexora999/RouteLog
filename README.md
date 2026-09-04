# RouteLog

Full-stack **Django + React** trip planner for property-carrying drivers. Enter current location, pickup, dropoff, and hours already used in the 70-hour / 8-day cycle. The app returns:

- A road map of the route with pickup, drop-off, fuel, break, and rest stops
- One FMCSA-style **Drivers Daily Log** per calendar day, with the duty line drawn on the 24-hour grid

Built for a take-home assessment. It is a planning tool, not a certified ELD.

## What it does

1. Geocodes the three locations with **OpenStreetMap Nominatim**
2. Builds driving directions with **OSRM** (Open Source Routing Machine)
3. Simulates the trip under FMCSA hours of service:
   - 11-hour driving limit
   - 14-hour duty window
   - 30-minute break after 8 hours of driving
   - 10 consecutive hours off duty / sleeper berth to start a new window
   - 70 hours / 8 days, with a 34-hour restart when the cycle is exhausted
   - **1 hour on duty** at pickup and at drop-off
   - **Fuel stop (30 min on duty)** at least once every **1,000 miles**
4. Splits the timeline onto paper-style daily logs (totals always add up to 24 hours)

The driver is assumed to start a new shift at **06:00** after 10 hours off duty. No adverse-driving exception is applied.

## Local setup

You need Python 3.11+ and Node 18+.

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
python manage.py runserver 8000
```

API:

- `GET /api/health/`
- `GET /api/geocode/?q=Dallas, TX`
- `POST /api/plan/` with JSON:

```json
{
  "current_location": "Dallas, TX",
  "pickup_location": "Memphis, TN",
  "dropoff_location": "Atlanta, GA",
  "current_cycle_used": 18
}
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The home page introduces the product; **Plan a trip** opens the planner at `/plan`. Vite proxies `/api` to Django on port 8000.

## Deploy (live hosted version)

The assessment mentions Vercel. Host the **React app on Vercel** and the **Django API on Render** (free).

### 1. Django on Render

1. Push this repo to GitHub
2. Create a new **Web Service** from the repo
3. Root directory: `backend`
4. Build: `pip install -r requirements.txt`
5. Start: `gunicorn config.wsgi:application`
6. Environment:
   - `DJANGO_DEBUG=false`
   - `ALLOWED_HOSTS=.onrender.com`
   - `DJANGO_SECRET_KEY` = a long random string

Copy the service URL, e.g. `https://routelog-api.onrender.com`.

### 2. React on Vercel

1. Import the same GitHub repo in Vercel
2. Root directory: `frontend`
3. Framework: Vite
4. Environment variable:

```
VITE_API_URL=https://routelog-api.onrender.com
```

5. Deploy. Share the `*.vercel.app` URL as the live demo.

The first Render request after idle can take ~30 seconds while the free instance wakes up.

## Tests

```bash
cd backend
python manage.py test trips
```

## Project layout

```
assessment/
  frontend/                 React + Vite UI
    src/components/         Map, itinerary, daily log sheets
  backend/                  Django API
    config/                 Settings, URLs, WSGI
    trips/                  Plan API, HOS engine, log builder
      services/hos.py       Hours-of-service simulator
      services/geo.py       Geocoding and routing
      services/logs.py      Daily log sheets
    manage.py
    requirements.txt
```

## Loom walkthrough (3–5 minutes)

Record this in order:

1. Open the hosted app. Show the four inputs and the 70/8 pills in the header (20s)
2. Use **Coast to coast** (or Dallas → Memphis → Atlanta). Submit and wait for the map (45s)
3. On the map, click pickup, fuel, rest, and drop-off markers. Scroll the stop timeline (60s)
4. Open a daily log. Point to the drawn line, 15-minute ticks, total hours, remarks, and the 70/8 recap (75s)
5. Flip to a second day if the trip is long. Mention print (20s)
6. Jump to GitHub: `hos.py` (HOS rules), `views.py` (API), `DailyLogSheet.tsx` (grid drawing) (60s)

Keep the whole clip under five minutes. Speak to the rules, not every file.
