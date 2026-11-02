import json
import os
from datetime import datetime, timedelta


def make_ics(sessions: list[dict], filename: str = "plan.ics") -> str:
    """Generates an iCalendar (.ics) file from study sessions for Google Calendar.

    Each session in sessions must match:
      session = {"title": str, "date": "YYYY-MM-DD", "hours": float, "description": str}
    """
    if isinstance(sessions, str):
        try:
            sessions = json.loads(sessions)
        except Exception:
            sessions = []

    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//SyllabusPilot//Study Schedule//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "X-WR-CALNAME:SyllabusPilot Study Plan",
        "X-WR-TIMEZONE:UTC",
    ]

    now_stamp = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")

    for i, sess in enumerate(sessions):
        title = sess.get("title", "Study Session")
        date_str = sess.get("date", "2026-11-10")
        hours = float(sess.get("hours", 2.0))
        desc = sess.get("description", "Study session planned by SyllabusPilot.")

        # Default study sessions to 18:00 (6:00 PM)
        try:
            start_dt = datetime.strptime(f"{date_str} 18:00", "%Y-%m-%d %H:%M")
        except ValueError:
            start_dt = datetime.now()

        end_dt = start_dt + timedelta(hours=hours)

        uid = f"session-{i}-{start_dt.strftime('%Y%m%d%H%M')}@syllabuspilot"

        lines.extend([
            "BEGIN:VEVENT",
            f"UID:{uid}",
            f"DTSTAMP:{now_stamp}",
            f"SUMMARY:{title}",
            f"DESCRIPTION:{desc}",
            f"DTSTART:{start_dt.strftime('%Y%m%dT%H%M00')}",
            f"DTEND:{end_dt.strftime('%Y%m%dT%H%M00')}",
            "STATUS:CONFIRMED",
            "BEGIN:VALARM",
            "ACTION:DISPLAY",
            "DESCRIPTION:Reminder: Study session starts in 15 minutes!",
            "TRIGGER:-PT15M",
            "END:VALARM",
            "END:VEVENT",
        ])

    lines.append("END:VCALENDAR\n")

    filepath = os.path.abspath(filename)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write("\r\n".join(lines))

    return filepath
