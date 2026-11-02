import json
import os
from datetime import datetime, timedelta, timezone


def _escape(text: str) -> str:
    """Escapes text for an .ics file (RFC 5545): backslash, comma, semicolon, newline."""
    return (
        str(text)
        .replace("\\", "\\\\")
        .replace(",", "\\,")
        .replace(";", "\\;")
        .replace("\n", "\\n")
    )


def _as_list(value) -> list:
    """The model sometimes sends a JSON string instead of a list."""
    if isinstance(value, str):
        try:
            value = json.loads(value)
        except ValueError:
            return []
    return value if isinstance(value, list) else []


def make_ics(
    sessions: list[dict],
    filename: str = "plan.ics",
    default_start_time: str = "18:00",
    deadlines: list[dict] | None = None,
) -> str:
    """Saves study sessions (and optionally graded-item deadlines) as an .ics calendar file.

    sessions:  [{"title": str, "date": "YYYY-MM-DD", "hours": float, "description": str,
                 "start_time": "HH:MM" (optional)}]
    default_start_time: "HH:MM" used when a session has no start_time, e.g. "09:00" for mornings.
    deadlines: optional graded items [{"name": str, "due_date": "YYYY-MM-DD", "weight": float}].
               Each becomes an all-day event with a reminder one day before.

    Returns the full path of the saved file.
    """
    sessions = _as_list(sessions)
    deadlines = _as_list(deadlines)

    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//SyllabusPilot//Study Schedule//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "X-WR-CALNAME:SyllabusPilot Study Plan",
    ]
    now_stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")

    for i, sess in enumerate(sessions):
        date_str = str(sess.get("date", ""))
        time_str = str(sess.get("start_time") or default_start_time)
        try:
            start_dt = datetime.strptime(f"{date_str} {time_str}", "%Y-%m-%d %H:%M")
        except ValueError:
            try:
                start_dt = datetime.strptime(f"{date_str} 18:00", "%Y-%m-%d %H:%M")
            except ValueError:
                continue  # no usable date: skip instead of inventing one
        try:
            hours = float(sess.get("hours", 2.0))
        except (TypeError, ValueError):
            hours = 2.0
        end_dt = start_dt + timedelta(hours=hours)

        lines += [
            "BEGIN:VEVENT",
            f"UID:session-{i}-{start_dt.strftime('%Y%m%d%H%M')}@syllabuspilot",
            f"DTSTAMP:{now_stamp}",
            f"SUMMARY:{_escape(sess.get('title', 'Study session'))}",
            f"DESCRIPTION:{_escape(sess.get('description', 'Planned by SyllabusPilot.'))}",
            # Floating local time: shows at the same clock time in any time zone
            f"DTSTART:{start_dt.strftime('%Y%m%dT%H%M00')}",
            f"DTEND:{end_dt.strftime('%Y%m%dT%H%M00')}",
            "STATUS:CONFIRMED",
            "BEGIN:VALARM",
            "ACTION:DISPLAY",
            "DESCRIPTION:Study session starts in 15 minutes",
            "TRIGGER:-PT15M",
            "END:VALARM",
            "END:VEVENT",
        ]

    for i, item in enumerate(deadlines):
        try:
            due_dt = datetime.strptime(str(item.get("due_date")), "%Y-%m-%d")
        except ValueError:
            continue  # items without a date can't go in the calendar
        name = item.get("name", "Deadline")
        weight = item.get("weight")
        summary = f"DUE: {name}" + (f" ({weight}%)" if weight not in (None, "") else "")
        lines += [
            "BEGIN:VEVENT",
            f"UID:deadline-{i}-{due_dt.strftime('%Y%m%d')}@syllabuspilot",
            f"DTSTAMP:{now_stamp}",
            f"SUMMARY:{_escape(summary)}",
            f"DTSTART;VALUE=DATE:{due_dt.strftime('%Y%m%d')}",
            f"DTEND;VALUE=DATE:{(due_dt + timedelta(days=1)).strftime('%Y%m%d')}",
            "TRANSP:TRANSPARENT",
            "BEGIN:VALARM",
            "ACTION:DISPLAY",
            f"DESCRIPTION:{_escape(name)} is due tomorrow",
            "TRIGGER:-P1D",
            "END:VALARM",
            "END:VEVENT",
        ]

    lines.append("END:VCALENDAR")

    filepath = os.path.abspath(filename)
    with open(filepath, "w", encoding="utf-8", newline="") as f:
        f.write("\r\n".join(lines) + "\r\n")
    return filepath
