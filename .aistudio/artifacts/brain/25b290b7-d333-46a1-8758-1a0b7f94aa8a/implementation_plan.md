# SyllabusPilot

SyllabusPilot is an academic planning agent that ingests messy course syllabi from PDFs, photos, or pasted text, extracts every graded item into an editable breakdown table, asks up to 3 targeted scheduling questions, and generates a tailored week-by-week study plan exported as `plan.ics` via a backend Python `make_ics` tool function.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural and UX decisions reflect your confirmed preferences from our initial review:

- **Confirmed Decision 1 — Python `make_ics` Execution & Inspection**: When generating the study plan, the Gemini agent invokes the `make_ics` tool declaration, which executes a real Python `make_ics(events, filename="plan.ics")` function on the backend to build an RFC 5545-compliant iCalendar file. The UI also exposes an inspectable code drawer so you can view, copy, or download the standalone `make_ics.py` script alongside `plan.ics`.
- **Confirmed Decision 2 — Editable Graded Items Table**: After SyllabusPilot extracts graded items (item name, category, due date, weight %, and syllabus policy notes), you can edit any cell inline, add missing assignments, or remove items before proceeding to the study plan step. Total weight percentage automatically tallies in real time using tabular numerals.
- **Confirmed Decision 3 — Built-in Messy CS Course Syllabus**: Includes a realistic, unstructured Computer Science syllabus (*CS 3410: Operating Systems & Systems Programming — Fall 2026*) featuring scattered mid-paragraph dates, instructor typos, "drop lowest quiz" rules, slip-day policies, and conflicting lab schedules for one-click testing.

---

## 1. Overview & Core Concept

- **What It Does**: Transforms unstructured, chaotic syllabus documents (PDFs, smartphone photos of printed handouts, or raw text) into a structured assessment ledger and an actionable week-by-week study calendar (`plan.ics`).
- **Target Audience / Persona**: University students and self-directed learners managing heavy course loads with complex grading weights and overlapping deadlines.
- **Key Value**: Eliminates manual syllabus hunting and deadline surprises by combining multimodal document extraction, human-in-the-loop table verification, and automated calendar scheduling in a guided 4-stage workflow.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Stage 1 — Syllabus Ingestion & Messy Sample Loader**:
   - Users can drop or upload a **PDF** or **Photo** (`PNG`, `JPG`, `WEBP`), paste raw syllabus text, or click **"Load Messy CS Syllabus"** to populate and preview the built-in chaotic *CS 3410* sample syllabus.
   - Clicking **"Extract Graded Items"** sends the multimodal payload to the server-side Gemini agent.
2. **Stage 2 — Editable Graded Items Ledger & Clarifying Questions (Max 3)**:
   - Displays the extracted course metadata (Course Title, Term, Grading Policy Summary) and a high-density **Graded Items Table** showing: *Graded Item*, *Due Date*, *Weight (%)*, and *Notes / Policy Rules*.
   - Users can edit names, dates, or weights inline, add a new row, or delete rows, with a live total weight verification indicator (`100.0% Total Weight`).
   - Adjacent to the table, SyllabusPilot presents **at most 3 tailored questions** generated from the syllabus context (e.g., weekly study hours available, preferred study days/time blocks, and which project/exam feels most challenging) with quick-select presets and custom text inputs.
3. **Stage 3 — Week-by-Week Study Plan & `plan.ics` Calendar Export**:
   - Submitting the answers triggers the study planner agent, which uses Gemini function calling to invoke the `make_ics` tool and construct a structured **Week-by-Week Study Plan** paired with specific calendar study blocks and due-date reminders.
   - Users can browse each week's study goals, allocated hours, and target graded items, filter by week or assignment type, and click **"Download plan.ics"** to save the Python-generated calendar file or **"Inspect make_ics.py"** to view the Python tool function code.

### Visual Identity & Theme
- **Aesthetic Direction**: High-craft academic workspace and SaaS task planner—structured, crisp, and editorial without decorative clutter.
- **Color Palette & Mood (60-30-10 Discipline)**:
  - **60% Dominant Neutral Canvas**: Crisp warm alabaster (`#F8FAFC`) in light posture, deep slate (`#0F172A`) in dark posture.
  - **30% Structural Surfaces**: Pure white (`#FFFFFF`) / slate-900 (`#1E293B`) flat workspace panels bounded by `1px solid` hairline borders (`#E2E8F0` / `#334155`). Single-elevation depth with zero nested cards.
  - **10% Focal Accent & Semantic States**: Academic Indigo (`#4F46E5`) for primary workflow actions; Emerald (`#16A34A`) with explicit text labels for verified weights (`100% Verified`) and generated `.ics` status; Amber (`#D97706`) with explicit warning icons for ambiguous/TBA syllabus dates or weights not summing to 100%.
- **Typography & Hierarchy (2+1 Font Rule)**:
  - *Display & Navigation*: `Plus Jakarta Sans` (SemiBold/Bold, tight tracking) for workspace headers and stage titles.
  - *Body & Syllabus Prose*: `Public Sans` (Regular/Medium) for dense readability in syllabus excerpts and study task descriptions.
  - *Data, Dates & Weights*: `JetBrains Mono` with `font-variant-numeric: tabular-nums` strictly enforced on all percentage weights, weekly hour tallies, due dates, and Python code inspection.
- **Component Styling & Layout**:
  - **Top Bar Contract**: Strictly one row with 3 zones separated by `gap-8`: Brand wordmark (`SyllabusPilot`) on the left, single-line stage navigation links in the center (`1. Input Syllabus`, `2. Graded Items & Q&A`, `3. Weekly Plan & ICS`, `Sample Syllabus`), and 1 primary action button (`Download plan.ics` or `Load Messy Sample`) on the right.
  - **Zero-Pill Discipline**: Course metadata, week numbers, and hour allocations render as clean inline text separated by `·` or `/` rather than rounded pill badges.
- **Interactive Feedback & Motion**:
  - Smooth compositor-only transitions (`150ms cubic-bezier(0.16, 1, 0.3, 1)`), structured skeleton rows matching the exact `40px` table row height during Gemini extraction, and instant inline validation when editing weights or dates.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1 — Gemini Function Calling + Real Backend Python `make_ics` Execution**
  - *Chosen Approach*: Declare `make_ics` as a Gemini `FunctionDeclaration` tool during study plan generation AND execute a real Python script (`make_ics(events, output_path)`) via Node's `child_process.execFile('python3', ...)` on the Express backend (with a deterministic RFC 5545 fallback if a container lacks Python runtime binaries).
  - *Why*: Satisfies both the AI agent tool-use architecture and authentic Python `.ics` calendar generation while guaranteeing `plan.ics` is always downloadable with valid `VCALENDAR` / `VEVENT` blocks.
  - *Alternatives Considered*: Pure client-side string concatenation was rejected as the primary path because you specifically requested a Python `make_ics` tool function executed on the backend with inspectable code.
- **Decision 2 — Multimodal Server-Side Extraction (`gemini-3.8-flash`)**
  - *Chosen Approach*: Send PDF (`application/pdf`), image (`image/png`, `image/jpeg`, `image/webp`), or raw text directly to `/api/syllabus/analyze` on the Express server using `@google/genai` and structured `responseSchema`.
  - *Why*: `gemini-3.8-flash` natively understands multi-page PDFs and photographed handouts in a single pass without brittle OCR preprocessing, extracting both the graded items table and at most 3 contextual questions simultaneously.
- **Decision 3 — Human-in-the-Loop Table Editing Before Planning**
  - *Chosen Approach*: Pause between extraction and study plan generation so the user can review and edit the graded items table and answer the 3 questions.
  - *Why*: Messy syllabi often contain ambiguous dates ("Midterm around Week 7") or optional extra credit; allowing inline edits ensures the resulting `plan.ics` calendar only schedules accurate deadlines and weights.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

### Architecture & Component Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        Top Navigation Bar (3-Zone Contract)                  │
│  [SyllabusPilot]     [1. Input · 2. Items & Qs · 3. Study Plan · Sample]     │
└───────────────────────────────────────┬──────────────────────────────────────┘
                                        │
        ┌───────────────────────────────┼───────────────────────────────┐
        ▼                               ▼                               ▼
┌───────────────────────┐   ┌───────────────────────┐   ┌───────────────────────┐
│  1. Syllabus Ingest   │   │ 2. Graded Items & Q&A │   │ 3. Study Plan & ICS   │
│  ───────────────────  │   │ ───────────────────── │   │ ───────────────────── │
│ • PDF / Photo Upload  │   │ • Inline Editable     │   │ • Week-by-Week Grid   │
│ • Raw Text Paste      │   │   Graded Items Table  │   │ • Calendar Event List │
│ • Messy CS Syllabus   │   │ • Weight Sum Verifier │   │ • Download plan.ics   │
│   One-Click Loader    │   │ • Up to 3 Agent Qs    │   │ • Python make_ics.py  │
│                       │   │   (Hours, Days, Focus)│   │   Code Inspector      │
└───────────┬───────────┘   └───────────┬───────────┘   └───────────▲───────────┘
            │                           │                           │
            │ POST /api/syllabus/parse  │ POST /api/syllabus/plan   │
            ▼                           ▼                           │
┌───────────────────────────────────────────────────────────────────┴──────────┐
│                         Express Backend Server (Port 3000)                   │
│  ┌────────────────────────────────────┐  ┌────────────────────────────────┐  │
│  │ @google/genai (gemini-3.8-flash)   │  │ Python Tool: make_ics.py       │  │
│  │ • Multimodal PDF/Image/Text Parse  │  │ • FunctionDeclaration: make_ics│  │
│  │ • Extracts GradedItem[] + <=3 Qs   │─▶│ • Executes def make_ics(...)   │  │
│  │ • Generates Weekly Plan + Events   │  │ • Outputs RFC 5545 plan.ics    │  │
│  └────────────────────────────────────┘  └────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Data Model & State
- **`GradedItem`**:
  - `id`: Unique identifier for row editing/deletion
  - `title`: Name of assignment, exam, lab, or quiz
  - `category`: `Exam` | `Project` | `Homework` | `Quiz` | `Lab` | `Participation`
  - `dueDate`: ISO date string (`YYYY-MM-DD`) or original syllabus text if TBA, with ambiguity flag
  - `weightPercent`: Numeric percentage of final grade (`number`)
  - `details`: Grading policy note (e.g., *"Lowest 1 dropped"*, *"Up to 2 slip days allowed"*)
- **`AgentQuestion` (Max 3)**:
  - `id`: Question identifier (`q1`, `q2`, `q3`)
  - `question`: Concise question text tailored to the course workload
  - `placeholder`: Suggested response format
  - `quickOptions`: Array of 3–4 one-click answer presets (e.g., `"6 hours/week"`, `"10 hours/week"`, `"15 hours/week"`)
  - `answer`: User's selected or typed response
- **`WeeklyStudyPlan` & `CalendarEvent`**:
  - `weeks`: Array of weekly breakdown objects (`weekNumber`, `dateRange`, `focusSummary`, `totalHours`, `tasks[]`, `milestonesDue[]`)
  - `events`: Array of concrete calendar sessions (`title`, `startDateTime`, `endDateTime`, `description`, `category`: `'study_session' | 'due_date'`) passed to `make_ics`
  - `icsContent`: Generated RFC 5545 `VCALENDAR` content for `plan.ics`
  - `pythonCode`: The exact `make_ics` Python function implementation and invocation trace

### Interactive Component & State Mapping
- **Syllabus Input Panel**: Handles drag-and-drop file reading (`FileReader` base64 encoding for PDF/images), raw text editing, and instant loading of the messy *CS 3410* sample syllabus with a side-by-side preview of why the syllabus is tricky.
- **Editable Graded Items Table**: Supports inline `<input>` editing for item title, date (`type="date"` + raw text note), weight percentage (`type="number"`), and policy notes; includes **"Add Graded Item"**, row deletion, category sorting, and a live weight sum bar that alerts the user if weights do not total `100%`.
- **3-Question Interview Panel**: Enforces a hard ceiling of `<= 3` questions. Clicking a quick preset populates the answer field immediately, or the user can type a custom constraint before clicking **"Generate Week-by-Week Plan & plan.ics"**.
- **Study Plan & `make_ics` Inspector**: Renders the weekly schedule with filter toggles (`All Weeks`, `Exam & Project Weeks`, `Calendar Events`), a one-click **`Download plan.ics`** button that triggers a browser download of `plan.ics`, and a collapsible **`make_ics.py` Tool Inspector** where users can view the Python tool call arguments and re-run `make_ics` if they tweak event times.
