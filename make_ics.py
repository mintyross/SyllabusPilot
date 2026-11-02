#!/usr/bin/env python3
"""
SyllabusPilot Calendar Tool: make_ics.py
Generates an RFC 5545-compliant iCalendar (.ics) file from a list of study sessions
and graded course deadlines.
"""

import json
import sys
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Any


def _escape_ics_text(value: str) -> str:
    """Escape special characters according to RFC 5545 Section 3.3.11."""
    if not value:
        return ""
    return (
        str(value)
        .replace("\\", "\\\\")
        .replace(";", "\\;")
        .replace(",", "\\,")
        .replace("\r\n", "\\n")
        .replace("\n", "\\n")
    )


def _format_ics_datetime(dt_str: str, default_hour: int = 9, duration_hours: float = 2.0) -> tuple[str, str]:
    """
    Parse an ISO date ('YYYY-MM-DD') or datetime ('YYYY-MM-DDTHH:MM') into
    RFC 5545 UTC/local timestamp strings (DTSTART, DTEND).
    """
    safe_hour = max(0, min(23, int(default_hour)))
    clean = (dt_str or "").strip()
    now = datetime(2026, 9, 7, safe_hour, 0)

    parsed_dt = None
    for fmt in ("%Y-%m-%dT%H:%M:%S", "%Y-%m-%dT%H:%M", "%Y-%m-%d %H:%M", "%Y-%m-%d"):
        try:
            parsed_dt = datetime.strptime(clean, fmt)
            if fmt == "%Y-%m-%d":
                parsed_dt = parsed_dt.replace(hour=safe_hour, minute=0, second=0)
            break
        except ValueError:
            continue

    if parsed_dt is None:
        parsed_dt = now

    end_dt = parsed_dt + timedelta(minutes=max(30, int(round(duration_hours * 60))))
    return parsed_dt.strftime("%Y%m%dT%H%M%S"), end_dt.strftime("%Y%m%dT%H%M%S")


def make_ics(events: List[Dict[str, Any]], filename: str = "plan.ics") -> str:
    """
    Build an iCalendar (.ics) file from a list of study plan events and save it to `filename`.

    Each event dictionary supports:
      - title (str): Summary title for the calendar event
      - start (str): Start date or ISO datetime ('YYYY-MM-DD' or 'YYYY-MM-DDTHH:MM')
      - end (str, optional): End ISO datetime ('YYYY-MM-DDTHH:MM')
      - duration_hours (float, optional): Length of study block in hours (default 2.0)
      - description (str, optional): Study goals, graded item weight, or notes
      - location (str, optional): Location or study context
      - category (str, optional): 'study_session' or 'due_date'

    Returns:
      str: The complete RFC 5545 iCalendar string written to `filename`.
    """
    dtstamp = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//SyllabusPilot//Academic Study Planner//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "X-WR-CALNAME:SyllabusPilot Study Plan",
        "X-WR-TIMEZONE:America/New_York",
    ]

    for idx, ev in enumerate(events):
        title = _escape_ics_text(ev.get("title") or f"Study Session {idx + 1}")
        description = _escape_ics_text(ev.get("description") or "Scheduled by SyllabusPilot")
        location = _escape_ics_text(ev.get("location") or "Study Desk / Library")
        category = str(ev.get("category") or "study_session").upper()
        duration = float(ev.get("duration_hours") or 2.0)

        start_raw = str(ev.get("start") or ev.get("startDateTime") or "2026-09-07T18:00")
        end_raw = ev.get("end") or ev.get("endDateTime")

        default_hr = 23 if category == "DUE_DATE" else 18
        dtstart, computed_end = _format_ics_datetime(start_raw, default_hour=default_hr, duration_hours=duration)

        if end_raw:
            dtend, _ = _format_ics_datetime(str(end_raw), default_hour=min(23, default_hr + 1), duration_hours=1.0)
            if dtend <= dtstart:
                dtend = computed_end
        else:
            dtend = computed_end

        uid = f"syllabuspilot-{idx + 1}-{uuid.uuid5(uuid.NAMESPACE_DNS, title + dtstart)}@syllabuspilot.local"

        lines.extend([
            "BEGIN:VEVENT",
            f"UID:{uid}",
            f"DTSTAMP:{dtstamp}",
            f"DTSTART:{dtstart}",
            f"DTEND:{dtend}",
            f"SUMMARY:{title}",
            f"DESCRIPTION:{description}",
            f"LOCATION:{location}",
            f"CATEGORIES:{_escape_ics_text(category)}",
            "STATUS:CONFIRMED",
            "BEGIN:VALARM",
            "TRIGGER:-PT30M",
            "ACTION:DISPLAY",
            f"DESCRIPTION:Reminder: {title}",
            "END:VALARM",
            "END:VEVENT",
        ])

    lines.append("END:VCALENDAR")
    ics_content = "\r\n".join(lines) + "\r\n"

    if filename:
        with open(filename, "w", encoding="utf-8", newline="") as f:
            f.write(ics_content)

    return ics_content


if __name__ == "__main__":
    # CLI entry point used by the SyllabusPilot backend tool runner:
    # Reads JSON payload {"events": [...], "filename": "plan.ics"} from stdin.
    raw_input = sys.stdin.read().strip()
    if not raw_input:
        payload = {"events": [], "filename": "plan.ics"}
    else:
        payload = json.loads(raw_input)

    events_arg = payload.get("events", [])
    filename_arg = payload.get("filename", "plan.ics")
    result_ics = make_ics(events_arg, filename=filename_arg)
    sys.stdout.write(result_ics)
