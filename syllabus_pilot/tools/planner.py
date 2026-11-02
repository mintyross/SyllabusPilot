from datetime import datetime, timedelta


def build_plan(
    items: list[dict],
    hours_per_week: float = 6.0,
    start_date: str = "2026-09-01",
) -> list[dict]:
    """Generates a balanced week-by-week study schedule from syllabus items.

    Each returned session follows the shared shape:
      session = {"title": str, "date": "YYYY-MM-DD", "hours": float, "description": str}
    """
    valid_items = [it for it in items if it.get("due_date")]
    if not valid_items:
        return []

    try:
        start_dt = datetime.strptime(start_date, "%Y-%m-%d")
    except ValueError:
        start_dt = datetime.now()

    # Sort items by chronological deadline
    valid_items.sort(key=lambda x: str(x.get("due_date", "")))

    sessions = []

    for item in valid_items:
        name = item.get("name", "Assignment")
        item_type = item.get("type", "assignment").lower()
        weight = float(item.get("weight", 10.0))

        try:
            due_dt = datetime.strptime(item["due_date"], "%Y-%m-%d")
        except ValueError:
            continue

        # Skip items in the past
        if due_dt < start_dt:
            continue

        # Scale prep hours based on grade weight and type
        if "exam" in item_type or "final" in item_type or "midterm" in item_type:
            total_prep_hours = max(4.0, (weight / 10.0) * 3.5)
            session_length = 2.0
            lead_days = [14, 10, 7, 4, 2, 1]
        elif "paper" in item_type or "essay" in item_type or "project" in item_type:
            total_prep_hours = max(3.0, (weight / 10.0) * 2.5)
            session_length = 2.0
            lead_days = [12, 8, 5, 2]
        else:
            # Labs, homework sets, quizzes
            total_prep_hours = max(1.5, min(4.0, weight * 0.5))
            session_length = 1.5
            lead_days = [4, 2, 1]

        num_sessions = max(1, int(round(total_prep_hours / session_length)))
        selected_lead_days = lead_days[:num_sessions]

        for idx, offset in enumerate(selected_lead_days):
            session_date = due_dt - timedelta(days=offset)
            if session_date < start_dt:
                session_date = start_dt + timedelta(days=idx)

            part_num = f" (Part {idx + 1}/{num_sessions})" if num_sessions > 1 else ""
            sessions.append({
                "title": f"Study: {name}{part_num}",
                "date": session_date.strftime("%Y-%m-%d"),
                "hours": session_length,
                "description": f"Targeted prep for {name} ({weight}% of total grade). Due on {due_dt.strftime('%b %d')}.",
            })

    # Sort all sessions chronologically
    sessions.sort(key=lambda s: s["date"])
    return sessions
