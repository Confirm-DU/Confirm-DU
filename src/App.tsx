import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Clock,
  GraduationCap,
  PlayCircle,
  Radio,
  Search,
  UserCheck,
} from 'lucide-react';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  auth,
  BOOTSTRAPPED_ADMIN_EMAIL,
  db,
  handleFirestoreError,
  OperationType,
  signInWithGoogle,
  signOutUser,
} from './firebase';
import { COURSES_DATA, HERO_IMAGE_URL } from './data/coursesData';
import { LIVE_CLASSES_DATA, MODEL_TESTS_DATA } from './data/liveAndNotesData';
import {
  Course,
  CourseCategory,
  CustomQuizQuestion,
  LeaderboardEntry,
  LiveClass,
  QuizAttemptRecord,
  UserLearningState,
} from './types/edu';
import { AppView, Navbar } from './components/Navbar';
import { ResilientImage } from './components/ResilientImage';
import { CourseClassroom } from './components/CourseClassroom';
import { LiveClassesView } from './components/LiveClassesView';
import { QuizArenaView } from './components/QuizArenaView';
import { NotesLibraryView } from './components/NotesLibraryView';
import { DashboardView } from './components/DashboardView';
import { AdminPanelView } from './components/AdminPanelView';

const STORAGE_KEY = 'confirmdu_learning_state_v1';

const DEFAULT_STATE: UserLearningState = {
  enrolledCourseIds: ['du-bangla-mastery'],
  completedLessonIds: [],
  bookmarkedNoteIds: ['du-note-1'],
  remindedLiveClassIds: [],
  personalNotes: {},
  quizAttempts: [],
};

const CATEGORY_TABS: { id: CourseCategory; label: string }[] = [
  { id: 'all', label: 'সকল কোর্স' },
  { id: 'bangla', label: 'বাংলা' },
  { id: 'english', label: 'ইংরেজি' },
  { id: 'gk', label: 'সাধারণ জ্ঞান' },
  { id: 'written', label: 'লিখিত ও মডেল' },
];

const CATEGORY_THUMBNAILS: Record<Exclude<CourseCategory, 'all'>, string> = {
  bangla: '/src/assets/images/course_du_bangla_1794960107150.jpg',
  english: '/src/assets/images/course_english_coding_thumb_1794959710188.jpg',
  gk: '/src/assets/images/course_du_gk_1794960107977.jpg',
  written: '/src/assets/images/course_du_written_1794960108944.jpg',
};

export default function App() {
  const [activeView, setActiveView] = useState<AppView>('home');
  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    COURSES_DATA[0].id
  );
  const [categoryFilter, setCategoryFilter] = useState<CourseCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Auth & Role State
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isAdminDoc, setIsAdminDoc] = useState(false);

  // Cloud Curriculum & Leaderboard State
  const [customCourses, setCustomCourses] = useState<Course[]>([]);
  const [customLiveClasses, setCustomLiveClasses] = useState<LiveClass[]>([]);
  const [customQuestions, setCustomQuestions] = useState<CustomQuizQuestion[]>(
    []
  );
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  // Local + Cloud Synced Learning State
  const [learningState, setLearningState] = useState<UserLearningState>(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_STATE, ...JSON.parse(saved) };
      }
    } catch {
      // Fallback to default state
    }
    return DEFAULT_STATE;
  });

  const savedCloudNotesRef = useRef<Set<string>>(new Set());

  const isAdmin = Boolean(
    user &&
      user.emailVerified &&
      (user.email === BOOTSTRAPPED_ADMIN_EMAIL || isAdminDoc)
  );

  // Persist locally as fallback
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(learningState));
    } catch {
      // Ignore storage quota errors
    }
  }, [learningState]);

  // Firebase Auth listener + User Profile Initialization
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);

      if (!currentUser) {
        setIsAdminDoc(false);
        return;
      }

      // Check optional /admins/{uid} document
      try {
        const adminSnap = await getDoc(doc(db, 'admins', currentUser.uid));
        setIsAdminDoc(adminSnap.exists());
      } catch {
        setIsAdminDoc(false);
      }

      // Ensure user profile doc exists in Firestore
      const profilePath = `users/${currentUser.uid}`;
      try {
        const profileRef = doc(db, 'users', currentUser.uid);
        const profileSnap = await getDoc(profileRef);
        if (!profileSnap.exists()) {
          await setDoc(profileRef, {
            uid: currentUser.uid,
            displayName: (currentUser.displayName || 'Confirm DU শিক্ষার্থী').slice(
              0,
              100
            ),
            email: (currentUser.email || 'student@confirmdu.edu').slice(0, 150),
            ...(currentUser.photoURL
              ? { photoURL: currentUser.photoURL.slice(0, 500) }
              : {}),
            enrolledCourseIds: learningState.enrolledCourseIds.slice(0, 30),
            completedLessonIds: learningState.completedLessonIds.slice(0, 150),
            bookmarkedNoteIds: learningState.bookmarkedNoteIds.slice(0, 100),
            remindedLiveClassIds: learningState.remindedLiveClassIds.slice(0, 50),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, profilePath);
      }
    });
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Real-time listeners for Public Curriculum & Leaderboard (once auth is initialized)
  useEffect(() => {
    if (!authReady) return;

    const unsubCourses = onSnapshot(
      collection(db, 'courses'),
      (snap) => {
        const items: Course[] = snap.docs.map((d) => {
          const data = d.data();
          const cat = (data.category || 'bangla') as Exclude<
            CourseCategory,
            'all'
          >;
          return {
            id: data.id || d.id,
            title: data.title,
            category: cat,
            categoryLabel: data.categoryLabel,
            subject: data.subject,
            instructorName: data.instructorName,
            instructorCredential: data.instructorCredential,
            totalDuration: data.totalDuration,
            lessonCount: 1,
            enrolledCount: 'Confirm DU ব্যাচ',
            thumbnail: CATEGORY_THUMBNAILS[cat] || CATEGORY_THUMBNAILS.bangla,
            description: data.description,
            videoUrl: data.videoUrl,
            pdfUrl: data.pdfUrl,
            isCustom: true,
            chapters: [
              {
                id: `${d.id}_ch1`,
                title: 'অধ্যায় ১: মূল লেকচার ও আলোচনা',
                lessons: [
                  {
                    id: `${d.id}_l1`,
                    title: data.title,
                    duration: data.totalDuration || '১৫:০০',
                    durationSec: 120,
                    diagramType:
                      cat === 'english'
                        ? 'grammar_tree'
                        : cat === 'gk'
                        ? 'gk_timeline'
                        : cat === 'written'
                        ? 'written_builder'
                        : 'bangla_grammar',
                    summary: data.description,
                    keyFormulas: [
                      `বিষয়: ${data.subject}`,
                      `মেন্টর: ${data.instructorName} (${data.instructorCredential})`,
                    ],
                    studyNotes: [data.description],
                    transcript: [
                      {
                        timeSec: 0,
                        text: `${data.title} — ${data.description}`,
                      },
                    ],
                  },
                ],
                quiz: [],
              },
            ],
          };
        });
        setCustomCourses(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'courses');
      }
    );

    const unsubLive = onSnapshot(
      collection(db, 'liveClasses'),
      (snap) => {
        const items: LiveClass[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: data.id || d.id,
            title: data.title,
            subject: data.subject,
            category: data.category,
            categoryLabel: data.categoryLabel,
            instructorName: data.instructorName,
            instructorCredential: data.instructorCredential,
            scheduleTime: data.scheduleTime,
            duration: data.duration,
            status: data.status,
            meetingUrl: data.meetingUrl,
            isCustom: true,
            topics: Array.isArray(data.topics) ? data.topics : [],
            pollQuestion: 'আজকের সেশন সম্পর্কে আপনার মতামত কী?',
            pollOptions: ['খুবই স্পষ্ট ও উপকারী', 'আরো উদাহরণ চাই', 'PDF নোট প্রয়োজন'],
          };
        });
        setCustomLiveClasses(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'liveClasses');
      }
    );

    const unsubQuestions = onSnapshot(
      collection(db, 'quizQuestions'),
      (snap) => {
        const items: CustomQuizQuestion[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: data.id || d.id,
            testId: data.testId,
            subject: data.subject,
            question: data.question,
            options: data.options,
            correctIndex: data.correctIndex,
            explanation: data.explanation,
          };
        });
        setCustomQuestions(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'quizQuestions');
      }
    );

    const leaderboardQuery = query(
      collection(db, 'leaderboard'),
      where('isPublic', '==', true),
      limit(50)
    );
    const unsubLeaderboard = onSnapshot(
      leaderboardQuery,
      (snap) => {
        const rows: LeaderboardEntry[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            uid: data.uid,
            studentName: data.studentName,
            testId: data.testId,
            testTitle: data.testTitle,
            score: data.score,
            total: data.total,
            accuracy: data.accuracy,
            isPublic: data.isPublic,
          };
        });
        rows.sort((a, b) => b.accuracy - a.accuracy || b.score - a.score);
        setLeaderboard(rows);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'leaderboard');
      }
    );

    return () => {
      unsubCourses();
      unsubLive();
      unsubQuestions();
      unsubLeaderboard();
    };
  }, [authReady]);

  // Authenticated User Profile & Private Notes Listeners
  useEffect(() => {
    if (!authReady || !user) return;

    const userDocRef = doc(db, 'users', user.uid);
    const unsubProfile = onSnapshot(
      userDocRef,
      (snap) => {
        if (!snap.exists()) return;
        const data = snap.data();
        setLearningState((prev) => ({
          ...prev,
          enrolledCourseIds: Array.isArray(data.enrolledCourseIds)
            ? data.enrolledCourseIds
            : prev.enrolledCourseIds,
          completedLessonIds: Array.isArray(data.completedLessonIds)
            ? data.completedLessonIds
            : prev.completedLessonIds,
          bookmarkedNoteIds: Array.isArray(data.bookmarkedNoteIds)
            ? data.bookmarkedNoteIds
            : prev.bookmarkedNoteIds,
          remindedLiveClassIds: Array.isArray(data.remindedLiveClassIds)
            ? data.remindedLiveClassIds
            : prev.remindedLiveClassIds,
        }));
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
      }
    );

    const notesPath = `users/${user.uid}/lessonNotes`;
    const unsubNotes = onSnapshot(
      collection(db, notesPath),
      (snap) => {
        const cloudNotes: Record<string, string> = {};
        const nextSet = new Set<string>();
        snap.docs.forEach((d) => {
          nextSet.add(d.id);
          const data = d.data();
          if (typeof data.content === 'string') {
            cloudNotes[d.id] = data.content;
          }
        });
        savedCloudNotesRef.current = nextSet;
        setLearningState((prev) => ({
          ...prev,
          personalNotes: { ...prev.personalNotes, ...cloudNotes },
        }));
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, notesPath);
      }
    );

    return () => {
      unsubProfile();
      unsubNotes();
    };
  }, [authReady, user]);

  const syncUserFields = async (patch: Record<string, unknown>) => {
    if (!user) return;
    const path = `users/${user.uid}`;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        ...patch,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code;
      if (code === 'auth/popup-closed-by-user') return;
      console.error('Sign in failed:', error);
    }
  };

  const handleSignOut = async () => {
    await signOutUser();
    if (activeView === 'admin') {
      setActiveView('home');
    }
  };

  const allCourses = useMemo(
    () => [...customCourses, ...COURSES_DATA],
    [customCourses]
  );

  const allLiveClasses = useMemo(
    () => [...customLiveClasses, ...LIVE_CLASSES_DATA],
    [customLiveClasses]
  );

  const openCourse = (courseId: string) => {
    setLearningState((prev) => {
      const nextEnrolled = prev.enrolledCourseIds.includes(courseId)
        ? prev.enrolledCourseIds
        : [...prev.enrolledCourseIds, courseId].slice(0, 30);
      void syncUserFields({ enrolledCourseIds: nextEnrolled });
      return {
        ...prev,
        enrolledCourseIds: nextEnrolled,
      };
    });
    setSelectedCourseId(courseId);
    setActiveView('classroom');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleLessonComplete = (lessonId: string) => {
    setLearningState((prev) => {
      const exists = prev.completedLessonIds.includes(lessonId);
      const nextCompleted = exists
        ? prev.completedLessonIds.filter((id) => id !== lessonId)
        : [...prev.completedLessonIds, lessonId].slice(0, 150);
      void syncUserFields({ completedLessonIds: nextCompleted });
      return {
        ...prev,
        completedLessonIds: nextCompleted,
      };
    });
  };

  const savePersonalNote = (lessonId: string, text: string) => {
    const trimmed = text.slice(0, 5000);
    setLearningState((prev) => ({
      ...prev,
      personalNotes: {
        ...prev.personalNotes,
        [lessonId]: trimmed,
      },
    }));

    if (user) {
      const noteRef = doc(db, 'users', user.uid, 'lessonNotes', lessonId);
      const path = `users/${user.uid}/lessonNotes/${lessonId}`;
      const alreadySaved = savedCloudNotesRef.current.has(lessonId);
      if (alreadySaved) {
        updateDoc(noteRef, {
          content: trimmed,
          updatedAt: serverTimestamp(),
        }).catch((error) =>
          handleFirestoreError(error, OperationType.UPDATE, path)
        );
      } else {
        setDoc(noteRef, {
          lessonId,
          courseId: selectedCourseId,
          content: trimmed,
          updatedAt: serverTimestamp(),
        })
          .then(() => {
            savedCloudNotesRef.current.add(lessonId);
          })
          .catch((error) =>
            handleFirestoreError(error, OperationType.CREATE, path)
          );
      }
    }
  };

  const toggleBookmark = (noteId: string) => {
    setLearningState((prev) => {
      const exists = prev.bookmarkedNoteIds.includes(noteId);
      const nextBookmarks = exists
        ? prev.bookmarkedNoteIds.filter((id) => id !== noteId)
        : [...prev.bookmarkedNoteIds, noteId].slice(0, 100);
      void syncUserFields({ bookmarkedNoteIds: nextBookmarks });
      return {
        ...prev,
        bookmarkedNoteIds: nextBookmarks,
      };
    });
  };

  const toggleLiveReminder = (liveId: string) => {
    setLearningState((prev) => {
      const exists = prev.remindedLiveClassIds.includes(liveId);
      const nextReminded = exists
        ? prev.remindedLiveClassIds.filter((id) => id !== liveId)
        : [...prev.remindedLiveClassIds, liveId].slice(0, 50);
      void syncUserFields({ remindedLiveClassIds: nextReminded });
      return {
        ...prev,
        remindedLiveClassIds: nextReminded,
      };
    });
  };

  const recordQuizAttempt = async (attempt: QuizAttemptRecord) => {
    setLearningState((prev) => ({
      ...prev,
      quizAttempts: [attempt, ...prev.quizAttempts],
    }));

    if (user) {
      const attemptId = `att_${user.uid.slice(0, 12)}_${Date.now()}`;
      const path = `leaderboard/${attemptId}`;
      try {
        await setDoc(doc(db, 'leaderboard', attemptId), {
          uid: user.uid,
          studentName: (user.displayName || 'Confirm DU শিক্ষার্থী').slice(0, 100),
          testId: attempt.testId.slice(0, 128),
          testTitle: attempt.testTitle.slice(0, 200),
          score: attempt.score,
          total: attempt.total,
          accuracy: attempt.accuracy,
          isPublic: true,
          createdAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, path);
      }
    }
  };

  const filteredCourses = useMemo(() => {
    return allCourses.filter((course) => {
      const matchesCategory =
        categoryFilter === 'all' || course.category === categoryFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        course.title.toLowerCase().includes(q) ||
        course.subject.toLowerCase().includes(q) ||
        course.instructorName.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [allCourses, categoryFilter, searchQuery]);

  const activeCourse: Course =
    allCourses.find((c) => c.id === selectedCourseId) || allCourses[0];

  const handleNavigate = (view: AppView) => {
    setActiveView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderCourseGrid = (courses: Course[]) => {
    if (courses.length === 0) {
      return (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-sm text-slate-600">
          আপনার খোঁজা বিষয় অনুযায়ী কোনো কোর্স পাওয়া যায়নি। অন্য শব্দ দিয়ে চেষ্টা করুন।
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => {
          const allLessons = course.chapters.flatMap((ch) => ch.lessons);
          const doneCount = allLessons.filter((l) =>
            learningState.completedLessonIds.includes(l.id)
          ).length;

          return (
            <article
              key={course.id}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col justify-between transition-colors hover:border-slate-300"
            >
              <div>
                <div className="aspect-[4/3] w-full overflow-hidden bg-slate-900">
                  <ResilientImage
                    src={course.thumbnail}
                    alt={course.title}
                    fallbackTitle={course.subject}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="p-5 space-y-2.5">
                  <div className="text-xs text-slate-500">
                    {course.categoryLabel} · {course.subject} ·{' '}
                    <span className="tabular-nums">
                      {course.lessonCount}টি লেকচার
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                    {course.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-2">
                    {course.description}
                  </p>
                </div>
              </div>

              <div className="px-5 pb-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-900 truncate">
                    {course.instructorName}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    {doneCount > 0
                      ? `${doneCount}/${allLessons.length} লেকচার সম্পন্ন`
                      : course.totalDuration}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => openCourse(course.id)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <PlayCircle className="w-4 h-4" aria-hidden="true" />
                  <span>{doneCount > 0 ? 'চালিয়ে যান' : 'ক্লাস শুরু করুন'}</span>
                </button>
              </div>
            </article>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar activeView={activeView} onNavigate={handleNavigate} />

      <main className="flex-1">
        {activeView === 'home' && (
          <>
            {/* Hero Split Section */}
            <section className="bg-white border-b border-slate-200">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
                  <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
                    <div className="text-xs sm:text-sm font-semibold text-emerald-700">
                      ঢাকা বিশ্ববিদ্যালয় (খ-ইউনিট) · রাবি · চবি · জাবি · গুচ্ছ মানবিক
                    </div>

                    <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold text-slate-900 leading-[1.2] tracking-tight">
                      Confirm DU: মানবিক ইউনিটে নিশ্চিত বিশ্ববিদ্যালয় ভর্তির পূর্ণাঙ্গ প্রস্তুতি
                    </h1>

                    <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
                      ঢাকা বিশ্ববিদ্যালয়ের কলা, আইন ও সামাজিক বিজ্ঞান অনুষদ এবং দেশের সকল পাবলিক বিশ্ববিদ্যালয়ের মানবিক শাখার জন্য বাংলা, ইংরেজি, সাধারণ জ্ঞান ও লিখিত প্রস্তুতির নির্ভরযোগ্য অনলাইন প্ল্যাটফর্ম।
                    </p>

                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => openCourse(allCourses[0].id)}
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-sm sm:text-base font-semibold transition-colors whitespace-nowrap cursor-pointer"
                      >
                        <span>ভর্তি প্রস্তুতি শুরু করুন</span>
                        <ArrowRight className="w-4 h-4" aria-hidden="true" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleNavigate('quiz')}
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-sm sm:text-base font-semibold transition-colors whitespace-nowrap cursor-pointer"
                      >
                        <span>ঢাবি মডেল টেস্ট দিন</span>
                      </button>
                    </div>
                  </div>

                  <div className="lg:col-span-6">
                    <div className="h-full min-h-64 sm:min-h-80 rounded-xl overflow-hidden border border-slate-200 bg-slate-900">
                      <ResilientImage
                        src={HERO_IMAGE_URL}
                        alt="Confirm DU অনলাইন মানবিক ভর্তি ক্লাসে প্রস্তুতি নিচ্ছেন একজন শিক্ষার্থী"
                        fallbackTitle="Confirm DU — মানবিক ভর্তি প্রস্তুতি"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>

                {/* Full-Width 4-Column Proof Strip below Hero */}
                <div className="mt-10 pt-8 border-t border-slate-200 grid grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="flex items-start gap-3">
                    <BookOpen
                      className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    <div>
                      <div className="text-lg font-bold text-slate-900 tabular-nums">
                        {allCourses.length}টি মানবিক কোর্স
                      </div>
                      <div className="text-xs text-slate-600">
                        বাংলা, ইংরেজি, GK ও লিখিত
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Radio
                      className="w-5 h-5 text-rose-600 shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    <div>
                      <div className="text-lg font-bold text-slate-900 tabular-nums">
                        {allLiveClasses.length}টি সাপ্তাহিক লাইভ
                      </div>
                      <div className="text-xs text-slate-600">
                        ঢাবি বিগত প্রশ্ন ও সাম্প্রতিক সলভ
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <GraduationCap
                      className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    <div>
                      <div className="text-lg font-bold text-slate-900 tabular-nums">
                        {MODEL_TESTS_DATA.length}টি মডেল টেস্ট
                      </div>
                      <div className="text-xs text-slate-600">
                        খ-ইউনিট স্ট্যান্ডার্ড MCQ ও লিডারবোর্ড
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <UserCheck
                      className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    <div>
                      <div className="text-lg font-bold text-slate-900 tabular-nums">
                        ১০০% ঢাবিয়ান মেন্টর
                      </div>
                      <div className="text-xs text-slate-600">
                        আইন, বাংলা, ইংরেজি ও আইআর বিভাগ
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Interactive Course Discovery Section */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    মানবিক ইউনিট ভর্তি কোর্সসমূহ
                  </h2>
                  <p className="text-sm text-slate-600 mt-1">
                    ঢাকা বিশ্ববিদ্যালয়সহ সকল বিশ্ববিদ্যালয়ের মানবিক শাখার বিষয়ভিত্তিক পূর্ণাঙ্গ কোর্স।
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="relative sm:w-64">
                    <Search
                      className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
                      aria-hidden="true"
                    />
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="বিষয় বা মেন্টর খুঁজুন..."
                      aria-label="বিষয় বা মেন্টর খুঁজুন"
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>
              </div>

              {/* Segmented Category Filter Controls */}
              <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 rounded-lg w-fit">
                {CATEGORY_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setCategoryFilter(tab.id)}
                    className={`px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                      categoryFilter === tab.id
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {renderCourseGrid(filteredCourses)}
            </section>

            {/* Quick Live Class & Model Test Callout Section */}
            <section className="bg-white border-t border-slate-200 py-12">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="border border-slate-200 rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-rose-700 inline-flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5" aria-hidden="true" />
                      আজকের ঢাবি স্পেশাল লাইভ
                    </span>
                    <span className="text-xs text-slate-500 font-mono tabular-nums">
                      {allLiveClasses[0].scheduleTime}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {allLiveClasses[0].title}
                  </h3>
                  <p className="text-sm text-slate-600">
                    মেন্টর: {allLiveClasses[0].instructorName} (
                    {allLiveClasses[0].instructorCredential})
                  </p>
                  <button
                    type="button"
                    onClick={() => handleNavigate('live')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition-colors cursor-pointer"
                  >
                    <span>লাইভ ক্লাস রুটিন দেখুন</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-700 inline-flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                      সময় ধরে প্রস্তুতি যাচাই
                    </span>
                    <span className="text-xs text-slate-500 tabular-nums">
                      খ-ইউনিট ও গুচ্ছ মানবিক
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    ঢাবি কলা, আইন ও সামাজিক বিজ্ঞান মডেল টেস্ট
                  </h3>
                  <p className="text-sm text-slate-600">
                    বাংলা, ইংরেজি ও সাধারণ জ্ঞান বিষয়ে টাইমারসহ MCQ পরীক্ষা দিয়ে সম্মিলিত লিডারবোর্ডে নিজের অবস্থান যাচাই করুন।
                  </p>
                  <button
                    type="button"
                    onClick={() => handleNavigate('quiz')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold transition-colors cursor-pointer"
                  >
                    <span>মডেল টেস্ট শুরু করুন</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </section>
          </>
        )}

        {activeView === 'courses' && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                  Confirm DU — সকল কোর্স ক্যাটালগ
                </h1>
                <p className="text-sm sm:text-base text-slate-600 mt-1.5">
                  ঢাকা বিশ্ববিদ্যালয় (খ-ইউনিট), রাবি, চবি, জাবি ও গুচ্ছ মানবিক ভর্তি প্রস্তুতির পূর্ণাঙ্গ কোর্স।
                </p>
              </div>

              <div className="relative w-full md:w-72">
                <Search
                  className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="কোর্স বা বিষয় খুঁজুন..."
                  aria-label="কোর্স বা বিষয় খুঁজুন"
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 rounded-lg w-fit">
              {CATEGORY_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setCategoryFilter(tab.id)}
                  className={`px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    categoryFilter === tab.id
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {renderCourseGrid(filteredCourses)}
          </section>
        )}

        {activeView === 'classroom' && (
          <CourseClassroom
            course={activeCourse}
            completedLessonIds={learningState.completedLessonIds}
            personalNotes={learningState.personalNotes}
            onToggleLessonComplete={toggleLessonComplete}
            onSavePersonalNote={savePersonalNote}
            onBack={() => handleNavigate('courses')}
          />
        )}

        {activeView === 'live' && (
          <LiveClassesView
            liveClasses={allLiveClasses}
            remindedIds={learningState.remindedLiveClassIds}
            onToggleReminder={toggleLiveReminder}
          />
        )}

        {activeView === 'quiz' && (
          <QuizArenaView
            user={user}
            attempts={learningState.quizAttempts}
            customQuestions={customQuestions}
            leaderboard={leaderboard}
            onRecordAttempt={recordQuizAttempt}
            onSignIn={handleSignIn}
          />
        )}

        {activeView === 'notes' && (
          <NotesLibraryView
            bookmarkedIds={learningState.bookmarkedNoteIds}
            onToggleBookmark={toggleBookmark}
          />
        )}

        {activeView === 'dashboard' && (
          <DashboardView
            user={user}
            isAdmin={isAdmin}
            allCourses={allCourses}
            learningState={learningState}
            onSignIn={handleSignIn}
            onSignOut={handleSignOut}
            onOpenAdmin={() => handleNavigate('admin')}
            onOpenCourse={openCourse}
            onNavigateCourses={() => handleNavigate('courses')}
            onNavigateQuiz={() => handleNavigate('quiz')}
          />
        )}

        {activeView === 'admin' && (
          <AdminPanelView
            user={user}
            isAdmin={isAdmin}
            customCourses={customCourses}
            customLiveClasses={customLiveClasses}
            customQuestions={customQuestions}
            onSignIn={handleSignIn}
          />
        )}
      </main>

      {/* Clean Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-slate-600">
          <div className="font-semibold text-slate-900">
            Confirm DU — ঢাকা বিশ্ববিদ্যালয় ও সকল বিশ্ববিদ্যালয় মানবিক ভর্তি প্রস্তুতি
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <button
              type="button"
              onClick={() => handleNavigate('courses')}
              className="hover:text-slate-900 cursor-pointer"
            >
              কোর্সসমূহ
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('live')}
              className="hover:text-slate-900 cursor-pointer"
            >
              লাইভ ক্লাস
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('quiz')}
              className="hover:text-slate-900 cursor-pointer"
            >
              মডেল টেস্ট
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('notes')}
              className="hover:text-slate-900 cursor-pointer"
            >
              স্মার্ট নোটস
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('admin')}
              className="hover:text-slate-900 font-medium cursor-pointer"
            >
              অ্যাডমিন প্যানেল
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
