import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  FileText,
  Upload,
  Calendar as CalendarIcon,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  Download,
  ArrowRight,
  Sparkles,
  Clock,
  RefreshCw,
  Image as ImageIcon,
  FileUp,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  ListChecks,
  MapPin,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import {
  GradedItem,
  GradedItemCategory,
  AgentQuestion,
  CourseMetadata,
  StudyPlanResult,
  CalendarEventItem,
} from './types';
import {
  MESSY_CS_SYLLABUS_TEXT,
  MESSY_CS_SYLLABUS_TITLE,
  MESSY_CS_SYLLABUS_HIGHLIGHTS,
  MESSY_CS_PRELOADED_EXTRACTION,
  DEFAULT_CS3410_STUDY_PLAN,
} from './data/messySyllabus';

type ActiveStage = 'input' | 'review' | 'plan';
type InputMode = 'text' | 'upload';
type PlanViewMode = 'calendar' | 'weekly';

const CATEGORIES: GradedItemCategory[] = [
  'Exam',
  'Project',
  'Homework',
  'Quiz',
  'Lab',
  'Participation',
  'Other',
];

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function App() {
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [activeStage, setActiveStage] = useState<ActiveStage>('plan');
  const [inputMode, setInputMode] = useState<InputMode>('text');
  const [planViewMode, setPlanViewMode] = useState<PlanViewMode>('calendar');
  const [distributionView, setDistributionView] = useState<'chart' | 'list'>('chart');

  // Stage 1: Syllabus Input State
  const [syllabusText, setSyllabusText] = useState<string>(MESSY_CS_SYLLABUS_TEXT);
  const [uploadedFile, setUploadedFile] = useState<{
    fileName: string;
    mimeType: string;
    base64Data: string;
    previewUrl?: string;
    sizeKb: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stage 2: Extracted Graded Items & <=3 Questions State
  const [course, setCourse] = useState<CourseMetadata>(MESSY_CS_PRELOADED_EXTRACTION.course);
  const [gradedItems, setGradedItems] = useState<GradedItem[]>(
    MESSY_CS_PRELOADED_EXTRACTION.gradedItems
  );
  const [questions, setQuestions] = useState<AgentQuestion[]>(
    MESSY_CS_PRELOADED_EXTRACTION.questions
  );
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  // Stage 3: Study Plan & Visual Calendar State
  const [studyPlan, setStudyPlan] = useState<StudyPlanResult>(DEFAULT_CS3410_STUDY_PLAN);
  const [currentMonth, setCurrentMonth] = useState<{ year: number; month: number }>({
    year: 2026,
    month: 9, // 0-indexed: 9 = October 2026 (Midterm & Kernel M1 month)
  });
  const [selectedDateStr, setSelectedDateStr] = useState<string>('2026-10-16');
  const [completedTaskIds, setCompletedTaskIds] = useState<Record<string, boolean>>({});

  // Loading & Feedback States
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState<boolean>(false);
  const [isReRunningIcs, setIsReRunningIcs] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusToast, setStatusToast] = useState<string | null>(null);

  // Ensure plan.ics is generated on backend on initial mount so download is always ready
  useEffect(() => {
    fetch('/api/syllabus/make-ics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        events: DEFAULT_CS3410_STUDY_PLAN.events,
        filename: 'plan.ics',
      }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.icsContent) {
          setStudyPlan((prev) => ({
            ...prev,
            icsContent: data.icsContent,
            pythonSource: data.pythonSource || prev.pythonSource,
            toolTrace: data.toolTrace || prev.toolTrace,
          }));
        }
      })
      .catch(() => {
        // Fallback already in DEFAULT_CS3410_STUDY_PLAN
      });
  }, []);

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    if (next) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const showToast = (msg: string) => {
    setStatusToast(msg);
    setTimeout(() => {
      setStatusToast((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  // Generate sample photographed syllabus handout on Canvas
  const handleGenerateSamplePhoto = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1000;
    canvas.height = 1250;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#f8f6f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#d6d3c9';
    ctx.lineWidth = 2;
    ctx.strokeRect(32, 32, canvas.width - 64, canvas.height - 64);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 22px monospace';
    ctx.fillText('CS 3410: OPERATING SYSTEMS & SYSTEMS PROGRAMMING (FALL 2026)', 56, 80);

    ctx.font = '15px monospace';
    ctx.fillStyle = '#334155';
    const lines = MESSY_CS_SYLLABUS_TEXT.split('\n');
    let y = 120;
    for (const line of lines) {
      if (line.startsWith('===')) continue;
      ctx.fillText(line.slice(0, 82), 56, y);
      y += 24;
      if (y > 1180) break;
    }

    const dataUrl = canvas.toDataURL('image/png');
    const base64Data = dataUrl.split(',')[1] || '';

    setInputMode('upload');
    setUploadedFile({
      fileName: 'cs3410_syllabus_handout_photo.png',
      mimeType: 'image/png',
      base64Data,
      previewUrl: dataUrl,
      sizeKb: Math.round((base64Data.length * 3) / 4 / 1024),
    });
    showToast('Generated sample syllabus photo for testing.');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/webp',
    ];
    if (!validTypes.includes(file.type)) {
      setErrorMessage('Please upload a PDF or an image (PNG, JPG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      const base64Data = result.includes(',') ? result.split(',')[1] : result;
      setUploadedFile({
        fileName: file.name,
        mimeType: file.type,
        base64Data,
        previewUrl: file.type.startsWith('image/') ? result : undefined,
        sizeKb: Math.max(1, Math.round(file.size / 1024)),
      });
      setInputMode('upload');
      setErrorMessage(null);
      showToast(`Attached ${file.name}`);
    };
    reader.readAsDataURL(file);
  };

  // Extract Graded Items & <=3 Questions via Gemini
  const handleExtractSyllabus = async () => {
    setErrorMessage(null);
    setIsExtracting(true);

    try {
      const payload: {
        text?: string;
        file?: { mimeType: string; base64Data: string; fileName?: string };
      } = {};

      if (inputMode === 'upload' && uploadedFile) {
        payload.file = {
          mimeType: uploadedFile.mimeType,
          base64Data: uploadedFile.base64Data,
          fileName: uploadedFile.fileName,
        };
        if (syllabusText.trim()) payload.text = syllabusText;
      } else {
        payload.text = syllabusText;
      }

      const response = await fetch('/api/syllabus/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to parse syllabus.');
      }

      if (data.course) setCourse(data.course);
      if (Array.isArray(data.gradedItems)) {
        setGradedItems(
          data.gradedItems.map((item: GradedItem, i: number) => ({
            ...item,
            id: item.id || `item-${Date.now()}-${i}`,
            weightPercent: Number(item.weightPercent) || 0,
          }))
        );
      }
      if (Array.isArray(data.questions)) {
        setQuestions(
          data.questions.slice(0, 3).map((q: AgentQuestion, i: number) => ({
            ...q,
            id: q.id || `q-${i + 1}`,
            answer: q.answer || q.quickOptions?.[0] || '',
          }))
        );
      }

      setActiveStage('review');
      showToast('Extracted graded items and 3 questions.');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Could not extract syllabus items.');
    } finally {
      setIsExtracting(false);
    }
  };

  // Graded Items Table Editing
  const handleUpdateItem = (id: string, field: keyof GradedItem, value: any) => {
    setGradedItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, [field]: field === 'weightPercent' ? Number(value) : value }
          : item
      )
    );
  };

  const handleAddItem = () => {
    const newItem: GradedItem = {
      id: `custom-${Date.now()}`,
      title: 'New Graded Assignment',
      category: 'Homework',
      dueDate: '2026-10-30',
      rawDateText: 'Custom item',
      weightPercent: 5,
      isDateAmbiguous: false,
      details: 'Added manually',
    };
    setGradedItems((prev) => [...prev, newItem]);
  };

  const handleDeleteItem = (id: string) => {
    setGradedItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdateQuestionAnswer = (id: string, answer: string) => {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, answer } : q)));
  };

  const totalWeight = useMemo(() => {
    return gradedItems.reduce((acc, item) => acc + (Number(item.weightPercent) || 0), 0);
  }, [gradedItems]);

  const categoryChartData = useMemo(() => {
    const palette: Record<string, string> = {
      Exam: '#4f46e5',
      Project: '#0284c7',
      Homework: '#0d9488',
      Quiz: '#d97706',
      Lab: '#7c3aed',
      Participation: '#16a34a',
      Other: '#64748b',
    };
    const counts: Record<string, number> = {};
    const weights: Record<string, number> = {};

    for (const item of gradedItems) {
      counts[item.category] = (counts[item.category] || 0) + 1;
      weights[item.category] =
        (weights[item.category] || 0) + (Number(item.weightPercent) || 0);
    }

    return Object.keys(weights)
      .map((category) => ({
        category,
        weight: Number(weights[category].toFixed(1)),
        count: counts[category] || 0,
        color: palette[category] || '#4f46e5',
      }))
      .sort((a, b) => b.weight - a.weight);
  }, [gradedItems]);

  const displayedGradedItems = useMemo(() => {
    const filtered =
      categoryFilter === 'All'
        ? gradedItems
        : gradedItems.filter((item) => item.category === categoryFilter);

    return [...filtered].sort((a, b) => {
      if (a.dueDate === 'TBA') return 1;
      if (b.dueDate === 'TBA') return -1;
      return a.dueDate.localeCompare(b.dueDate);
    });
  }, [gradedItems, categoryFilter]);

  // Generate Study Plan & Execute Python make_ics Tool
  const handleGenerateStudyPlan = async () => {
    setErrorMessage(null);
    setIsGeneratingPlan(true);

    try {
      const response = await fetch('/api/syllabus/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course,
          gradedItems,
          questions: questions.slice(0, 3),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate study plan.');
      }

      setStudyPlan(data);
      // Jump calendar to first event's month
      if (Array.isArray(data.events) && data.events.length > 0) {
        const firstDateStr = String(data.events[0].start || '').slice(0, 10);
        if (/^\d{4}-\d{2}-\d{2}$/.test(firstDateStr)) {
          const [y, m] = firstDateStr.split('-').map(Number);
          setCurrentMonth({ year: y, month: m - 1 });
          setSelectedDateStr(firstDateStr);
        }
      }
      setActiveStage('plan');
      setPlanViewMode('calendar');
      showToast('Created study calendar and saved plan.ics with Python make_ics!');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error generating study plan.');
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  // Visual Calendar Helpers
  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEventItem[]> = {};
    for (const ev of studyPlan.events || []) {
      const datePart = String(ev.start || '').slice(0, 10);
      if (!datePart) continue;
      if (!map[datePart]) map[datePart] = [];
      map[datePart].push(ev);
    }
    // Sort each day's events so due_date appears prominently first, then by time
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => {
        if (a.category !== b.category) {
          return a.category === 'due_date' ? -1 : 1;
        }
        return String(a.start).localeCompare(String(b.start));
      });
    }
    return map;
  }, [studyPlan.events]);

  // Build 6-week (42 cell) or 5-week calendar grid for currentMonth
  const calendarCells = useMemo(() => {
    const { year, month } = currentMonth;
    const firstDayOfMonth = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Convert Sunday=0..Saturday=6 to Monday=0..Sunday=6
    const startWeekday = (firstDayOfMonth.getDay() + 6) % 7;

    const cells: Array<{
      dateStr: string;
      dayNumber: number;
      inCurrentMonth: boolean;
      events: CalendarEventItem[];
    }> = [];

    // Previous month padding days
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = startWeekday - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const prevDate = new Date(year, month - 1, d);
      const dateStr = formatIsoDate(prevDate);
      cells.push({
        dateStr,
        dayNumber: d,
        inCurrentMonth: false,
        events: eventsByDate[dateStr] || [],
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const currDate = new Date(year, month, d);
      const dateStr = formatIsoDate(currDate);
      cells.push({
        dateStr,
        dayNumber: d,
        inCurrentMonth: true,
        events: eventsByDate[dateStr] || [],
      });
    }

    // Trailing days to complete the week row
    const remainder = cells.length % 7;
    if (remainder !== 0) {
      const needed = 7 - remainder;
      for (let d = 1; d <= needed; d++) {
        const nextDate = new Date(year, month + 1, d);
        const dateStr = formatIsoDate(nextDate);
        cells.push({
          dateStr,
          dayNumber: d,
          inCurrentMonth: false,
          events: eventsByDate[dateStr] || [],
        });
      }
    }

    return cells;
  }, [currentMonth, eventsByDate]);

  const selectedDayEvents = useMemo(() => {
    return eventsByDate[selectedDateStr] || [];
  }, [eventsByDate, selectedDateStr]);

  const handlePrevMonth = () => {
    setCurrentMonth((prev) => {
      if (prev.month === 0) return { year: prev.year - 1, month: 11 };
      return { year: prev.year, month: prev.month - 1 };
    });
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => {
      if (prev.month === 11) return { year: prev.year + 1, month: 0 };
      return { year: prev.year, month: prev.month + 1 };
    });
  };

  const handleAddEventOnSelectedDay = async () => {
    const newEv: CalendarEventItem = {
      id: `ev-${Date.now()}`,
      title: `Study: ${course.courseCode} Review Session`,
      start: `${selectedDateStr}T18:30`,
      end: `${selectedDateStr}T20:30`,
      duration_hours: 2,
      description: 'Focused study block added from calendar.',
      location: 'Study Desk',
      category: 'study_session',
    };
    const nextEvents = [...studyPlan.events, newEv];
    setStudyPlan({ ...studyPlan, events: nextEvents });
    await syncEventsWithPythonMakeIcs(nextEvents);
  };

  const handleDeleteCalendarEvent = async (id: string) => {
    const nextEvents = studyPlan.events.filter((ev) => ev.id !== id);
    setStudyPlan({ ...studyPlan, events: nextEvents });
    await syncEventsWithPythonMakeIcs(nextEvents);
  };

  const syncEventsWithPythonMakeIcs = async (eventsToSync: CalendarEventItem[]) => {
    setIsReRunningIcs(true);
    try {
      const response = await fetch('/api/syllabus/make-ics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          events: eventsToSync,
          filename: 'plan.ics',
        }),
      });
      const data = await response.json();
      if (response.ok && data.icsContent) {
        setStudyPlan((prev) => ({
          ...prev,
          events: eventsToSync,
          icsContent: data.icsContent,
          pythonSource: data.pythonSource || prev.pythonSource,
          toolTrace: data.toolTrace || prev.toolTrace,
        }));
        showToast('Updated plan.ics via Python make_ics.');
      }
    } catch {
      // Keep local update
    } finally {
      setIsReRunningIcs(false);
    }
  };

  const handleDownloadIcs = () => {
    if (studyPlan?.icsContent) {
      const blob = new Blob([studyPlan.icsContent], {
        type: 'text/calendar;charset=utf-8',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'plan.ics';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Downloaded plan.ics calendar file.');
    } else {
      window.location.href = '/api/syllabus/plan.ics';
    }
  };

  const toggleTaskCompleted = (taskId: string) => {
    setCompletedTaskIds((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const monthLabel = new Date(currentMonth.year, currentMonth.month, 1).toLocaleDateString(
    'en-US',
    { month: 'long', year: 'numeric' }
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Clean 3-Zone Top Navigation Bar */}
      <header className="grid grid-cols-[1fr_auto] md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-4 gap-y-3 px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30">
        {/* Zone 1: Brand Wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setActiveStage('plan');
          }}
          className="justify-self-start text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 font-display whitespace-nowrap shrink-0"
        >
          SyllabusPilot
        </a>

        {/* Zone 2: 3 Clear Workflow Steps */}
        <nav aria-label="Main navigation" className="row-start-2 col-span-2 justify-self-center max-w-full md:row-start-1 md:col-start-2 md:col-span-1 flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-400 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveStage('input')}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 cursor-pointer ${
              activeStage === 'input'
                ? 'text-indigo-600 dark:text-indigo-400 border-indigo-600 dark:border-indigo-400 font-semibold'
                : 'border-transparent hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            Syllabus Input
          </button>
          <button
            type="button"
            onClick={() => setActiveStage('review')}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 cursor-pointer ${
              activeStage === 'review'
                ? 'text-indigo-600 dark:text-indigo-400 border-indigo-600 dark:border-indigo-400 font-semibold'
                : 'border-transparent hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            Graded Items &amp; Q&amp;A
          </button>
          <button
            type="button"
            onClick={() => setActiveStage('plan')}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 cursor-pointer ${
              activeStage === 'plan'
                ? 'text-indigo-600 dark:text-indigo-400 border-indigo-600 dark:border-indigo-400 font-semibold'
                : 'border-transparent hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            Study Calendar
          </button>
        </nav>

        <button
          type="button"
          onClick={toggleDarkMode}
          aria-label={darkMode ? 'Switch to light theme' : 'Switch to dark theme'}
          title={darkMode ? 'Switch to light theme' : 'Switch to dark theme'}
          className="row-start-1 col-start-2 md:col-start-3 justify-self-end p-2 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </header>

      {/* Toast & Error Notifications */}
      {statusToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-2.5 rounded-lg shadow-lg text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span>{statusToast}</span>
        </div>
      )}

      {errorMessage && (
        <div className="max-w-[1280px] w-full mx-auto px-6 pt-4">
          <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg flex items-center justify-between gap-4 text-sm text-red-800 dark:text-red-200">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-xs font-semibold underline whitespace-nowrap shrink-0 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Content Container */}
      <main className="flex-1 max-w-[1280px] w-full mx-auto px-6 py-8">
        {/* =====================================================================
            STEP 1: SIMPLE, CLEAN SYLLABUS INPUT
           ===================================================================== */}
        {activeStage === 'input' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-display">
                  Add Your Course Syllabus
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Paste syllabus text, upload a PDF or photo, or test with the pre-loaded messy CS 3410 syllabus.
                </p>
              </div>


            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left 8 Cols: Clean Input Box */}
              <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
                <div className="flex items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                  <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setInputMode('text')}
                      className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                        inputMode === 'text'
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Paste Text
                    </button>
                    <button
                      type="button"
                      onClick={() => setInputMode('upload')}
                      className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                        inputMode === 'upload'
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Upload PDF or Photo
                    </button>
                  </div>

                  <span className="text-xs text-slate-500 font-mono tabular-nums">
                    {MESSY_CS_SYLLABUS_TITLE}
                  </span>
                </div>

                {inputMode === 'text' ? (
                  <textarea
                    value={syllabusText}
                    onChange={(e) => setSyllabusText(e.target.value)}
                    rows={15}
                    placeholder="Paste your course syllabus here..."
                    className="w-full font-mono text-xs leading-relaxed p-4 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                ) : (
                  <div className="space-y-4">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="application/pdf,image/png,image/jpeg,image/webp"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 rounded-xl p-10 text-center cursor-pointer transition-colors bg-slate-50/60 dark:bg-slate-950/50"
                    >
                      <FileUp className="w-8 h-8 text-indigo-600 dark:text-indigo-400 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        Click to select a PDF or Photo of your syllabus
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Supports PDF, PNG, JPG, or WEBP
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={handleGenerateSamplePhoto}
                        className="px-3 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 rounded-md flex items-center gap-1.5 cursor-pointer"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        Generate Sample Photo Handout
                      </button>

                      {uploadedFile && (
                        <span className="text-xs text-slate-600 dark:text-slate-400 font-mono">
                          Attached: {uploadedFile.fileName} ({uploadedFile.sizeKb} KB)
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveStage('review')}
                    className="px-4 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    Skip to Pre-loaded Graded Items →
                  </button>

                  <button
                    type="button"
                    onClick={handleExtractSyllabus}
                    disabled={isExtracting}
                    className="px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    {isExtracting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Extracting Graded Items...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Extract Graded Items with AI
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Right 4 Cols: Simple Summary of the Messy Sample */}
              <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 font-display">
                  Included Messy Sample Quirks
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  The sample CS 3410 syllabus includes common real-world syllabus traps that SyllabusPilot resolves automatically:
                </p>
                <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                  {MESSY_CS_SYLLABUS_HIGHLIGHTS.map((item, i) => (
                    <li
                      key={i}
                      className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-start gap-2.5"
                    >
                      <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                        0{i + 1}.
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            STEP 2: CLEAN GRADED ITEMS TABLE, CHART & 3 QUESTIONS
           ===================================================================== */}
        {activeStage === 'review' && (
          <div className="space-y-8">
            {/* Simple Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-display">
                  Review Graded Items &amp; Answer 3 Questions
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  {course.courseCode}: {course.courseTitle} ({course.term}) · Edit any item below before building your calendar.
                </p>
              </div>

              <button
                type="button"
                onClick={handleGenerateStudyPlan}
                disabled={isGeneratingPlan}
                className="px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
              >
                {isGeneratingPlan ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Building Calendar...
                  </>
                ) : (
                  <>
                    <span>Create Study Calendar &amp; plan.ics</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-6 items-start">
            {/* Grade Weight Distribution */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 font-display">
                    Grade Weight Distribution
                  </h2>
                  <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">
                    {distributionView === 'chart' ? 'Click a bar to filter items' : 'Click a category to filter items'}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs font-mono tabular-nums">
                  {categoryFilter !== 'All' && (
                    <button
                      type="button"
                      onClick={() => setCategoryFilter('All')}
                      className="px-2.5 py-1 font-sans font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 rounded-md cursor-pointer"
                    >
                      Filter: {categoryFilter} ✕
                    </button>
                  )}
                  <span
                    className={
                      Math.abs(totalWeight - 100) < 0.2
                        ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                        : 'text-amber-600 dark:text-amber-400 font-semibold'
                    }
                  >
                    Total Weight: {totalWeight.toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg" role="group" aria-label="Grade weight distribution view">
                {(['chart', 'list'] as const).map((view) => (
                  <button
                    key={view}
                    type="button"
                    aria-pressed={distributionView === view}
                    onClick={() => setDistributionView(view)}
                    className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                      distributionView === view
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {view === 'chart' ? 'Show as charts' : 'Show as list'}
                  </button>
                ))}
              </div>

              <div>
                {distributionView === 'chart' ? (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={categoryChartData}
                      margin={{ top: 8, right: 12, left: -16, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke={darkMode ? '#1e293b' : '#e2e8f0'}
                      />
                      <XAxis
                        dataKey="category"
                        tick={{
                          fill: darkMode ? '#94a3b8' : '#475569',
                          fontSize: 12,
                        }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        unit="%"
                        tick={{
                          fill: darkMode ? '#94a3b8' : '#475569',
                          fontSize: 11,
                          fontFamily: 'JetBrains Mono, monospace',
                        }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const row = payload[0].payload as {
                            category: string;
                            weight: number;
                            count: number;
                          };
                          return (
                            <div className="bg-slate-900 text-white rounded-lg px-3 py-2 shadow-md text-xs">
                              <div className="font-semibold">{row.category}</div>
                              <div className="font-mono tabular-nums text-indigo-300">
                                {row.weight.toFixed(1)}% ({row.count} items)
                              </div>
                            </div>
                          );
                        }}
                      />
                      <Bar
                        dataKey="weight"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={52}
                        onClick={(barData: any) => {
                          const cat = barData?.category || barData?.payload?.category;
                          if (cat) {
                            setCategoryFilter((prev) => (prev === cat ? 'All' : cat));
                          }
                        }}
                        className="cursor-pointer"
                      >
                        {categoryChartData.map((entry) => (
                          <Cell
                            key={entry.category}
                            fill={entry.color}
                            fillOpacity={
                              categoryFilter === 'All' || categoryFilter === entry.category
                                ? 1
                                : 0.35
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                ) : (
                <div className="grid grid-cols-1 gap-2">
                  {categoryChartData.map((row) => (
                    <button
                      key={row.category}
                      type="button"
                      onClick={() =>
                        setCategoryFilter((prev) =>
                          prev === row.category ? 'All' : row.category
                        )
                      }
                      className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs border transition-colors cursor-pointer ${
                        categoryFilter === row.category
                          ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-400 font-semibold'
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-xs"
                          style={{ backgroundColor: row.color }}
                        />
                        <span>{row.category}</span>
                      </span>
                      <span className="font-mono tabular-nums font-semibold">
                        {row.weight.toFixed(1)}%
                      </span>
                    </button>
                  ))}
                </div>
                )}
              </div>
            </div>

            {/* Clean Graded Items Table */}
            <div className="min-w-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 font-display">
                  Graded Items ({displayedGradedItems.length})
                </h2>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Item
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[780px] text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-xs font-semibold text-slate-600 dark:text-slate-400">
                      <th className="py-3 px-5">Graded Item</th>
                      <th className="py-3 px-3 w-32">Category</th>
                      <th className="py-3 px-3 w-40">Due Date</th>
                      <th className="py-3 px-3 w-28 text-right">Weight (%)</th>
                      <th className="py-3 px-4">Notes</th>
                      <th className="py-3 px-3 w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                    {displayedGradedItems.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30"
                      >
                        <td className="py-3 px-5">
                          <input
                            type="text"
                            value={item.title}
                            onChange={(e) =>
                              handleUpdateItem(item.id, 'title', e.target.value)
                            }
                            className="w-full bg-transparent font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded px-1.5 py-1"
                          />
                        </td>
                        <td className="py-3 px-3">
                          <select
                            value={item.category}
                            onChange={(e) =>
                              handleUpdateItem(
                                item.id,
                                'category',
                                e.target.value as GradedItemCategory
                              )
                            }
                            className="w-full bg-slate-100 dark:bg-slate-800 rounded px-2 py-1 text-xs"
                          >
                            {CATEGORIES.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3 px-3">
                          <input
                            type="date"
                            value={/^\d{4}-\d{2}-\d{2}$/.test(item.dueDate) ? item.dueDate : ''}
                            onChange={(e) =>
                              handleUpdateItem(item.id, 'dueDate', e.target.value || 'TBA')
                            }
                            className="w-full bg-transparent font-mono tabular-nums text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded px-1.5 py-1"
                          />
                        </td>
                        <td className="py-3 px-3 text-right">
                          <input
                            type="number"
                            step="0.5"
                            value={item.weightPercent}
                            onChange={(e) =>
                              handleUpdateItem(item.id, 'weightPercent', e.target.value)
                            }
                            className="w-16 text-right bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono tabular-nums font-semibold rounded px-2 py-1"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            value={item.details}
                            onChange={(e) =>
                              handleUpdateItem(item.id, 'details', e.target.value)
                            }
                            className="w-full bg-transparent text-slate-600 dark:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded px-1.5 py-1"
                          />
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            </div>

            {/* At Most 3 Questions Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 font-display">
                  Quick Study Preferences ({questions.slice(0, 3).length} Questions)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  SyllabusPilot asks at most 3 questions to schedule your study blocks.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {questions.slice(0, 3).map((q, idx) => (
                  <div
                    key={q.id}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-1">
                      <span className="text-xs font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                        Question {idx + 1}
                      </span>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {q.question}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1.5">
                        {q.quickOptions?.map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => handleUpdateQuestionAnswer(q.id, opt)}
                            className={`px-2.5 py-1 text-xs rounded-md border transition-colors cursor-pointer ${
                              q.answer === opt
                                ? 'bg-indigo-600 text-white border-indigo-600 font-medium'
                                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                      <input
                        type="text"
                        value={q.answer}
                        onChange={(e) => handleUpdateQuestionAnswer(q.id, e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            STEP 3: EASY-TO-READ VISUAL CALENDAR & WEEKLY PLAN
           ===================================================================== */}
        {activeStage === 'plan' && (
          <div className="space-y-6">
            {/* Clean Top Bar for Calendar View */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-display">
                  Study Calendar
                </h1>

              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {/* Switch between Visual Calendar and Week-by-Week List */}
                <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setPlanViewMode('calendar')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
                      planViewMode === 'calendar'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <CalendarIcon className="w-3.5 h-3.5" />
                    Monthly Calendar
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlanViewMode('weekly')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
                      planViewMode === 'weekly'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <ListChecks className="w-3.5 h-3.5" />
                    Week-by-Week List ({studyPlan.weeks.length})
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadIcs}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors whitespace-nowrap flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Schedule
                </button>
              </div>
            </div>

            {/* =================================================================
                VIEW A: READABLE MONTHLY CALENDAR GRID + SELECTED DAY SIDEBAR
               ================================================================= */}
            {planViewMode === 'calendar' ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left 8 Cols: Monthly Calendar Grid */}
                <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  {/* Calendar Navigation Header */}
                  <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handlePrevMonth}
                        aria-label="Previous month"
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 font-display min-w-[160px] text-center">
                        {monthLabel}
                      </h2>
                      <button
                        type="button"
                        onClick={handleNextMonth}
                        aria-label="Next month"
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Simple Color Legend */}
                    <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-xs bg-amber-500" />
                        Due Date / Exam
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-xs bg-indigo-600" />
                        Study Session
                      </span>
                    </div>
                  </div>

                  {/* Weekday Header Row */}
                  <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
                    {WEEKDAYS.map((day) => (
                      <div
                        key={day}
                        className="py-2.5 text-center text-xs font-semibold text-slate-500 dark:text-slate-400"
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* 7-Column Days Grid */}
                  <div className="grid grid-cols-7 divide-x divide-y divide-slate-200 dark:divide-slate-800">
                    {calendarCells.map((cell) => {
                      const isSelected = cell.dateStr === selectedDateStr;
                      const hasDue = cell.events.some((e) => e.category === 'due_date');
                      return (
                        <div
                          key={cell.dateStr}
                          onClick={() => setSelectedDateStr(cell.dateStr)}
                          className={`min-h-[112px] p-2 transition-colors cursor-pointer flex flex-col justify-between ${
                            !cell.inCurrentMonth
                              ? 'bg-slate-50/50 dark:bg-slate-950/40 text-slate-400'
                              : 'bg-white dark:bg-slate-900'
                          } ${
                            isSelected
                              ? 'ring-2 ring-inset ring-indigo-600 dark:ring-indigo-400 bg-indigo-50/20 dark:bg-indigo-950/20'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-xs font-mono tabular-nums w-6 h-6 flex items-center justify-center rounded-full ${
                                isSelected
                                  ? 'bg-indigo-600 text-white font-bold'
                                  : hasDue
                                  ? 'font-bold text-amber-700 dark:text-amber-400'
                                  : 'font-medium'
                              }`}
                            >
                              {cell.dayNumber}
                            </span>
                            {cell.events.length > 0 && (
                              <span className="text-[10px] font-mono text-slate-400 tabular-nums">
                                {cell.events.length} {cell.events.length === 1 ? 'item' : 'items'}
                              </span>
                            )}
                          </div>

                          <div className="space-y-1 mt-1.5">
                            {cell.events.slice(0, 3).map((ev) => {
                              const isDue = ev.category === 'due_date';
                              const timePart = String(ev.start || '').slice(11, 16);
                              return (
                                <div
                                  key={ev.id}
                                  className={`px-1.5 py-1 rounded text-[11px] leading-tight truncate font-medium ${
                                    isDue
                                      ? 'bg-amber-100/90 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border border-amber-300/80 dark:border-amber-800'
                                      : 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-900 dark:text-indigo-200 border border-indigo-200/70 dark:border-indigo-800/70'
                                  }`}
                                  title={`${timePart ? timePart + ' · ' : ''}${ev.title}`}
                                >
                                  {isDue ? '★ ' : ''}
                                  {ev.title.replace(/^(DUE:|Study:|EXAM:)\s*/i, '')}
                                </div>
                              );
                            })}
                            {cell.events.length > 3 && (
                              <div className="text-[10px] text-slate-500 font-medium pl-1">
                                +{cell.events.length - 3} more
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right 4 Cols: Selected Day Details & Upcoming Deadlines */}
                <div className="lg:col-span-4 space-y-6">
                  {/* Selected Date Card */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                      <div>
                        <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                          Selected Day Schedule
                        </p>
                        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 font-display mt-0.5">
                          {formatReadableDate(selectedDateStr)}
                        </h3>
                      </div>

                      <button
                        type="button"
                        onClick={handleAddEventOnSelectedDay}
                        disabled={isReRunningIcs}
                        className="px-2.5 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 rounded-lg flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Study Block
                      </button>
                    </div>

                    {selectedDayEvents.length === 0 ? (
                      <div className="py-8 text-center space-y-2">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          No study sessions or deadlines scheduled on this date.
                        </p>
                        <button
                          type="button"
                          onClick={handleAddEventOnSelectedDay}
                          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                        >
                          + Schedule a 2-hour study session here
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {selectedDayEvents.map((ev) => {
                          const isDue = ev.category === 'due_date';
                          const timeStr = String(ev.start || '').slice(11, 16) || '18:30';
                          return (
                            <div
                              key={ev.id}
                              className={`p-3.5 rounded-xl border space-y-2 ${
                                isDue
                                  ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/80'
                                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <span
                                    className={`text-[11px] font-mono font-semibold uppercase ${
                                      isDue
                                        ? 'text-amber-700 dark:text-amber-400'
                                        : 'text-indigo-600 dark:text-indigo-400'
                                    }`}
                                  >
                                    {isDue ? 'Course Deadline / Exam' : 'Study Session'} · {timeStr} ({ev.duration_hours}h)
                                  </span>
                                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                                    {ev.title}
                                  </h4>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCalendarEvent(ev.id)}
                                  title="Remove from calendar"
                                  className="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                {ev.description}
                              </p>

                              {ev.location && (
                                <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                                  <MapPin className="w-3 h-3" />
                                  <span>{ev.location}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Key Deadlines Quick-Jump List */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-display">
                      All Course Deadlines (Click to Jump)
                    </h3>
                    <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                      {gradedItems.map((item) => {
                        const isSelected = item.dueDate === selectedDateStr;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              if (/^\d{4}-\d{2}-\d{2}$/.test(item.dueDate)) {
                                const [y, m] = item.dueDate.split('-').map(Number);
                                setCurrentMonth({ year: y, month: m - 1 });
                                setSelectedDateStr(item.dueDate);
                              }
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer border ${
                              isSelected
                                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 font-semibold'
                                : 'bg-slate-50 dark:bg-slate-950 border-slate-200/70 dark:border-slate-800 hover:border-slate-300'
                            }`}
                          >
                            <div className="truncate">
                              <span className="text-slate-900 dark:text-slate-100">
                                {item.title}
                              </span>
                              <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                                {item.dueDate}
                              </div>
                            </div>
                            <span className="font-mono tabular-nums font-semibold text-indigo-600 dark:text-indigo-400 shrink-0">
                              {item.weightPercent}%
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* ===============================================================
                 VIEW B: CLEAN WEEK-BY-WEEK CHECKLIST
                 =============================================================== */
              <div className="divide-y divide-slate-200 dark:divide-slate-800 border-y border-slate-200 dark:border-slate-800">
                {studyPlan.weeks.map((week) => (
                  <div
                    key={week.weekNumber}
                    className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-5 md:gap-8 py-6"
                  >
                    <div className="space-y-3 min-w-0">
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
                        <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          WEEK {String(week.weekNumber).padStart(2, '0')}
                          <span className="block mt-1 font-medium text-slate-500 dark:text-slate-400">{week.dateRange}</span>
                        </span>
                        <span className="font-mono tabular-nums font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {week.totalHours} hrs
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 font-display">
                        {week.theme}
                      </h3>

                      {week.milestonesDue?.length > 0 && (
                        <div className="text-xs font-medium text-amber-700 dark:text-amber-400">
                          ★ Due this week: {week.milestonesDue.join(' · ')}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 divide-y divide-slate-200 dark:divide-slate-800">
                      {week.tasks.map((task) => {
                        const done = !!completedTaskIds[task.id];
                        return (
                          <label
                            key={task.id}
                            className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0 cursor-pointer"
                          >
                            <div className="flex items-start gap-2.5">
                              <input
                                type="checkbox"
                                checked={done}
                                onChange={() => toggleTaskCompleted(task.id)}
                                className="mt-0.5 rounded border-slate-300 text-indigo-600"
                              />
                              <div className="text-xs">
                                <div
                                  className={`font-semibold ${
                                    done
                                      ? 'line-through text-slate-400'
                                      : 'text-slate-900 dark:text-slate-100'
                                  }`}
                                >
                                  {task.title}
                                </div>
                                <div className="text-slate-500 mt-0.5">
                                  {task.suggestedDay} · {task.notes}
                                </div>
                              </div>
                            </div>
                            <span className="text-xs font-mono tabular-nums font-semibold text-slate-700 dark:text-slate-300 shrink-0">
                              {task.estimatedHours}h
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function formatIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatReadableDate(isoStr: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoStr)) return isoStr;
  const [y, m, d] = isoStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
