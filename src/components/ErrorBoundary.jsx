import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('React ErrorBoundary caught an unhandled exception:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4 font-sans" dir="rtl">
          <div className="bg-slate-800 border border-slate-700 max-w-lg w-full rounded-2xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 bg-red-500/10 text-red-400 rounded-2xl flex items-center justify-center mx-auto border border-red-500/20">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div>
              <h1 className="text-base sm:text-lg font-bold text-white">خطایی در نمایش صفحه رخ داده است</h1>
              <p className="text-xs text-slate-400 mt-1">
                اطلاعات ثبت‌شده شما در دیتابیس کاملاً محفوظ است. با فشردن دکمه زیر می‌توانید صفحه را نوسازی کنید.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-slate-950 p-3 rounded-xl text-left font-mono text-[11px] text-red-300 border border-red-900/50 overflow-x-auto max-h-36 scrollbar-none" dir="ltr">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs sm:text-sm font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer shadow-md shadow-amber-500/20 transition"
              >
                <RefreshCw className="w-4 h-4" />
                <span>بارگذاری مجدد سامانه</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
