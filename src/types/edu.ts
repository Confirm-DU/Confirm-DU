export type CourseCategory = 'all' | 'bangla' | 'english' | 'gk' | 'written';

export type InteractiveDiagramType =
  | 'bangla_grammar'
  | 'grammar_tree'
  | 'gk_timeline'
  | 'intl_orgs'
  | 'written_builder'
  | 'constitution_articles';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface LessonTranscriptLine {
  timeSec: number;
  text: string;
}

export interface Lesson {
  id: string;
  title: string;
  duration: string;
  durationSec: number;
  diagramType: InteractiveDiagramType;
  summary: string;
  keyFormulas: string[];
  studyNotes: string[];
  transcript: LessonTranscriptLine[];
}

export interface Chapter {
  id: string;
  title: string;
  lessons: Lesson[];
  quiz: QuizQuestion[];
}

export interface Course {
  id: string;
  title: string;
  category: Exclude<CourseCategory, 'all'>;
  categoryLabel: string;
  subject: string;
  instructorName: string;
  instructorCredential: string;
  totalDuration: string;
  lessonCount: number;
  enrolledCount: string;
  thumbnail: string;
  description: string;
  videoUrl?: string;
  pdfUrl?: string;
  isCustom?: boolean;
  chapters: Chapter[];
}

export interface LiveClass {
  id: string;
  title: string;
  subject: string;
  category: Exclude<CourseCategory, 'all'>;
  categoryLabel: string;
  instructorName: string;
  instructorCredential: string;
  scheduleTime: string;
  duration: string;
  status: 'live' | 'upcoming';
  meetingUrl?: string;
  isCustom?: boolean;
  topics: string[];
  pollQuestion: string;
  pollOptions: string[];
}

export interface ModelTest {
  id: string;
  title: string;
  subject: string;
  categoryLabel: string;
  durationMinutes: number;
  questions: QuizQuestion[];
}

export interface FormulaNote {
  id: string;
  title: string;
  subject: string;
  level: string;
  formula: string;
  explanation: string;
  example: string;
}

export interface QuizAttemptRecord {
  testId: string;
  testTitle: string;
  score: number;
  total: number;
  accuracy: number;
  completedAt: string;
}

export interface LeaderboardEntry {
  id?: string;
  uid: string;
  studentName: string;
  testId: string;
  testTitle: string;
  score: number;
  total: number;
  accuracy: number;
  isPublic: boolean;
}

export interface CustomQuizQuestion extends QuizQuestion {
  testId: string;
  subject: string;
}

export interface UserLearningState {
  enrolledCourseIds: string[];
  completedLessonIds: string[];
  bookmarkedNoteIds: string[];
  remindedLiveClassIds: string[];
  personalNotes: Record<string, string>;
  quizAttempts: QuizAttemptRecord[];
}
