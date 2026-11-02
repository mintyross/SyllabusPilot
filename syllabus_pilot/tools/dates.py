import re
from datetime import datetime, timedelta


def normalize_date(text: str, semester_start: str = "2026-09-01") -> str | None:
    """Normalizes raw syllabus date strings into ISO 'YYYY-MM-DD' or None.

    Examples:
      - '2026-11-16' -> '2026-11-16'
      - 'Week 7' -> calculated date from semester_start
      - 'Oct 3rd', 'October 21, 2026' -> '2026-10-21'
      - '18 Nov', '2 Dec' -> '2026-11-18', '2026-12-02'
      - 'TBA', 'Throughout semester' -> None
    """
    if not text or not isinstance(text, str):
        return None

    cleaned = text.strip()
    if cleaned.upper() in ("TBA", "TBD", "UNKNOWN", "NONE", "N/A", "THROUGHOUT SEMESTER"):
        return None

    # Check for direct ISO format YYYY-MM-DD
    iso_match = re.search(r"\b(\d{4}-\d{2}-\d{2})\b", cleaned)
    if iso_match:
        return iso_match.group(1)

    # Check for "Week X"
    week_match = re.search(r"week\s*(\d+)", cleaned, re.IGNORECASE)
    if week_match:
        try:
            week_num = int(week_match.group(1))
            start_dt = datetime.strptime(semester_start, "%Y-%m-%d")
            target_dt = start_dt + timedelta(weeks=week_num - 1)
            return target_dt.strftime("%Y-%m-%d")
        except ValueError:
            pass

    # Remove ordinals: 1st, 2nd, 3rd, 4th, etc.
    cleaned_date = re.sub(r"(\d+)(st|nd|rd|th)", r"\1", cleaned, flags=re.IGNORECASE)
    # Remove time portions if present (e.g. 'at 5:00 PM', '10:00 AM')
    cleaned_date = re.sub(r"\b(at\s+)?\d{1,2}:\d{2}\s*(AM|PM)?\b", "", cleaned_date, flags=re.IGNORECASE).strip()

    # Formats to try
    formats = [
        "%B %d, %Y",  # October 21, 2026
        "%b %d, %Y",   # Oct 21, 2026
        "%B %d %Y",   # October 21 2026
        "%b %d %Y",    # Oct 21 2026
        "%d %B %Y",   # 21 October 2026
        "%d %b %Y",    # 21 Oct 2026
        "%B %d",      # October 21
        "%b %d",       # Oct 21
        "%d %B",      # 21 October
        "%d %b",       # 21 Oct
        "%m/%d/%Y",   # 10/21/2026
        "%m/%d/%y",   # 10/21/26
    ]

    for fmt in formats:
        try:
            parsed = datetime.strptime(cleaned_date, fmt)
            year = 2026 if parsed.year == 1900 else parsed.year
            return parsed.replace(year=year).strftime("%Y-%m-%d")
        except ValueError:
            continue

    return None
