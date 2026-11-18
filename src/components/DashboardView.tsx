import React from 'react';
import { User } from 'firebase/auth';
import {
  Award,
  Bookmark,
  BookOpen,
  CheckCircle2,
  LogIn,
  LogOut,
  PenLine,
  ShieldCheck,
} from 'lucide-react';
import { FORMULA_NOTES_DATA } from '../data/liveAndNotesData';
import { Course, UserLearningState } from '../types/edu';

interface DashboardViewProps {
  user: User | null;
  isAdmin: boolean;
  allCourses: Course[];
  learningState: UserLearningState;
  onSignIn: () => void;
  onSignOut: () => void;
  onOpenAdmin: () => void;
  onOpenCourse: (courseId: string) => void;
  onNavigateCourses: () => void;
  onNavigateQuiz: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  isAdmin,
  allCourses,
  learningState,
  onSignIn,
  onSignOut,
  onOpenAdmin,
  onOpenCourse,
  onNavigateCourses,
  onNavigateQuiz,
}) => {
  const enrolledCourses = allCourses.filter((c) =>
    learningState.enrolledCourseIds.includes(c.id)
  );

  const avgAccuracy = learningState.quizAttempts.length
    ? Math.round(
        learningState.quizAttempts.reduce((acc, a) => acc + a.accuracy, 0) /
          learningState.quizAttempts.length
      )
    : 0;

  const bookmarkedNotes = FORMULA_NOTES_DATA.filter((n) =>
    learningState.bookmarkedNoteIds.includes(n.id)
  );

  const savedPersonalNotes = Object.entries(learningState.personalNotes).filter(
    ([, val]) => val.trim().length > 0
  );

  const allLessonsMap = new Map(
    allCourses.flatMap((c) =>
      c.chapters.flatMap((ch) =>
        ch.lessons.map((l) => [
          l.id,
          { lessonTitle: l.title, courseTitle: c.title, courseId: c.id },
        ])
      )
    )
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Account & Cloud Sync Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {user ? (
          <>
            <div className="flex items-center gap-4">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'শিক্ষার্থী'}
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-full object-cover border border-slate-200"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  {(user.displayName || 'S').slice(0, 1)}
                </div>
              )}
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {user.displayName || 'Confirm DU শিক্ষার্থী'}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600">
                  {user.email} · ক্লাউড ডাটাবেজে অগ্রগতি স্বয়ংক্রিয়ভাবে সংরক্ষিত হচ্ছে
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {isAdmin && (
                <button
                  type="button"
                  onClick={onOpenAdmin}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                  <span>অ্যাডমিন প্যানেল খুলুন</span>
                </button>
              )}

              <button
                type="button"
                onClick={onSignOut}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium transition-colors whitespace-nowrap cursor-pointer"
              >
                <LogOut className="w-4 h-4" aria-hidden="true" />
                <span>সাইন আউট</span>
              </button>
            </div>
          </>
        ) : (
          <>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                সব ডিভাইসে পড়াশোনা সেভ রাখতে সাইন ইন করুন
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                Google অ্যাকাউন্ট দিয়ে সাইন ইন করলে আপনার মডেল টেস্ট স্কোর লিডারবোর্ডে যুক্ত হবে এবং নোটস সুরক্ষিত থাকবে।
              </p>
            </div>
            <button
              type="button"
              onClick={onSignIn}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <LogIn className="w-4 h-4" aria-hidden="true" />
              <span>Google দিয়ে সাইন ইন করুন</span>
            </button>
          </>
        )}
      </div>

      <div className="border-b border-slate-200 pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            আমার লার্নিং ড্যাশবোর্ড
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-1.5">
            আপনার চলমান কোর্স, সম্পন্ন লেকচার, মডেল টেস্ট স্কোর এবং সংরক্ষিত নোটসমূহ।
          </p>
        </div>

        <button
          type="button"
          onClick={onNavigateCourses}
          className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          নতুন কোর্স দেখুন
        </button>
      </div>

      {/* 4-Column Summary KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>ভর্তিকৃত কোর্স</span>
            <BookOpen className="w-4 h-4 text-emerald-700" aria-hidden="true" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {enrolledCourses.length}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>সম্পন্ন লেকচার</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-700" aria-hidden="true" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {learningState.completedLessonIds.length}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>কুইজ গড় নির্ভুলতা</span>
            <Award className="w-4 h-4 text-emerald-700" aria-hidden="true" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {avgAccuracy}%
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>সংরক্ষিত সূত্র</span>
            <Bookmark className="w-4 h-4 text-emerald-700" aria-hidden="true" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {bookmarkedNotes.length}
          </div>
        </div>
      </div>

      {/* Enrolled Courses Progress */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900">আমার কোর্সসমূহ</h2>
        {enrolledCourses.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-3">
            <p className="text-sm text-slate-600">
              আপনি এখনো কোনো কোর্সে যুক্ত হননি। যেকোনো কোর্স খুলে শেখা শুরু করুন।
            </p>
            <button
              type="button"
              onClick={onNavigateCourses}
              className="px-4 py-2 rounded-lg bg-emerald-700 text-white text-sm font-semibold hover:bg-emerald-800 cursor-pointer"
            >
              কোর্স ব্রাউজ করুন
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {enrolledCourses.map((course) => {
              const allLessons = course.chapters.flatMap((ch) => ch.lessons);
              const doneCount = allLessons.filter((l) =>
                learningState.completedLessonIds.includes(l.id)
              ).length;
              const pct = allLessons.length
                ? Math.round((doneCount / allLessons.length) * 100)
                : 0;

              return (
                <div
                  key={course.id}
                  className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-4"
                >
                  <div>
                    <div className="text-xs text-slate-500">
                      {course.categoryLabel} · {course.subject}
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-1">
                      {course.title}
                    </h3>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-slate-600 tabular-nums">
                      <span>
                        {doneCount} / {allLessons.length} লেকচার সম্পন্ন
                      </span>
                      <span className="font-semibold text-emerald-700">{pct}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-600"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenCourse(course.id)}
                    className="w-full py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition-colors cursor-pointer"
                  >
                    পড়া চালিয়ে যান
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Quiz Attempts & Personal Notes Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">
              মডেল টেস্ট ফলাফল ইতিহাস
            </h2>
            <button
              type="button"
              onClick={onNavigateQuiz}
              className="text-xs font-semibold text-emerald-700 hover:underline cursor-pointer"
            >
              নতুন পরীক্ষা দিন
            </button>
          </div>

          {learningState.quizAttempts.length === 0 ? (
            <p className="text-sm text-slate-500">
              এখনো কোনো মডেল টেস্ট দেওয়া হয়নি।
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {learningState.quizAttempts.slice(0, 5).map((attempt, idx) => (
                <div
                  key={idx}
                  className="py-3 flex items-center justify-between gap-3 text-sm"
                >
                  <div>
                    <div className="font-medium text-slate-900">
                      {attempt.testTitle}
                    </div>
                    <div className="text-xs text-slate-500">
                      তারিখ: {attempt.completedAt}
                    </div>
                  </div>
                  <div className="font-mono font-bold text-emerald-700 tabular-nums shrink-0">
                    {attempt.score}/{attempt.total} ({attempt.accuracy}%)
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <PenLine className="w-4 h-4 text-emerald-700" aria-hidden="true" />
            <span>আমার ব্যক্তিগত লেকচার নোটস</span>
          </h2>

          {savedPersonalNotes.length === 0 ? (
            <p className="text-sm text-slate-500">
              ক্লাসরুমের ‘আমার নোটবুক’ ট্যাবে কোনো নোট লিখলে তা এখানে দেখাবে।
            </p>
          ) : (
            <div className="space-y-3">
              {savedPersonalNotes.map(([lessonId, noteText]) => {
                const info = allLessonsMap.get(lessonId);
                return (
                  <div
                    key={lessonId}
                    className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-1"
                  >
                    <div className="text-xs font-semibold text-emerald-800">
                      {info?.lessonTitle || lessonId}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-wrap">
                      {noteText}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
