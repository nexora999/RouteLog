from __future__ import annotations

import math
import threading
import time
from typing import Any

import requests

NOMINATIM_URL = "https://nominatim.openstreetmap.org"
OSRM_URL = "https://router.project-osrm.org/route/v1/driving"
USER_AGENT = "RouteLog/1.0 (ELD trip planner assessment; contact=assessment)"
EARTH_MILES = 3958.8

_lock = threading.Lock()
_last_nominatim = 0.0


def _nominatim_get(path: str, params: dict[str, Any]) -> Any:
    global _last_nominatim
    with _lock:
        wait = 1.05 - (time.time() - _last_nominatim)
        if wait > 0:
            time.sleep(wait)
        response = requests.get(
            f"{NOMINATIM_URL}{path}",
            params=params,
            headers={"User-Agent": USER_AGENT, "Accept-Language": "en"},
            timeout=20,
        )
        _last_nominatim = time.time()
    response.raise_for_status()
    return response.json()


def _short_name(item: dict[str, Any]) -> str:
    addr = item.get("address") or {}
    city = (
        addr.get("city")
        or addr.get("town")
        or addr.get("village")
        or addr.get("hamlet")
        or addr.get("county")
        or addr.get("municipality")
    )
    state = addr.get("ISO3166-2-lvl4") or addr.get("state")
    if isinstance(state, str) and state.startswith("US-"):
        state = state.replace("US-", "")
    if city and state:
        return f"{city}, {state}"
    display = item.get("display_name") or "Unknown location"
    parts = [p.strip() for p in display.split(",")]
    if len(parts) >= 2:
        return f"{parts[0]}, {parts[1]}"
    return parts[0]


def geocode_one(query: str) -> dict[str, Any]:
    query = (query or "").strip()
    if not query:
        raise ValueError("Location is required.")
    data = _nominatim_get(
        "/search",
        {
            "q": query,
            "format": "json",
            "addressdetails": 1,
            "limit": 1,
        },
    )
    if not data:
        raise ValueError(f'Could not find "{query}". Try a city and state, e.g. "Dallas, TX".')
    item = data[0]
    return {
        "query": query,
        "lat": float(item["lat"]),
        "lng": float(item["lon"]),
        "label": _short_name(item),
        "display_name": item.get("display_name") or _short_name(item),
    }


def suggest(query: str, limit: int = 5) -> list[dict[str, Any]]:
    query = (query or "").strip()
    if len(query) < 2:
        return []
    data = _nominatim_get(
        "/search",
        {
            "q": query,
            "format": "json",
            "addressdetails": 1,
            "limit": limit,
        },
    )
    results = []
    seen: set[str] = set()
    for item in data:
        label = _short_name(item)
        key = label.lower()
        if key in seen:
            continue
        seen.add(key)
        results.append(
            {
                "label": label,
                "display_name": item.get("display_name") or label,
                "lat": float(item["lat"]),
                "lng": float(item["lon"]),
            }
        )
    return results


def reverse_geocode(lat: float, lng: float) -> str:
    try:
        item = _nominatim_get(
            "/reverse",
            {
                "lat": lat,
                "lon": lng,
                "format": "json",
                "addressdetails": 1,
                "zoom": 10,
            },
        )
        if not item or item.get("error"):
            return f"{lat:.3f}, {lng:.3f}"
        return _short_name(item)
    except Exception:
        return f"{lat:.3f}, {lng:.3f}"


def haversine_miles(lng1: float, lat1: float, lng2: float, lat2: float) -> float:
    rlat1, rlat2 = math.radians(lat1), math.radians(lat2)
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat / 2) ** 2 + math.cos(rlat1) * math.cos(rlat2) * math.sin(dlng / 2) ** 2
    return EARTH_MILES * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def cumulative_miles(coords: list[list[float]]) -> list[float]:
    miles = [0.0]
    for i in range(1, len(coords)):
        miles.append(
            miles[-1]
            + haversine_miles(coords[i - 1][0], coords[i - 1][1], coords[i][0], coords[i][1])
        )
    return miles


def point_at_miles(coords: list[list[float]], miles: list[float], target: float) -> list[float]:
    if not coords:
        return [0.0, 0.0]
    if target <= 0:
        return coords[0]
    if target >= miles[-1]:
        return coords[-1]
    for i in range(1, len(miles)):
        if miles[i] >= target:
            span = miles[i] - miles[i - 1]
            t = 0.0 if span <= 0 else (target - miles[i - 1]) / span
            lon = coords[i - 1][0] + t * (coords[i][0] - coords[i - 1][0])
            lat = coords[i - 1][1] + t * (coords[i][1] - coords[i - 1][1])
            return [lon, lat]
    return coords[-1]


def _scale_distances(coords: list[list[float]], actual_miles: float) -> list[float]:
    raw = cumulative_miles(coords)
    if raw[-1] <= 0:
        return raw
    scale = actual_miles / raw[-1]
    return [d * scale for d in raw]


def route_leg(start: dict[str, Any], end: dict[str, Any]) -> dict[str, Any]:
    coords = f"{start['lng']},{start['lat']};{end['lng']},{end['lat']}"
    try:
        response = requests.get(
            f"{OSRM_URL}/{coords}",
            params={"overview": "full", "geometries": "geojson"},
            timeout=25,
        )
        payload = response.json()
        if response.status_code != 200 or payload.get("code") != "Ok":
            raise RuntimeError(payload.get("message") or "OSRM routing failed")
        route = payload["routes"][0]
        geometry = route["geometry"]["coordinates"]
        distance_miles = route["distance"] / 1609.344
        duration_hours = route["duration"] / 3600.0
        # Truck traffic moves slower than the car profile.
        duration_hours *= 1.12
        distances = _scale_distances(geometry, distance_miles)
        return {
            "from": start,
            "to": end,
            "distance_miles": distance_miles,
            "duration_hours": duration_hours,
            "geometry": geometry,
            "distances": distances,
        }
    except Exception:
        distance_miles = haversine_miles(start["lng"], start["lat"], end["lng"], end["lat"]) * 1.18
        duration_hours = max(distance_miles / 55.0, 0.1)
        geometry = [[start["lng"], start["lat"]], [end["lng"], end["lat"]]]
        return {
            "from": start,
            "to": end,
            "distance_miles": distance_miles,
            "duration_hours": duration_hours,
            "geometry": geometry,
            "distances": [0.0, distance_miles],
            "fallback": True,
        }
