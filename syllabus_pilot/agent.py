import os
from google.adk.agents.llm_agent import Agent

from syllabus_pilot.tools.calendar import make_ics
from syllabus_pilot.tools.planner import build_plan
from syllabus_pilot.tools.checks import check_items
from syllabus_pilot.tools.dates import normalize_date
from syllabus_pilot.tools.pdf import read_pdf

# Directory for modular prompt files
PROMPTS_DIR = os.path.join(os.path.dirname(__file__), "prompts")


def _read_prompt(filename: str) -> str:
    path = os.path.join(PROMPTS_DIR, filename)
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return f.read()
    return ""


# Assemble modular instructions
instruction_text = f"""You are SyllabusPilot, an expert academic planner assistant.
Your goal is to transform any messy syllabus (PDF, text, or image) into an actionable study plan and calendar.

{_read_prompt("extract.md")}

{_read_prompt("questions.md")}

{_read_prompt("plan.md")}
"""

root_agent = Agent(
    model="gemini-3.8-flash",
    name="syllabus_pilot",
    description="An academic agent that extracts deadlines and builds balanced study schedules.",
    instruction=instruction_text,
    tools=[make_ics, build_plan, check_items, normalize_date, read_pdf],
)
