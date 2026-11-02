export type GradedItemCategory =
  | 'Exam'
  | 'Project'
  | 'Homework'
  | 'Quiz'
  | 'Lab'
  | 'Participation'
  | 'Other';

export interface GradedItem {
  id: string;
  title: string;
  category: GradedItemCategory;
  dueDate: string; // YYYY-MM-DD or 'TBA'
  rawDateText: string; // Original phrase in the syllabus
  weightPercent: number;
  isDateAmbiguous: boolean;
  details: string;
}

export interface AgentQuestion {
  id: string;
  question: string;
  whyAsked: string;
  quickOptions: string[];
  answer: string;
}

export interface CourseMetadata {
  courseCode: string;
  courseTitle: string;
  term: string;
  instructor: string;
  semesterStartDate: string;
  semesterEndDate: string;
  gradingPolicySummary: string;
}

export interface SyllabusExtractionResult {
  course: CourseMetadata;
  gradedItems: GradedItem[];
  questions: AgentQuestion[];
}

export interface StudyTask {
  id: string;
  title: string;
  relatedItemTitle: string;
  estimatedHours: number;
  suggestedDay: string;
  priority: 'High' | 'Medium' | 'Standard';
  notes: string;
}

export interface StudyWeek {
  weekNumber: number;
  dateRange: string;
  theme: string;
  totalHours: number;
  milestonesDue: string[];
  tasks: StudyTask[];
}

export interface CalendarEventItem {
  id: string;
  title: string;
  start: string; // YYYY-MM-DDTHH:MM
  end: string;   // YYYY-MM-DDTHH:MM
  duration_hours: number;
  description: string;
  location: string;
  category: 'study_session' | 'due_date';
}

export interface ToolCallTrace {
  functionName: string;
  filename: string;
  eventCount: number;
  executedWithPython: boolean;
  pythonVersion?: string;
  executedAt: string;
  sampleInvocationCode: string;
}

export interface StudyPlanResult {
  agentSummary: string;
  studyStrategyNotes: string[];
  weeks: StudyWeek[];
  events: CalendarEventItem[];
  icsContent: string;
  pythonSource: string;
  toolTrace: ToolCallTrace;
}
