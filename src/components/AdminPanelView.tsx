import React, { useState } from 'react';
import { User } from 'firebase/auth';
import {
  deleteDoc,
  doc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import {
  BookPlus,
  HelpCircle,
  Radio,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { MODEL_TESTS_DATA } from '../data/liveAndNotesData';
import {
  Course,
  CourseCategory,
  CustomQuizQuestion,
  LiveClass,
} from '../types/edu';

interface AdminPanelViewProps {
  user: User | null;
  isAdmin: boolean;
  customCourses: Course[];
  customLiveClasses: LiveClass[];
  customQuestions: CustomQuizQuestion[];
  onSignIn: () => void;
}

type AdminTab = 'courses' | 'live' | 'quiz';

const CATEGORY_LABELS: Record<Exclude<CourseCategory, 'all'>, string> = {
  bangla: 'বাংলা',
  english: 'ইংরেজি',
  gk: 'সাধারণ জ্ঞান',
  written: 'লিখিত ও মডেল',
};

export const AdminPanelView: React.FC<AdminPanelViewProps> = ({
  user,
  isAdmin,
  customCourses,
  customLiveClasses,
  customQuestions,
  onSignIn,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('courses');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Course form state
  const [courseTitle, setCourseTitle] = useState('');
  const [courseCategory, setCourseCategory] =
    useState<Exclude<CourseCategory, 'all'>>('bangla');
  const [courseSubject, setCourseSubject] = useState('বাংলা');
  const [instructorName, setInstructorName] = useState('');
  const [instructorCredential, setInstructorCredential] = useState(
    'ঢাকা বিশ্ববিদ্যালয়'
  );
  const [totalDuration, setTotalDuration] = useState('২ ঘণ্টা ৩০ মিনিট');
  const [videoUrl, setVideoUrl] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [courseDesc, setCourseDesc] = useState('');

  // Live class form state
  const [liveTitle, setLiveTitle] = useState('');
  const [liveCategory, setLiveCategory] =
    useState<Exclude<CourseCategory, 'all'>>('gk');
  const [liveSubject, setLiveSubject] = useState('সাধারণ জ্ঞান');
  const [liveInstructor, setLiveInstructor] = useState('');
  const [liveCredential, setLiveCredential] = useState('ঢাকা বিশ্ববিদ্যালয়');
  const [liveSchedule, setLiveSchedule] = useState('আজ রাত ৮:৩০');
  const [liveDuration, setLiveDuration] = useState('৬০ মিনিট');
  const [liveStatus, setLiveStatus] = useState<'live' | 'upcoming'>('upcoming');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [liveTopicsText, setLiveTopicsText] = useState('');

  // Quiz question form state
  const [targetTestId, setTargetTestId] = useState(MODEL_TESTS_DATA[0].id);
  const [qSubject, setQSubject] = useState('বাংলা');
  const [qText, setQText] = useState('');
  const [opt0, setOpt0] = useState('');
  const [opt1, setOpt1] = useState('');
  const [opt2, setOpt2] = useState('');
  const [opt3, setOpt3] = useState('');
  const [correctIdx, setCorrectIdx] = useState(0);
  const [qExplanation, setQExplanation] = useState('');

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-4">
          <ShieldCheck
            className="w-10 h-10 text-emerald-700 mx-auto"
            aria-hidden="true"
          />
          <h1 className="text-xl font-bold text-slate-900">
            Confirm DU অ্যাডমিন প্যানেল
          </h1>
          <p className="text-sm text-slate-600">
            কোর্স, ভিডিও লেকচার, লাইভ ক্লাস এবং মডেল টেস্ট প্রশ্ন পরিচালনা করতে অনুগ্রহ করে আপনার অ্যাডমিন গুগল অ্যাকাউন্ট দিয়ে সাইন ইন করুন।
          </p>
          <button
            type="button"
            onClick={onSignIn}
            className="px-5 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold transition-colors cursor-pointer"
          >
            Google দিয়ে সাইন ইন করুন
          </button>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-3">
          <h1 className="text-xl font-bold text-slate-900">
            অ্যাডমিন অ্যাক্সেস অনুমোদিত নয়
          </h1>
          <p className="text-sm text-slate-600">
            বর্তমানে আপনি <span className="font-semibold">{user.email}</span> অ্যাকাউন্টে লগইন আছেন। নতুন কোর্স বা প্রশ্ন আপলোড করতে প্রতিষ্ঠানের অ্যাডমিন অ্যাকাউন্ট প্রয়োজন।
          </p>
        </div>
      </div>
    );
  }

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseTitle.trim() || !instructorName.trim() || !courseDesc.trim()) {
      setFeedback('অনুগ্রহ করে কোর্সের শিরোনাম, শিক্ষকের নাম এবং বিবরণ পূরণ করুন।');
      return;
    }
    setIsSaving(true);
    setFeedback(null);
    const id = `course_${Date.now()}`;
    const path = `courses/${id}`;
    try {
      const payload: Record<string, unknown> = {
        id,
        title: courseTitle.trim().slice(0, 200),
        category: courseCategory,
        categoryLabel: CATEGORY_LABELS[courseCategory],
        subject: courseSubject.trim().slice(0, 80),
        instructorName: instructorName.trim().slice(0, 100),
        instructorCredential: instructorCredential.trim().slice(0, 150),
        totalDuration: totalDuration.trim().slice(0, 60),
        description: courseDesc.trim().slice(0, 1000),
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      if (videoUrl.trim()) payload.videoUrl = videoUrl.trim().slice(0, 500);
      if (pdfUrl.trim()) payload.pdfUrl = pdfUrl.trim().slice(0, 500);

      await setDoc(doc(db, 'courses', id), payload);
      setCourseTitle('');
      setInstructorName('');
      setVideoUrl('');
      setPdfUrl('');
      setCourseDesc('');
      setFeedback('নতুন কোর্স সফলভাবে ডাটাবেজে যুক্ত হয়েছে!');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateLiveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!liveTitle.trim() || !liveInstructor.trim()) {
      setFeedback('অনুগ্রহ করে লাইভ ক্লাসের শিরোনাম ও শিক্ষকের নাম লিখুন।');
      return;
    }
    setIsSaving(true);
    setFeedback(null);
    const id = `live_${Date.now()}`;
    const path = `liveClasses/${id}`;
    try {
      const topics = liveTopicsText
        .split('\n')
        .map((t) => t.trim().slice(0, 128))
        .filter(Boolean)
        .slice(0, 10);

      const payload: Record<string, unknown> = {
        id,
        title: liveTitle.trim().slice(0, 200),
        subject: liveSubject.trim().slice(0, 80),
        category: liveCategory,
        categoryLabel: CATEGORY_LABELS[liveCategory],
        instructorName: liveInstructor.trim().slice(0, 100),
        instructorCredential: liveCredential.trim().slice(0, 150),
        scheduleTime: liveSchedule.trim().slice(0, 80),
        duration: liveDuration.trim().slice(0, 40),
        status: liveStatus,
        topics: topics.length > 0 ? topics : ['বিগত ঢাবি প্রশ্ন বিশ্লেষণ'],
        createdBy: user.uid,
        createdAt: serverTimestamp(),
      };
      if (meetingUrl.trim()) payload.meetingUrl = meetingUrl.trim().slice(0, 500);

      await setDoc(doc(db, 'liveClasses', id), payload);
      setLiveTitle('');
      setLiveInstructor('');
      setMeetingUrl('');
      setLiveTopicsText('');
      setFeedback('লাইভ ক্লাস সফলভাবে প্রকাশিত হয়েছে!');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !qText.trim() ||
      !opt0.trim() ||
      !opt1.trim() ||
      !opt2.trim() ||
      !opt3.trim() ||
      !qExplanation.trim()
    ) {
      setFeedback('অনুগ্রহ করে প্রশ্ন, ৪টি অপশন এবং ব্যাখ্যা সম্পূর্ণ পূরণ করুন।');
      return;
    }
    setIsSaving(true);
    setFeedback(null);
    const id = `q_${Date.now()}`;
    const path = `quizQuestions/${id}`;
    try {
      await setDoc(doc(db, 'quizQuestions', id), {
        id,
        testId: targetTestId,
        subject: qSubject.trim().slice(0, 80),
        question: qText.trim().slice(0, 500),
        options: [
          opt0.trim().slice(0, 200),
          opt1.trim().slice(0, 200),
          opt2.trim().slice(0, 200),
          opt3.trim().slice(0, 200),
        ],
        correctIndex: correctIdx,
        explanation: qExplanation.trim().slice(0, 1000),
        createdBy: user.uid,
        createdAt: serverTimestamp(),
      });
      setQText('');
      setOpt0('');
      setOpt1('');
      setOpt2('');
      setOpt3('');
      setQExplanation('');
      setFeedback('নতুন MCQ প্রশ্ন মডেল টেস্টে যুক্ত হয়েছে!');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (collectionName: string, docId: string) => {
    const path = `${collectionName}/${docId}`;
    try {
      await deleteDoc(doc(db, collectionName, docId));
      setFeedback('আইটেমটি সফলভাবে মুছে ফেলা হয়েছে।');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="border-b border-slate-200 pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-emerald-700 mb-1">
            Confirm DU ব্যবস্থাপনা · {user.email}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            অ্যাডমিন প্যানেল (কন্টেন্ট ম্যানেজার)
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            এখান থেকে নতুন কোর্স, ইউটিউব ভিডিও/PDF লিংক, লাইভ ক্লাস রুটিন এবং মডেল টেস্ট প্রশ্ন যোগ করুন।
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg w-fit">
          <button
            type="button"
            onClick={() => {
              setActiveTab('courses');
              setFeedback(null);
            }}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'courses'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookPlus className="w-4 h-4" aria-hidden="true" />
            <span>কোর্স ({customCourses.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('live');
              setFeedback(null);
            }}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'live'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Radio className="w-4 h-4" aria-hidden="true" />
            <span>লাইভ ক্লাস ({customLiveClasses.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('quiz');
              setFeedback(null);
            }}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'quiz'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <HelpCircle className="w-4 h-4" aria-hidden="true" />
            <span>কুইজ প্রশ্ন ({customQuestions.length})</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg px-4 py-3 text-sm font-medium">
          {feedback}
        </div>
      )}

      {/* TAB 1: Courses */}
      {activeTab === 'courses' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <form
            onSubmit={handleCreateCourse}
            className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-4"
          >
            <h2 className="text-lg font-bold text-slate-900">
              নতুন কোর্স ও ক্লাস ভিডিও যোগ করুন
            </h2>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                কোর্সের শিরোনাম *
              </label>
              <input
                type="text"
                maxLength={200}
                value={courseTitle}
                onChange={(e) => setCourseTitle(e.target.value)}
                placeholder="যেমন: ঢাবি খ-ইউনিট বাংলা সাহিত্য চূড়ান্ত সাজেশন"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  বিভাগ (Category)
                </label>
                <select
                  value={courseCategory}
                  onChange={(e) =>
                    setCourseCategory(
                      e.target.value as Exclude<CourseCategory, 'all'>
                    )
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:border-emerald-600"
                >
                  <option value="bangla">বাংলা</option>
                  <option value="english">ইংরেজি</option>
                  <option value="gk">সাধারণ জ্ঞান</option>
                  <option value="written">লিখিত ও মডেল</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  বিষয়
                </label>
                <input
                  type="text"
                  maxLength={80}
                  value={courseSubject}
                  onChange={(e) => setCourseSubject(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  মেন্টর / শিক্ষকের নাম *
                </label>
                <input
                  type="text"
                  maxLength={100}
                  value={instructorName}
                  onChange={(e) => setInstructorName(e.target.value)}
                  placeholder="শিক্ষকের নাম"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  পরিচিতি / বিভাগ
                </label>
                <input
                  type="text"
                  maxLength={150}
                  value={instructorCredential}
                  onChange={(e) => setInstructorCredential(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  ইউটিউব ভিডিও লিংক (ঐচ্ছিক)
                </label>
                <input
                  type="url"
                  maxLength={500}
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  PDF লেকচার শিট লিংক (ঐচ্ছিক)
                </label>
                <input
                  type="url"
                  maxLength={500}
                  value={pdfUrl}
                  onChange={(e) => setPdfUrl(e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                সময়কাল
              </label>
              <input
                type="text"
                maxLength={60}
                value={totalDuration}
                onChange={(e) => setTotalDuration(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                কোর্সের বিবরণ *
              </label>
              <textarea
                rows={3}
                maxLength={1000}
                value={courseDesc}
                onChange={(e) => setCourseDesc(e.target.value)}
                placeholder="এই কোর্সে কী কী শেখানো হবে..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-emerald-600"
              />
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? 'সংরক্ষণ হচ্ছে...' : 'কোর্স প্রকাশ করুন'}
            </button>
          </form>

          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              আপনার যুক্ত করা কোর্সসমূহ
            </h3>
            {customCourses.length === 0 ? (
              <p className="text-sm text-slate-500">
                এখনো কোনো কাস্টম কোর্স যোগ করা হয়নি।
              </p>
            ) : (
              <div className="space-y-3">
                {customCourses.map((c) => (
                  <div
                    key={c.id}
                    className="border border-slate-200 rounded-lg p-3.5 flex items-start justify-between gap-3"
                  >
                    <div>
                      <div className="text-xs text-slate-500">
                        {c.categoryLabel} · {c.instructorName}
                      </div>
                      <div className="text-sm font-semibold text-slate-900 mt-0.5">
                        {c.title}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDelete('courses', c.id)}
                      aria-label="কোর্স মুছুন"
                      className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Live Classes */}
      {activeTab === 'live' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <form
            onSubmit={handleCreateLiveClass}
            className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-4"
          >
            <h2 className="text-lg font-bold text-slate-900">
              নতুন লাইভ ক্লাস রুটিন যোগ করুন
            </h2>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                লাইভ ক্লাসের শিরোনাম *
              </label>
              <input
                type="text"
                maxLength={200}
                value={liveTitle}
                onChange={(e) => setLiveTitle(e.target.value)}
                placeholder="যেমন: ঢাবি খ-ইউনিট সাম্প্রতিক সাধারণ জ্ঞান ম্যারাথন"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  বিভাগ
                </label>
                <select
                  value={liveCategory}
                  onChange={(e) =>
                    setLiveCategory(
                      e.target.value as Exclude<CourseCategory, 'all'>
                    )
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:border-emerald-600"
                >
                  <option value="bangla">বাংলা</option>
                  <option value="english">ইংরেজি</option>
                  <option value="gk">সাধারণ জ্ঞান</option>
                  <option value="written">লিখিত ও মডেল</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  অবস্থা
                </label>
                <select
                  value={liveStatus}
                  onChange={(e) =>
                    setLiveStatus(e.target.value as 'live' | 'upcoming')
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:border-emerald-600"
                >
                  <option value="upcoming">আসন্ন সেশন</option>
                  <option value="live">এখন লাইভ চলছে</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  বিষয়
                </label>
                <input
                  type="text"
                  maxLength={80}
                  value={liveSubject}
                  onChange={(e) => setLiveSubject(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  শিক্ষকের নাম *
                </label>
                <input
                  type="text"
                  maxLength={100}
                  value={liveInstructor}
                  onChange={(e) => setLiveInstructor(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-emerald-600"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  সময়সূচি
                </label>
                <input
                  type="text"
                  maxLength={80}
                  value={liveSchedule}
                  onChange={(e) => setLiveSchedule(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Zoom / Meet / Live লিংক (ঐচ্ছিক)
                </label>
                <input
                  type="url"
                  maxLength={500}
                  value={meetingUrl}
                  onChange={(e) => setMeetingUrl(e.target.value)}
                  placeholder="https://meet.google.com/..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-emerald-600"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  সময়কাল
                </label>
                <input
                  type="text"
                  maxLength={40}
                  value={liveDuration}
                  onChange={(e) => setLiveDuration(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                আলোচ্য টপিকসমূহ (প্রতি লাইনে একটি)
              </label>
              <textarea
                rows={3}
                value={liveTopicsText}
                onChange={(e) => setLiveTopicsText(e.target.value)}
                placeholder={'বিগত ৫ বছরের প্রশ্ন সমাধান\nসাম্প্রতিক আন্তর্জাতিক ঘটনা'}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-emerald-600"
              />
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? 'সংরক্ষণ হচ্ছে...' : 'লাইভ ক্লাস যোগ করুন'}
            </button>
          </form>

          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              প্রকাশিত কাস্টম লাইভ ক্লাস
            </h3>
            {customLiveClasses.length === 0 ? (
              <p className="text-sm text-slate-500">
                এখনো কোনো কাস্টম লাইভ ক্লাস যোগ করা হয়নি।
              </p>
            ) : (
              <div className="space-y-3">
                {customLiveClasses.map((lc) => (
                  <div
                    key={lc.id}
                    className="border border-slate-200 rounded-lg p-3.5 flex items-start justify-between gap-3"
                  >
                    <div>
                      <div className="text-xs text-slate-500">
                        {lc.scheduleTime} · {lc.instructorName}
                      </div>
                      <div className="text-sm font-semibold text-slate-900 mt-0.5">
                        {lc.title}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDelete('liveClasses', lc.id)}
                      aria-label="লাইভ ক্লাস মুছুন"
                      className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Quiz Questions */}
      {activeTab === 'quiz' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <form
            onSubmit={handleCreateQuestion}
            className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-4"
          >
            <h2 className="text-lg font-bold text-slate-900">
              মডেল টেস্টে নতুন MCQ প্রশ্ন যোগ করুন
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  কোন মডেল টেস্টে যোগ করবেন?
                </label>
                <select
                  value={targetTestId}
                  onChange={(e) => setTargetTestId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:border-emerald-600"
                >
                  {MODEL_TESTS_DATA.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  বিষয়
                </label>
                <input
                  type="text"
                  maxLength={80}
                  value={qSubject}
                  onChange={(e) => setQSubject(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                প্রশ্ন *
              </label>
              <input
                type="text"
                maxLength={500}
                value={qText}
                onChange={(e) => setQText(e.target.value)}
                placeholder="প্রশ্নটি লিখুন..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: 'অপশন ক', val: opt0, set: setOpt0 },
                { label: 'অপশন খ', val: opt1, set: setOpt1 },
                { label: 'অপশন গ', val: opt2, set: setOpt2 },
                { label: 'অপশন ঘ', val: opt3, set: setOpt3 },
              ].map((opt, idx) => (
                <div key={idx} className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    {opt.label} *
                  </label>
                  <input
                    type="text"
                    maxLength={200}
                    value={opt.val}
                    onChange={(e) => opt.set(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-emerald-600"
                  />
                </div>
              ))}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                সঠিক উত্তর নির্বাচন করুন
              </label>
              <select
                value={correctIdx}
                onChange={(e) => setCorrectIdx(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:border-emerald-600"
              >
                <option value={0}>অপশন ক</option>
                <option value={1}>অপশন খ</option>
                <option value={2}>অপশন গ</option>
                <option value={3}>অপশন ঘ</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                সঠিক উত্তরের ব্যাখ্যা *
              </label>
              <textarea
                rows={2}
                maxLength={1000}
                value={qExplanation}
                onChange={(e) => setQExplanation(e.target.value)}
                placeholder="সংক্ষিপ্ত ব্যাখ্যা লিখুন..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-emerald-600"
              />
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? 'সংরক্ষণ হচ্ছে...' : 'প্রশ্ন যোগ করুন'}
            </button>
          </form>

          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              যুক্ত করা কাস্টম প্রশ্নসমূহ
            </h3>
            {customQuestions.length === 0 ? (
              <p className="text-sm text-slate-500">
                এখনো কোনো কাস্টম প্রশ্ন যোগ করা হয়নি।
              </p>
            ) : (
              <div className="space-y-3">
                {customQuestions.map((q) => (
                  <div
                    key={q.id}
                    className="border border-slate-200 rounded-lg p-3.5 flex items-start justify-between gap-3"
                  >
                    <div>
                      <div className="text-xs text-slate-500">{q.subject}</div>
                      <div className="text-sm font-semibold text-slate-900 mt-0.5">
                        {q.question}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDelete('quizQuestions', q.id)}
                      aria-label="প্রশ্ন মুছুন"
                      className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
