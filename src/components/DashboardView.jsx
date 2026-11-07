import React from 'react';
import {
  Wheat,
  Layers,
  ShoppingBag,
  Percent,
  ArrowUpRight,
  Plus,
  Sparkles,
  HelpCircle,
  Utensils,
  PackageCheck,
  CheckCircle2,
} from 'lucide-react';
import { formatToman, formatPercent, toPersianDigits, getCategoryBadgeClass } from '../utils.js';

export default function DashboardView({
  products = [],
  intermediates = [],
  materials = [],
  onNavigate,
  onOpenProductModal,
  onOpenIntermediateModal,
  onOpenMaterialModal,
}) {
  // Compute dashboard metrics
  const totalProducts = products.length;
  const totalIntermediates = intermediates.length;
  const totalMaterials = materials.length;

  const avgMultiplier =
    totalProducts > 0
      ? (products.reduce((acc, p) => acc + (p.profitMultiplier || 2.5), 0) / totalProducts).toFixed(2)
      : '2.50';

  const avgFoodCostPercentDineIn =
    totalProducts > 0
      ? (products.reduce((acc, p) => acc + (p.foodCostPercentDineIn || 0), 0) / totalProducts).toFixed(1)
      : '0';

  const avgFoodCostPercentTakeout =
    totalProducts > 0
      ? (products.reduce((acc, p) => acc + (p.foodCostPercentTakeout || 0), 0) / totalProducts).toFixed(1)
      : '0';

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-linear-to-r from-slate-900 via-slate-800 to-amber-950 rounded-2xl p-6 text-white shadow-lg border border-slate-700/60 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -translate-x-20 -translate-y-20" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/25 text-amber-300 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>سیستم هوشمند بهای تمام شده و رسپی‌بوک رستوران</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              داشبورد مدیریت و تحلیل سود منو
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              محاسبه زنجیره‌ای بهای تمام شده از مواد اولیه تا کالاهای واسط و محصولات نهایی منو با تفکیک هزینه‌های بسته‌بندی سالن و بیرون‌بر و اعمال ضریب سود پیشنهادی.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onNavigate('recipebook')}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer"
            >
              <Utensils className="w-4 h-4 text-slate-950" />
              <span>مشاهده رسپی‌بوک</span>
            </button>
            <button
              onClick={() => onNavigate('materials')}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2.5 rounded-xl text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer"
            >
              <Wheat className="w-4 h-4 text-amber-400" />
              <span>مدیریت مواد اولیه</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div
          onClick={() => onNavigate('materials')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-amber-400 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">مواد اولیه</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition">
              <Wheat className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-800">
            {toPersianDigits(totalMaterials)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span>اقلام با واحد و قیمت خرید</span>
          </div>
        </div>

        <div
          onClick={() => onNavigate('intermediates')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-amber-400 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">کالاهای واسط</span>
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-800">
            {toPersianDigits(totalIntermediates)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span>نیمه‌آماده‌های ترکیبی</span>
          </div>
        </div>

        <div
          onClick={() => onNavigate('products')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-amber-400 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">محصولات منو</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-800">
            {toPersianDigits(totalProducts)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span>پاستا، سوخاری و غذاهای اصلی</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">میانگین ضریب سود</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-800">
            {toPersianDigits(avgMultiplier)}×
          </div>
          <div className="text-[11px] text-purple-600 font-medium mt-1">
            ضریب اعمالی روی قیمت مواد اولیه
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">فودکاست میانگین</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <PackageCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-800">
              {formatPercent(avgFoodCostPercentDineIn)}
            </span>
            <span className="text-xs text-slate-400">سالن</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            بیرون‌بر: {formatPercent(avgFoodCostPercentTakeout)}
          </div>
        </div>
      </div>

      {/* Explanation Flow Banner */}
      <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 mt-0.5 font-bold">
            💡
          </div>
          <div className="space-y-1 text-xs sm:text-sm text-slate-700">
            <div className="font-bold text-slate-900 text-sm sm:text-base">
              فرمول دقیق قیمت‌گذاری در این سامانه
            </div>
            <p className="leading-relaxed">
              ۱. <strong>بهای صرفاً مواد اولیه (Food Cost):</strong> مجموع هزینه مواد خام اولیه و کالاهای واسط تشکیل‌دهنده طبق رسپی غذا.
            </p>
            <p className="leading-relaxed">
              ۲. <strong>قیمت پیشنهادی فروش سالن:</strong> (بهای مواد اولیه × ضریب سود) + هزینه پکیجینگ و خدمات سالن
            </p>
            <p className="leading-relaxed">
              ۳. <strong>قیمت پیشنهادی فروش بیرون‌بر:</strong> (بهای مواد اولیه × ضریب سود) + هزینه پکیجینگ کامل بیرون‌بر (جعبه، ساک، ظروف آلومینیومی، پک قاشق)
            </p>
          </div>
        </div>
      </div>

      {/* Final Products Live Cost Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-amber-500" />
              <span>جدول بهای تمام شده و قیمت پیشنهادی فروش محصولات منو</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              مقایسه شفاف هزینه مواد، پکیجینگ سالن، پکیجینگ بیرون‌بر و قیمت فروش نهایی
            </p>
          </div>

          <button
            onClick={onOpenProductModal}
            className="self-start sm:self-auto bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>افزودن محصول منو</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs sm:text-sm">
            <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">نام محصول نهایی</th>
                <th className="py-3 px-3">هزینه مواد اولیه (Food Cost)</th>
                <th className="py-3 px-3">پکیجینگ سالن / بیرون‌بر</th>
                <th className="py-3 px-3">تمام شده سالن / بیرون‌بر</th>
                <th className="py-3 px-3 text-center">ضریب سود</th>
                <th className="py-3 px-4 text-emerald-700 font-bold bg-emerald-50/40">قیمت پیشنهادی سالن</th>
                <th className="py-3 px-4 text-amber-800 font-bold bg-amber-50/40">قیمت پیشنهادی بیرون‌بر</th>
                <th className="py-3 px-3 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400">
                    هیچ محصولی در سامانه ثبت نشده است.
                  </td>
                </tr>
              ) : (
                products.map((prod) => (
                  <tr key={prod.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{prod.name}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span className={`px-2 py-0.5 rounded-full border text-[10px] ${getCategoryBadgeClass(prod.category)}`}>
                          {prod.category}
                        </span>
                      </div>
                    </td>

                    {/* Food cost */}
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-slate-800">
                        {formatToman(prod.foodCost)}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        صرفاً اقلام مصرفی
                      </div>
                    </td>

                    {/* Packaging */}
                    <td className="py-3.5 px-3">
                      <div className="text-slate-700 text-xs">
                        سالن: <span className="font-semibold">{formatToman(prod.dineInPackagingCost)}</span>
                      </div>
                      <div className="text-slate-700 text-xs mt-0.5">
                        بیرون‌بر: <span className="font-semibold text-indigo-700">{formatToman(prod.takeoutPackagingCost)}</span>
                      </div>
                    </td>

                    {/* Total cost */}
                    <td className="py-3.5 px-3">
                      <div className="text-slate-800 font-medium text-xs">
                        سالن: {formatToman(prod.totalDineInCost)}
                      </div>
                      <div className="text-slate-800 font-medium text-xs mt-0.5">
                        بیرون‌بر: {formatToman(prod.totalTakeoutCost)}
                      </div>
                    </td>

                    {/* Multiplier */}
                    <td className="py-3.5 px-3 text-center">
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 font-bold font-mono text-xs border border-purple-200">
                        {toPersianDigits(prod.profitMultiplier)}×
                      </span>
                    </td>

                    {/* Suggested Dine In Price */}
                    <td className="py-3.5 px-4 bg-emerald-50/20">
                      <div className="font-black text-emerald-700 text-sm">
                        {formatToman(prod.suggestedDineInPrice)}
                      </div>
                      <div className="text-[10px] text-emerald-600 font-medium mt-0.5">
                        فودکاست: {formatPercent(prod.foodCostPercentDineIn)}
                      </div>
                    </td>

                    {/* Suggested Takeout Price */}
                    <td className="py-3.5 px-4 bg-amber-50/20">
                      <div className="font-black text-amber-900 text-sm">
                        {formatToman(prod.suggestedTakeoutPrice)}
                      </div>
                      <div className="text-[10px] text-amber-700 font-medium mt-0.5">
                        فودکاست: {formatPercent(prod.foodCostPercentTakeout)}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-3 text-center">
                      <button
                        onClick={() => onNavigate('recipebook', prod.id)}
                        className="text-xs text-amber-600 hover:text-amber-700 font-bold hover:underline cursor-pointer"
                      >
                        رسپی‌بوک
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
