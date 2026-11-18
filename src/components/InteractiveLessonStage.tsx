import React, { useEffect, useMemo, useState } from 'react';
import { Pause, Play, RotateCcw, StepForward } from 'lucide-react';
import { Lesson } from '../types/edu';

interface InteractiveLessonStageProps {
  lesson: Lesson;
  onLessonFinished?: () => void;
}

const formatTime = (sec: number): string => {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const BANGLA_GRAMMAR_CASES = [
  {
    word: 'স্বাগত',
    category: 'স্বরসন্ধি (যণ্ সূত্র)',
    breakdown: 'সু + আগত',
    rule: 'উ-কারের পর অ-সমান স্বরধ্বনি এলে উ-কার ‘ব’-ফলা (্ব) রূপে যুক্ত হয়।',
    examTip: 'ঢাবি খ-ইউনিটে বহুবার এসেছে; ‘স + আগত’ অপশনে বিভ্রান্ত হবেন না।',
  },
  {
    word: 'গবেষণা',
    category: 'স্বরসন্ধি (অয়াদি সূত্র)',
    breakdown: 'গো + এষণা',
    rule: 'ও-কারের পর ভিন্ন স্বরধ্বনি থাকলে ও-কারের স্থানে ‘অব্’ হয়।',
    examTip: 'গব + এষণা ভুল; মূল পদ ‘গো’ (অর্থ: গরু/ইন্দ্রিয়)।',
  },
  {
    word: 'কুলটা',
    category: 'নিপাতনে সিদ্ধ স্বরসন্ধি',
    breakdown: 'কুল + অটা',
    rule: 'এটি স্বরসন্ধির কোনো সাধারণ সূত্র মেনে চলে না, সরাসরি নিপাতনে সিদ্ধ।',
    examTip: 'গবাক্ষ, মার্তণ্ড ও প্রৌঢ়—এই তিনটিও নিপাতনে সিদ্ধ স্বরসন্ধি।',
  },
  {
    word: 'গায়েহলুদ',
    category: 'অলুক বহুব্রীহি সমাস',
    breakdown: 'গায়ে হলুদ দেওয়া হয় যে অনুষ্ঠানে',
    rule: 'পূর্বপদের ‘এ’ বিভক্তি (গা + এ) লোপ না পাওয়ায় এটি অলুক বহুব্রীহি।',
    examTip: 'বিশেষ অনুষ্ঠান বা ভিন্ন অর্থ বোঝালে বহুব্রীহি সমাস হয়।',
  },
  {
    word: 'তুষারশুভ্র',
    category: 'উপমান কর্মধারয় সমাস',
    breakdown: 'তুষারের ন্যায় শুভ্র',
    rule: 'উপমানের (তুষার) সাথে সাধারণ ধর্মবাচক পদের (শুভ্র) সমাস।',
    examTip: 'সাধারণ গুণের উল্লেখ থাকলে উপমান, না থাকলে (যেমন: সিংহপুরুষ) উপমিত কর্মধারয়।',
  },
];

const GRAMMAR_MODES = [
  {
    id: 'subjunctive',
    label: 'Subjunctive Mood',
    formula: 'Verb (insist/suggest) + that + Sub + Base Verb',
    subject: 'The professor',
    aux: 'insisted that',
    verb: 'she submit',
    object: 'the thesis on time',
    bn: 'অধ্যাপক জোর দিলেন যেন সে সময়মতো থিসিস জমা দেয়।',
  },
  {
    id: 'inversion',
    label: 'Negative Inversion',
    formula: 'No sooner had + Sub + V₃ + than + Sub + V₂',
    subject: 'No sooner had',
    aux: 'the exam',
    verb: 'started than',
    object: 'everyone began writing',
    bn: 'পরীক্ষা শুরু হতে না হতেই সবাই লিখতে শুরু করল।',
  },
  {
    id: 'conditional',
    label: '3rd Conditional',
    formula: 'If + Sub + had + V₃, Sub + would have + V₃',
    subject: 'If he',
    aux: 'had studied',
    verb: 'would have secured',
    object: 'a seat at DU',
    bn: 'সে যদি মনোযোগ দিয়ে পড়ত, তবে ঢাবিতে একটি আসন নিশ্চিত করত।',
  },
  {
    id: 'passive',
    label: 'Interrogative Passive',
    formula: 'By whom + aux + Sub + V₃ + Obj?',
    subject: 'By whom',
    aux: 'were',
    verb: 'you taught',
    object: 'English grammar?',
    bn: 'কার দ্বারা তোমাকে ইংরেজি ব্যাকরণ শেখানো হয়েছিল?',
  },
];

const HISTORY_MILESTONES = [
  {
    year: '১৯৫২',
    date: '২১ ফেব্রুয়ারি (৮ ফাল্গুন ১৩৫৮)',
    title: 'মহান ভাষা আন্দোলন',
    detail:
      'বাংলাকে রাষ্ট্রভাষা করার দাবিতে সালাম, বরকত, রফিক, জব্বারসহ শহিদদের আত্মত্যাগ। ১৯৯৯ সালের ১৭ নভেম্বর ইউনেস্কো দিনটিকে আন্তর্জাতিক মাতৃভাষা দিবস ঘোষণা করে।',
  },
  {
    year: '১৯৬৬',
    date: '৫ ফেব্রুয়ারি (লাহোর)',
    title: 'ঐতিহাসিক ৬ দফা দাবি',
    detail:
      'বাঙালির অর্থনৈতিক ও রাজনৈতিক মুক্তির সনদ (ম্যাগনা কার্টা) হিসেবে পরিচিত ৬ দফা দাবি পেশ করা হয়। ২৩ মার্চ আনুষ্ঠানিকভাবে পুস্তিকা আকারে প্রকাশিত হয়।',
  },
  {
    year: '১৯৬৯',
    date: '২০ জানুয়ারি – ২৪ জানুয়ারি',
    title: 'উনসত্তরের গণ-অভ্যুত্থান',
    detail:
      'আগরতলা ষড়যন্ত্র মামলা প্রত্যাহার এবং আসাদ-মতিউরের আত্মত্যাগের মাধ্যমে গণ-অভ্যুত্থান সংঘটিত হয়; ২৩ ফেব্রুয়ারি রেসকোর্স ময়দানে ‘বঙ্গবন্ধু’ উপাধি দেওয়া হয়।',
  },
  {
    year: '১৯৭১ (মার্চ-এপ্রিল)',
    date: '৭ মার্চ, ২৬ মার্চ ও ১৭ এপ্রিল',
    title: 'স্বাধীনতার ঘোষণা ও মুজিবনগর সরকার',
    detail:
      '৭ মার্চের ঐতিহাসিক ভাষণ, ২৬ মার্চ প্রথম প্রহরে স্বাধীনতার ঘোষণা এবং ১৭ এপ্রিল মেহেরপুরের বৈদ্যনাথতলায় অস্থায়ী সরকারের শপথ গ্রহণ।',
  },
  {
    year: '১৯৭১ (ডিসেম্বর)',
    date: '১৬ ডিসেম্বর',
    title: 'চূড়ান্ত বিজয় ও সার্বভৌম বাংলাদেশ',
    detail:
      '৯ মাসের সশস্ত্র মুক্তিযুদ্ধ শেষে রেসকোর্স ময়দানে (সোহরাওয়ার্দী উদ্যান) যৌথবাহিনীর নিকট পাকিস্তানি বাহিনীর আত্মসমর্পণ।',
  },
];

const CONSTITUTION_ARTICLES = [
  {
    article: 'অনুচ্ছেদ ৭',
    part: 'প্রথম ভাগ (প্রজাতন্ত্র)',
    title: 'সংবিধানের প্রাধান্য',
    detail:
      'প্রজাতন্ত্রের সকল ক্ষমতার মালিক জনগণ এবং জনগণের পক্ষে সেই ক্ষমতার প্রয়োগ কেবল এই সংবিধানের অধীন ও কর্তৃত্বে কার্যকর হইবে। এই সংবিধান প্রজাতন্ত্রের সর্বোচ্চ আইন।',
  },
  {
    article: 'অনুচ্ছেদ ২৭',
    part: 'তৃতীয় ভাগ (মৌলিক অধিকার)',
    title: 'আইনের দৃষ্টিতে সমতা',
    detail:
      'সকল নাগরিক আইনের দৃষ্টিতে সমান এবং আইনের সমান আশ্রয় লাভের অধিকারী।',
  },
  {
    article: 'অনুচ্ছেদ ৩৯',
    part: 'তৃতীয় ভাগ (মৌলিক অধিকার)',
    title: 'চিন্তা ও বিবেকের স্বাধীনতা এবং বাক্-স্বাধীনতা',
    detail:
      'চিন্তা ও বিবেকের স্বাধীনতার নিশ্চয়তা দান করা হইল এবং প্রত্যেক নাগরিকের বাক্ ও ভাবপ্রকাশের স্বাধীনতা ও সংবাদপত্রের স্বাধীনতা নিশ্চিত করা হইল।',
  },
  {
    article: 'অনুচ্ছেদ ৭০',
    part: 'পঞ্চম ভাগ (আইনসভা)',
    title: 'রাজনৈতিক দল হইতে পদত্যাগ বা দলের বিপক্ষে ভোটদান',
    detail:
      'কোনো নির্বাচনে কোনো রাজনৈতিক দলের প্রার্থীরূপে মনোনীত হইয়া কোনো ব্যক্তি সংসদ-সদস্য নির্বাচিত হইলে তিনি যদি উক্ত দল হইতে পদত্যাগ করেন অথবা দলের বিপক্ষে ভোটদান করেন, তবে তাঁহার আসন শূন্য হইবে।',
  },
  {
    article: 'অনুচ্ছেদ ১০২',
    part: 'ষষ্ঠ ভাগ (বিচার বিভাগ)',
    title: 'কতিপয় আদেশ ও নির্দেশ দানের ক্ষেত্রে হাইকোর্ট বিভাগের ক্ষমতা (রিট)',
    detail:
      'মৌলিক অধিকার বলবৎ করার জন্য সংক্ষুব্ধ ব্যক্তি সংবিধানের ৪৪ ও ১০২ অনুচ্ছেদের অধীনে হাইকোর্ট বিভাগে রিট আবেদন করতে পারেন।',
  },
];

const INTL_ORGANIZATIONS = [
  {
    abbr: 'UN',
    name: 'জাতিসংঘ (United Nations)',
    founded: '২৪ অক্টোবর ১৯৪৫',
    hq: 'নিউইয়র্ক, যুক্তরাষ্ট্র',
    members: '১৯৩টি রাষ্ট্র',
    bdStatus: 'বাংলাদেশ ১৭ সেপ্টেম্বর ১৯৭৪ (১৩৬তম সদস্য) হিসেবে যোগদান করে।',
  },
  {
    abbr: 'ICJ',
    name: 'আন্তর্জাতিক আদালত (International Court of Justice)',
    founded: '১৯৪৫ (কার্যক্রম শুরু ১৯৪৬)',
    hq: 'দ্য হেগ (পিস প্যালেস), নেদারল্যান্ডস',
    members: '১৫ জন বিচারক (মেয়াদ ৯ বছর)',
    bdStatus: 'জাতিসংঘের ৬টি মূল অঙ্গসংস্থার মধ্যে একমাত্র এটির সদরদপ্তর নিউইয়র্কের বাইরে।',
  },
  {
    abbr: 'UNESCO',
    name: 'জাতিসংঘ শিক্ষা, বিজ্ঞান ও সংস্কৃতি সংস্থা',
    founded: '১৬ নভেম্বর ১৯৪৫',
    hq: 'প্যারিস, ফ্রান্স',
    members: '১৯৪টি সদস্য রাষ্ট্র',
    bdStatus: '২১ ফেব্রুয়ারিকে আন্তর্জাতিক মাতৃভাষা দিবস এবং সুন্দরবন, ষাটগম্বুজ ও পাহাড়পুরকে বিশ্ব ঐতিহ্য ঘোষণা করে।',
  },
  {
    abbr: 'SAARC',
    name: 'দক্ষিণ এশীয় আঞ্চলিক সহযোগিতা সংস্থা',
    founded: '৮ ডিসেম্বর ১৯৮৫ (ঢাকায়)',
    hq: 'কাঠমান্ডু, নেপাল',
    members: '৮টি রাষ্ট্র (সর্বশেষ আফগানিস্তান, ২০০৭)',
    bdStatus: 'বাংলাদেশের উদ্যোগে প্রথম শীর্ষ সম্মেলন ১৯৮৫ সালে ঢাকায় অনুষ্ঠিত হয়।',
  },
];

const WRITTEN_TEMPLATES = [
  {
    id: 'paragraph',
    label: 'Analytical Paragraph',
    structure: [
      { step: '১. Topic Sentence', text: 'প্রথম ১-২ বাক্যেই মূল বিষয়টি স্পষ্টভাবে সংজ্ঞায়িত করুন।' },
      { step: '২. Supporting Evidence', text: 'মাঝের ৩-৪ বাক্যে কারণ, পরিসংখ্যান বা প্রাসঙ্গিক উদাহরণ দিন।' },
      { step: '৩. Concluding Insight', text: 'শেষ বাক্যে সমাধান বা সারসংক্ষেপ দিয়ে অনুচ্ছেদ শেষ করুন।' },
    ],
    sample:
      'Higher education plays a decisive role in shaping an equitable society. By fostering critical inquiry and civic awareness, universities empower youth to address socioeconomic challenges effectively.',
  },
  {
    id: 'summary',
    label: 'Summary / সারাংশ',
    structure: [
      { step: '১. দৈর্ঘ্য নিয়ন্ত্রণ', text: 'মূল প্যাসেজের প্রায় এক-তৃতীয়াংশ (১/৩) শব্দে সীমাবদ্ধ রাখুন।' },
      { step: '২. নিজস্ব ভাষা', text: 'প্যাসেজের হুবহু বাক্য না তুলে নিজের ভাষায় মূলভাব লিখুন।' },
      { step: '৩. উদাহরণ বর্জন', text: 'সারাংশে কোনো উপমা, উদ্ধৃতি বা ব্যক্তিগত মতামত যোগ করবেন না।' },
    ],
    sample:
      'মূল পাঠের প্রধান ধারণা: প্রযুক্তির দ্রুত প্রসারে মানবিক মূল্যবোধ ও সমালোচনামূলক চিন্তার চর্চা বজায় রাখা টেকসই উন্নয়নের জন্য অপরিহার্য।',
  },
  {
    id: 'translation',
    label: 'Translation / বঙ্গানুবাদ',
    structure: [
      { step: '১. ভাবানুবাদ অগ্রাধিকার', text: 'শব্দে-শব্দে অনুবাদের চেয়ে অর্থ ও প্রাঞ্জল বাংলা বাক্য গঠন করুন।' },
      { step: '২. Tense ও Voice মিল', text: 'ইংরেজি বাক্যের কাল (Tense) বাংলা ক্রিয়াপদে সঠিকভাবে বজায় রাখুন।' },
      { step: '৩. প্রবাদ ও বাগধারা', text: 'ইংরেজি Idiom-এর সমার্থক বাংলা বাগধারা ব্যবহার করুন।' },
    ],
    sample:
      'Knowledge without wisdom is like a ship without a compass. → প্রজ্ঞাবিহীন জ্ঞান কম্পাসবিহীন জাহাজের মতোই দিকভ্রান্ত।',
  },
];

export const InteractiveLessonStage: React.FC<InteractiveLessonStageProps> = ({
  lesson,
  onLessonFinished,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 1.25 | 1.5>(1);

  const [banglaIdx, setBanglaIdx] = useState(0);
  const [grammarIdx, setGrammarIdx] = useState(0);
  const [milestoneIdx, setMilestoneIdx] = useState(0);
  const [articleIdx, setArticleIdx] = useState(0);
  const [orgIdx, setOrgIdx] = useState(0);
  const [writtenIdx, setWrittenIdx] = useState(0);

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
  }, [lesson.id]);

  useEffect(() => {
    if (!isPlaying) return;
    const intervalMs = Math.round(250 / playbackSpeed);
    const timer = window.setInterval(() => {
      setCurrentTime((prev) => {
        const next = prev + 0.25;
        if (next >= lesson.durationSec) {
          setIsPlaying(false);
          onLessonFinished?.();
          return lesson.durationSec;
        }
        return next;
      });
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [isPlaying, playbackSpeed, lesson.durationSec, onLessonFinished]);

  const activeCaption = useMemo(() => {
    const sorted = [...lesson.transcript].sort((a, b) => b.timeSec - a.timeSec);
    return (
      sorted.find((line) => currentTime >= line.timeSec)?.text ||
      lesson.transcript[0]?.text ||
      lesson.summary
    );
  }, [currentTime, lesson.transcript, lesson.summary]);

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden text-white">
      <div className="p-5 sm:p-6 bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <p className="text-xs font-medium text-emerald-400">
            Confirm DU ইন্টারেক্টিভ কনসেপ্ট বোর্ড · {lesson.duration}
          </p>
          <span className="text-xs font-mono tabular-nums text-slate-400">
            {formatTime(currentTime)} / {formatTime(lesson.durationSec)}
          </span>
        </div>

        {/* 1. Bangla Grammar & Samas Explorer */}
        {lesson.diagramType === 'bangla_grammar' && (
          <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-5 space-y-4">
            <div className="flex flex-wrap gap-2">
              {BANGLA_GRAMMAR_CASES.map((item, idx) => (
                <button
                  key={item.word}
                  type="button"
                  onClick={() => setBanglaIdx(idx)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                    banglaIdx === idx
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {item.word}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                <div className="text-xs text-slate-400 mb-1">বিচ্ছেদ / ব্যাসবাক্য</div>
                <div className="text-base font-bold text-emerald-400">
                  {BANGLA_GRAMMAR_CASES[banglaIdx].breakdown}
                </div>
                <div className="text-xs text-amber-300 mt-1">
                  {BANGLA_GRAMMAR_CASES[banglaIdx].category}
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-1.5">
                <div className="text-xs font-semibold text-white">ব্যাকরণিক নিয়ম</div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {BANGLA_GRAMMAR_CASES[banglaIdx].rule}
                </p>
              </div>
            </div>

            <div className="text-xs text-emerald-300 bg-slate-900/70 border border-slate-800 rounded-lg px-3.5 py-2.5">
              <span className="font-semibold text-white">ঢাবি ভর্তি টিপস: </span>
              {BANGLA_GRAMMAR_CASES[banglaIdx].examTip}
            </div>
          </div>
        )}

        {/* 2. English Grammar Structure Explorer */}
        {lesson.diagramType === 'grammar_tree' && (
          <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-5 space-y-5">
            <div className="flex flex-wrap gap-2">
              {GRAMMAR_MODES.map((mode, i) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setGrammarIdx(i)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                    grammarIdx === i
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
                <div className="text-[11px] text-slate-400 mb-1">Lead / Subject</div>
                <div className="text-sm font-semibold text-emerald-400">
                  {GRAMMAR_MODES[grammarIdx].subject}
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
                <div className="text-[11px] text-slate-400 mb-1">Trigger / Aux</div>
                <div className="text-sm font-semibold text-amber-300">
                  {GRAMMAR_MODES[grammarIdx].aux}
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
                <div className="text-[11px] text-slate-400 mb-1">Core Verb</div>
                <div className="text-sm font-semibold text-sky-400">
                  {GRAMMAR_MODES[grammarIdx].verb}
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
                <div className="text-[11px] text-slate-400 mb-1">Complement</div>
                <div className="text-sm font-semibold text-white">
                  {GRAMMAR_MODES[grammarIdx].object}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <span className="font-mono text-slate-300">
                গঠন: {GRAMMAR_MODES[grammarIdx].formula}
              </span>
              <span className="text-emerald-300 font-medium">
                অর্থ: {GRAMMAR_MODES[grammarIdx].bn}
              </span>
            </div>
          </div>
        )}

        {/* 3. Bangladesh Liberation War Timeline */}
        {lesson.diagramType === 'gk_timeline' && (
          <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-5 space-y-4">
            <div className="flex flex-wrap gap-2">
              {HISTORY_MILESTONES.map((item, i) => (
                <button
                  key={item.year}
                  type="button"
                  onClick={() => setMilestoneIdx(i)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                    milestoneIdx === i
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {item.year}
                </button>
              ))}
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
              <div className="text-xs text-emerald-400 font-medium mb-1">
                {HISTORY_MILESTONES[milestoneIdx].date}
              </div>
              <h4 className="text-base font-bold text-white mb-2">
                {HISTORY_MILESTONES[milestoneIdx].title}
              </h4>
              <p className="text-sm text-slate-300 leading-relaxed">
                {HISTORY_MILESTONES[milestoneIdx].detail}
              </p>
            </div>
          </div>
        )}

        {/* 4. Bangladesh Constitution Explorer */}
        {lesson.diagramType === 'constitution_articles' && (
          <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-5 space-y-4">
            <div className="flex flex-wrap gap-2">
              {CONSTITUTION_ARTICLES.map((art, i) => (
                <button
                  key={art.article}
                  type="button"
                  onClick={() => setArticleIdx(i)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                    articleIdx === i
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {art.article}
                </button>
              ))}
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-1.5">
              <div className="text-xs text-amber-300">
                {CONSTITUTION_ARTICLES[articleIdx].part}
              </div>
              <h4 className="text-base font-bold text-white">
                {CONSTITUTION_ARTICLES[articleIdx].title}
              </h4>
              <p className="text-sm text-slate-300 leading-relaxed">
                {CONSTITUTION_ARTICLES[articleIdx].detail}
              </p>
            </div>
          </div>
        )}

        {/* 5. International Organizations Explorer */}
        {lesson.diagramType === 'intl_orgs' && (
          <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-5 space-y-4">
            <div className="flex flex-wrap gap-2">
              {INTL_ORGANIZATIONS.map((org, i) => (
                <button
                  key={org.abbr}
                  type="button"
                  onClick={() => setOrgIdx(i)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                    orgIdx === i
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {org.abbr}
                </button>
              ))}
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
              <h4 className="text-base font-bold text-white">
                {INTL_ORGANIZATIONS[orgIdx].name}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block">প্রতিষ্ঠাকাল</span>
                  <span className="text-emerald-400 font-semibold">
                    {INTL_ORGANIZATIONS[orgIdx].founded}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">সদরদপ্তর</span>
                  <span className="text-amber-300 font-semibold">
                    {INTL_ORGANIZATIONS[orgIdx].hq}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">সদস্য / কাঠামো</span>
                  <span className="text-white font-semibold">
                    {INTL_ORGANIZATIONS[orgIdx].members}
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-300 pt-2 border-t border-slate-800">
                {INTL_ORGANIZATIONS[orgIdx].bdStatus}
              </p>
            </div>
          </div>
        )}

        {/* 6. DU Written Structure Builder */}
        {lesson.diagramType === 'written_builder' && (
          <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-5 space-y-4">
            <div className="flex flex-wrap gap-2">
              {WRITTEN_TEMPLATES.map((tpl, i) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => setWrittenIdx(i)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                    writtenIdx === i
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {tpl.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {WRITTEN_TEMPLATES[writtenIdx].structure.map((s) => (
                <div
                  key={s.step}
                  className="bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-1"
                >
                  <div className="text-xs font-semibold text-emerald-400">
                    {s.step}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{s.text}</p>
                </div>
              ))}
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5 text-xs text-slate-200 leading-relaxed">
              <span className="font-semibold text-amber-300">আদর্শ নমুনা: </span>
              {WRITTEN_TEMPLATES[writtenIdx].sample}
            </div>
          </div>
        )}

        {/* Live Bengali Subtitles / Captions */}
        <div className="mt-4 bg-slate-900/90 border border-slate-800 rounded-lg px-4 py-3">
          <div className="text-[11px] font-medium text-emerald-400 mb-0.5">
            লেকচার অডিও সাবটাইটেল
          </div>
          <p className="text-sm text-slate-100 leading-relaxed">{activeCaption}</p>
        </div>
      </div>

      {/* Player Control Deck */}
      <div className="px-5 py-3.5 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPlaying((p) => !p)}
            aria-label={isPlaying ? 'বিরতি দিন' : 'লেকচার চালান'}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5" aria-hidden="true" />
                <span>বিরতি</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" aria-hidden="true" />
                <span>ক্লাস চালান</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() =>
              setCurrentTime((prev) => Math.min(lesson.durationSec, prev + 15))
            }
            aria-label="১৫ সেকেন্ড সামনে যান"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
          >
            <StepForward className="w-4 h-4" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => {
              setIsPlaying(false);
              setCurrentTime(0);
            }}
            aria-label="পুনরায় শুরু করুন"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 min-w-44">
          <input
            type="range"
            min={0}
            max={lesson.durationSec}
            step={1}
            value={Math.floor(currentTime)}
            onChange={(e) => setCurrentTime(Number(e.target.value))}
            aria-label="লেকচার টাইমলাইন"
            className="w-full accent-emerald-500 cursor-pointer"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
          {([1, 1.25, 1.5] as const).map((spd) => (
            <button
              key={spd}
              type="button"
              onClick={() => setPlaybackSpeed(spd)}
              className={`px-2 py-1 text-xs font-mono tabular-nums rounded transition-colors cursor-pointer ${
                playbackSpeed === spd
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
