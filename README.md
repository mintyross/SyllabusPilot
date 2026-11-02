- 📊 **Graded Item Breakdown**: Clear summary table showing every deadline, task type, and grade percentage.
- 🎯 **Smart Workload Balancing**: Calculates necessary prep hours based on assignment weight and your weekly availability.
- 🗓️ **iCalendar (.ics) Export**: One-click import into Google Calendar with reminder alerts.
---
## 🛠️ Tech Stack
- **Framework**: [Google Agent Development Kit (ADK)](https://github.com/google/agent-development-kit)
- **Model**: `gemini-flash-latest` (fast, multimodal, accurate reasoning)
- **Language**: Python 3.10+
- **Export Format**: Standard iCalendar format (`.ics`)
---
## 🚀 Quickstart
### 1. Clone the repository
```bash
git clone https://github.com/<your-username>/syllabus-pilot.git
cd syllabus-pilot
```
### 2. Set up a virtual environment
```bash
python -m venv venv
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
```
### 3. Install dependencies
```bash
pip install google-adk ics
```
### 4. Configure your Gemini API Key
Create a `.env` file in the root directory:
```env
GOOGLE_GENAI_API_KEY=your_gemini_api_key_here
```
### 5. Run SyllabusPilot
```bash
adk web
```
Open [http://localhost:8000](http://localhost:8000) in your browser, upload your syllabus, and start planning!
---
## 👥 Hackathon Submission
- **Title**: SyllabusPilot
- **One-line pitch**: Turn messy syllabi into a balanced Google Calendar study schedule in seconds.
- **Challenge Track**: Student Productivity / AI Agents
- **Demo Highlights**: Ingesting a messy syllabus, answering study pace questions, generating `plan.ics`, and showing study blocks pop up in Google Calendar.
