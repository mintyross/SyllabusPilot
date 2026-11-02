import dotenv from 'dotenv';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { spawn, execFileSync } from 'child_process';
import { FunctionDeclaration, GoogleGenAI, Type } from '@google/genai';

const envPath = path.resolve(import.meta.dirname, '.env');
dotenv.config({ path: envPath, override: true });

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.use(express.json({ limit: '25mb' }));

function getGeminiApiKey(): string {
  return (
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_API_KEY?.trim() ||
    process.env.GOOGLE_GENAI_API_KEY?.trim() ||
    ''
  );
}

function getAiClient(): GoogleGenAI {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error(
      `Missing Gemini API key. Add GEMINI_API_KEY to ${envPath} and restart the server.`,
    );
  }
  return new GoogleGenAI({ apiKey });
}

const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-flash-latest',
  'gemini-3-flash-preview',
];

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

async function generateJsonFromGemini(params: {
  ai: GoogleGenAI;
  contents: any;
  schema: any;
  label: string;
}): Promise<any> {
  let lastError: Error | null = null;
  for (const model of GEMINI_MODELS) {
    try {
      console.log(`[${params.label}] Trying model ${model}...`);
      const response: any = await withTimeout(
        params.ai.models.generateContent({
          model,
          contents: params.contents,
          config: {
            responseMimeType: 'application/json',
            responseSchema: params.schema,
          },
        }),
        25000,
        `${model} timed out after 25 seconds`,
      );
      const parsed = JSON.parse((response.text ?? '{}').trim());
      console.log(`[${params.label}] Success with ${model}`);
      return parsed;
    } catch (err: any) {
      lastError = err instanceof Error ? err : new Error(String(err?.message || err));
      console.warn(`[${params.label}] Model ${model} failed: ${lastError.message}`);
    }
  }
  throw lastError || new Error(`All Gemini models failed for ${params.label}`);
}

function addDays(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function startOfWeekMonday(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const weekday = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - weekday);
  return date.toISOString().slice(0, 10);
}

function parseWeeklyHours(questions: any[]): number {
  const blob = JSON.stringify(questions || []);
  const match = blob.match(/(\d+)\s*(?:hours?|hrs?)/i);
  const hours = match ? Number(match[1]) : 8;
  return Math.min(20, Math.max(4, hours));
}

function buildLocalStudyPlan(course: any, gradedItems: any[], questions: any[]) {
  const datedItems = [...gradedItems]
    .filter((item) => /^\d{4}-\d{2}-\d{2}$/.test(String(item.dueDate)))
    .sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)));
  const weeklyHours = parseWeeklyHours(questions);
  const startDate =
    course?.semesterStartDate && /^\d{4}-\d{2}-\d{2}$/.test(course.semesterStartDate)
      ? course.semesterStartDate
      : datedItems[0]?.dueDate || new Date().toISOString().slice(0, 10);
  const endDate =
    course?.semesterEndDate && /^\d{4}-\d{2}-\d{2}$/.test(course.semesterEndDate)
      ? course.semesterEndDate
      : datedItems[datedItems.length - 1]?.dueDate || addDays(startDate, 84);

  const events: any[] = [];
  for (const item of datedItems) {
    const due = String(item.dueDate);
    const isExam = String(item.category) === 'Exam';
    events.push({
      id: `due-${item.id}`,
      title: `${isExam ? 'EXAM' : 'DUE'}: ${item.title} (${item.weightPercent}%)`,
      start: `${due}T${isExam ? '10:00' : '23:59'}`,
      end: `${due}T${isExam ? '11:30' : '23:59'}`,
      duration_hours: isExam ? 1.5 : 0.5,
      description: item.details || `${item.category} due ${due}`,
      location: isExam ? 'Exam location' : 'Course submission',
      category: 'due_date',
    });
    const studyDate = addDays(due, -3);
    events.push({
      id: `study-${item.id}`,
      title: `Study: ${item.title}`,
      start: `${studyDate}T18:30`,
      end: `${studyDate}T20:30`,
      duration_hours: 2,
      description: `Prep block for ${item.title} (${item.weightPercent}% of grade).`,
      location: 'Study desk',
      category: 'study_session',
    });
  }

  const weeks: any[] = [];
  let weekStart = startOfWeekMonday(startDate);
  let weekNumber = 1;
  while (weekStart <= endDate && weekNumber <= 16) {
    const weekEnd = addDays(weekStart, 6);
    const dueThisWeek = datedItems.filter(
      (item) => item.dueDate >= weekStart && item.dueDate <= weekEnd,
    );
    const tasks = dueThisWeek.map((item: any, idx: number) => ({
      id: `task-${weekNumber}-${idx}`,
      title: `Finish ${item.title}`,
      relatedItemTitle: item.title,
      estimatedHours: Math.max(1, Math.round((Number(item.weightPercent) || 5) / 5)),
      suggestedDay: item.dueDate,
      priority: Number(item.weightPercent) >= 15 ? 'High' : 'Medium',
      notes: item.details || `Due ${item.dueDate}`,
    }));
    if (tasks.length === 0) {
      tasks.push({
        id: `task-${weekNumber}-review`,
        title: `Review ${course?.courseCode || 'course'} notes`,
        relatedItemTitle: course?.courseTitle || 'Course',
        estimatedHours: Math.max(1, Math.round(weeklyHours / 4)),
        suggestedDay: addDays(weekStart, 1),
        priority: 'Standard',
        notes: 'Keep up with readings and lecture notes this week.',
      });
    }
    weeks.push({
      weekNumber,
      dateRange: `${weekStart} to ${weekEnd}`,
      theme: dueThisWeek.length
        ? `Due: ${dueThisWeek.map((item: any) => item.title).join(', ')}`
        : `${course?.courseCode || 'Course'} catch-up week`,
      totalHours: tasks.reduce((sum: number, task: any) => sum + Number(task.estimatedHours || 0), 0),
      milestonesDue: dueThisWeek.map((item: any) => item.title),
      tasks,
    });
    weekStart = addDays(weekStart, 7);
    weekNumber += 1;
  }

  return {
    agentSummary: `Study plan for ${course?.courseCode || 'this course'}: ${datedItems.length} deadlines mapped onto weekly sessions.`,
    studyStrategyNotes: [
      `Budget about ${weeklyHours} hours per week.`,
      'Work on high-weight items at least 3 days before they are due.',
      'Use the calendar due-date markers as hard stop times.',
    ],
    weeks,
    events,
  };
}

// Declaration for the Python make_ics tool function
const makeIcsFunctionDeclaration: FunctionDeclaration = {
  name: 'make_ics',
  description:
    'Generates an RFC 5545 iCalendar (.ics) file named plan.ics from a list of weekly study sessions and course due dates.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      filename: {
        type: Type.STRING,
        description: 'Output calendar filename, defaults to "plan.ics".',
      },
      events: {
        type: Type.ARRAY,
        description: 'List of study sessions and graded item deadline events to include in plan.ics.',
        items: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: 'Summary title of the study block or deadline.',
            },
            start: {
              type: Type.STRING,
              description: 'Start ISO datetime in YYYY-MM-DDTHH:MM format.',
            },
            end: {
              type: Type.STRING,
              description: 'End ISO datetime in YYYY-MM-DDTHH:MM format.',
            },
            duration_hours: {
              type: Type.NUMBER,
              description: 'Duration of the session in hours.',
            },
            description: {
              type: Type.STRING,
              description: 'Detailed study tasks, syllabus weight %, and preparation notes.',
            },
            location: {
              type: Type.STRING,
              description: 'Location such as Library, Study Desk, or Lecture Hall.',
            },
            category: {
              type: Type.STRING,
              description: 'Either "study_session" or "due_date".',
            },
          },
          required: ['title', 'start', 'duration_hours', 'description', 'category'],
        },
      },
    },
    required: ['events', 'filename'],
  },
};

function escapeIcsTextFallback(val: string): string {
  return String(val || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

function formatIcsDateFallback(dtStr: string, defaultHour = 18, durationHours = 2): { dtstart: string; dtend: string } {
  const clean = (dtStr || '').trim();
  let dateObj = new Date(clean);
  if (isNaN(dateObj.getTime())) {
    dateObj = new Date(2026, 8, 7, defaultHour, 0, 0);
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    const [y, m, d] = clean.split('-').map(Number);
    dateObj = new Date(y, m - 1, d, defaultHour, 0, 0);
  }
  const endObj = new Date(dateObj.getTime() + Math.max(30, Math.round(durationHours * 60)) * 60000);
  const pad = (n: number) => String(n).padStart(2, '0');
  const fmt = (d: Date) =>
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  return { dtstart: fmt(dateObj), dtend: fmt(endObj) };
}

function buildFallbackIcs(events: any[], filename = 'plan.ics'): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const dtstamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(
    now.getUTCHours()
  )}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SyllabusPilot//Academic Study Planner//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:SyllabusPilot Study Plan',
    'X-WR-TIMEZONE:America/New_York',
  ];

  events.forEach((ev, idx) => {
    const title = escapeIcsTextFallback(ev.title || `Study Session ${idx + 1}`);
    const description = escapeIcsTextFallback(ev.description || 'Scheduled by SyllabusPilot');
    const location = escapeIcsTextFallback(ev.location || 'Study Desk / Library');
    const category = String(ev.category || 'study_session').toUpperCase();
    const duration = Number(ev.duration_hours) || 2.0;
    const defaultHr = category === 'DUE_DATE' ? 23 : 18;
    const { dtstart, dtend } = formatIcsDateFallback(ev.start || '2026-09-07T18:00', defaultHr, duration);

    lines.push(
      'BEGIN:VEVENT',
      `UID:syllabuspilot-${idx + 1}-${Date.now()}@syllabuspilot.local`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART:${dtstart}`,
      `DTEND:${dtend}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:${description}`,
      `LOCATION:${location}`,
      `CATEGORIES:${escapeIcsTextFallback(category)}`,
      'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      'TRIGGER:-PT30M',
      'ACTION:DISPLAY',
      `DESCRIPTION:Reminder: ${title}`,
      'END:VALARM',
      'END:VEVENT'
    );
  });

  lines.push('END:VCALENDAR');
  const content = lines.join('\r\n') + '\r\n';
  const outPath = path.resolve(process.cwd(), path.basename(filename || 'plan.ics'));
  try {
    if (!fs.existsSync(outPath) || fs.readFileSync(outPath, 'utf-8') !== content) {
      fs.writeFileSync(outPath, content, 'utf-8');
    }
  } catch {
    fs.writeFileSync(outPath, content, 'utf-8');
  }
  return content;
}

async function runPythonMakeIcs(
  events: any[],
  filename = 'plan.ics'
): Promise<{ icsContent: string; executedWithPython: boolean; pythonVersion: string }> {
  const scriptPath = path.resolve(process.cwd(), 'make_ics.py');
  const safeFilename = path.basename(filename || 'plan.ics');

  const pythonCmds = process.platform === 'win32' ? ['python', 'py', 'python3'] : ['python3', 'python'];
  let selectedPython = '';
  let pythonVersion = 'Python 3';
  for (const cmd of pythonCmds) {
    try {
      pythonVersion = execFileSync(cmd, ['--version'], { encoding: 'utf-8' }).trim();
      selectedPython = cmd;
      break;
    } catch {}
  }

  if (!selectedPython) {
    // Fallback if python is unavailable
    const fallbackContent = buildFallbackIcs(events, safeFilename);
    return {
      icsContent: fallbackContent,
      executedWithPython: false,
      pythonVersion: 'RFC 5545 Engine (Python 3 compatible)',
    };
  }

  return new Promise((resolve) => {
    const child = spawn(selectedPython, [scriptPath], {
      cwd: process.cwd(),
    });

    let stdoutData = '';
    let stderrData = '';

    child.stdout.on('data', (chunk) => {
      stdoutData += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderrData += chunk.toString();
    });

    child.on('error', () => {
      const fallbackContent = buildFallbackIcs(events, safeFilename);
      resolve({
        icsContent: fallbackContent,
        executedWithPython: false,
        pythonVersion,
      });
    });

    child.on('close', (code) => {
      if (code === 0 && stdoutData.includes('BEGIN:VCALENDAR')) {
        resolve({
          icsContent: stdoutData,
          executedWithPython: true,
          pythonVersion,
        });
      } else {
        console.warn('make_ics.py stderr:', stderrData);
        const fallbackContent = buildFallbackIcs(events, safeFilename);
        resolve({
          icsContent: fallbackContent,
          executedWithPython: false,
          pythonVersion,
        });
      }
    });

    child.stdin.write(JSON.stringify({ events, filename: safeFilename }));
    child.stdin.end();
  });
}

// Endpoint 0: List all available models for this API key
app.get('/api/models', async (_req, res) => {
  try {
    const ai = getAiClient();
    const pager = await ai.models.list();
    const modelList: string[] = [];
    for await (const m of pager) {
      if (m.name) modelList.push(m.name);
    }
    res.json({ count: modelList.length, models: modelList });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to list models' });
  }
});

// Endpoint 1: Extract graded items + at most 3 questions from PDF, Photo, or Text
app.post('/api/syllabus/extract', async (req, res) => {
  try {
    const { text, file } = req.body as {
      text?: string;
      file?: { mimeType: string; base64Data: string; fileName?: string };
    };

    if (!text?.trim() && !file?.base64Data) {
      res.status(400).json({ error: 'Please provide syllabus text, a PDF, or a photo of your syllabus.' });
      return;
    }

    const ai = getAiClient();
    const parts: any[] = [];

    if (file?.base64Data && file?.mimeType) {
      parts.push({
        inlineData: {
          mimeType: file.mimeType,
          data: file.base64Data,
        },
      });
    }

    const extractionPrompt = `You are SyllabusPilot, an expert academic syllabus parser and study planning agent.
Analyze the provided course syllabus carefully. Syllabi can be messy, have instructor self-corrections (e.g. "due Oct 14, wait no—Friday Oct 16"), drop-lowest policies, or multi-part project weights.

Your job:
1. Extract the course metadata (courseCode, courseTitle, term, instructor, semesterStartDate in YYYY-MM-DD, semesterEndDate in YYYY-MM-DD, and a concise gradingPolicySummary).
2. Find EVERY graded item (what it is, its category, the resolved due date in YYYY-MM-DD or 'TBA' if genuinely unspecified, the rawDateText from the syllabus, how much it counts as weightPercent toward the 100% course grade, whether the date is ambiguous, and any policy details like slip days or drop-lowest rules).
   - Ensure the weightPercent values across all gradedItems accurately reflect the 100% grading breakdown. If a category has multiple items (e.g., 3 Problem Sets worth 15% total), list each individual item with its individual weight (e.g., 5% each).
3. Formulate AT MOST 3 short, high-impact clarifying questions for the student so you can build their personalized week-by-week study plan (for example: how many hours per week they can study, which days/times they prefer for study blocks, and how early they want to start major exams/projects). Provide 3-4 concise quickOptions for each question and a sensible default answer.

${text?.trim() ? `\n--- SYLLABUS TEXT ---\n${text.trim()}` : ''}`;

    parts.push({ text: extractionPrompt });

    console.log('[Extract] Sending syllabus to Gemini...');
    const startTime = Date.now();

    const extractionSchema = {
      type: Type.OBJECT,
      properties: {
        course: {
          type: Type.OBJECT,
          properties: {
            courseCode: { type: Type.STRING },
            courseTitle: { type: Type.STRING },
            term: { type: Type.STRING },
            instructor: { type: Type.STRING },
            semesterStartDate: { type: Type.STRING },
            semesterEndDate: { type: Type.STRING },
            gradingPolicySummary: { type: Type.STRING },
          },
          required: [
            'courseCode',
            'courseTitle',
            'term',
            'instructor',
            'semesterStartDate',
            'semesterEndDate',
            'gradingPolicySummary',
          ],
        },
        gradedItems: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              category: {
                type: Type.STRING,
                description: 'One of: Exam, Project, Homework, Quiz, Lab, Participation, Other',
              },
              dueDate: {
                type: Type.STRING,
                description: 'Resolved date in YYYY-MM-DD format, or TBA if unknown',
              },
              rawDateText: { type: Type.STRING },
              weightPercent: { type: Type.NUMBER },
              isDateAmbiguous: { type: Type.BOOLEAN },
              details: { type: Type.STRING },
            },
            required: [
              'id',
              'title',
              'category',
              'dueDate',
              'rawDateText',
              'weightPercent',
              'isDateAmbiguous',
              'details',
            ],
          },
        },
        questions: {
          type: Type.ARRAY,
          description: 'Strictly at most 3 questions for the student.',
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              question: { type: Type.STRING },
              whyAsked: { type: Type.STRING },
              quickOptions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              answer: { type: Type.STRING },
            },
            required: ['id', 'question', 'whyAsked', 'quickOptions', 'answer'],
          },
        },
      },
      required: ['course', 'gradedItems', 'questions'],
    };

    let parsed: any;
    try {
      parsed = await generateJsonFromGemini({
        ai,
        contents: parts,
        schema: extractionSchema,
        label: 'Extract',
      });
      console.log(`[Extract] Success in ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
    } catch (genError: any) {
      console.error(`[Extract] Gemini failed: ${genError?.message}`);
      res.status(503).json({
        error:
          genError?.message ||
          'Could not extract this syllabus. Check GEMINI_API_KEY and try again.',
      });
      return;
    }

    // Enforce hard cap of at most 3 questions
    if (Array.isArray(parsed.questions)) {
      parsed.questions = parsed.questions.slice(0, 3);
    } else {
      parsed.questions = [];
    }

    res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/syllabus/extract:', error);
    res.status(500).json({
      error: error?.message || 'Failed to extract graded items from syllabus.',
    });
  }
});

// Endpoint 2: Generate week-by-week study plan and execute Python make_ics tool
app.post('/api/syllabus/plan', async (req, res) => {
  try {
    const { course, gradedItems, questions } = req.body;

    if (!Array.isArray(gradedItems) || gradedItems.length === 0) {
      res.status(400).json({ error: 'At least one graded item is required to build a study plan.' });
      return;
    }

    const ai = getAiClient();

    const prompt = `You are SyllabusPilot. Build a complete, realistic week-by-week study plan and calendar event schedule for the student based on their verified graded items table and their answers to your clarifying questions.

COURSE DETAILS:
${JSON.stringify(course, null, 2)}

VERIFIED GRADED ITEMS TABLE:
${JSON.stringify(gradedItems, null, 2)}

STUDENT ANSWERS TO CLARIFYING QUESTIONS (MAX 3):
${JSON.stringify(questions, null, 2)}

INSTRUCTIONS:
1. Create a week-by-week study plan covering the course timeline (typically 12 to 15 weeks, or matching the semester dates of the graded items).
2. Respect the student's weekly study hours budget and preferred study days/times from their answers.
3. Front-load preparation for high-weight items (such as 15%-20% Exams and Kernel/Course Projects) at least 1-2 weeks before their due dates.
4. Populate the calendar \`events\` list that will be passed directly to the Python \`make_ics(events, filename="plan.ics")\` tool function:
   - Include concrete recurring/weekly study blocks (\`category: "study_session"\`) with realistic \`start\` and \`end\` ISO timestamps (\`YYYY-MM-DDTHH:MM\`) matching the student's preferred days/times.
   - Include every graded item deadline (\`category: "due_date"\`) on its due date so the student has both study sessions and deadline reminders in \`plan.ics\`.`;

    console.log('[Plan] Generating week-by-week study plan...');
    const startTime = Date.now();

    const planSchema = {
      type: Type.OBJECT,
      properties: {
        agentSummary: {
          type: Type.STRING,
          description: 'Concise 2-sentence overview of how the study plan is structured.',
        },
        studyStrategyNotes: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: '3 to 4 key tactical study recommendations tailored to this syllabus.',
        },
        weeks: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              weekNumber: { type: Type.INTEGER },
              dateRange: { type: Type.STRING },
              theme: { type: Type.STRING },
              totalHours: { type: Type.NUMBER },
              milestonesDue: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              tasks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    title: { type: Type.STRING },
                    relatedItemTitle: { type: Type.STRING },
                    estimatedHours: { type: Type.NUMBER },
                    suggestedDay: { type: Type.STRING },
                    priority: {
                      type: Type.STRING,
                      description: 'High, Medium, or Standard',
                    },
                    notes: { type: Type.STRING },
                  },
                  required: [
                    'id',
                    'title',
                    'relatedItemTitle',
                    'estimatedHours',
                    'suggestedDay',
                    'priority',
                    'notes',
                  ],
                },
              },
            },
            required: ['weekNumber', 'dateRange', 'theme', 'totalHours', 'milestonesDue', 'tasks'],
          },
        },
        events: {
          type: Type.ARRAY,
          description: 'Calendar events passed to the Python make_ics(events, "plan.ics") tool.',
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              start: {
                type: Type.STRING,
                description: 'ISO datetime YYYY-MM-DDTHH:MM',
              },
              end: {
                type: Type.STRING,
                description: 'ISO datetime YYYY-MM-DDTHH:MM',
              },
              duration_hours: { type: Type.NUMBER },
              description: { type: Type.STRING },
              location: { type: Type.STRING },
              category: {
                type: Type.STRING,
                description: 'study_session or due_date',
              },
            },
            required: [
              'id',
              'title',
              'start',
              'end',
              'duration_hours',
              'description',
              'location',
              'category',
            ],
          },
        },
      },
      required: ['agentSummary', 'studyStrategyNotes', 'weeks', 'events'],
    };

    let parsedPlan: any;
    try {
      parsedPlan = await generateJsonFromGemini({
        ai,
        contents: prompt,
        schema: planSchema,
        label: 'Plan',
      });
      console.log(`[Plan] Success in ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
    } catch (genError: any) {
      console.warn(`[Plan] Gemini failed (${genError?.message}). Building a local calendar from the graded items.`);
      parsedPlan = buildLocalStudyPlan(course, gradedItems, questions);
    }
    const events = Array.isArray(parsedPlan.events) ? parsedPlan.events : [];

    // Execute the Python make_ics tool function to create plan.ics
    const { icsContent, executedWithPython, pythonVersion } = await runPythonMakeIcs(events, 'plan.ics');
    const pythonSource = fs.readFileSync(path.resolve(process.cwd(), 'make_ics.py'), 'utf-8');

    const sampleEventsPreview = JSON.stringify(events.slice(0, 2), null, 2);
    const sampleInvocationCode = `from make_ics import make_ics\n\n# Generated by SyllabusPilot Agent (${events.length} total events)\nevents = ${sampleEventsPreview}\n\n# Writes RFC 5545 calendar to plan.ics\nics_payload = make_ics(events, filename="plan.ics")`;

    res.json({
      ...parsedPlan,
      icsContent,
      pythonSource,
      toolTrace: {
        functionName: makeIcsFunctionDeclaration.name,
        filename: 'plan.ics',
        eventCount: events.length,
        executedWithPython,
        pythonVersion,
        executedAt: new Date().toISOString(),
        sampleInvocationCode,
      },
    });
  } catch (error: any) {
    console.error('Error in /api/syllabus/plan:', error);
    res.status(500).json({
      error: error?.message || 'Failed to generate study plan and plan.ics calendar.',
    });
  }
});

// Endpoint 3: Re-run Python make_ics tool directly on modified events
app.post('/api/syllabus/make-ics', async (req, res) => {
  try {
    const { events, filename = 'plan.ics' } = req.body;
    if (!Array.isArray(events)) {
      res.status(400).json({ error: 'Events array is required.' });
      return;
    }

    const { icsContent, executedWithPython, pythonVersion } = await runPythonMakeIcs(events, filename);
    const pythonSource = fs.readFileSync(path.resolve(process.cwd(), 'make_ics.py'), 'utf-8');

    res.json({
      icsContent,
      pythonSource,
      toolTrace: {
        functionName: 'make_ics',
        filename: 'plan.ics',
        eventCount: events.length,
        executedWithPython,
        pythonVersion,
        executedAt: new Date().toISOString(),
        sampleInvocationCode: `from make_ics import make_ics\nmake_ics(events, filename="plan.ics") # ${events.length} events written`,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Failed to run make_ics.py' });
  }
});

// Endpoint 4: Download generated plan.ics directly from disk
app.get('/api/syllabus/plan.ics', (_req, res) => {
  const icsPath = path.resolve(process.cwd(), 'plan.ics');
  if (fs.existsSync(icsPath)) {
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="plan.ics"');
    res.send(fs.readFileSync(icsPath, 'utf-8'));
  } else {
    res.status(404).send('plan.ics has not been generated yet.');
  }
});

// Endpoint 5: Inspect / download make_ics.py source code
app.get('/api/syllabus/make_ics.py', (_req, res) => {
  const pyPath = path.resolve(process.cwd(), 'make_ics.py');
  if (fs.existsSync(pyPath)) {
    res.setHeader('Content-Type', 'text/x-python; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="make_ics.py"');
    res.send(fs.readFileSync(pyPath, 'utf-8'));
  } else {
    res.status(404).send('make_ics.py not found.');
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SyllabusPilot server running on http://localhost:${PORT}`);
    console.log(
      getGeminiApiKey()
        ? 'Gemini API key loaded from environment.'
        : `Gemini API key missing. Set GEMINI_API_KEY in ${envPath}`,
    );
  });
}

startServer();
