import React, { useState, useMemo, useEffect } from 'react';
import {
  BookOpen,
  Printer,
  Utensils,
  Layers,
  Wheat,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Percent,
  CheckCircle2,
  Search,
} from 'lucide-react';
import { formatToman, formatPercent, toPersianDigits, getCategoryBadgeClass } from '../utils.js';

export default function RecipeBookView({
  products = [],
  selectedProductId,
  onSelectProduct,
  onEditProduct,
}) {
  const [activeId, setActiveId] = useState(
    selectedProductId || (products.length > 0 ? products[0].id : null)
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSubIntermediates, setExpandedSubIntermediates] = useState({});

  useEffect(() => {
    if (selectedProductId) {
      setActiveId(selectedProductId);
    }
  }, [selectedProductId]);

  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return products;
    const q = searchTerm.toLowerCase().trim();
    return products.filter((p) =>
      p.name.toLowerCase().includes(q) ||
      (p.category && p.category.toLowerCase().includes(q)) ||
      (p.recipeBreakdown && p.recipeBreakdown.some((item) => item.name && item.name.toLowerCase().includes(q)))
    );
  }, [products, searchTerm]);

  // If current activeId is not in filtered list, auto-select first matching
  useEffect(() => {
    if (filteredProducts.length > 0 && !filteredProducts.some((p) => p.id === activeId)) {
      setActiveId(filteredProducts[0].id);
    }
  }, [filteredProducts, activeId]);

  const currentProduct = products.find((p) => p.id === activeId) || products[0];

  const handlePrint = () => {
    window.print();
  };

  const toggleSubExpand = (itemId) => {
    setExpandedSubIntermediates((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  if (!currentProduct) {
    return (
      <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400">
        هیچ محصولی در رسپی‌بوک یافت نشد.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Selector & Print Bar (Hidden in print) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 overflow-hidden">
          {/* Search Box */}
          <div className="relative min-w-[200px] max-w-xs shrink-0">
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="جستجوی رسپی محصول..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pr-9 pl-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
            />
          </div>

          {/* Product selector pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none flex-1">
            {filteredProducts.length === 0 ? (
              <span className="text-xs text-slate-400 italic">هیچ رسپی‌ای با این نام یافت نشد.</span>
            ) : (
              filteredProducts.map((prod) => (
                <button
                  key={prod.id}
                  onClick={() => {
                    setActiveId(prod.id);
                    if (onSelectProduct) onSelectProduct(prod.id);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    prod.id === activeId
                      ? 'bg-amber-500 text-slate-950 shadow-xs font-bold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {prod.name}
                </button>
              ))
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
          <button
            onClick={() => onEditProduct(currentProduct)}
            className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3 py-2 rounded-xl transition cursor-pointer"
          >
            ویرایش فرمول رسپی
          </button>
          <button
            onClick={handlePrint}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-md transition cursor-pointer"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>چاپ کارت رسپی (Print)</span>
          </button>
        </div>
      </div>

      {/* Printable Recipe Book Sheet */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6 print:border-none print:shadow-none print:p-0">
        {/* Sheet Header */}
        <div className="border-b-2 border-slate-900 pb-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${getCategoryBadgeClass(currentProduct.category)}`}>
                {currentProduct.category}
              </span>
              <span className="text-xs text-slate-500 font-mono">کد: {currentProduct.id}</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {currentProduct.name}
            </h1>
            {currentProduct.description && (
              <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
                {currentProduct.description}
              </p>
            )}
          </div>

          <div className="bg-purple-50 p-3 rounded-xl border border-purple-200 text-left shrink-0">
            <div className="text-[11px] text-purple-700 font-medium">ضریب سود مدیریت:</div>
            <div className="text-base font-extrabold text-purple-900 font-mono mt-0.5">
              {toPersianDigits(currentProduct.profitMultiplier)}×
            </div>
          </div>
        </div>

        {/* Instructions & Prep Box */}
        {currentProduct.instructions && (
          <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200/80 text-xs sm:text-sm">
            <div className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
              <Utensils className="w-4 h-4 text-amber-600" />
              <span>دستورالعمل آماده‌سازی، طبخ و نحوه سرو سرآشپز:</span>
            </div>
            <p className="text-slate-700 leading-relaxed whitespace-pre-line">
              {currentProduct.instructions}
            </p>
          </div>
        )}

        {/* Detailed Bill of Materials (BOM) Table */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-amber-500" />
              <span>جدول آنالیز مواد تشکیل‌دهنده (Food Cost Breakdown)</span>
            </h2>
            <span className="text-xs text-slate-500 font-mono">
              بهای کل مواد: <strong className="text-slate-900">{formatToman(currentProduct.foodCost)}</strong>
            </span>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold">
                <tr>
                  <th className="py-2.5 px-3">نوع قلم</th>
                  <th className="py-2.5 px-3">نام قلم تشکیل‌دهنده</th>
                  <th className="py-2.5 px-3">مقدار در رسپی</th>
                  <th className="py-2.5 px-3">نرخ پایه</th>
                  <th className="py-2.5 px-3">بهای تمام شده</th>
                  <th className="py-2.5 px-3 text-center">سهم در هزینه</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(currentProduct.recipeBreakdown || []).map((item, idx) => {
                  const isInter = item.type === 'intermediate';
                  const isExpanded = expandedSubIntermediates[item.id];
                  const hasSub = isInter && item.subIngredients && item.subIngredients.length > 0;

                  return (
                    <React.Fragment key={idx}>
                      <tr className="hover:bg-slate-50/80 transition">
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isInter ? 'bg-purple-100 text-purple-800' : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {isInter ? 'کالای واسط' : 'ماده اولیه'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{item.name}</span>
                            {hasSub && (
                              <button
                                onClick={() => toggleSubExpand(item.id)}
                                className="text-[10px] text-purple-600 hover:text-purple-800 underline flex items-center gap-0.5 cursor-pointer no-print"
                              >
                                <span>{isExpanded ? 'بستن ریزاقلام' : 'ریز اقلام واسط'}</span>
                                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                          {toPersianDigits(item.quantity)} {item.unit}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">
                          {isInter
                            ? `${formatToman(item.unitCost)} / ${item.yieldUnit}`
                            : `${formatToman(item.purchasePrice)} / ${item.purchaseUnit}`}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-900 font-mono">
                          {formatToman(item.calculatedCost)}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono">
                          <span className="font-bold text-slate-700">
                            {formatPercent(item.costPercentage)}
                          </span>
                        </td>
                      </tr>

                      {/* Expanded Sub-Ingredients for Nested Intermediate Goods */}
                      {isExpanded && hasSub && (
                        <tr className="bg-purple-50/30">
                          <td colSpan="6" className="py-2 px-6">
                            <div className="p-3 bg-white rounded-lg border border-purple-200 space-y-1.5">
                              <div className="text-[11px] font-bold text-purple-900">
                                ریز اقلام تشکیل‌دهنده کالای واسط «{item.name}»:
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600">
                                {item.subIngredients.map((sub, sIdx) => (
                                  <div key={sIdx} className="flex justify-between bg-slate-50 px-2 py-1 rounded">
                                    <span>• {sub.name} ({toPersianDigits(sub.quantity)} {sub.unit})</span>
                                    <span className="font-mono">{formatToman(sub.calculatedCost)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Packaging Breakdown Table */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Dine-in packaging */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
              <span>پکیجینگ و ظروف مصرفی سالن (Dine-in)</span>
              <span className="font-mono text-emerald-700">
                جمع: {formatToman(currentProduct.dineInPackagingCost)}
              </span>
            </div>
            {currentProduct.dineInPackagingBreakdown?.length > 0 ? (
              <div className="space-y-1 text-xs">
                {currentProduct.dineInPackagingBreakdown.map((pkg, i) => (
                  <div key={i} className="flex justify-between text-slate-600 bg-white px-2 py-1 rounded border border-slate-200">
                    <span>{pkg.name} ({toPersianDigits(pkg.quantity)} {pkg.unit})</span>
                    <span className="font-mono">{formatToman(pkg.calculatedCost)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic">بدون پکیجینگ اضافی در سالن</div>
            )}
          </div>

          {/* Takeout packaging */}
          <div className="border border-indigo-200 rounded-xl p-4 bg-indigo-50/30 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-indigo-950">
              <span>پکیجینگ کامل سفارش بیرون‌بر (Takeout)</span>
              <span className="font-mono text-indigo-800 font-bold">
                جمع: {formatToman(currentProduct.takeoutPackagingCost)}
              </span>
            </div>
            {currentProduct.takeoutPackagingBreakdown?.length > 0 ? (
              <div className="space-y-1 text-xs">
                {currentProduct.takeoutPackagingBreakdown.map((pkg, i) => (
                  <div key={i} className="flex justify-between text-slate-700 bg-white px-2 py-1 rounded border border-indigo-100">
                    <span>{pkg.name} ({toPersianDigits(pkg.quantity)} {pkg.unit})</span>
                    <span className="font-mono font-semibold">{formatToman(pkg.calculatedCost)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic">بدون پکیجینگ بیرون‌بر ثبت شده</div>
            )}
          </div>
        </div>

        {/* Final Financial Summary Box */}
        <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <div className="text-slate-400 text-[11px] mb-1">بهای صرفاً مواد اولیه:</div>
            <div className="text-lg font-black text-amber-400 font-mono">
              {formatToman(currentProduct.foodCost)}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              ضریب سود: {toPersianDigits(currentProduct.profitMultiplier)}×
            </div>
          </div>

          <div>
            <div className="text-slate-400 text-[11px] mb-1">تمام شده سالن / بیرون‌بر:</div>
            <div className="font-bold text-slate-200 font-mono">
              سالن: {formatToman(currentProduct.totalDineInCost)}
            </div>
            <div className="font-bold text-slate-200 font-mono mt-0.5">
              بیرون‌بر: {formatToman(currentProduct.totalTakeoutCost)}
            </div>
          </div>

          <div className="bg-emerald-950/60 p-3 rounded-xl border border-emerald-500/30">
            <div className="text-emerald-400 text-[11px] font-semibold mb-1">
              قیمت پیشنهادی فروش سالن:
            </div>
            <div className="text-lg font-black text-white font-mono">
              {formatToman(currentProduct.suggestedDineInPrice)}
            </div>
            <div className="text-[10px] text-emerald-300 mt-1">
              نسبت فودکاست: {formatPercent(currentProduct.foodCostPercentDineIn)}
            </div>
          </div>

          <div className="bg-amber-950/60 p-3 rounded-xl border border-amber-500/30">
            <div className="text-amber-400 text-[11px] font-semibold mb-1">
              قیمت پیشنهادی فروش بیرون‌بر:
            </div>
            <div className="text-lg font-black text-white font-mono">
              {formatToman(currentProduct.suggestedTakeoutPrice)}
            </div>
            <div className="text-[10px] text-amber-300 mt-1">
              نسبت فودکاست: {formatPercent(currentProduct.foodCostPercentTakeout)}
            </div>
          </div>
        </div>

        {/* Footer Signature Box for Kitchen Handover */}
        <div className="pt-4 border-t border-slate-200 flex justify-between text-[11px] text-slate-400">
          <div>سامانه رسپی‌بوک و مدیریت بهای تمام شده رستوران</div>
          <div>تأییدیه سرآشپز اجرایی و مدیر مجموعه</div>
        </div>
      </div>
    </div>
  );
}
