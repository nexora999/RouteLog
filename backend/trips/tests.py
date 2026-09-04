from datetime import datetime
from unittest.mock import patch

from django.test import SimpleTestCase

from trips.services.hos import DRIVING, ON_DUTY, OFF_DUTY, SLEEPER, plan_schedule
from trips.services.logs import build_daily_logs


def _place(label, lat, lng):
    return {"label": label, "lat": lat, "lng": lng}


def _leg(start, end, miles, hours):
    return {
        "from": start,
        "to": end,
        "distance_miles": miles,
        "duration_hours": hours,
        "geometry": [[start["lng"], start["lat"]], [end["lng"], end["lat"]]],
        "distances": [0.0, miles],
    }


class HOSPlannerTests(SimpleTestCase):
    def setUp(self):
        patcher = patch("trips.services.hos.reverse_geocode", side_effect=lambda lat, lng: f"{lat:.2f},{lng:.2f}")
        self.addCleanup(patcher.stop)
        patcher.start()

    def test_pickup_and_dropoff_are_one_hour_on_duty(self):
        current = _place("Dallas, TX", 32.78, -96.8)
        pickup = _place("Memphis, TN", 35.15, -90.05)
        dropoff = _place("Atlanta, GA", 33.75, -84.39)
        schedule = plan_schedule(
            current,
            pickup,
            dropoff,
            _leg(current, pickup, 450, 8.0),
            _leg(pickup, dropoff, 380, 6.5),
            cycle_used=10,
            start_at=datetime(2026, 9, 3, 6, 0),
        )
        on_duty = [e for e in schedule["events"] if e["status"] == ON_DUTY]
        pickups = [e for e in on_duty if e.get("stop_type") == "pickup"]
        dropoffs = [e for e in on_duty if e.get("stop_type") == "dropoff"]
        self.assertEqual(len(pickups), 1)
        self.assertEqual(len(dropoffs), 1)
        self.assertAlmostEqual(pickups[0]["duration_hours"], 1.0, places=2)
        self.assertAlmostEqual(dropoffs[0]["duration_hours"], 1.0, places=2)

    def test_long_drive_inserts_break_and_sleeper(self):
        current = _place("Newark, NJ", 40.7, -74.2)
        pickup = _place("Chicago, IL", 41.88, -87.63)
        dropoff = _place("Los Angeles, CA", 34.05, -118.24)
        schedule = plan_schedule(
            current,
            pickup,
            dropoff,
            _leg(current, pickup, 790, 14.0),
            _leg(pickup, dropoff, 2015, 36.0),
            cycle_used=8,
            start_at=datetime(2026, 9, 3, 6, 0),
        )
        statuses = {e["status"] for e in schedule["events"]}
        self.assertIn(DRIVING, statuses)
        self.assertIn(SLEEPER, statuses)
        self.assertTrue(any(e.get("stop_type") == "break" for e in schedule["events"]))
        self.assertGreaterEqual(schedule["total_miles"], 2000)
        self.assertTrue(any(e.get("stop_type") == "fuel" for e in schedule["events"]))

    def test_daily_logs_sum_to_24_hours(self):
        current = _place("Atlanta, GA", 33.75, -84.39)
        pickup = _place("Jacksonville, FL", 30.33, -81.66)
        dropoff = _place("Miami, FL", 25.76, -80.19)
        schedule = plan_schedule(
            current,
            pickup,
            dropoff,
            _leg(current, pickup, 346, 6.0),
            _leg(pickup, dropoff, 348, 6.2),
            cycle_used=20,
            start_at=datetime(2026, 9, 3, 6, 0),
        )
        logs = build_daily_logs(
            schedule["events"],
            {
                "current_label": current["label"],
                "dropoff_label": dropoff["label"],
                "cycle_used_start": 20,
                "carrier": {},
            },
        )
        self.assertGreaterEqual(len(logs), 1)
        for sheet in logs:
            total = sum(sheet["totals"].values())
            self.assertAlmostEqual(total, 24.0, places=1)
            self.assertIn(OFF_DUTY, sheet["totals"])
