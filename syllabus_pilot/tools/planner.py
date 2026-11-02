from datetime import datetime, timedelta


def _week_start(day: datetime) -> datetime:
    """Monday of the week that contains `day`."""
    return day - timedelta(days=day.weekday())


def build_plan(
    items: list[dict],
    hours_per_week: float = 6.0,
    start_date: str = "2026-09-01",
) -> list[dict]:
    """Generates a balanced week-by-week study schedule from syllabus items.

    Items with more weight get more study hours, scheduled in the days before
    their due date. No week (Monday-Sunday) ever gets more than `hours_per_week`.
    Items without a due date, or due before `start_date`, are skipped.

    Each returned session follows the shared shape:
      session = {"title": str, "date": "YYYY-MM-DD", "hours": float, "description": str}
    """
    try:
        weekly_limit = float(hours_per_week)
    except (TypeError, ValueError):
        weekly_limit = 6.0
    if weekly_limit <= 0:
        return []

    try:
        start_dt = datetime.strptime(str(start_date), "%Y-%m-%d")
    except ValueError:
        start_dt = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)

    # 1. Keep only items with a real due date on or after the start date.
    dated = []
    for item in items or []:
        try:
            due_dt = datetime.strptime(str(item.get("due_date")), "%Y-%m-%d")
        except ValueError:
            continue
        if due_dt < start_dt:
            continue
        try:
            weight = float(item.get("weight") or 0)
        except (TypeError, ValueError):
            weight = 0.0
        dated.append((item, due_dt, weight))

    # 2. Most important items first, so they get the free hours first.
    dated.sort(key=lambda x: (-x[2], x[1]))

    week_hours: dict[datetime, float] = {}
    sessions = []

    for item, due_dt, weight in dated:
        name = item.get("name", "Assignment")
        item_type = str(item.get("type", "assignment")).lower()

        # How many hours this item deserves, and how they are split.
        if any(word in item_type for word in ("exam", "final", "midterm", "test")):
            wanted_hours = max(4.0, weight / 10.0 * 3.5)
            session_length = 2.0
            lead_days = [1, 2, 4, 7, 10, 14]
        elif any(word in item_type for word in ("paper", "essay", "project", "report")):
            wanted_hours = max(3.0, weight / 10.0 * 2.5)
            session_length = 2.0
            lead_days = [2, 5, 8, 12]
        else:  # labs, homework, quizzes
            wanted_hours = max(1.5, min(4.0, weight * 0.5))
            session_length = 1.5
            lead_days = [1, 2, 4]

        session_count = max(1, round(wanted_hours / session_length))
        placed = []

        for offset in lead_days[:session_count]:
            # Try the ideal day first, then walk back towards the start date
            # until a week with free hours is found.
            day = max(due_dt - timedelta(days=offset), start_dt)
            while day >= start_dt:
                week = _week_start(day)
                free = weekly_limit - week_hours.get(week, 0.0)
                if free >= 1.0:
                    hours = min(session_length, free)
                    week_hours[week] = week_hours.get(week, 0.0) + hours
                    placed.append((day, hours))
                    break
                day -= timedelta(days=1)

        for idx, (day, hours) in enumerate(sorted(placed)):
            part = f" (Part {idx + 1}/{len(placed)})" if len(placed) > 1 else ""
            sessions.append({
                "title": f"Study: {name}{part}",
                "date": day.strftime("%Y-%m-%d"),
                "hours": round(hours, 2),
                "description": (
                    f"Prep for {name} ({weight:g}% of the grade), "
                    f"due {due_dt.strftime('%a %b %d')}."
                ),
            })

    sessions.sort(key=lambda s: (s["date"], s["title"]))
    return sessions
