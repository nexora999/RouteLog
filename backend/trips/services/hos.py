from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any

from .geo import point_at_miles, reverse_geocode

# FMCSA property-carrying HOS (49 CFR 395.3) — 70/8 cycle
MAX_DRIVE_HOURS = 11.0
MAX_WINDOW_HOURS = 14.0
BREAK_AFTER_DRIVE = 8.0
BREAK_HOURS = 0.5
DAILY_RESET_HOURS = 10.0
CYCLE_LIMIT = 70.0
RESTART_HOURS = 34.0
PICKUP_HOURS = 1.0
DROPOFF_HOURS = 1.0
FUEL_INTERVAL_MILES = 1000.0
FUEL_HOURS = 0.5
MIN_DRIVE_HOURS = 0.08

OFF_DUTY = "off_duty"
SLEEPER = "sleeper"
DRIVING = "driving"
ON_DUTY = "on_duty"


def hours_between(start: datetime, end: datetime) -> float:
    return (end - start).total_seconds() / 3600.0


class HOSPlanner:
    """Build a legal property-carrying schedule for a current → pickup → dropoff trip."""

    def __init__(self, cycle_used: float, start_at: datetime):
        self.t = start_at
        self.cycle = max(0.0, min(cycle_used, CYCLE_LIMIT))
        self.cycle_start = self.cycle
        self.window_start: datetime | None = None
        self.driving_in_shift = 0.0
        self.driving_since_break = 0.0
        self.miles_since_fuel = 0.0
        self.total_miles = 0.0
        self.events: list[dict[str, Any]] = []
        self.stops: list[dict[str, Any]] = []

    def _iso(self, dt: datetime) -> str:
        return dt.replace(microsecond=0).isoformat()

    def _add_stop(
        self,
        kind: str,
        title: str,
        location: str,
        lat: float,
        lng: float,
        duration_hours: float,
        remark: str,
        miles: float | None = None,
    ) -> None:
        self.stops.append(
            {
                "type": kind,
                "title": title,
                "location": location,
                "lat": lat,
                "lng": lng,
                "time": self._iso(self.t),
                "duration_hours": round(duration_hours, 2),
                "remark": remark,
                "miles_from_start": round(self.total_miles if miles is None else miles, 1),
            }
        )

    def add_event(
        self,
        status: str,
        duration_hours: float,
        location: str,
        lat: float,
        lng: float,
        remark: str,
        stop_type: str | None = None,
        miles: float = 0.0,
        extra: dict[str, Any] | None = None,
    ) -> None:
        if duration_hours <= 0.001:
            return
        start = self.t
        end = self.t + timedelta(hours=duration_hours)
        if status in {DRIVING, ON_DUTY}:
            if self.window_start is None:
                self.window_start = start
            self.cycle += duration_hours
        if status == DRIVING:
            self.driving_in_shift += duration_hours
            self.driving_since_break += duration_hours
            self.miles_since_fuel += miles
            self.total_miles += miles
        # Any 30+ minute non-driving period resets the 8-hour driving-break clock.
        if status in {OFF_DUTY, SLEEPER, ON_DUTY} and duration_hours >= 0.5:
            self.driving_since_break = 0.0
        # 10 consecutive hours off duty / sleeper starts a new 14-hour window.
        if status in {OFF_DUTY, SLEEPER} and duration_hours >= DAILY_RESET_HOURS - 0.01:
            self.window_start = None
            self.driving_in_shift = 0.0
            self.driving_since_break = 0.0
        if status in {OFF_DUTY, SLEEPER} and duration_hours >= RESTART_HOURS - 0.01:
            self.cycle = 0.0

        payload = {
            "status": status,
            "start": self._iso(start),
            "end": self._iso(end),
            "duration_hours": round(duration_hours, 3),
            "location": location,
            "lat": round(lat, 5),
            "lng": round(lng, 5),
            "remark": remark,
            "miles": round(miles, 1),
            "cycle_after": round(self.cycle, 2),
            "stop_type": stop_type,
        }
        if extra:
            payload.update(extra)
        self.events.append(payload)
        self.t = end

    def window_elapsed(self) -> float:
        if self.window_start is None:
            return 0.0
        return hours_between(self.window_start, self.t)

    def drive_capacity(self) -> float:
        caps = [
            BREAK_AFTER_DRIVE - self.driving_since_break,
            MAX_DRIVE_HOURS - self.driving_in_shift,
            CYCLE_LIMIT - self.cycle,
        ]
        if self.window_start is not None:
            caps.append(MAX_WINDOW_HOURS - self.window_elapsed())
        else:
            caps.append(MAX_WINDOW_HOURS)
        return max(0.0, min(caps))

    def _named_place(self, lat: float, lng: float, location: str, reverse: bool = False) -> str:
        if location and not location.lower().startswith("en route"):
            return location
        if reverse:
            return reverse_geocode(lat, lng)
        return f"Mile {int(self.total_miles)}"

    def add_break(self, lat: float, lng: float, location: str) -> None:
        place = self._named_place(lat, lng, location)
        self._add_stop(
            "break",
            "30-minute break",
            place,
            lat,
            lng,
            BREAK_HOURS,
            "30-minute off-duty break (8-hour driving rule)",
        )
        self.add_event(
            OFF_DUTY,
            BREAK_HOURS,
            place,
            lat,
            lng,
            f"30-min break — {place}",
            stop_type="break",
        )

    def add_daily_rest(self, lat: float, lng: float, location: str) -> None:
        place = self._named_place(lat, lng, location, reverse=True)
        self._add_stop(
            "rest",
            "10-hour rest",
            place,
            lat,
            lng,
            DAILY_RESET_HOURS,
            "10 consecutive hours in sleeper berth — new 11/14 window",
        )
        self.add_event(
            SLEEPER,
            DAILY_RESET_HOURS,
            place,
            lat,
            lng,
            f"10-hr sleeper berth — {place}",
            stop_type="rest",
        )

    def add_restart(self, lat: float, lng: float, location: str) -> None:
        place = self._named_place(lat, lng, location, reverse=True)
        self._add_stop(
            "restart",
            "34-hour restart",
            place,
            lat,
            lng,
            RESTART_HOURS,
            "34 consecutive hours off duty — 70-hour cycle reset",
        )
        self.add_event(
            OFF_DUTY,
            RESTART_HOURS,
            place,
            lat,
            lng,
            f"34-hour restart — {place}",
            stop_type="restart",
        )

    def ensure_can_drive(self, lat: float, lng: float, location: str) -> None:
        for _ in range(12):
            if self.cycle >= CYCLE_LIMIT - 0.05:
                self.add_restart(lat, lng, location)
                continue
            if self.driving_in_shift >= MAX_DRIVE_HOURS - 0.05:
                self.add_daily_rest(lat, lng, location)
                continue
            if self.window_start is not None and self.window_elapsed() >= MAX_WINDOW_HOURS - 0.05:
                self.add_daily_rest(lat, lng, location)
                continue
            if self.driving_since_break >= BREAK_AFTER_DRIVE - 0.05:
                self.add_break(lat, lng, location)
                continue
            break

    def _slice_position(self, leg: dict[str, Any], miles_into: float) -> tuple[float, float, str]:
        point = point_at_miles(leg["geometry"], leg["distances"], miles_into)
        lng, lat = point[0], point[1]
        if miles_into <= 2:
            return lat, lng, leg["from"]["label"]
        if miles_into >= leg["distance_miles"] - 2:
            return lat, lng, leg["to"]["label"]
        return lat, lng, f"En route to {leg['to']['label']}"

    def drive_leg(self, leg: dict[str, Any]) -> None:
        remaining_miles = leg["distance_miles"]
        if remaining_miles < 0.4:
            return
        speed = remaining_miles / leg["duration_hours"] if leg["duration_hours"] > 0 else 55.0
        speed = max(speed, 20.0)
        miles_into = 0.0
        dest = leg["to"]["label"]

        while remaining_miles > 0.35:
            lat, lng, loc = self._slice_position(leg, miles_into)
            self.ensure_can_drive(lat, lng, loc)

            cap = self.drive_capacity()
            miles_to_fuel = FUEL_INTERVAL_MILES - self.miles_since_fuel
            hours_to_fuel = miles_to_fuel / speed if speed else cap
            hours_left = remaining_miles / speed
            slice_h = min(cap, hours_to_fuel, hours_left)

            if slice_h < MIN_DRIVE_HOURS:
                lat, lng, loc = self._slice_position(leg, miles_into)
                self.ensure_can_drive(lat, lng, loc)
                if self.drive_capacity() < MIN_DRIVE_HOURS:
                    self.add_daily_rest(lat, lng, loc)
                continue

            slice_m = min(slice_h * speed, remaining_miles)
            slice_h = slice_m / speed
            lat, lng, loc = self._slice_position(leg, miles_into)
            self.add_event(
                DRIVING,
                slice_h,
                loc,
                lat,
                lng,
                f"Driving toward {dest}",
                miles=slice_m,
            )
            miles_into += slice_m
            remaining_miles -= slice_m

            if self.miles_since_fuel >= FUEL_INTERVAL_MILES - 1:
                lat, lng, _ = self._slice_position(leg, miles_into)
                place = reverse_geocode(lat, lng)
                self._add_stop(
                    "fuel",
                    "Fuel stop",
                    place,
                    lat,
                    lng,
                    FUEL_HOURS,
                    "On-duty fueling — required at least once every 1,000 miles",
                )
                self.add_event(
                    ON_DUTY,
                    FUEL_HOURS,
                    place,
                    lat,
                    lng,
                    f"Fuel stop — {place}",
                    stop_type="fuel",
                )
                self.miles_since_fuel = 0.0

    def on_duty_stop(
        self,
        kind: str,
        hours: float,
        place: dict[str, Any],
        remark: str,
        title: str,
    ) -> None:
        self._add_stop(
            kind,
            title,
            place["label"],
            place["lat"],
            place["lng"],
            hours,
            remark,
        )
        self.add_event(
            ON_DUTY,
            hours,
            place["label"],
            place["lat"],
            place["lng"],
            remark,
            stop_type=kind,
        )


def plan_schedule(
    current: dict[str, Any],
    pickup: dict[str, Any],
    dropoff: dict[str, Any],
    current_to_pickup: dict[str, Any],
    pickup_to_dropoff: dict[str, Any],
    cycle_used: float,
    start_at: datetime,
) -> dict[str, Any]:
    planner = HOSPlanner(cycle_used, start_at.replace(hour=0, minute=0, second=0, microsecond=0))

    day_start = planner.t
    if start_at > day_start:
        planner.add_event(
            OFF_DUTY,
            hours_between(day_start, start_at),
            current["label"],
            current["lat"],
            current["lng"],
            f"Off duty — {current['label']}",
        )

    planner._add_stop(
        "current",
        "Current location",
        current["label"],
        current["lat"],
        current["lng"],
        0,
        "Trip origin / current vehicle position",
        miles=0,
    )

    planner.drive_leg(current_to_pickup)
    planner.on_duty_stop(
        "pickup",
        PICKUP_HOURS,
        pickup,
        f"Pickup — 1 hour on duty at {pickup['label']}",
        "Pickup (1 hour)",
    )
    planner.drive_leg(pickup_to_dropoff)
    planner.on_duty_stop(
        "dropoff",
        DROPOFF_HOURS,
        dropoff,
        f"Drop-off — 1 hour on duty at {dropoff['label']}",
        "Drop-off (1 hour)",
    )

    # Complete the last log sheet through midnight.
    end_midnight = (planner.t + timedelta(days=1)).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    remaining = hours_between(planner.t, end_midnight)
    if remaining > 0.01:
        planner.add_event(
            OFF_DUTY,
            remaining,
            dropoff["label"],
            dropoff["lat"],
            dropoff["lng"],
            f"Off duty after release — {dropoff['label']}",
        )

    driving_hours = sum(e["duration_hours"] for e in planner.events if e["status"] == DRIVING)
    on_duty_hours = sum(
        e["duration_hours"] for e in planner.events if e["status"] in {DRIVING, ON_DUTY}
    )

    return {
        "events": planner.events,
        "stops": planner.stops,
        "cycle_used_start": round(cycle_used, 2),
        "cycle_used_end": round(planner.cycle, 2),
        "hours_available_end": round(max(0.0, CYCLE_LIMIT - planner.cycle), 2),
        "total_miles": round(planner.total_miles, 1),
        "driving_hours": round(driving_hours, 2),
        "on_duty_hours": round(on_duty_hours, 2),
        "rules": {
            "cycle": "70 hours / 8 days",
            "driving_limit": "11 hours",
            "duty_window": "14 hours",
            "break": "30 minutes after 8 hours driving",
            "daily_reset": "10 consecutive hours off duty / sleeper",
            "restart": "34 consecutive hours off duty",
            "pickup_dropoff": "1 hour on duty each",
            "fuel": "30 minutes on duty at least once every 1,000 miles",
        },
    }
