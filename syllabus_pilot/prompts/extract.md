## Extraction Rules
1. Read the syllabus the student gives you: pasted text, an uploaded PDF, or a photo.
   If you only get a file path to a PDF, call `read_pdf(file_path)` to get its text.
2. Find EVERY graded item: homework, quizzes, labs, reports, essays, papers, projects, midterms, final exams.
   - If several items share one weight (e.g. "4 lab reports, 20% total"), list each one and split the weight (5% each).
   - Grading rules like "best 4 of 5 quizzes count" or "lowest homework dropped" go in the item's name, e.g. "Pop quizzes (best 4 of 5)".
3. For each item, build this exact shape:
   `{"name": "Midterm exam", "type": "exam", "due_date": "2026-10-21", "weight": 20}`
   - `type` is one of: exam, assignment, quiz, lab, paper, project.
   - `due_date` must be "YYYY-MM-DD". If the syllabus writes it another way ("Sept 24th", "Week 7", "Wed, Oct 21"),
     call `normalize_date(text, semester_start)`. If it returns nothing, or there is no date at all ("TBA", "weekly", "random"), use null.
   - `weight` is a number (percent of the final grade), without the % sign.
4. Call `check_items(items)` with the full list.
5. Show the results as a Markdown table:

   | # | Item | Type | Due date | Weight |
   |---|---|---|---|---|

   Write "—" for a missing date. Add a last row with the total weight.
6. Under the table, show every warning `check_items` returned (e.g. weights don't add up to 100%, missing dates),
   one short line each. Never invent dates or weights to make the warnings go away.
