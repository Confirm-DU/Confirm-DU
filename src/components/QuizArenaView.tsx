import React, { useEffect, useState } from 'react';
import { Award, CheckCircle2, Clock, RotateCcw, Trophy, XCircle } from 'lucide-react';
import { User } from 'firebase/auth';
import {
  CustomQuizQuestion,
  LeaderboardEntry,
  ModelTest,
  QuizAttemptRecord,
} from '../types/edu';
import { MODEL_TESTS_DATA } from '../data/liveAndNotesData';

interface QuizArenaViewProps {
  user: User | null;
  attempts: QuizAttemptRecord[];
  customQuestions: CustomQuizQuestion[];
  leaderboard: LeaderboardEntry[];
  onRecordAttempt: (attempt: QuizAttemptRecord) => void;
  onSignIn: () => void;
}

export const QuizArenaView: React.FC<QuizArenaViewProps> = ({
  user,
  attempts,
  customQuestions,
  leaderboard,
  onRecordAttempt,
  onSignIn,
}) => {
  const [activeTest, setActiveTest] = useState<ModelTest | null>(null);
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const mergedTests: ModelTest[] = MODEL_TESTS_DATA.map((test) => {
    const extras = customQuestions.filter((q) => q.testId === test.id);
    if (extras.length === 0) return test;
    return {
      ...test,
      questions: [...test.questions, ...extras],
    };
  });

  const startTest = (test: ModelTest) => {
    setActiveTest(test);
    setCurrentQIdx(0);
    setAnswers({});
    setSecondsLeft(test.durationMinutes * 60);
    setIsSubmitted(false);
  };

  const finishTest = () => {
    if (!activeTest || isSubmitted) return;
    setIsSubmitted(true);
    const score = activeTest.questions.reduce(
      (acc, q) => acc + (answers[q.id] === q.correctIndex ? 1 : 0),
      0
    );
    const total = activeTest.questions.length;
    const accuracy = Math.round((score / total) * 100);
    onRecordAttempt({
      testId: activeTest.id,
      testTitle: activeTest.title,
      score,
      total,
      accuracy,
      completedAt: new Date().toLocaleDateString('bn-BD'),
    });
  };

  useEffect(() => {
    if (!activeTest || isSubmitted) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          finishTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTest, isSubmitted]);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  if (!activeTest) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        <div className="border-b border-slate-200 pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Confirm DU মডেল টেস্ট ও মেধাতালিকা
            </h1>
            <p className="text-sm sm:text-base text-slate-600 mt-1.5">
              সময় ধরে খ-ইউনিট ও গুচ্ছ মানবিক স্ট্যান্ডার্ড MCQ পরীক্ষা দিন এবং লিডারবোর্ডে আপনার অবস্থান দেখুন।
            </p>
          </div>
          {!user && (
            <button
              type="button"
              onClick={onSignIn}
              className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              লিডারবোর্ডে স্কোর সেভ করতে লগইন করুন
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {mergedTests.map((test) => {
            const bestAttempt = attempts
              .filter((a) => a.testId === test.id)
              .sort((a, b) => b.accuracy - a.accuracy)[0];

            return (
              <article
                key={test.id}
                className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between gap-5"
              >
                <div className="space-y-2.5">
                  <div className="text-xs font-medium text-slate-500">
                    {test.categoryLabel} · {test.subject}
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 leading-snug">
                    {test.title}
                  </h2>
                  <div className="flex items-center gap-4 text-xs text-slate-600 tabular-nums pt-1">
                    <span>প্রশ্ন: {test.questions.length}টি</span>
                    <span>সময়: {test.durationMinutes} মিনিট</span>
                  </div>
                  {bestAttempt && (
                    <div className="text-xs font-semibold text-emerald-700 pt-1 tabular-nums">
                      আপনার সেরা স্কোর: {bestAttempt.score}/{bestAttempt.total} (
                      {bestAttempt.accuracy}%)
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => startTest(test)}
                  className="w-full py-2.5 px-4 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold transition-colors cursor-pointer"
                >
                  {bestAttempt ? 'পুনরায় পরীক্ষা দিন' : 'মডেল টেস্ট শুরু করুন'}
                </button>
              </article>
            );
          })}
        </div>

        {/* Confirm DU Live Leaderboard */}
        <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" aria-hidden="true" />
              <span>সম্মিলিত মডেল টেস্ট লিডারবোর্ড</span>
            </h2>
            <span className="text-xs text-slate-500 tabular-nums">
              মোট {leaderboard.length}টি স্কোর রেকর্ড
            </span>
          </div>

          {leaderboard.length === 0 ? (
            <p className="text-sm text-slate-500">
              সাইন ইন করে প্রথম মডেল টেস্ট দিলে আপনার নাম ও স্কোর লিডারবোর্ডে যুক্ত হবে।
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs text-slate-500">
                    <th className="py-2.5 pr-4 font-semibold">ক্রম</th>
                    <th className="py-2.5 pr-4 font-semibold">শিক্ষার্থীর নাম</th>
                    <th className="py-2.5 pr-4 font-semibold">মডেল টেস্ট</th>
                    <th className="py-2.5 pr-4 font-semibold text-right">স্কোর</th>
                    <th className="py-2.5 font-semibold text-right">নির্ভুলতা</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leaderboard.slice(0, 10).map((entry, idx) => (
                    <tr key={entry.id || idx}>
                      <td className="py-3 pr-4 font-mono tabular-nums font-semibold text-slate-700">
                        {idx + 1}
                      </td>
                      <td className="py-3 pr-4 font-medium text-slate-900">
                        {entry.studentName}
                      </td>
                      <td className="py-3 pr-4 text-xs sm:text-sm text-slate-600">
                        {entry.testTitle}
                      </td>
                      <td className="py-3 pr-4 text-right font-mono tabular-nums font-semibold text-slate-900">
                        {entry.score}/{entry.total}
                      </td>
                      <td className="py-3 text-right font-mono tabular-nums font-semibold text-emerald-700">
                        {entry.accuracy}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    );
  }

  const currentQ = activeTest.questions[currentQIdx];
  const score = activeTest.questions.reduce(
    (acc, q) => acc + (answers[q.id] === q.correctIndex ? 1 : 0),
    0
  );
  const accuracy = Math.round((score / activeTest.questions.length) * 100);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs text-slate-500">
            {activeTest.categoryLabel} · {activeTest.subject}
          </span>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900">
            {activeTest.title}
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {!isSubmitted && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-900 font-mono text-sm font-semibold tabular-nums">
              <Clock className="w-4 h-4 text-emerald-700" aria-hidden="true" />
              <span>{formatTimer(secondsLeft)}</span>
            </div>
          )}
          <button
            type="button"
            onClick={() => setActiveTest(null)}
            className="text-sm font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            তালিকায় ফিরুন
          </button>
        </div>
      </div>

      {!isSubmitted ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
            <div className="flex items-center justify-between text-xs text-slate-500 tabular-nums">
              <span>
                প্রশ্ন {currentQIdx + 1} / {activeTest.questions.length}
              </span>
              <span>উত্তর দিয়েছেন: {Object.keys(answers).length}টি</span>
            </div>

            <h2 className="text-lg font-bold text-slate-900 leading-relaxed">
              {currentQ.question}
            </h2>

            <div className="space-y-2.5">
              {currentQ.options.map((opt, idx) => {
                const selected = answers[currentQ.id] === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() =>
                      setAnswers((prev) => ({ ...prev, [currentQ.id]: idx }))
                    }
                    className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors cursor-pointer ${
                      selected
                        ? 'bg-emerald-50 border-emerald-700 text-emerald-950 font-semibold'
                        : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>

            <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                type="button"
                disabled={currentQIdx === 0}
                onClick={() => setCurrentQIdx((i) => Math.max(0, i - 1))}
                className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              >
                পূর্ববর্তী প্রশ্ন
              </button>

              {currentQIdx < activeTest.questions.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentQIdx((i) => i + 1)}
                  className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 cursor-pointer"
                >
                  পরবর্তী প্রশ্ন
                </button>
              ) : (
                <button
                  type="button"
                  onClick={finishTest}
                  className="px-5 py-2 rounded-lg bg-emerald-700 text-white text-sm font-semibold hover:bg-emerald-800 cursor-pointer"
                >
                  পরীক্ষা জমা দিন
                </button>
              )}
            </div>
          </div>

          <aside className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">প্রশ্ন নেভিগেটর</h3>
            <div className="grid grid-cols-5 gap-2">
              {activeTest.questions.map((q, idx) => {
                const answered = answers[q.id] !== undefined;
                const current = idx === currentQIdx;
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentQIdx(idx)}
                    className={`h-10 rounded-lg font-mono text-sm font-semibold tabular-nums border transition-colors cursor-pointer ${
                      current
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : answered
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={finishTest}
              className="w-full py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold transition-colors cursor-pointer"
            >
              সব উত্তর জমা দিন
            </button>
          </aside>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                <Award className="w-6 h-6" aria-hidden="true" />
              </div>
              <div>
                <div className="text-xs text-slate-500">মডেল টেস্ট ফলাফল</div>
                <h2 className="text-xl font-bold text-slate-900 tabular-nums">
                  আপনার প্রাপ্ত নম্বর: {score} / {activeTest.questions.length} ({accuracy}%)
                </h2>
                {user ? (
                  <p className="text-xs text-emerald-700 mt-0.5">
                    আপনার স্কোর সম্মিলিত লিডারবোর্ডে সংরক্ষিত হয়েছে।
                  </p>
                ) : (
                  <p className="text-xs text-slate-500 mt-0.5">
                    লিডারবোর্ডে নাম যুক্ত করতে ড্যাশবোর্ড থেকে Google দিয়ে সাইন ইন করুন।
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => startTest(activeTest)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
              <span>পুনরায় পরীক্ষা দিন</span>
            </button>
          </div>

          <div className="space-y-4">
            {activeTest.questions.map((q, idx) => {
              const userChoice = answers[q.id];
              const isCorrect = userChoice === q.correctIndex;
              return (
                <div
                  key={q.id}
                  className="bg-white border border-slate-200 rounded-xl p-5 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm sm:text-base font-semibold text-slate-900">
                      {idx + 1}. {q.question}
                    </p>
                    {isCorrect ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 shrink-0">
                        <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                        সঠিক
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 shrink-0">
                        <XCircle className="w-4 h-4" aria-hidden="true" />
                        ভুল
                      </span>
                    )}
                  </div>

                  <div className="text-xs sm:text-sm space-y-1">
                    <p className="text-slate-600">
                      আপনার উত্তর:{' '}
                      <span className="font-semibold text-slate-900">
                        {userChoice !== undefined
                          ? q.options[userChoice]
                          : 'উত্তর দেওয়া হয়নি'}
                      </span>
                    </p>
                    <p className="text-emerald-800">
                      সঠিক উত্তর:{' '}
                      <span className="font-semibold">
                        {q.options[q.correctIndex]}
                      </span>
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
                    <span className="font-semibold text-slate-900">ব্যাখ্যা: </span>
                    {q.explanation}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
