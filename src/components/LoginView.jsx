import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, UtensilsCrossed, ShieldCheck, ArrowLeft, KeyRound } from 'lucide-react';

export default function LoginView({ onLoginSuccess }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123456');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await onLoginSuccess(username, password);
    } catch (err) {
      setError(err.message || 'نام کاربری یا کلمه عبور نادرست است.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = () => {
    setUsername('admin');
    setPassword('admin123456');
    setError('');
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-amber-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-linear-to-tr from-amber-500 to-amber-400 text-slate-950 shadow-xl shadow-amber-500/20 mb-4 ring-4 ring-amber-500/20">
            <UtensilsCrossed className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            سامانه قیمت‌گذاری و رسپی‌بوک
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            پنل اختصاصی مدیریت هزینه و بهای تمام شده رستوران
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-800/90 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center gap-2 mb-6 text-amber-400 font-semibold text-sm pb-3 border-b border-slate-700/60">
            <ShieldCheck className="w-4 h-4" />
            <span>ورود مدیر ارشد مجموعه</span>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-red-500/15 border border-red-500/30 text-red-300 rounded-xl text-sm flex items-start gap-2.5">
              <span className="text-red-400 font-bold">✕</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                نام کاربری مدیر
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="مثال: admin"
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-xl pr-10 pl-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                کلمه عبور
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-xl pr-10 pl-10 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 hover:text-slate-200 transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-slate-950 border-t-transparent" />
              ) : (
                <>
                  <span>ورود به سامانه</span>
                  <ArrowLeft className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Box */}
          <div className="mt-6 pt-5 border-t border-slate-700/60 bg-slate-900/50 -mx-6 -mb-6 p-4 rounded-b-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <KeyRound className="w-4 h-4 text-amber-400" />
                <span>اطلاعات ورود پیش‌فرض:</span>
              </div>
              <button
                type="button"
                onClick={handleQuickFill}
                className="text-xs text-amber-400 hover:text-amber-300 font-medium underline underline-offset-2 transition cursor-pointer"
              >
                پر کردن خودکار
              </button>
            </div>
            <div className="mt-2 text-[11px] font-mono text-slate-400 flex items-center justify-between bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800">
              <span>کاربر: <strong className="text-slate-200">admin</strong></span>
              <span className="text-slate-600">|</span>
              <span>رمز: <strong className="text-slate-200">admin123456</strong></span>
            </div>
          </div>
        </div>

        {/* Security badge footer */}
        <p className="text-center text-xs text-slate-500 mt-6">
          دسترسی فقط مجاز برای مدیر رستوران • محافظت شده با نشست امنیتی
        </p>
      </div>
    </div>
  );
}
