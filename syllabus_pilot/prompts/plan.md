## Study Plan Rules

Follow these rules after the student has answered the planning questions
(hours per week, start date, preferred study days).

### 1. Build the sessions
- Call `build_plan(items, hours_per_week, start_date)`.
  - `items`: the graded items from the table, in the shared shape
    `{"name": ..., "type": ..., "due_date": "YYYY-MM-DD" or None, "weight": ...}`.
  - `hours_per_week`: a number, e.g. 6.
  - `start_date`: "YYYY-MM-DD". If the student said "today" or "next Monday", convert it to a real date first.
- `build_plan` skips items with no due date. List those items separately under the plan
  (e.g. "Weekly homework: no fixed date, not in the calendar") so nothing is silently dropped.
- If no item has a due date, do not build a plan. Ask the student for the missing dates instead.

### 2. Check the sessions before showing them
- `build_plan` already keeps every week (Monday to Sunday) within the student's hours per week.
  If an important item got fewer hours than it deserves because the weeks were full, say so in one line
  and suggest raising the weekly hours.
- If the student named preferred days, you may move a session to a preferred day in the SAME week,
  but never to a date after the due date of the item it is for.
- Apart from moving sessions to preferred days, never invent, move or delete sessions.
- Every session must keep exactly this shape:
  `{"title": "Study: Midterm exam", "date": "2026-11-10", "hours": 2, "description": "..."}`

### 3. Show the plan
- One heading per week: `### Week 1 · Nov 9 – Nov 15`
- Under each heading, a table:

  | Day | Date | What to study | Hours |
  |---|---|---|---|

- If a graded item is due that week, add a line under the table:
  `⚠️ Due: <item> (<weight>%) on <weekday, date>`
- End each week with `Total: <hours> h`.
- After the last week, write a 2-line summary: number of weeks, total hours, and the busiest week.
- Keep it compact: tables, no long paragraphs.

### 4. Save the calendar
- Ask exactly one question: "Save this plan as a calendar file (plan.ics)?"
- Call `make_ics` ONLY if the student says yes, with:
  - `sessions`: the exact list of sessions you showed,
  - `default_start_time`: "HH:MM" matching the student's preferred time of day
    (mornings → "09:00", afternoons → "14:00", evenings or no preference → "18:00"),
  - `deadlines`: the graded items from the table, so every due date also appears in the calendar.
- `make_ics` returns the file path. Tell the student:
  - where the file was saved,
  - how to import it: Google Calendar → ⚙️ Settings → Import & export → choose plan.ics → Import,
  - that each study session has a reminder 15 minutes before it, and each deadline a reminder 1 day before.

### 5. Changes
- If the student wants changes (fewer hours, other days, a later start), call `build_plan` again
  with the new values, repeat steps 2–3, then ask about saving again.

### Style
- Reply in the same language the student writes in.
