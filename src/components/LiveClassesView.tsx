import React, { useState } from 'react';
import { Bell, BellRing, Calendar, Clock, Radio, Users, X } from 'lucide-react';
import { CourseCategory, LiveClass } from '../types/edu';

interface LiveClassesViewProps {
  liveClasses: LiveClass[];
  remindedIds: string[];
  onToggleReminder: (id: string) => void;
}

const CATEGORY_FILTERS: { id: CourseCategory; label: string }[] = [
  { id: 'all', label: 'সবগুলো' },
  { id: 'bangla', label: 'বাংলা' },
  { id: 'english', label: 'ইংরেজি' },
  { id: 'gk', label: 'সাধারণ জ্ঞান' },
  { id: 'written', label: 'লিখিত ও মডেল' },
];

export const LiveClassesView: React.FC<LiveClassesViewProps> = ({
  liveClasses,
  remindedIds,
  onToggleReminder,
}) => {
  const [filter, setFilter] = useState<CourseCategory>('all');
  const [activeLiveRoom, setActiveLiveRoom] = useState<LiveClass | null>(null);
  const [pollVotes, setPollVotes] = useState<Record<string, number>>({});

  const filteredClasses = liveClasses.filter(
    (item) => filter === 'all' || item.category === filter
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            লাইভ ক্লাস ও রুটিন
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-1.5">
            সেরা শিক্ষকদের সাথে সরাসরি ক্লাসে যুক্ত হয়ে প্রশ্ন করুন এবং লাইভ পোলে অংশ নিন।
          </p>
        </div>

        {/* Interactive Category Segmented Filter */}
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg w-fit">
          {CATEGORY_FILTERS.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setFilter(cat.id)}
              className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                filter === cat.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Live Room Panel when joined */}
      {activeLiveRoom && (
        <section className="bg-slate-900 text-white rounded-xl border border-slate-800 p-6 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-400 mb-1">
                <Radio className="w-4 h-4" aria-hidden="true" />
                <span>
                  {activeLiveRoom.status === 'live'
                    ? 'সরাসরি সম্প্রচার চলছে'
                    : 'সেশন প্রিভিউ রুম'}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold">
                {activeLiveRoom.title}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                শিক্ষক: {activeLiveRoom.instructorName} ({activeLiveRoom.instructorCredential}) ·{' '}
                {activeLiveRoom.scheduleTime}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveLiveRoom(null)}
              aria-label="লাইভ রুম বন্ধ করুন"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          {activeLiveRoom.meetingUrl && (
            <div className="bg-emerald-950/60 border border-emerald-800 rounded-lg px-4 py-3 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs sm:text-sm text-emerald-200">
                সরাসরি ভিডিও মিটিং / ক্লাস লিংক প্রস্তুত রয়েছে:
              </span>
              <a
                href={activeLiveRoom.meetingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
              >
                ক্লাস লিংকে প্রবেশ করুন
              </a>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-lg p-5 space-y-3">
              <h3 className="text-sm font-semibold text-emerald-400">
                আজকের লাইভ ক্লাসের আলোচ্য বিষয়সমূহ
              </h3>
              <ul className="space-y-2.5 text-sm text-slate-200">
                {activeLiveRoom.topics.map((topic, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="font-mono text-xs text-emerald-400 mt-0.5">
                      ০{idx + 1}.
                    </span>
                    <span>{topic}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-lg p-5 space-y-3">
              <div className="text-xs font-semibold text-amber-300">
                লাইভ স্টুডেন্ট পোল
              </div>
              <p className="text-sm font-medium text-white">
                {activeLiveRoom.pollQuestion}
              </p>
              <div className="space-y-2">
                {activeLiveRoom.pollOptions.map((opt, idx) => {
                  const isVoted = pollVotes[activeLiveRoom.id] === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() =>
                        setPollVotes((prev) => ({
                          ...prev,
                          [activeLiveRoom.id]: idx,
                        }))
                      }
                      className={`w-full text-left px-3.5 py-2 rounded-lg border text-xs sm:text-sm transition-colors cursor-pointer ${
                        isVoted
                          ? 'bg-emerald-700 border-emerald-500 text-white font-semibold'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {opt} {isVoted && '— আপনার ভোট গৃহীত হয়েছে'}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Live Class Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredClasses.map((item) => {
          const isReminded = remindedIds.includes(item.id);
          const isLive = item.status === 'live';

          return (
            <article
              key={item.id}
              className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between gap-5"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-slate-600 font-medium">
                    {item.categoryLabel} · {item.subject}
                  </span>
                  {isLive ? (
                    <span className="inline-flex items-center gap-1.5 font-semibold text-rose-700">
                      <Radio className="w-3.5 h-3.5" aria-hidden="true" />
                      এখন লাইভ চলছে
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-slate-500">
                      <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                      আসন্ন সেশন
                    </span>
                  )}
                </div>

                <h2 className="text-lg font-bold text-slate-900 leading-snug">
                  {item.title}
                </h2>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                  <span className="inline-flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                    {item.instructorName} ({item.instructorCredential})
                  </span>
                  <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                    <Clock className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                    {item.scheduleTime} · {item.duration}
                  </span>
                </div>

                <ul className="pt-2 border-t border-slate-100 space-y-1.5 text-xs sm:text-sm text-slate-600">
                  {item.topics.map((t, i) => (
                    <li key={i}>• {t}</li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveLiveRoom(item)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                    isLive
                      ? 'bg-rose-600 hover:bg-rose-700 text-white'
                      : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                  }`}
                >
                  {isLive ? 'লাইভ ক্লাসে যুক্ত হোন' : 'ক্লাস প্রিভিউ ও পোল দেখুন'}
                </button>

                {!isLive && (
                  <button
                    type="button"
                    onClick={() => onToggleReminder(item.id)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                      isReminded
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {isReminded ? (
                      <>
                        <BellRing className="w-4 h-4" aria-hidden="true" />
                        <span>রিমাইন্ডার সেট আছে</span>
                      </>
                    ) : (
                      <>
                        <Bell className="w-4 h-4" aria-hidden="true" />
                        <span>রিমাইন্ডার সেট করুন</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};
