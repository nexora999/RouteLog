from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any

STATUS_ORDER = ["off_duty", "sleeper", "driving", "on_duty"]


def _parse(value: str) -> datetime:
    return datetime.fromisoformat(value)


def _hour_of_day(dt: datetime) -> float:
    return dt.hour + dt.minute / 60.0 + dt.second / 3600.0


def _round_hours(value: float) -> float:
    return round(value + 1e-9, 2)


def _slice_event(event: dict[str, Any], start: datetime, end: datetime) -> dict[str, Any] | None:
    event_start = _parse(event["start"])
    event_end = _parse(event["end"])
    clipped_start = max(event_start, start)
    clipped_end = min(event_end, end)
    if clipped_end <= clipped_start:
        return None
    duration = (clipped_end - clipped_start).total_seconds() / 3600.0
    miles = 0.0
    full = (event_end - event_start).total_seconds() / 3600.0
    if event.get("miles") and full > 0:
        miles = event["miles"] * (duration / full)
    return {
        **event,
        "start": clipped_start.isoformat(timespec="seconds"),
        "end": clipped_end.isoformat(timespec="seconds"),
        "duration_hours": _round_hours(duration),
        "miles": round(miles, 1),
        "start_hour": round(_hour_of_day(clipped_start), 4),
        "end_hour": round(_hour_of_day(clipped_end) if clipped_end.time() != datetime.min.time() else 24.0, 4),
    }


def _merge_segments(segments: list[dict[str, Any]]) -> list[dict[str, Any]]:
    merged: list[dict[str, Any]] = []
    for seg in segments:
        if (
            merged
            and merged[-1]["status"] == seg["status"]
            and abs(merged[-1]["end_hour"] - seg["start_hour"]) < 0.02
        ):
            merged[-1]["end"] = seg["end"]
            merged[-1]["end_hour"] = seg["end_hour"]
            merged[-1]["duration_hours"] = _round_hours(
                merged[-1]["duration_hours"] + seg["duration_hours"]
            )
            merged[-1]["miles"] = round(merged[-1].get("miles", 0) + seg.get("miles", 0), 1)
            if seg.get("remark") and seg["remark"] not in (merged[-1].get("remark") or ""):
                merged[-1]["remark"] = seg["remark"]
        else:
            merged.append(dict(seg))
    return merged


def _fix_totals(totals: dict[str, float]) -> dict[str, float]:
    values = {k: max(0.0, _round_hours(v)) for k, v in totals.items()}
    drift = round(24.0 - sum(values.values()), 2)
    if abs(drift) >= 0.01:
        # Prefer adjusting off-duty so the day still closes at 24 hours.
        values["off_duty"] = _round_hours(values.get("off_duty", 0) + drift)
        if values["off_duty"] < 0:
            values["sleeper"] = _round_hours(values["sleeper"] + values["off_duty"])
            values["off_duty"] = 0.0
    return {k: _round_hours(values.get(k, 0)) for k in STATUS_ORDER}


def build_daily_logs(
    events: list[dict[str, Any]],
    meta: dict[str, Any],
) -> list[dict[str, Any]]:
    if not events:
        return []

    first = _parse(events[0]["start"]).replace(hour=0, minute=0, second=0, microsecond=0)
    last = _parse(events[-1]["end"])
    last_day = last.replace(hour=0, minute=0, second=0, microsecond=0)
    if last.time() == datetime.min.time():
        last_day -= timedelta(days=1)

    logs: list[dict[str, Any]] = []
    day = first
    sheet = 1
    while day <= last_day:
        day_end = day + timedelta(days=1)
        raw = [s for e in events if (s := _slice_event(e, day, day_end))]
        segments = _merge_segments(raw)
        if segments:
            if segments[0]["start_hour"] > 0.02:
                segments.insert(
                    0,
                    {
                        "status": "off_duty",
                        "start": day.isoformat(timespec="seconds"),
                        "end": segments[0]["start"],
                        "duration_hours": _round_hours(segments[0]["start_hour"]),
                        "miles": 0.0,
                        "start_hour": 0.0,
                        "end_hour": segments[0]["start_hour"],
                        "location": segments[0].get("location") or "",
                        "remark": "",
                    },
                )
            if segments[-1]["end_hour"] < 23.98:
                segments.append(
                    {
                        "status": "off_duty",
                        "start": segments[-1]["end"],
                        "end": day_end.isoformat(timespec="seconds"),
                        "duration_hours": _round_hours(24.0 - segments[-1]["end_hour"]),
                        "miles": 0.0,
                        "start_hour": segments[-1]["end_hour"],
                        "end_hour": 24.0,
                        "location": segments[-1].get("location") or "",
                        "remark": "",
                    },
                )

        totals = {status: 0.0 for status in STATUS_ORDER}
        miles = 0.0
        remarks: list[dict[str, Any]] = []
        from_place = meta.get("current_label") or ""
        to_place = meta.get("dropoff_label") or ""
        cycle_after = meta.get("cycle_used_start", 0)
        locations: list[str] = []

        for seg in segments:
            totals[seg["status"]] = totals.get(seg["status"], 0) + seg["duration_hours"]
            miles += seg.get("miles") or 0
            cycle_after = seg.get("cycle_after", cycle_after)
            if seg.get("location"):
                locations.append(seg["location"])
            if seg.get("remark") and (
                seg.get("stop_type")
                or seg["status"] in {"sleeper", "on_duty"}
                or "break" in (seg.get("remark") or "").lower()
                or "restart" in (seg.get("remark") or "").lower()
            ):
                remarks.append(
                    {
                        "time": seg["start"][11:16],
                        "hour": seg["start_hour"],
                        "end_hour": seg["end_hour"],
                        "duration_hours": seg["duration_hours"],
                        "text": seg["remark"],
                        "status": seg["status"],
                    }
                )

        if locations:
            from_place = locations[0]
            to_place = locations[-1]
            for loc in locations:
                if loc and not loc.lower().startswith("en route"):
                    from_place = loc
                    break
            for loc in reversed(locations):
                if loc and not loc.lower().startswith("en route"):
                    to_place = loc
                    break

        totals = _fix_totals(totals)
        on_duty_today = _round_hours(totals["driving"] + totals["on_duty"])
        recap_a = _round_hours(cycle_after)
        recap_b = _round_hours(max(0.0, 70.0 - recap_a))

        logs.append(
            {
                "sheet": sheet,
                "date": day.strftime("%Y-%m-%d"),
                "month": day.strftime("%m"),
                "day": day.strftime("%d"),
                "year": day.strftime("%Y"),
                "from": from_place,
                "to": to_place,
                "total_miles_driving": round(miles, 1),
                "total_mileage": round(miles, 1),
                "segments": [
                    {
                        "status": s["status"],
                        "start_hour": s["start_hour"],
                        "end_hour": 24.0 if abs(s["end_hour"]) < 0.001 else s["end_hour"],
                        "duration_hours": s["duration_hours"],
                        "remark": s.get("remark") or "",
                    }
                    for s in segments
                ],
                "totals": totals,
                "on_duty_today": on_duty_today,
                "remarks": remarks,
                "recap": {
                    "on_duty_today": on_duty_today,
                    "a": recap_a,
                    "b": recap_b,
                    "c": recap_a,
                },
                "carrier": meta.get("carrier") or {},
            }
        )
        sheet += 1
        day += timedelta(days=1)

    return logs
