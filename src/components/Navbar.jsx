import React from 'react';
import {
  UtensilsCrossed,
  LayoutDashboard,
  Wheat,
  Layers,
  ShoppingBag,
  BookOpen,
  Scale,
  LogOut,
  User,
  Settings,
  Download,
} from 'lucide-react';

export default function Navbar({
  activeTab,
  setActiveTab,
  manager,
  onLogout,
  onOpenSettings,
  onOpenBackup,
  counts = {},
}) {
  const navItems = [
    { id: 'dashboard', label: 'داشبورد', icon: LayoutDashboard },
    { id: 'materials', label: 'مواد اولیه', icon: Wheat, count: counts.materials },
    { id: 'intermediates', label: 'کالاهای واسط', icon: Layers, count: counts.intermediates },
    { id: 'products', label: 'محصولات نهایی', icon: ShoppingBag, count: counts.products },
    { id: 'recipebook', label: 'رسپی‌بوک', icon: BookOpen },
    { id: 'units', label: 'تبدیل واحدها و مقادیر پیش‌فرض', icon: Scale },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-amber-500 to-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/20">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <div className="text-base font-extrabold tracking-tight text-white flex items-center gap-2">
                <span>سامانه قیمت‌گذاری و رسپی‌بوک</span>
                <span className="text-[10px] font-medium bg-amber-400/10 text-amber-400 px-2 py-0.5 rounded-full border border-amber-400/20">
                  نسخه مدیریت
                </span>
              </div>
              <div className="text-xs text-slate-400">
                {manager?.restaurantName || 'مدیریت بهای تمام شده رستوران'}
              </div>
            </div>
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onOpenBackup}
              title="پشتیبان‌گیری و خروجی داده‌ها"
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span className="hidden md:inline">پشتیبان‌گیری</span>
            </button>

            <button
              onClick={onOpenSettings}
              title="تنظیمات مدیر"
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Settings className="w-4 h-4 text-slate-400" />
              <span className="hidden md:inline">تنظیمات</span>
            </button>

            {/* Manager Pill */}
            <div className="hidden sm:flex items-center gap-2 bg-slate-800/80 border border-slate-700/80 px-3 py-1.5 rounded-xl text-xs">
              <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                <User className="w-3.5 h-3.5" />
              </div>
              <div className="text-right">
                <div className="font-semibold text-slate-200">{manager?.fullName || 'مدیر مجموعه'}</div>
              </div>
            </div>

            {/* Logout button */}
            <button
              onClick={onLogout}
              title="خروج از سیستم"
              className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">خروج</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="bg-slate-900/90 border-t border-slate-800/80 px-4 sm:px-6 lg:px-8 overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto flex gap-1 sm:gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-xs sm:text-sm font-medium border-b-2 transition whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'border-amber-400 text-amber-400 font-bold bg-amber-400/5'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.count !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isActive ? 'bg-amber-400/20 text-amber-300' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
