import os
from syllabus_pilot.tools.checks import check_items
from syllabus_pilot.tools.dates import normalize_date
from syllabus_pilot.tools.planner import build_plan
from syllabus_pilot.tools.calendar import make_ics

FAKE_ITEMS = [
    {"name": "Homework Sets", "type": "assignment", "due_date": "2026-10-01", "weight": 20},
    {"name": "Midterm exam", "type": "exam", "due_date": "2026-10-21", "weight": 30},
    {"name": "Term Paper", "type": "paper", "due_date": "2026-12-01", "weight": 20},
    {"name": "Final exam", "type": "exam", "due_date": "2026-12-14", "weight": 30},
]


def test_check_items():
    res = check_items(FAKE_ITEMS)
    assert res["valid"] is True
    assert res["total_weight"] == 100.0
    assert res["item_count"] == 4

    # Test invalid total weight warning
    invalid_items = [{"name": "Quiz 1", "type": "quiz", "due_date": "2026-09-15", "weight": 40}]
    bad_res = check_items(invalid_items)
    assert bad_res["valid"] is False
    assert len(bad_res["warnings"]) > 0


def test_normalize_date():
    # ISO dates
    assert normalize_date("2026-11-16") == "2026-11-16"
    # Ordinal dates
    assert normalize_date("Oct 3rd, 2026") == "2026-10-03"
    assert normalize_date("Sept 24th") == "2026-09-24"
    # Day Month format
    assert normalize_date("18 Nov") == "2026-11-18"
    assert normalize_date("2 Dec 2026") == "2026-12-02"
    # Week relative
    assert normalize_date("Week 3", semester_start="2026-09-01") == "2026-09-15"
    # Unknown / TBA
    assert normalize_date("TBA") is None
    assert normalize_date("Throughout semester") is None


def test_build_plan():
    sessions = build_plan(FAKE_ITEMS, hours_per_week=6, start_date="2026-09-01")
    assert len(sessions) > 0
    # Every session has title, date, hours, description
    for s in sessions:
        assert "title" in s
        assert "date" in s
        assert "hours" in s
        assert "description" in s
        assert s["hours"] > 0


def test_make_ics(tmp_path):
    test_sessions = [
        {"title": "Study: Midterm Exam", "date": "2026-10-18", "hours": 2.0, "description": "Chapters 1-5"},
        {"title": "Study: Final Exam", "date": "2026-12-10", "hours": 2.5, "description": "Practice exams"},
    ]
    out_file = tmp_path / "plan.ics"
    saved_path = make_ics(test_sessions, filename=str(out_file))
    assert os.path.exists(saved_path)

    with open(saved_path, "r", encoding="utf-8") as f:
        content = f.read()

    assert "BEGIN:VCALENDAR" in content
    assert "SUMMARY:Study: Midterm Exam" in content
    assert "BEGIN:VALARM" in content
    assert "END:VCALENDAR" in content


# --- Added: checks for the bug fixes ---
import json
from collections import defaultdict
from datetime import datetime, timedelta


def test_build_plan_respects_weekly_hours():
    items = [
        {"name": "Midterm", "type": "exam", "due_date": "2026-12-10", "weight": 30},
        {"name": "Paper", "type": "paper", "due_date": "2026-12-11", "weight": 30},
        {"name": "Final", "type": "exam", "due_date": "2026-12-12", "weight": 40},
    ]
    sessions = build_plan(items, hours_per_week=2, start_date="2026-11-30")
    per_week = defaultdict(float)
    for s in sessions:
        day = datetime.strptime(s["date"], "%Y-%m-%d")
        per_week[day - timedelta(days=day.weekday())] += s["hours"]
        assert s["date"] >= "2026-11-30"
    assert sessions, "should still plan something"
    assert all(h <= 2 for h in per_week.values())


def test_build_plan_never_after_due_date():
    sessions = build_plan(FAKE_ITEMS, hours_per_week=6, start_date="2026-09-01")
    due = {i["name"]: i["due_date"] for i in FAKE_ITEMS}
    for s in sessions:
        name = s["title"].replace("Study: ", "").split(" (Part")[0]
        assert s["date"] <= due[name]


def test_build_plan_skips_undated_items():
    items = FAKE_ITEMS + [{"name": "Weekly homework", "type": "assignment", "due_date": None, "weight": 10}]
    assert all("Weekly homework" not in s["title"] for s in build_plan(items, 6, "2026-09-01"))


def test_normalize_date_messy_inputs():
    assert normalize_date("Due Sept. 24, 2026") == "2026-09-24"
    assert normalize_date("Wednesday, October 21, 2026") == "2026-10-21"
    assert normalize_date("Tuesday, December 01, 2026 at 5:00 PM") == "2026-12-01"
    assert normalize_date("Nov 5 by 11:59 PM") == "2026-11-05"
    assert normalize_date("Oct 3", semester_start="2027-01-10") == "2027-10-03"


def test_make_ics_start_time_deadlines_and_escaping(tmp_path):
    sessions = [{"title": "Study: Lab 1", "date": "2026-09-20", "hours": 1.5,
                 "description": "Read ch. 1, 2; do exercises"}]
    deadlines = [{"name": "Lab 1", "due_date": "2026-09-24", "weight": 5},
                 {"name": "Quizzes", "due_date": None, "weight": 10}]
    path = make_ics(sessions, filename=str(tmp_path / "p.ics"),
                    default_start_time="09:00", deadlines=deadlines)
    raw = open(path, "rb").read()
    text = raw.decode("utf-8")
    assert b"\r\r\n" not in raw  # no doubled line endings
    assert "DTSTART:20260920T090000" in text
    assert "DTEND:20260920T103000" in text
    assert "Read ch. 1\\, 2\; do exercises" in text
    assert "DTSTART;VALUE=DATE:20260924" in text
    assert "TRIGGER:-P1D" in text
    assert text.count("BEGIN:VEVENT") == 2  # undated deadline skipped


def test_expected_json_is_valid():
    root = os.path.dirname(os.path.dirname(__file__))
    data = json.load(open(os.path.join(root, "samples", "expected.json"), encoding="utf-8"))
    for sample in data:
        assert os.path.exists(os.path.join(root, "samples", sample["sample"]))
        assert abs(sum(i["weight"] for i in sample["expected_items"]) - 100) < 0.5
        assert check_items(sample["expected_items"])["total_weight"] == 100.0
