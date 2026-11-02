<div align="center">

# 📅 SyllabusPilot 🚀

### **Turn messy course syllabi into an actionable Google Calendar study schedule in seconds.**

[![Gemini](https://img.shields.io/badge/Model-Gemini%203.8%20Flash-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)
[![Framework](https://img.shields.io/badge/Framework-Google%20ADK-34A853?logo=google-cloud&logoColor=white)](https://github.com/google/agent-development-kit)
[![Frontend](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite%208-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Standard](https://img.shields.io/badge/Calendar-RFC%205545%20iCalendar-EA4335?logo=google-calendar&logoColor=white)](https://calendar.google.com)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

</div>

## 📌 The Problem

At the start of every semester, students are bombarded with **5 to 8 course syllabi**.
- A 12-page PDF where the midterm date is buried on page 9.
- A blurry phone photo of a lecture slide saying *"Essay due week 11"*.
- An email from a professor with a broken plain-text table and drop-lowest grading policies.

**The result:** Most students never turn them into an actionable plan. They hear about midterms one week prior, or miss essays mentioned on page 9. Students who do plan waste hours manually copying dates into Google Calendar—only to repeat the entire process whenever a date shifts.

---

## 💡 The Solution

**SyllabusPilot** is an intelligent academic planner agent powered by **Google Gemini 3.8 Flash** and the **Google Agent Development Kit (ADK)**:

1. 📥 **Drop any syllabus:** Accepts raw text, PDF documents, or photos of slides and handouts.
2. 🔍 **Instant extraction:** Automatically identifies every graded item (exams, assignments, quizzes, papers), due dates, and grading percentage weights.
3. 💬 **Personalized pacing:** Asks at most 1 to 3 quick clarifying questions (weekly study hours, preferred days/times, semester start date).
4. 🧠 **Smart workload balancing:** Strategically assigns more prep sessions before high-stakes exams and term papers to eliminate cramming.
5. 🗓️ **1-Click Google Calendar export:** Generates a standard RFC 5545 `plan.ics` calendar file with built-in 30-minute reminder alarms, ready to import directly into Google Calendar, Apple Calendar, or Outlook.

---

## ✨ Features

- 📄 **Multimodal Ingestion:** Ingest raw text, 12-page PDFs, or photos of lecture slides.
- 📊 **Graded Item Breakdown:** Clean summary table with categories, due dates, and grade weight validation (ensuring items sum to 100%).
- ⚖️ **Weight Distribution Charts:** Visual representation of course grade allocation using interactive Recharts graphs.
- 🎯 **Algorithmic Study Planning:** Distributes study hours across the semester, scheduling heavier prep blocks 1–2 weeks before major exams.
- 🐍 **Native Python Tool Calling:** Generates standard RFC 5545 `.ics` calendar events using our `make_ics` tool function.
- ⏰ **Deadline & Study Reminders:** Embedded `VALARM` notifications alert students 30 minutes before each study block and milestone deadline.
- 🌓 **Modern Web Dashboard:** Full React 19 UI with dark/light mode, interactive calendar views, and instant `.ics` downloads.

---

## 🛠️ Tech Stack

- **AI Model:** `gemini-3.8-flash` (Google AI Studio)
- **Agent Framework:** [Google Agent Development Kit (ADK)](https://github.com/google/agent-development-kit)
- **Frontend:** React 19, TypeScript, Tailwind CSS, Vite 8, Lucide Icons, Recharts
- **Backend:** Express.js, Node.js, `@google/genai`
- **Core Calendar Engine:** Python 3.10+ (`make_ics.py`, RFC 5545 standard)

---

## 🚀 Quickstart & Setup

### Prerequisites
- **Node.js** (v20 or newer recommended)
- **Python** (v3.10 or newer)
- A free **Gemini API Key** from [Google AI Studio](https://aistudio.google.com/apikey)

### 1. Clone the repository
```bash
git clone https://github.com/mintyross/SyllabusPilot.git
cd SyllabusPilot
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory:
```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3000
```

### 3. Install Dependencies
```bash
# Install frontend & server dependencies
npm install --legacy-peer-deps

# (Optional) Install Python test & ADK tools
pip install -r requirements.txt
```

### 4. Run the SyllabusPilot Web App
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser!

---

## 💻 Alternative: Running via Google ADK CLI

You can also run SyllabusPilot directly through the official Google Agent Development Kit CLI:

1. Create `syllabus_pilot/.env` (next to `agent.py`) with:
   ```env
   GOOGLE_GENAI_USE_VERTEXAI=FALSE
   GOOGLE_API_KEY=your_gemini_api_key_here
   ```
2. From the **repo root** (the folder that *contains* `syllabus_pilot/`, not from inside it):
   ```powershell
   py -m venv venv
   venv\Scripts\activate          # macOS/Linux: source venv/bin/activate
   pip install -r requirements.txt
   adk web
   ```
   On Windows you can also just double-click `run_agent.bat` after the first setup.
3. Visit **[http://localhost:8000](http://localhost:8000)** and select `syllabus_pilot` from the menu.

Run the tests with `python -m pytest` from the repo root.

---

## 📂 Project Structure

```text
SyllabusPilot/
├── src/                          # React 19 Frontend
│   ├── App.tsx                   # Main Dashboard (Input, Review, Plan views)
│   ├── types.ts                  # Shared TypeScript interfaces
│   └── data/messySyllabus.ts     # Preloaded messy CS & Bio test syllabi
├── syllabus_pilot/               # Google ADK Agent
│   ├── agent.py                  # Agent definitions & tool registration
│   ├── prompts/                  # Modular agent instructions
│   │   ├── extract.md            # Extraction rules & table structure
│   │   ├── questions.md          # Strict <=3 question constraints
│   │   └── plan.md               # Week-by-week study scheduling logic
│   └── tools/                    # Deterministic Python Tools
│       ├── calendar.py           # make_ics() calendar exporter
│       ├── checks.py             # check_items() weight & duplicate validator
│       ├── dates.py              # normalize_date() date string parser
│       ├── planner.py            # build_plan() workload distributor
│       └── pdf.py                # read_pdf() document parser
├── samples/                      # Sample syllabi & ground-truth expected.json
├── tests/                        # Automated unit tests (pytest)
├── make_ics.py                   # Standalone RFC 5545 Python tool
├── server.ts                     # Express + Vite backend server
├── plan.ics                      # Generated output calendar file
└── README.md
```

---

## 📅 Importing `plan.ics` into Google Calendar

1. Open **[Google Calendar](https://calendar.google.com)**.
2. Click the **Gear icon ⚙️** (Top Right) > **Settings**.
3. In the left navigation, select **Import & export**.
4. Click **Select file from your computer** and choose `plan.ics`.
5. Click **Import** — your study blocks and exam milestones appear instantly!

---

## 🏆 Hackathon Submission Details

- **Project Title:** SyllabusPilot
- **One-line Pitch:** Turn messy course syllabi into an actionable Google Calendar study schedule in seconds.
- **Challenge Track:** AI Agents / Student Productivity
- **Live Demo Video / Pitch Flow (5 minutes):**
  1. **The Problem (1 min):** Present an ugly 12-page PDF / slide photo with buried exam dates.
  2. **The Extraction (1.5 min):** Upload syllabus to SyllabusPilot -> instant extraction table + weight chart.
  3. **The Planning (1 min):** Answer 1 question (*"I have 6 hours/week"*).
  4. **The Calendar Sync (1.5 min):** 1-click download `plan.ics` -> import into Google Calendar -> view color-coded study sessions & reminder alarms.
