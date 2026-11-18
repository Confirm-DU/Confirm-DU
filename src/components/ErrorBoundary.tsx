import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error?.message || 'অ্যাপ্লিকেশনে একটি অনাকাঙ্ক্ষিত ত্রুটি ঘটেছে।',
    };
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white border border-slate-200 rounded-xl p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" aria-hidden="true" />
            </div>
            <h1 className="text-lg font-bold text-slate-900">
              একটি সাময়িক সমস্যা দেখা দিয়েছে
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 break-words">
              অনুগ্রহ করে পেজটি রিলোড করুন অথবা পুনরায় সাইন ইন করে চেষ্টা করুন।
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
              <span>রিলোড করুন</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
