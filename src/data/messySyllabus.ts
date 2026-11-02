import { SyllabusExtractionResult, StudyPlanResult } from '../types';

export const MESSY_CS_SYLLABUS_TITLE =
  'CS 3410: Operating Systems & Systems Programming (Fall 2026)';

export const MESSY_CS_SYLLABUS_HIGHLIGHTS = [
  'Dates hidden inside paragraphs instead of a structured schedule',
  'Self-corrected deadline ("Oct 14... wait no, Friday Oct 16")',
  'Drop-lowest rule on 4 Micro-Quizzes (top 3 count 2% each = 6%)',
  '35% Kernel Project split across 3 unevenly weighted milestones',
];

export const MESSY_CS_SYLLABUS_TEXT = `======================================================================
DEPT OF COMPUTER SCIENCE -- CORNELL / TECH SYSTEMS TRACK
Course: CS-3410 Operating Systems & Systems Programming (Fall 2026)
Prof. Marcus Vance (mvance@cs.univ.edu) | Lecture: Mon/Wed 10:10am - 11:25am
Semester runs: Sept 7, 2026 through Dec 14, 2026
======================================================================

HOW YOUR GRADE ACTUALLY WORKS (Read carefully, Canvas weights are wrong!):

1) PROBLEM SETS (Written & C Warmups) -- 15% Total (5% each):
- PS1 ("Pointers, Bitmasks & x86-64 Stack Frames") is due Friday, Sept 18, 2026 at 11:59pm.
- PS2 ("Process Forking & Shell Pipes") is due Oct 2, 2026 by 11:59 PM EST.
- PS3 ("Deadlocks, Semaphores & Dining Philosophers") was originally Oct 21,
  wait no—because of Fall Break we moved PS3 to Monday, Oct 26, 2026 at 11:59pm.

2) THE KERNEL PROJECT ("Weenix-Lite OS") -- 35% TOTAL!
  * Milestone 1: Thread Scheduler & Context Switch -> counts for 8% of final grade.
    Due Wednesday Oct 14, 2026... ACTUALLY WAIT, the cluster reboot is that night,
    so Milestone 1 is officially due Friday, Oct 16, 2026 at 11:59pm.
  * Milestone 2: Virtual Memory & Page Fault Handler -> start at least two weeks
    early! Worth 15% of your final grade. Due Nov 13, 2026.
  * Milestone 3: VFS & Simple Disk File System -> worth 12% of final grade.
    Hard deadline: Friday, Dec 4, 2026 at 11:59pm (no slip days allowed on M3!).

3) EXAMS (In-Person Prelims + Cumulative Final):
- Midterm Exam: Worth 20% of your grade. Held in-class on Wednesday, Oct 28, 2026.
- Final Exam: Worth 20% of your overall grade. Monday, Dec 14, 2026 (9:00 AM - 11:30 AM).

4) POP QUIZZES & LAB CHECKOFFS (The remaining 10%):
- Bi-weekly In-Class Micro-Quizzes: 6% of total grade. 4 short quizzes on
  Sept 23, Oct 7, Nov 4, and Nov 18 (lowest 1 dropped, top 3 count 2% each).
- Weekly GDB Lab Checkoffs: 4% of total grade (attend 9 of 11 Friday labs by Dec 9, 2026).
======================================================================`;

export const MESSY_CS_PRELOADED_EXTRACTION: SyllabusExtractionResult = {
  course: {
    courseCode: 'CS 3410',
    courseTitle: 'Operating Systems & Systems Programming',
    term: 'Fall 2026',
    instructor: 'Prof. Marcus Vance',
    semesterStartDate: '2026-09-07',
    semesterEndDate: '2026-12-14',
    gradingPolicySummary:
      '3 Problem Sets (15%), 3-part Kernel Project (35%), Midterm Exam (20%), Final Exam (20%), 4 Quizzes with lowest dropped (6%), and Lab Checkoffs (4%).',
  },
  gradedItems: [
    {
      id: 'item-ps1',
      title: 'Problem Set 1: Pointers & Stack Frames',
      category: 'Homework',
      dueDate: '2026-09-18',
      rawDateText: 'Friday, Sept 18, 2026',
      weightPercent: 5,
      isDateAmbiguous: false,
      details: '5% of grade. Slip tokens allowed.',
    },
    {
      id: 'item-q1',
      title: 'Micro-Quiz 1',
      category: 'Quiz',
      dueDate: '2026-09-23',
      rawDateText: 'Sept 23',
      weightPercent: 1.5,
      isDateAmbiguous: false,
      details: 'Lowest 1 of 4 quizzes dropped (6% total).',
    },
    {
      id: 'item-ps2',
      title: 'Problem Set 2: Process Forking & Pipes',
      category: 'Homework',
      dueDate: '2026-10-02',
      rawDateText: 'Oct 2, 2026',
      weightPercent: 5,
      isDateAmbiguous: false,
      details: '5% of grade. Slip tokens allowed.',
    },
    {
      id: 'item-q2',
      title: 'Micro-Quiz 2',
      category: 'Quiz',
      dueDate: '2026-10-07',
      rawDateText: 'Oct 7',
      weightPercent: 1.5,
      isDateAmbiguous: false,
      details: 'Lowest 1 of 4 quizzes dropped.',
    },
    {
      id: 'item-km1',
      title: 'Kernel Milestone 1: Thread Scheduler',
      category: 'Project',
      dueDate: '2026-10-16',
      rawDateText: 'Moved from Oct 14 to Oct 16',
      weightPercent: 8,
      isDateAmbiguous: false,
      details: 'Pushed to Friday Oct 16 due to cluster reboot.',
    },
    {
      id: 'item-ps3',
      title: 'Problem Set 3: Deadlocks & Semaphores',
      category: 'Homework',
      dueDate: '2026-10-26',
      rawDateText: 'Moved from Oct 21 to Oct 26',
      weightPercent: 5,
      isDateAmbiguous: false,
      details: 'Shifted after Fall Break.',
    },
    {
      id: 'item-midterm',
      title: 'Midterm Exam (Lectures 1–14)',
      category: 'Exam',
      dueDate: '2026-10-28',
      rawDateText: 'Wednesday, Oct 28, 2026',
      weightPercent: 20,
      isDateAmbiguous: false,
      details: 'In-class exam covering processes, threads, and locks.',
    },
    {
      id: 'item-q3',
      title: 'Micro-Quiz 3',
      category: 'Quiz',
      dueDate: '2026-11-04',
      rawDateText: 'Nov 4',
      weightPercent: 1.5,
      isDateAmbiguous: false,
      details: 'Lowest 1 of 4 quizzes dropped.',
    },
    {
      id: 'item-km2',
      title: 'Kernel Milestone 2: Virtual Memory',
      category: 'Project',
      dueDate: '2026-11-13',
      rawDateText: 'Nov 13, 2026',
      weightPercent: 15,
      isDateAmbiguous: false,
      details: 'Heaviest project milestone (15%). Start 2 weeks early.',
    },
    {
      id: 'item-q4',
      title: 'Micro-Quiz 4',
      category: 'Quiz',
      dueDate: '2026-11-18',
      rawDateText: 'Nov 18',
      weightPercent: 1.5,
      isDateAmbiguous: false,
      details: 'Lowest 1 of 4 quizzes dropped.',
    },
    {
      id: 'item-km3',
      title: 'Kernel Milestone 3: Virtual File System',
      category: 'Project',
      dueDate: '2026-12-04',
      rawDateText: 'Friday, Dec 4, 2026',
      weightPercent: 12,
      isDateAmbiguous: false,
      details: 'Hard deadline — no slip tokens allowed.',
    },
    {
      id: 'item-labs',
      title: 'Weekly GDB Lab Checkoffs (9 of 11)',
      category: 'Lab',
      dueDate: '2026-12-09',
      rawDateText: 'Closes Dec 9, 2026',
      weightPercent: 4,
      isDateAmbiguous: false,
      details: 'Attend at least 9 Friday recitation labs.',
    },
    {
      id: 'item-final',
      title: 'Cumulative Final Exam',
      category: 'Exam',
      dueDate: '2026-12-14',
      rawDateText: 'Monday, Dec 14, 2026 (9:00 AM)',
      weightPercent: 20,
      isDateAmbiguous: false,
      details: 'Barton Hall, 9:00 AM – 11:30 AM.',
    },
  ],
  questions: [
    {
      id: 'q1',
      question: 'How many hours a week can you study for this course?',
      whyAsked: 'Sets your weekly study session budget.',
      quickOptions: ['6 hours/week', '10 hours/week', '14 hours/week'],
      answer: '10 hours/week',
    },
    {
      id: 'q2',
      question: 'Which days work best for your study blocks?',
      whyAsked: 'Places recurring study blocks on your calendar.',
      quickOptions: [
        'Tue & Thu evenings + Sun afternoon',
        'Mon, Wed & Fri afternoons',
        'Saturday & Sunday mornings',
      ],
      answer: 'Tue & Thu evenings + Sun afternoon',
    },
    {
      id: 'q3',
      question: 'How early do you want to start major projects & exams?',
      whyAsked: 'Paces preparation before the 15% Kernel project and 20% exams.',
      quickOptions: ['2 weeks early (Recommended)', '10 days early', '1 week early'],
      answer: '2 weeks early (Recommended)',
    },
  ],
};

export const DEFAULT_CS3410_STUDY_PLAN: StudyPlanResult = {
  agentSummary:
    'Balanced 10 hr/week schedule on Tue/Thu evenings and Sunday afternoons, starting major Kernel Milestones and Exam prep 2 weeks ahead of every deadline.',
  studyStrategyNotes: [
    'Start Kernel Milestone 2 (15%) right after the Oct 28 Midterm to avoid a November crunch.',
    'Save your 3 slip tokens for Kernel Milestone 2 since Milestone 3 (Dec 4) forbids extensions.',
    'Review lecture notes every Tuesday before the 4 bi-weekly Wednesday micro-quizzes.',
  ],
  weeks: [
    {
      weekNumber: 1,
      dateRange: 'Sept 7 – Sept 13, 2026',
      theme: 'C Pointers, Bitmasks & Stack Frame Fundamentals',
      totalHours: 8,
      milestonesDue: [],
      tasks: [
        {
          id: 'w1-t1',
          title: 'Setup Linux/GDB container & start Problem Set 1',
          relatedItemTitle: 'Problem Set 1: Pointers & Stack Frames',
          estimatedHours: 4,
          suggestedDay: 'Tuesday, Sept 8',
          priority: 'Medium',
          notes: 'Complete bitmask exercises 1–3',
        },
        {
          id: 'w1-t2',
          title: 'Draft x86-64 stack frame diagrams for PS1',
          relatedItemTitle: 'Problem Set 1: Pointers & Stack Frames',
          estimatedHours: 4,
          suggestedDay: 'Sunday, Sept 13',
          priority: 'High',
          notes: 'Finish full draft 5 days before due date',
        },
      ],
    },
    {
      weekNumber: 2,
      dateRange: 'Sept 14 – Sept 20, 2026',
      theme: 'Finish Problem Set 1 & Prep Micro-Quiz 1',
      totalHours: 9,
      milestonesDue: ['Problem Set 1: Pointers & Stack Frames (Sept 18)'],
      tasks: [
        {
          id: 'w2-t1',
          title: 'Final test & submit Problem Set 1',
          relatedItemTitle: 'Problem Set 1: Pointers & Stack Frames',
          estimatedHours: 4,
          suggestedDay: 'Thursday, Sept 17',
          priority: 'High',
          notes: 'Submit 24h before Friday 11:59pm deadline',
        },
        {
          id: 'w2-t2',
          title: 'Review process address spaces for Micro-Quiz 1',
          relatedItemTitle: 'Micro-Quiz 1',
          estimatedHours: 5,
          suggestedDay: 'Sunday, Sept 20',
          priority: 'Medium',
          notes: 'Practice pointer arithmetic quiz problems',
        },
      ],
    },
    {
      weekNumber: 3,
      dateRange: 'Sept 21 – Sept 27, 2026',
      theme: 'Micro-Quiz 1 & Process Forking (PS2)',
      totalHours: 10,
      milestonesDue: ['Micro-Quiz 1 (Sept 23)'],
      tasks: [
        {
          id: 'w3-t1',
          title: 'Quick review for Micro-Quiz 1',
          relatedItemTitle: 'Micro-Quiz 1',
          estimatedHours: 2,
          suggestedDay: 'Tuesday, Sept 22',
          priority: 'High',
          notes: 'In-class quiz on Wednesday Sept 23',
        },
        {
          id: 'w3-t2',
          title: 'Implement fork(), exec(), and pipe() shell runner for PS2',
          relatedItemTitle: 'Problem Set 2: Process Forking & Pipes',
          estimatedHours: 8,
          suggestedDay: 'Sunday, Sept 27',
          priority: 'High',
          notes: 'Core C coding for Problem Set 2',
        },
      ],
    },
    {
      weekNumber: 4,
      dateRange: 'Sept 28 – Oct 4, 2026',
      theme: 'Submit PS2 & Begin Kernel Milestone 1 Early',
      totalHours: 10,
      milestonesDue: ['Problem Set 2: Process Forking & Pipes (Oct 2)'],
      tasks: [
        {
          id: 'w4-t1',
          title: 'Check file descriptor leaks & submit PS2',
          relatedItemTitle: 'Problem Set 2: Process Forking & Pipes',
          estimatedHours: 4,
          suggestedDay: 'Thursday, Oct 1',
          priority: 'High',
          notes: 'Due Friday Oct 2 at 11:59pm',
        },
        {
          id: 'w4-t2',
          title: 'Read Weenix-Lite codebase & design Thread Queue (2 weeks early)',
          relatedItemTitle: 'Kernel Milestone 1: Thread Scheduler',
          estimatedHours: 6,
          suggestedDay: 'Sunday, Oct 4',
          priority: 'High',
          notes: 'Front-load 8% Kernel Milestone 1',
        },
      ],
    },
    {
      weekNumber: 5,
      dateRange: 'Oct 5 – Oct 11, 2026',
      theme: 'Micro-Quiz 2 & Kernel Context Switch Implementation',
      totalHours: 10,
      milestonesDue: ['Micro-Quiz 2 (Oct 7)'],
      tasks: [
        {
          id: 'w5-t1',
          title: 'Prep & complete Micro-Quiz 2',
          relatedItemTitle: 'Micro-Quiz 2',
          estimatedHours: 2,
          suggestedDay: 'Tuesday, Oct 6',
          priority: 'Medium',
          notes: 'Quiz on Wednesday Oct 7',
        },
        {
          id: 'w5-t2',
          title: 'Write context_switch() assembly & run GDB thread tests',
          relatedItemTitle: 'Kernel Milestone 1: Thread Scheduler',
          estimatedHours: 8,
          suggestedDay: 'Thursday & Sunday, Oct 8–11',
          priority: 'High',
          notes: 'Pass 80% of scheduler unit tests',
        },
      ],
    },
    {
      weekNumber: 6,
      dateRange: 'Oct 12 – Oct 18, 2026',
      theme: 'Complete Kernel Milestone 1 & Start Midterm Review',
      totalHours: 11,
      milestonesDue: ['Kernel Milestone 1: Thread Scheduler (Oct 16)'],
      tasks: [
        {
          id: 'w6-t1',
          title: 'Stress-test preemptive scheduler & submit Kernel Milestone 1',
          relatedItemTitle: 'Kernel Milestone 1: Thread Scheduler',
          estimatedHours: 6,
          suggestedDay: 'Thursday, Oct 15',
          priority: 'High',
          notes: 'Official deadline Friday Oct 16 (worth 8%)',
        },
        {
          id: 'w6-t2',
          title: 'Start Problem Set 3 (Deadlocks & Semaphores) + Midterm Outline',
          relatedItemTitle: 'Midterm Exam (Lectures 1–14)',
          estimatedHours: 5,
          suggestedDay: 'Sunday, Oct 18',
          priority: 'High',
          notes: 'Begin 10-day Midterm Exam countdown',
        },
      ],
    },
    {
      weekNumber: 7,
      dateRange: 'Oct 19 – Oct 25, 2026',
      theme: 'Problem Set 3 & Deep Midterm Exam Practice',
      totalHours: 12,
      milestonesDue: [],
      tasks: [
        {
          id: 'w7-t1',
          title: 'Complete Dining Philosophers & Banker’s Algorithm for PS3',
          relatedItemTitle: 'Problem Set 3: Deadlocks & Semaphores',
          estimatedHours: 5,
          suggestedDay: 'Thursday, Oct 22',
          priority: 'High',
          notes: 'Ready ahead of Monday Oct 26 due date',
        },
        {
          id: 'w7-t2',
          title: 'Take 2 timed practice Midterms (Lectures 1–14)',
          relatedItemTitle: 'Midterm Exam (Lectures 1–14)',
          estimatedHours: 7,
          suggestedDay: 'Sunday, Oct 25',
          priority: 'High',
          notes: 'Midterm counts for 20% of final grade',
        },
      ],
    },
    {
      weekNumber: 8,
      dateRange: 'Oct 26 – Nov 1, 2026',
      theme: 'PS3 Submission, Midterm Exam (20%) & Start Virtual Memory',
      totalHours: 12,
      milestonesDue: [
        'Problem Set 3: Deadlocks & Semaphores (Oct 26)',
        'Midterm Exam (Lectures 1–14) (Oct 28)',
      ],
      tasks: [
        {
          id: 'w8-t1',
          title: 'Final formula & synchronization drill before Wednesday Midterm',
          relatedItemTitle: 'Midterm Exam (Lectures 1–14)',
          estimatedHours: 6,
          suggestedDay: 'Tuesday, Oct 27',
          priority: 'High',
          notes: 'Exam in class Wednesday Oct 28',
        },
        {
          id: 'w8-t2',
          title: 'Design Page Table & Page Fault Handler for Kernel Milestone 2',
          relatedItemTitle: 'Kernel Milestone 2: Virtual Memory',
          estimatedHours: 6,
          suggestedDay: 'Sunday, Nov 1',
          priority: 'High',
          notes: 'Start 2 weeks early for 15% Virtual Memory milestone',
        },
      ],
    },
    {
      weekNumber: 9,
      dateRange: 'Nov 2 – Nov 8, 2026',
      theme: 'Micro-Quiz 3 & Virtual Memory Page Fault Handler',
      totalHours: 11,
      milestonesDue: ['Micro-Quiz 3 (Nov 4)'],
      tasks: [
        {
          id: 'w9-t1',
          title: 'Review TLB & multi-level paging for Micro-Quiz 3',
          relatedItemTitle: 'Micro-Quiz 3',
          estimatedHours: 2,
          suggestedDay: 'Tuesday, Nov 3',
          priority: 'Medium',
          notes: 'Quiz on Wednesday Nov 4',
        },
        {
          id: 'w9-t2',
          title: 'Implement vmmap and shadow objects for Kernel Milestone 2',
          relatedItemTitle: 'Kernel Milestone 2: Virtual Memory',
          estimatedHours: 9,
          suggestedDay: 'Thursday & Sunday, Nov 5–8',
          priority: 'High',
          notes: 'Heaviest coding week of the semester',
        },
      ],
    },
    {
      weekNumber: 10,
      dateRange: 'Nov 9 – Nov 15, 2026',
      theme: 'Deliver Kernel Milestone 2 (15%)',
      totalHours: 10,
      milestonesDue: ['Kernel Milestone 2: Virtual Memory (Nov 13)'],
      tasks: [
        {
          id: 'w10-t1',
          title: 'Debug user-space page faults & submit Kernel Milestone 2',
          relatedItemTitle: 'Kernel Milestone 2: Virtual Memory',
          estimatedHours: 7,
          suggestedDay: 'Thursday, Nov 12',
          priority: 'High',
          notes: 'Due Friday Nov 13 (15% of course grade)',
        },
        {
          id: 'w10-t2',
          title: 'Read VFS inode specification for Kernel Milestone 3',
          relatedItemTitle: 'Kernel Milestone 3: Virtual File System',
          estimatedHours: 3,
          suggestedDay: 'Sunday, Nov 15',
          priority: 'Medium',
          notes: 'Early architectural prep',
        },
      ],
    },
    {
      weekNumber: 11,
      dateRange: 'Nov 16 – Nov 29, 2026',
      theme: 'Micro-Quiz 4 & Virtual File System Implementation',
      totalHours: 10,
      milestonesDue: ['Micro-Quiz 4 (Nov 18)'],
      tasks: [
        {
          id: 'w11-t1',
          title: 'Prep for Micro-Quiz 4 (File Systems & Disks)',
          relatedItemTitle: 'Micro-Quiz 4',
          estimatedHours: 2,
          suggestedDay: 'Tuesday, Nov 17',
          priority: 'Medium',
          notes: 'Final micro-quiz on Nov 18',
        },
        {
          id: 'w11-t2',
          title: 'Implement vnode operations & directory lookup for Milestone 3',
          relatedItemTitle: 'Kernel Milestone 3: Virtual File System',
          estimatedHours: 8,
          suggestedDay: 'Thursday & Sunday, Nov 19–22',
          priority: 'High',
          notes: 'Remember: NO slip tokens allowed on Dec 4',
        },
      ],
    },
    {
      weekNumber: 12,
      dateRange: 'Nov 30 – Dec 14, 2026',
      theme: 'Kernel Milestone 3 Hard Deadline & Cumulative Final Exam',
      totalHours: 14,
      milestonesDue: [
        'Kernel Milestone 3: Virtual File System (Dec 4)',
        'Weekly GDB Lab Checkoffs (9 of 11) (Dec 9)',
        'Cumulative Final Exam (Dec 14)',
      ],
      tasks: [
        {
          id: 'w12-t1',
          title: 'Final regression suite & submit Kernel Milestone 3 early',
          relatedItemTitle: 'Kernel Milestone 3: Virtual File System',
          estimatedHours: 5,
          suggestedDay: 'Thursday, Dec 3',
          priority: 'High',
          notes: 'Hard deadline Friday Dec 4 (12% of grade)',
        },
        {
          id: 'w12-t2',
          title: 'Full-course synthesis & practice exams for Cumulative Final',
          relatedItemTitle: 'Cumulative Final Exam',
          estimatedHours: 9,
          suggestedDay: 'Dec 8 – Dec 13',
          priority: 'High',
          notes: 'Final Exam Monday Dec 14 at 9:00 AM (20% of grade)',
        },
      ],
    },
  ],
  events: [
    {
      id: 'ev-1',
      title: 'Study: PS1 Pointers & Stack Frames',
      start: '2026-09-15T18:30',
      end: '2026-09-15T20:30',
      duration_hours: 2,
      description: 'Complete x86-64 stack frame exercises for Problem Set 1 (5%).',
      location: 'Library Study Desk',
      category: 'study_session',
    },
    {
      id: 'ev-2',
      title: 'DUE: Problem Set 1 (5%)',
      start: '2026-09-18T23:59',
      end: '2026-09-19T00:30',
      duration_hours: 0.5,
      description: 'Problem Set 1: Pointers, Bitmasks & x86-64 Stack Frames due.',
      location: 'Canvas / CMSX',
      category: 'due_date',
    },
    {
      id: 'ev-3',
      title: 'DUE: Micro-Quiz 1 (1.5%)',
      start: '2026-09-23T10:10',
      end: '2026-09-23T11:00',
      duration_hours: 1,
      description: 'In-class Micro-Quiz 1 (lowest 1 of 4 dropped).',
      location: 'Statler Auditorium',
      category: 'due_date',
    },
    {
      id: 'ev-4',
      title: 'Study: PS2 Forking & Shell Pipes',
      start: '2026-09-29T18:30',
      end: '2026-09-29T21:00',
      duration_hours: 2.5,
      description: 'Implement fork() and pipe() IPC for Problem Set 2.',
      location: 'Gates Hall Lab',
      category: 'study_session',
    },
    {
      id: 'ev-5',
      title: 'DUE: Problem Set 2 (5%)',
      start: '2026-10-02T23:59',
      end: '2026-10-03T00:30',
      duration_hours: 0.5,
      description: 'Problem Set 2: Process Forking & Shell Pipes due.',
      location: 'Canvas / CMSX',
      category: 'due_date',
    },
    {
      id: 'ev-6',
      title: 'Study: Start Kernel Milestone 1 (2 Weeks Early)',
      start: '2026-10-04T14:00',
      end: '2026-10-04T17:00',
      duration_hours: 3,
      description: 'Design thread queue and context switch for Kernel Milestone 1 (8%).',
      location: 'Library Study Desk',
      category: 'study_session',
    },
    {
      id: 'ev-7',
      title: 'DUE: Micro-Quiz 2 (1.5%)',
      start: '2026-10-07T10:10',
      end: '2026-10-07T11:00',
      duration_hours: 1,
      description: 'In-class Micro-Quiz 2.',
      location: 'Statler Auditorium',
      category: 'due_date',
    },
    {
      id: 'ev-8',
      title: 'Study: Kernel Milestone 1 GDB Debugging',
      start: '2026-10-13T18:30',
      end: '2026-10-13T21:00',
      duration_hours: 2.5,
      description: 'Test preemptive scheduler and context switch before Friday deadline.',
      location: 'Gates Hall Lab',
      category: 'study_session',
    },
    {
      id: 'ev-9',
      title: 'DUE: Kernel Milestone 1 — Thread Scheduler (8%)',
      start: '2026-10-16T23:59',
      end: '2026-10-17T00:30',
      duration_hours: 0.5,
      description: 'Official moved deadline (Oct 16) for Kernel Milestone 1.',
      location: 'CMSX Git Repo',
      category: 'due_date',
    },
    {
      id: 'ev-10',
      title: 'Study: Midterm Practice Exam & PS3 Deadlocks',
      start: '2026-10-22T18:30',
      end: '2026-10-22T21:00',
      duration_hours: 2.5,
      description: 'Finish Dining Philosophers (PS3) and review Lectures 1–14.',
      location: 'Library Study Desk',
      category: 'study_session',
    },
    {
      id: 'ev-11',
      title: 'DUE: Problem Set 3 — Deadlocks (5%)',
      start: '2026-10-26T23:59',
      end: '2026-10-27T00:30',
      duration_hours: 0.5,
      description: 'Problem Set 3 due after Fall Break.',
      location: 'Canvas / CMSX',
      category: 'due_date',
    },
    {
      id: 'ev-12',
      title: 'EXAM: Midterm Exam (20% of Grade)',
      start: '2026-10-28T10:10',
      end: '2026-10-28T11:25',
      duration_hours: 1.25,
      description: 'In-class Midterm covering processes, threads, and concurrency.',
      location: 'Statler Auditorium',
      category: 'due_date',
    },
    {
      id: 'ev-13',
      title: 'Study: Start Kernel Milestone 2 — Virtual Memory (15%)',
      start: '2026-11-01T14:00',
      end: '2026-11-01T17:30',
      duration_hours: 3.5,
      description: 'Design page table & page fault handler 2 weeks before Nov 13 deadline.',
      location: 'Gates Hall Lab',
      category: 'study_session',
    },
    {
      id: 'ev-14',
      title: 'DUE: Micro-Quiz 3 (1.5%)',
      start: '2026-11-04T10:10',
      end: '2026-11-04T11:00',
      duration_hours: 1,
      description: 'In-class Micro-Quiz 3.',
      location: 'Statler Auditorium',
      category: 'due_date',
    },
    {
      id: 'ev-15',
      title: 'Study: Virtual Memory Page Fault Debugging',
      start: '2026-11-10T18:30',
      end: '2026-11-10T21:30',
      duration_hours: 3,
      description: 'Complete shadow object & page fault tests for Milestone 2.',
      location: 'Gates Hall Lab',
      category: 'study_session',
    },
    {
      id: 'ev-16',
      title: 'DUE: Kernel Milestone 2 — Virtual Memory (15%)',
      start: '2026-11-13T23:59',
      end: '2026-11-14T00:30',
      duration_hours: 0.5,
      description: 'Heaviest project checkpoint (15% of final grade).',
      location: 'CMSX Git Repo',
      category: 'due_date',
    },
    {
      id: 'ev-17',
      title: 'DUE: Micro-Quiz 4 (1.5%)',
      start: '2026-11-18T10:10',
      end: '2026-11-18T11:00',
      duration_hours: 1,
      description: 'In-class Micro-Quiz 4.',
      location: 'Statler Auditorium',
      category: 'due_date',
    },
    {
      id: 'ev-18',
      title: 'Study: Kernel Milestone 3 — VFS Inodes',
      start: '2026-11-24T18:30',
      end: '2026-11-24T21:00',
      duration_hours: 2.5,
      description: 'Implement VFS directory lookup ahead of Dec 4 hard deadline.',
      location: 'Library Study Desk',
      category: 'study_session',
    },
    {
      id: 'ev-19',
      title: 'DUE: Kernel Milestone 3 — VFS (12% · No Slip Days)',
      start: '2026-12-04T23:59',
      end: '2026-12-05T00:30',
      duration_hours: 0.5,
      description: 'Hard deadline for Kernel Milestone 3.',
      location: 'CMSX Git Repo',
      category: 'due_date',
    },
    {
      id: 'ev-20',
      title: 'DUE: Final GDB Lab Checkoffs (4%)',
      start: '2026-12-09T17:00',
      end: '2026-12-09T18:00',
      duration_hours: 1,
      description: 'Ensure 9 of 11 Friday recitation labs are checked off.',
      location: 'Gates Hall Lab',
      category: 'due_date',
    },
    {
      id: 'ev-21',
      title: 'Study: Cumulative Final Exam Review Session',
      start: '2026-12-11T14:00',
      end: '2026-12-11T18:00',
      duration_hours: 4,
      description: 'Full practice exam covering Virtual Memory, Concurrency, and File Systems.',
      location: 'Library Study Desk',
      category: 'study_session',
    },
    {
      id: 'ev-22',
      title: 'EXAM: Cumulative Final Exam (20% of Grade)',
      start: '2026-12-14T09:00',
      end: '2026-12-14T11:30',
      duration_hours: 2.5,
      description: 'Registrar scheduled Final Exam in Barton Hall.',
      location: 'Barton Hall',
      category: 'due_date',
    },
  ],
  icsContent: `BEGIN:VCALENDAR\r
VERSION:2.0\r
PRODID:-//SyllabusPilot//Academic Study Planner//EN\r
CALSCALE:GREGORIAN\r
METHOD:PUBLISH\r
X-WR-CALNAME:SyllabusPilot Study Plan\r
BEGIN:VEVENT\r
UID:syllabuspilot-cs3410-1@syllabuspilot.local\r
DTSTAMP:20260907T120000Z\r
DTSTART:20260918T235900\r
DTEND:20260919T003000\r
SUMMARY:DUE: Problem Set 1 (5%)\r
DESCRIPTION:Problem Set 1: Pointers, Bitmasks & x86-64 Stack Frames due.\r
LOCATION:Canvas / CMSX\r
CATEGORIES:DUE_DATE\r
STATUS:CONFIRMED\r
END:VEVENT\r
BEGIN:VEVENT\r
UID:syllabuspilot-cs3410-2@syllabuspilot.local\r
DTSTAMP:20260907T120000Z\r
DTSTART:20261016T235900\r
DTEND:20261017T003000\r
SUMMARY:DUE: Kernel Milestone 1 — Thread Scheduler (8%)\r
DESCRIPTION:Official moved deadline (Oct 16) for Kernel Milestone 1.\r
LOCATION:CMSX Git Repo\r
CATEGORIES:DUE_DATE\r
STATUS:CONFIRMED\r
END:VEVENT\r
BEGIN:VEVENT\r
UID:syllabuspilot-cs3410-3@syllabuspilot.local\r
DTSTAMP:20260907T120000Z\r
DTSTART:20261028T101000\r
DTEND:20261028T112500\r
SUMMARY:EXAM: Midterm Exam (20% of Grade)\r
DESCRIPTION:In-class Midterm covering processes, threads, and concurrency.\r
LOCATION:Statler Auditorium\r
CATEGORIES:DUE_DATE\r
STATUS:CONFIRMED\r
END:VEVENT\r
BEGIN:VEVENT\r
UID:syllabuspilot-cs3410-4@syllabuspilot.local\r
DTSTAMP:20260907T120000Z\r
DTSTART:20261113T235900\r
DTEND:20261114T003000\r
SUMMARY:DUE: Kernel Milestone 2 — Virtual Memory (15%)\r
DESCRIPTION:Heaviest project checkpoint (15% of final grade).\r
LOCATION:CMSX Git Repo\r
CATEGORIES:DUE_DATE\r
STATUS:CONFIRMED\r
END:VEVENT\r
BEGIN:VEVENT\r
UID:syllabuspilot-cs3410-5@syllabuspilot.local\r
DTSTAMP:20260907T120000Z\r
DTSTART:20261214T090000\r
DTEND:20261214T113000\r
SUMMARY:EXAM: Cumulative Final Exam (20% of Grade)\r
DESCRIPTION:Registrar scheduled Final Exam in Barton Hall.\r
LOCATION:Barton Hall\r
CATEGORIES:DUE_DATE\r
STATUS:CONFIRMED\r
END:VEVENT\r
END:VCALENDAR\r
`,
  pythonSource: '',
  toolTrace: {
    functionName: 'make_ics',
    filename: 'plan.ics',
    eventCount: 22,
    executedWithPython: true,
    pythonVersion: 'Python 3 (make_ics.py)',
    executedAt: '2026-09-07T12:00:00.000Z',
    sampleInvocationCode: 'make_ics(events, filename="plan.ics")',
  },
};
