import dotenv from 'dotenv';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
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

// Tried in order until one succeeds. Checked against the API on 2026-11-02:
// gemini-2.5-flash / 2.5-flash-lite now return 404 for new users, and
// gemini-3.8-flash was overloaded (503 / timeouts), so it sits near the end.
const GEMINI_MODELS = [
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.8-flash',
  'gemini-flash-lite-latest',
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

function isAuthError(message: string): boolean {
  return /API key|API_KEY_INVALID|PERMISSION_DENIED|UNAUTHENTICATED|\b401\b|\b403\b/i.test(message);
}

type ModelAttempt = { model: string; ok: boolean; ms: number; error?: string };

// Error thrown when every model fails; carries the per-model attempts for the UI.
class GeminiFailedError extends Error {
  attempts: ModelAttempt[];
  constructor(message: string, attempts: ModelAttempt[]) {
    super(message);
    this.attempts = attempts;
  }
}

// Tries each real Gemini model in turn. Never returns placeholder data:
// if every model fails, a GeminiFailedError with every model's error is thrown.
async function generateJsonFromGemini(params: {
  ai: GoogleGenAI;
  contents: any;
  schema: any;
  label: string;
}): Promise<{ data: any; model: string; rawText: string; attempts: ModelAttempt[] }> {
  let lastError: Error | null = null;
  const attempts: ModelAttempt[] = [];
  for (const model of GEMINI_MODELS) {
    const attemptStart = Date.now();
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
        60000,
        `${model} timed out after 60 seconds`,
      );
      const rawText = String(response.text ?? '').trim();
      if (!rawText) {
        throw new Error(`${model} returned an empty response`);
      }
      let parsed: any;
      try {
        parsed = JSON.parse(rawText);
      } catch {
        throw new Error(`${model} returned text that is not valid JSON: ${rawText.slice(0, 200)}`);
      }
      console.log(`[${params.label}] Success with ${model}`);
      attempts.push({ model, ok: true, ms: Date.now() - attemptStart });
      return { data: parsed, model, rawText, attempts };
    } catch (err: any) {
      lastError = err instanceof Error ? err : new Error(String(err?.message || err));
      attempts.push({ model, ok: false, ms: Date.now() - attemptStart, error: lastError.message });
      console.error(`[${params.label}] Model ${model} failed: ${lastError.message}`);
      if (isAuthError(lastError.message)) {
        console.error(
          `[${params.label}] This looks like a GEMINI_API_KEY problem, so the other models were skipped.`,
        );
        break;
      }
    }
  }
  throw new GeminiFailedError(
    `All ${attempts.length} Gemini model(s) failed. Last error: ${lastError?.message || 'unknown'}`,
    attempts,
  );
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

function formatIcsDateFallback(dtStr: string, defaultHour = 18, durationHours = 2): { dtstart: string; dtend: string } | null {
  const clean = (dtStr || '').trim();
  let dateObj = new Date(clean);
  if (!clean || isNaN(dateObj.getTime())) {
    return null;
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
    const formatted = formatIcsDateFallback(ev.start, defaultHr, duration);
    if (!formatted) {
      console.warn(`[make_ics] Skipping event "${ev.title}" - invalid start date: ${JSON.stringify(ev.start)}`);
      return;
    }
    const { dtstart, dtend } = formatted;

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
    // Python is unavailable: write the same events with the built-in JS writer (no invented events).
    console.warn('[make_ics] Python not found on PATH - writing plan.ics with the built-in JS writer instead.');
    const fallbackContent = buildFallbackIcs(events, safeFilename);
    return {
      icsContent: fallbackContent,
      executedWithPython: false,
      pythonVersion: 'Python not found - built-in JS .ics writer used',
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

    child.on('error', (err) => {
      console.warn(`[make_ics] Could not start ${selectedPython}: ${err.message} - using built-in JS writer.`);
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
        console.warn(`[make_ics] make_ics.py exited with code ${code} - using built-in JS writer. stderr:`, stderrData);
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

    const fileBytes = file?.base64Data ? Math.round((file.base64Data.length * 3) / 4) : 0;
    console.log(
      file?.base64Data
        ? `[Extract] Received file "${file.fileName || 'unnamed'}" (${file.mimeType}, ${(fileBytes / 1024).toFixed(1)} KB)`
        : `[Extract] Received pasted text (${text!.trim().length} characters)`,
    );

    if (file?.base64Data && !file.mimeType) {
      console.error(`[Extract] File "${file.fileName}" arrived without a mimeType - refusing to send a prompt with no document.`);
      res.status(400).json({ error: `File "${file.fileName || 'unnamed'}" has no MIME type, so it cannot be sent to Gemini.` });
      return;
    }

    const ai = getAiClient();
    const parts: any[] = [];

    // Summary of exactly what is sent to Gemini, returned to the UI for verification.
    let sentToModel: Record<string, any>;
    if (file?.base64Data) {
      const decoded = Buffer.from(file.base64Data, 'base64');
      sentToModel = {
        kind: 'file',
        fileName: file.fileName || null,
        mimeType: file.mimeType,
        decodedBytes: decoded.length,
        sha256: crypto.createHash('sha256').update(decoded).digest('hex'),
        base64Head: file.base64Data.slice(0, 80),
      };
      parts.push({
        inlineData: {
          mimeType: file.mimeType,
          data: file.base64Data,
        },
      });
    } else {
      const trimmed = text!.trim();
      sentToModel = {
        kind: 'text',
        characters: trimmed.length,
        sha256: crypto.createHash('sha256').update(trimmed).digest('hex'),
        textHead: trimmed.slice(0, 500),
      };
    }
    console.log('[Extract] Sending to Gemini:', JSON.stringify(sentToModel));

    const extractionPrompt = `You are SyllabusPilot, an expert academic syllabus parser and study planning agent.
Analyze the provided course syllabus carefully. Syllabi can be messy, have instructor self-corrections (e.g. "due Oct 14, wait no—Friday Oct 16"), drop-lowest policies, or multi-part project weights.

Your job:
1. Extract the course metadata (courseCode, courseTitle, term, instructor, semesterStartDate in YYYY-MM-DD, semesterEndDate in YYYY-MM-DD, and a concise gradingPolicySummary).
2. Find EVERY graded item (what it is, its category, the resolved due date in YYYY-MM-DD or 'TBA' if genuinely unspecified, the rawDateText from the syllabus, how much it counts as weightPercent toward the 100% course grade, whether the date is ambiguous, and any policy details like slip days or drop-lowest rules).
   - Ensure the weightPercent values across all gradedItems accurately reflect the 100% grading breakdown. If a category has multiple items (e.g., 3 Problem Sets worth 15% total), list each individual item with its individual weight (e.g., 5% each).
3. Formulate AT MOST 3 short, high-impact clarifying questions for the student so you can build their personalized week-by-week study plan (for example: how many hours per week they can study, which days/times they prefer for study blocks, and how early they want to start major exams/projects). Provide 3-4 concise quickOptions for each question and a sensible default answer.
4. Set sourceQuote to a verbatim excerpt (up to ~300 characters) copied exactly from the top of the provided document, so the student can verify which document you read.

Use ONLY information found in the provided document. Never invent graded items, dates, or course details. If a metadata field is not in the document, use an empty string. If the document is not a syllabus or contains no graded items, return an empty gradedItems array.

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
        sourceQuote: {
          type: Type.STRING,
          description: 'Verbatim excerpt copied from the top of the provided document.',
        },
      },
      required: ['course', 'gradedItems', 'questions', 'sourceQuote'],
    };

    sentToModel.promptCharacters = extractionPrompt.length;

    let parsed: any;
    let modelUsed = '';
    let rawModelText = '';
    let attempts: ModelAttempt[] = [];
    try {
      const result = await generateJsonFromGemini({
        ai,
        contents: parts,
        schema: extractionSchema,
        label: 'Extract',
      });
      parsed = result.data;
      modelUsed = result.model;
      rawModelText = result.rawText;
      attempts = result.attempts;
    } catch (genError: any) {
      console.error(`[Extract] Gemini failed: ${genError?.message}`);
      res.status(502).json({
        error: `Gemini extraction failed: ${genError?.message || 'unknown error'}`,
        attempts: genError?.attempts || [],
        sentToModel,
      });
      return;
    }

    const durationMs = Date.now() - startTime;
    if (!Array.isArray(parsed.gradedItems)) parsed.gradedItems = [];
    // Enforce hard cap of at most 3 questions
    parsed.questions = Array.isArray(parsed.questions) ? parsed.questions.slice(0, 3) : [];

    console.log(
      `[Extract] Success with ${modelUsed} in ${(durationMs / 1000).toFixed(1)}s: ` +
        `course="${parsed.course?.courseCode || ''} ${parsed.course?.courseTitle || ''}", ` +
        `${parsed.gradedItems.length} graded items, ${parsed.questions.length} questions`,
    );
    for (const item of parsed.gradedItems) {
      console.log(`  - ${item.title} | ${item.category} | ${item.dueDate} | ${item.weightPercent}%`);
    }
    console.log(`[Extract] Source quote: ${JSON.stringify(String(parsed.sourceQuote || '').slice(0, 300))}`);

    res.json({
      ...parsed,
      meta: {
        source: file?.base64Data ? 'file' : 'text',
        fileName: file?.fileName || null,
        mimeType: file?.mimeType || null,
        fileBytes: fileBytes || null,
        textLength: file?.base64Data ? null : text!.trim().length,
        model: modelUsed,
        durationMs,
        extractedAt: new Date().toISOString(),
        attempts,
        sentToModel,
        rawModelText,
      },
    });
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
      const result = await generateJsonFromGemini({
        ai,
        contents: prompt,
        schema: planSchema,
        label: 'Plan',
      });
      parsedPlan = result.data;
      console.log(
        `[Plan] Success with ${result.model} in ${((Date.now() - startTime) / 1000).toFixed(1)}s ` +
          `(${parsedPlan.weeks?.length ?? 0} weeks, ${parsedPlan.events?.length ?? 0} events)`,
      );
    } catch (genError: any) {
      console.error(`[Plan] Gemini failed: ${genError?.message}`);
      if (genError?.stack) console.error(genError.stack);
      res.status(502).json({
        error: `Gemini study-plan generation failed: ${genError?.message || 'unknown error'}. Check GEMINI_API_KEY in .env and the server terminal for details.`,
      });
      return;
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

// Return JSON (not an HTML page) for body-parser errors such as an oversized upload.
app.use('/api', (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!err) return next();
  const status = err.status || err.statusCode || 500;
  const message =
    err.type === 'entity.too.large'
      ? 'Uploaded file is too large (limit is about 18 MB after encoding). Try a smaller PDF or image.'
      : err.message || 'Request failed';
  console.error(`[${req.method} ${req.originalUrl}] ${status}: ${message}`);
  res.status(status).json({ error: message });
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
