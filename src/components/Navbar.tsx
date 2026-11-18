import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';

export type AppView =
  | 'home'
  | 'courses'
  | 'classroom'
  | 'live'
  | 'quiz'
  | 'notes'
  | 'dashboard'
  | 'admin';

interface NavbarProps {
  activeView: AppView;
  onNavigate: (view: AppView) => void;
}

const NAV_ITEMS: { id: AppView; label: string }[] = [
  { id: 'home', label: 'হোম' },
  { id: 'courses', label: 'কোর্সসমূহ' },
  { id: 'live', label: 'লাইভ ক্লাস' },
  { id: 'quiz', label: 'মডেল টেস্ট' },
  { id: 'notes', label: 'নোটস' },
];

export const Navbar: React.FC<NavbarProps> = ({ activeView, onNavigate }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSelect = (view: AppView) => {
    onNavigate(view);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <button
          type="button"
          onClick={() => handleSelect('home')}
          className="text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-600 cursor-pointer"
        >
          Confirm <span className="text-emerald-700">DU</span>
        </button>

        {/* Zone 2: 5 concise single-line nav links */}
        <nav
          aria-label="প্রধান নেভিগেশন"
          className="hidden md:flex items-center gap-7 text-sm font-medium"
        >
          {NAV_ITEMS.map((item) => {
            const isActive =
              activeView === item.id ||
              (item.id === 'courses' && activeView === 'classroom');
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                className={`py-1 whitespace-nowrap shrink-0 transition-colors duration-150 border-b-2 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-600 ${
                  isActive
                    ? 'text-emerald-700 border-emerald-700 font-semibold'
                    : 'text-slate-600 border-transparent hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary CTA + mobile drawer toggle */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => handleSelect('dashboard')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${
              activeView === 'dashboard'
                ? 'bg-slate-900 text-white'
                : 'bg-emerald-700 text-white hover:bg-emerald-800'
            }`}
          >
            আমার ড্যাশবোর্ড
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? 'মেনু বন্ধ করুন' : 'মেনু খুলুন'}
            aria-expanded={mobileMenuOpen}
            className="md:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-emerald-600 cursor-pointer"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" aria-hidden="true" />
            ) : (
              <Menu className="w-5 h-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              activeView === item.id ||
              (item.id === 'courses' && activeView === 'classroom');
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                className={`block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-800 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
