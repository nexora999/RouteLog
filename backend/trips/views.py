from __future__ import annotations

from datetime import datetime
from typing import Any

from rest_framework.decorators import api_view
from rest_framework.response import Response

from .services.geo import geocode_one, route_leg, suggest
from .services.hos import plan_schedule
from .services.logs import build_daily_logs

DEFAULT_CARRIER = {
    "name": "FleetLine Transport",
    "main_office": "100 Terminal Way, Dallas, TX 75201",
    "home_terminal": "100 Terminal Way, Dallas, TX 75201",
    "truck": "Unit 4821 / Trailer 1904",
    "driver": "A. Driver",
}


def _error(message: str, status: int = 400) -> Response:
    return Response({"error": message}, status=status)


@api_view(["GET"])
def health(_request) -> Response:
    return Response({"ok": True, "service": "routelog"})


@api_view(["GET"])
def geocode(request) -> Response:
    query = request.query_params.get("q", "")
    try:
        return Response({"results": suggest(query)})
    except Exception as exc:
        return _error(str(exc), status=502)


@api_view(["POST"])
def plan_trip(request) -> Response:
    body = request.data if isinstance(request.data, dict) else {}
    current_q = (body.get("current_location") or "").strip()
    pickup_q = (body.get("pickup_location") or "").strip()
    dropoff_q = (body.get("dropoff_location") or "").strip()

    if not current_q or not pickup_q or not dropoff_q:
        return _error("Current, pickup, and dropoff locations are required.")

    try:
        cycle_used = float(body.get("current_cycle_used", 0))
    except (TypeError, ValueError):
        return _error("Current cycle used must be a number between 0 and 70.")

    if cycle_used < 0 or cycle_used > 70:
        return _error("Current cycle used must be between 0 and 70 hours.")

    carrier = {**DEFAULT_CARRIER, **(body.get("carrier") or {})}

    try:
        current = geocode_one(current_q)
        pickup = geocode_one(pickup_q)
        dropoff = geocode_one(dropoff_q)
    except ValueError as exc:
        return _error(str(exc))
    except Exception:
        return _error("Geocoding service is unavailable. Please try again in a moment.", 502)

    current_to_pickup = route_leg(current, pickup)
    pickup_to_dropoff = route_leg(pickup, dropoff)

    start_at = datetime.now().replace(hour=6, minute=0, second=0, microsecond=0)
    start_raw = body.get("start_time")
    if start_raw:
        try:
            start_at = datetime.fromisoformat(str(start_raw))
        except ValueError:
            pass

    schedule = plan_schedule(
        current,
        pickup,
        dropoff,
        current_to_pickup,
        pickup_to_dropoff,
        cycle_used,
        start_at,
    )

    geometry = current_to_pickup["geometry"] + pickup_to_dropoff["geometry"][1:]
    total_miles = current_to_pickup["distance_miles"] + pickup_to_dropoff["distance_miles"]
    road_hours = current_to_pickup["duration_hours"] + pickup_to_dropoff["duration_hours"]

    logs = build_daily_logs(
        schedule["events"],
        {
            "current_label": current["label"],
            "pickup_label": pickup["label"],
            "dropoff_label": dropoff["label"],
            "cycle_used_start": cycle_used,
            "carrier": carrier,
        },
    )

    payload: dict[str, Any] = {
        "inputs": {
            "current_location": current,
            "pickup_location": pickup,
            "dropoff_location": dropoff,
            "current_cycle_used": cycle_used,
            "start_time": start_at.isoformat(timespec="minutes"),
        },
        "carrier": carrier,
        "route": {
            "distance_miles": round(total_miles, 1),
            "duration_hours": round(road_hours, 2),
            "geometry": geometry,
            "legs": [
                {
                    "label": "Current → Pickup",
                    "from": current["label"],
                    "to": pickup["label"],
                    "distance_miles": round(current_to_pickup["distance_miles"], 1),
                    "duration_hours": round(current_to_pickup["duration_hours"], 2),
                },
                {
                    "label": "Pickup → Dropoff",
                    "from": pickup["label"],
                    "to": dropoff["label"],
                    "distance_miles": round(pickup_to_dropoff["distance_miles"], 1),
                    "duration_hours": round(pickup_to_dropoff["duration_hours"], 2),
                },
            ],
            "stops": schedule["stops"],
        },
        "hos": {
            "cycle_used_start": schedule["cycle_used_start"],
            "cycle_used_end": schedule["cycle_used_end"],
            "hours_available_end": schedule["hours_available_end"],
            "driving_hours": schedule["driving_hours"],
            "on_duty_hours": schedule["on_duty_hours"],
            "days": len(logs),
            "rules": schedule["rules"],
        },
        "logs": logs,
        "events": schedule["events"],
    }
    return Response(payload)
