import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Circle,
  FileText,
  HelpCircle,
  PenLine,
} from 'lucide-react';
import { Course } from '../types/edu';
import { InteractiveLessonStage } from './InteractiveLessonStage';

interface CourseClassroomProps {
  course: Course;
  completedLessonIds: string[];
  personalNotes: Record<string, string>;
  onToggleLessonComplete: (lessonId: string) => void;
  onSavePersonalNote: (lessonId: string, text: string) => void;
  onBack: () => void;
}

type ClassroomTab = 'notes' | 'quiz' | 'notebook';

export const CourseClassroom: React.FC<CourseClassroomProps> = ({
  course,
  completedLessonIds,
  personalNotes,
  onToggleLessonComplete,
  onSavePersonalNote,
  onBack,
}) => {
  const [activeChapterIdx, setActiveChapterIdx] = useState(0);
  const [activeLessonIdx, setActiveLessonIdx] = useState(0);
  const [activeTab, setActiveTab] = useState<ClassroomTab>('notes');

  // Chapter quiz interactive state
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const activeChapter = course.chapters[activeChapterIdx] || course.chapters[0];
  const activeLesson =
    activeChapter.lessons[activeLessonIdx] || activeChapter.lessons[0];

  const allLessons = useMemo(
    () => course.chapters.flatMap((ch) => ch.lessons),
    [course.chapters]
  );

  const completedInCourse = useMemo(
    () =>
      allLessons.filter((lesson) => completedLessonIds.includes(lesson.id))
        .length,
    [allLessons, completedLessonIds]
  );

  const progressPercent = allLessons.length
    ? Math.round((completedInCourse / allLessons.length) * 100)
    : 0;

  const isLessonCompleted = completedLessonIds.includes(activeLesson.id);

  const handleSelectLesson = (chIdx: number, lIdx: number) => {
    setActiveChapterIdx(chIdx);
    setActiveLessonIdx(lIdx);
    setSelectedAnswers({});
    setQuizSubmitted(false);
  };

  const chapterQuizScore = useMemo(() => {
    return activeChapter.quiz.reduce((acc, q) => {
      return acc + (selectedAnswers[q.id] === q.correctIndex ? 1 : 0);
    }, 0);
  }, [activeChapter.quiz, selectedAnswers]);

  const embedVideoUrl = useMemo(() => {
    if (!course.videoUrl) return null;
    try {
      const url = new URL(course.videoUrl);
      if (url.hostname.includes('youtube.com')) {
        const v = url.searchParams.get('v');
        if (v) return `https://www.youtube.com/embed/${v}`;
      }
      if (url.hostname.includes('youtu.be')) {
        const v = url.pathname.replace('/', '');
        if (v) return `https://www.youtube.com/embed/${v}`;
      }
      return course.videoUrl;
    } catch {
      return null;
    }
  }, [course.videoUrl]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb & Course Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-emerald-700 transition-colors mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>সব কোর্সে ফিরে যান</span>
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            {course.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            {course.instructorName} ({course.instructorCredential}) ·{' '}
            {course.categoryLabel}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onToggleLessonComplete(activeLesson.id)}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            isLessonCompleted
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
              : 'bg-emerald-700 text-white hover:bg-emerald-800'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
          <span>
            {isLessonCompleted
              ? 'সম্পন্ন হয়েছে (বাতিল করুন)'
              : 'লেকচার সম্পন্ন চিহ্নিত করুন'}
          </span>
        </button>
      </div>

      {/* 2-Zone Sandbox Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left/Main Zone (65-67%): Interactive Stage + Tabs */}
        <div className="lg:col-span-8 space-y-6">
          {embedVideoUrl && (
            <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden aspect-video">
              <iframe
                src={embedVideoUrl}
                title={course.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}

          {course.pdfUrl && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm font-semibold text-emerald-900">
                এই কোর্সের জন্য লেকচার শিট (PDF) সংযুক্ত রয়েছে
              </span>
              <a
                href={course.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition-colors"
              >
                লেকচার শিট খুলুন
              </a>
            </div>
          )}

          <InteractiveLessonStage
            lesson={activeLesson}
            onLessonFinished={() => {
              if (!isLessonCompleted) {
                onToggleLessonComplete(activeLesson.id);
              }
            }}
          />

          {/* Lesson Title & Tab Switcher */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-1">
              {activeLesson.title}
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed mb-5">
              {activeLesson.summary}
            </p>

            {/* Segmented Tab Controls */}
            <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg w-fit mb-6">
              <button
                type="button"
                onClick={() => setActiveTab('notes')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === 'notes'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-4 h-4" aria-hidden="true" />
                <span>লেকচার নোটস ও সূত্র</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('quiz')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === 'quiz'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <HelpCircle className="w-4 h-4" aria-hidden="true" />
                <span>অধ্যায় কুইজ ({activeChapter.quiz.length}টি)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('notebook')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === 'notebook'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <PenLine className="w-4 h-4" aria-hidden="true" />
                <span>আমার নোটবুক</span>
              </button>
            </div>

            {/* Tab 1: Study Notes & Key Formulas */}
            {activeTab === 'notes' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">
                    গুরুত্বপূর্ণ সূত্র ও মূল তথ্য
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeLesson.keyFormulas.map((formula, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 font-mono text-xs sm:text-sm text-slate-800"
                      >
                        {formula}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">
                    সহজ সারসংক্ষেপ
                  </h3>
                  <ul className="space-y-2.5 text-sm text-slate-700 leading-relaxed">
                    {activeLesson.studyNotes.map((note, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <span className="font-mono text-xs font-semibold text-emerald-700 mt-1">
                          ০{idx + 1}.
                        </span>
                        <span>{note}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Tab 2: Chapter Quiz */}
            {activeTab === 'quiz' && (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
                  <span className="text-sm font-semibold text-slate-900">
                    {activeChapter.title} — অনুশীলন কুইজ
                  </span>
                  {quizSubmitted && (
                    <span className="text-sm font-bold text-emerald-700 tabular-nums">
                      স্কোর: {chapterQuizScore} / {activeChapter.quiz.length}
                    </span>
                  )}
                </div>

                {activeChapter.quiz.map((q, qIdx) => {
                  const chosen = selectedAnswers[q.id];
                  return (
                    <div
                      key={q.id}
                      className="border border-slate-200 rounded-lg p-4 space-y-3"
                    >
                      <p className="text-sm font-semibold text-slate-900">
                        প্রশ্ন {qIdx + 1}: {q.question}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {q.options.map((opt, oIdx) => {
                          const isSelected = chosen === oIdx;
                          const isCorrect = q.correctIndex === oIdx;
                          let style =
                            'border-slate-200 bg-white text-slate-700 hover:bg-slate-50';
                          if (quizSubmitted) {
                            if (isCorrect) {
                              style =
                                'border-emerald-600 bg-emerald-50 text-emerald-900 font-semibold';
                            } else if (isSelected && !isCorrect) {
                              style =
                                'border-rose-500 bg-rose-50 text-rose-900';
                            }
                          } else if (isSelected) {
                            style =
                              'border-emerald-700 bg-emerald-50 text-emerald-900 font-medium';
                          }
                          return (
                            <button
                              key={oIdx}
                              type="button"
                              disabled={quizSubmitted}
                              onClick={() =>
                                setSelectedAnswers((prev) => ({
                                  ...prev,
                                  [q.id]: oIdx,
                                }))
                              }
                              className={`text-left px-3.5 py-2.5 rounded-lg border text-xs sm:text-sm transition-colors cursor-pointer disabled:cursor-default ${style}`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                      {quizSubmitted && (
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-700 leading-relaxed">
                          <span className="font-semibold text-slate-900">
                            ব্যাখ্যা:{' '}
                          </span>
                          {q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}

                <div className="flex items-center gap-3">
                  {!quizSubmitted ? (
                    <button
                      type="button"
                      onClick={() => setQuizSubmitted(true)}
                      disabled={
                        Object.keys(selectedAnswers).length <
                        activeChapter.quiz.length
                      }
                      className="px-4 py-2 rounded-lg bg-emerald-700 text-white text-sm font-semibold hover:bg-emerald-800 disabled:bg-slate-300 disabled:text-slate-500 transition-colors cursor-pointer disabled:cursor-not-allowed"
                    >
                      উত্তর জমা দিন
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAnswers({});
                        setQuizSubmitted(false);
                      }}
                      className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      পুনরায় অনুশীলন করুন
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Tab 3: Personal Notebook */}
            {activeTab === 'notebook' && (
              <div className="space-y-3">
                <label
                  htmlFor="personal-lesson-note"
                  className="block text-sm font-semibold text-slate-900"
                >
                  এই লেকচারের জন্য আপনার নিজস্ব নোট লিখুন (স্বয়ংক্রিয়ভাবে সংরক্ষিত হবে)
                </label>
                <textarea
                  id="personal-lesson-note"
                  rows={6}
                  value={personalNotes[activeLesson.id] || ''}
                  onChange={(e) =>
                    onSavePersonalNote(activeLesson.id, e.target.value)
                  }
                  placeholder="এখানে গুরুত্বপূর্ণ সূত্র, সংজ্ঞা বা পরীক্ষার টিপস লিখে রাখুন..."
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 p-3.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-600"
                />
                <p className="text-xs text-slate-500">
                  সংরক্ষিত নোটগুলো ‘আমার ড্যাশবোর্ড’ থেকে যেকোনো সময় দেখতে পারবেন।
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Deck (33%): Course Curriculum & Progress */}
        <aside className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 space-y-5">
          <div>
            <div className="flex items-center justify-between text-sm font-semibold text-slate-900 mb-2">
              <span className="inline-flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-emerald-700" aria-hidden="true" />
                কোর্স অগ্রগতি
              </span>
              <span className="font-mono tabular-nums text-emerald-700">
                {progressPercent}%
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-600 transition-all duration-200"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-1.5 tabular-nums">
              মোট {allLessons.length}টি লেকচারের মধ্যে {completedInCourse}টি সম্পন্ন
            </p>
          </div>

          <div className="border-t border-slate-200 pt-4 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              কোর্স কারিকুলাম
            </h3>

            {course.chapters.map((chapter, chIdx) => (
              <div key={chapter.id} className="space-y-2">
                <div className="text-xs font-semibold text-slate-500">
                  {chapter.title}
                </div>
                <div className="space-y-1.5">
                  {chapter.lessons.map((lesson, lIdx) => {
                    const isCurrent =
                      chIdx === activeChapterIdx && lIdx === activeLessonIdx;
                    const done = completedLessonIds.includes(lesson.id);
                    return (
                      <button
                        key={lesson.id}
                        type="button"
                        onClick={() => handleSelectLesson(chIdx, lIdx)}
                        className={`w-full text-left px-3 py-2.5 rounded-lg border text-xs sm:text-sm flex items-start gap-2.5 transition-colors cursor-pointer ${
                          isCurrent
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-950 font-semibold'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {done ? (
                          <CheckCircle2
                            className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5"
                            aria-hidden="true"
                          />
                        ) : (
                          <Circle
                            className="w-4 h-4 text-slate-400 shrink-0 mt-0.5"
                            aria-hidden="true"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="leading-snug">{lesson.title}</div>
                          <div className="text-[11px] text-slate-500 font-mono tabular-nums mt-0.5">
                            {lesson.duration}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
};
