import React, { useMemo, useState } from 'react';
import { Bookmark, Search } from 'lucide-react';
import { FORMULA_NOTES_DATA } from '../data/liveAndNotesData';

interface NotesLibraryViewProps {
  bookmarkedIds: string[];
  onToggleBookmark: (noteId: string) => void;
}

const SUBJECT_TABS = [
  'সব বিষয়',
  'বাংলা',
  'ইংরেজি',
  'বাংলাদেশ বিষয়াবলি',
  'আন্তর্জাতিক বিষয়াবলি',
  'লিখিত প্রস্তুতি',
];

export const NotesLibraryView: React.FC<NotesLibraryViewProps> = ({
  bookmarkedIds,
  onToggleBookmark,
}) => {
  const [selectedSubject, setSelectedSubject] = useState('সব বিষয়');
  const [query, setQuery] = useState('');

  const filteredNotes = useMemo(() => {
    return FORMULA_NOTES_DATA.filter((note) => {
      const matchSubject =
        selectedSubject === 'সব বিষয়' || note.subject === selectedSubject;
      const q = query.trim().toLowerCase();
      const matchQuery =
        !q ||
        note.title.toLowerCase().includes(q) ||
        note.formula.toLowerCase().includes(q) ||
        note.explanation.toLowerCase().includes(q);
      return matchSubject && matchQuery;
    });
  }, [selectedSubject, query]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            স্মার্ট নোটস ও সূত্র ব্যাংক
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-1.5">
            পরীক্ষার আগে দ্রুত রিভিশনের জন্য বিষয়ভিত্তিক গুরুত্বপূর্ণ সূত্র, নিয়ম এবং উদাহরণ।
          </p>
        </div>

        <div className="relative w-full md:w-72">
          <Search
            className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="সূত্র বা টপিক খুঁজুন..."
            aria-label="সূত্র বা টপিক খুঁজুন"
            className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:border-emerald-600"
          />
        </div>
      </div>

      {/* Subject Filter Buttons */}
      <div className="flex flex-wrap items-center gap-1.5">
        {SUBJECT_TABS.map((subject) => (
          <button
            key={subject}
            type="button"
            onClick={() => setSelectedSubject(subject)}
            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
              selectedSubject === subject
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            {subject}
          </button>
        ))}
      </div>

      {filteredNotes.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-sm text-slate-600">
          আপনার অনুসন্ধানের সাথে মিলে এমন কোনো সূত্র বা নোট পাওয়া যায়নি।
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredNotes.map((note) => {
            const isBookmarked = bookmarkedIds.includes(note.id);
            return (
              <article
                key={note.id}
                className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs text-slate-500">
                        {note.subject} · {note.level}
                      </div>
                      <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                        {note.title}
                      </h2>
                    </div>

                    <button
                      type="button"
                      onClick={() => onToggleBookmark(note.id)}
                      aria-label={
                        isBookmarked ? 'বুকমার্ক সরান' : 'বুকমার্ক করুন'
                      }
                      className={`p-2 rounded-lg border transition-colors shrink-0 cursor-pointer ${
                        isBookmarked
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <Bookmark
                        className="w-4 h-4"
                        fill={isBookmarked ? 'currentColor' : 'none'}
                        aria-hidden="true"
                      />
                    </button>
                  </div>

                  <div className="bg-slate-900 text-emerald-300 font-mono text-xs sm:text-sm rounded-lg p-3.5 overflow-x-auto leading-relaxed">
                    {note.formula}
                  </div>

                  <p className="text-sm text-slate-700 leading-relaxed">
                    {note.explanation}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 text-xs sm:text-sm text-slate-600">
                  <span className="font-semibold text-slate-900">উদাহরণ: </span>
                  {note.example}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
