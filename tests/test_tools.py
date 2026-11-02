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
