import React, { useState, useMemo } from 'react';
import {
  ShoppingBag,
  Plus,
  Edit2,
  Trash2,
  BookOpen,
  TrendingUp,
  Percent,
  Layers,
  UtensilsCrossed,
  Package,
  Search,
} from 'lucide-react';
import NumericInput from './NumericInput.jsx';
import { formatToman, formatPercent, toPersianDigits, getCategoryBadgeClass } from '../utils.js';

export default function FinalProductsView({
  products = [],
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onOpenRecipeBook,
  onUpdateMultiplier,
  availableCategories = [],
}) {
  const [editingMultiplierId, setEditingMultiplierId] = useState(null);
  const [tempMultiplier, setTempMultiplier] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const handleStartEditMultiplier = (prod) => {
    setEditingMultiplierId(prod.id);
    setTempMultiplier(String(prod.profitMultiplier || 2.5));
  };

  const handleSaveMultiplier = async (id) => {
    const val = Number(tempMultiplier);
    if (val > 0 && onUpdateMultiplier) {
      await onUpdateMultiplier(id, val);
    }
    setEditingMultiplierId(null);
  };

  const categories = useMemo(() => {
    const fromProds = products.map((p) => p.category).filter(Boolean);
    const fromAvailable = availableCategories.map((c) => (typeof c === 'string' ? c : c?.name)).filter(Boolean);
    const set = new Set([...fromProds, ...fromAvailable]);
    return ['all', ...Array.from(set)];
  }, [products, availableCategories]);

  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        prod.name.toLowerCase().includes(q) ||
        (prod.category && prod.category.toLowerCase().includes(q)) ||
        (prod.description && prod.description.toLowerCase().includes(q)) ||
        (prod.recipeBreakdown && prod.recipeBreakdown.some((item) => item.name && item.name.toLowerCase().includes(q)));
      const matchesCat = selectedCategory === 'all' || prod.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [products, searchTerm, selectedCategory]);

  return (
    <div className="space-y-6">
      {/* Top Header & Search Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-amber-500" />
              <span>محصولات نهایی منو و قیمت‌گذاری سالن / بیرون‌بر</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              محاسبه خودکار بهای مواد اولیه، تفکیک دقیق هزینه‌های پکیجینگ سالن و بیرون‌بر و قیمت پیشنهادی فروش بر اساس ضریب سود
            </p>
          </div>

          <button
            onClick={() => onAddProduct(selectedCategory !== 'all' ? selectedCategory : undefined)}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>افزودن محصول جدید منو</span>
          </button>
        </div>

        {/* Search & Category Filter Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2 border-t border-slate-100">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="جستجو در نام محصول، دسته، یا اقلام رسپی..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pr-9 pl-3 py-2 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat === 'all' ? 'همه منو' : cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Product Cards Grid */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 space-y-3 shadow-xs">
          <ShoppingBag className="w-12 h-12 mx-auto text-amber-500/30" />
          <div className="text-sm font-bold text-slate-700">محصولی با این مشخصات یافت نشد.</div>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            برای ثبت اولین محصول منو با قابلیت محاسبه خودکار بهای مواد اولیه و پکیجینگ، روی دکمه «افزودن محصول جدید منو» در بالا کلیک کنید.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredProducts.map((prod) => (
            <div
              key={prod.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-3 bg-linear-to-b from-slate-50/50 to-transparent">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="font-extrabold text-base text-slate-900">{prod.name}</h2>
                    <span className={`px-2 py-0.5 rounded-full border text-[10px] ${getCategoryBadgeClass(prod.category)}`}>
                      {prod.category}
                    </span>
                  </div>
                  {prod.description && (
                    <div className="text-xs text-slate-400">
                      {prod.description}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onOpenRecipeBook(prod.id)}
                    title="مشاهده کارت رسپی"
                    className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer flex items-center gap-1 text-xs font-bold"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span className="hidden sm:inline">رسپی</span>
                  </button>
                  <button
                    onClick={() => onEditProduct(prod)}
                    title="ویرایش"
                    className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteProduct(prod.id)}
                    title="حذف"
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Food Cost & Multiplier Bar */}
              <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">بهای صرفاً مواد اولیه (Food Cost):</span>
                  <span className="font-extrabold text-slate-900 text-sm font-mono">
                    {formatToman(prod.foodCost)}
                  </span>
                </div>

                {/* Profit Multiplier badge with quick edit */}
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 text-[11px]">ضریب سود:</span>
                  {editingMultiplierId === prod.id ? (
                    <div className="flex items-center gap-1">
                      <NumericInput
                        placeholder="ضریب"
                        value={tempMultiplier}
                        onChange={(val) => setTempMultiplier(val)}
                        className="w-16 bg-white border border-purple-400 rounded-md px-1.5 py-0.5 text-xs text-center font-bold"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveMultiplier(prod.id)}
                        className="bg-purple-600 text-white text-[10px] px-2 py-1 rounded cursor-pointer"
                      >
                        تایید
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleStartEditMultiplier(prod)}
                      title="کلیک برای تغییر سریع ضریب سود"
                      className="px-2 py-0.5 rounded-lg bg-purple-50 text-purple-700 font-bold border border-purple-200 text-xs font-mono hover:bg-purple-100 transition cursor-pointer"
                    >
                      {toPersianDigits(prod.profitMultiplier)}×
                    </button>
                  )}
                </div>
              </div>

              {/* Price Cards Comparison: Dine-in vs Takeout */}
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
                {/* Dine-In Card */}
                <div className="bg-emerald-50/40 rounded-xl p-4 border border-emerald-200/80 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span>سرو در سالن رستوران</span>
                      </span>
                      <span className="text-[11px] text-emerald-700 font-mono">
                        فودکاست: {formatPercent(prod.foodCostPercentDineIn)}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs text-slate-600 mb-3">
                      <div className="flex justify-between">
                        <span>پکیجینگ و مصرفی سالن:</span>
                        <strong className="text-slate-800">{formatToman(prod.dineInPackagingCost)}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>بهای تمام شده کل سالن:</span>
                        <strong className="text-slate-800">{formatToman(prod.totalDineInCost)}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-emerald-200/80">
                    <div className="text-[11px] text-emerald-800 font-medium">
                      قیمت پیشنهادی فروش سالن:
                    </div>
                    <div className="text-lg font-black text-emerald-700">
                      {formatToman(prod.suggestedDineInPrice)}
                    </div>
                  </div>
                </div>

                {/* Takeout Card */}
                <div className="bg-amber-50/40 rounded-xl p-4 border border-amber-200/80 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        <span>سفارش بیرون‌بر و دلیوری</span>
                      </span>
                      <span className="text-[11px] text-amber-800 font-mono">
                        فودکاست: {formatPercent(prod.foodCostPercentTakeout)}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs text-slate-600 mb-3">
                      <div className="flex justify-between">
                        <span>پکیجینگ کامل بیرون‌بر:</span>
                        <strong className="text-slate-800 font-bold text-indigo-700">
                          {formatToman(prod.takeoutPackagingCost)}
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span>بهای تمام شده کل بیرون‌بر:</span>
                        <strong className="text-slate-800">{formatToman(prod.totalTakeoutCost)}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-amber-200/80">
                    <div className="text-[11px] text-amber-900 font-medium">
                      قیمت پیشنهادی فروش بیرون‌بر:
                    </div>
                    <div className="text-lg font-black text-amber-950">
                      {formatToman(prod.suggestedTakeoutPrice)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Recipe summary pill footer */}
              <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                <span className="font-semibold text-slate-700">اقلام تشکیل‌دهنده:</span>
                {(prod.recipeBreakdown || []).map((item, i) => (
                  <span
                    key={i}
                    className="bg-white px-2 py-0.5 rounded-md border border-slate-200 font-mono text-slate-700"
                  >
                    {item.name} ({toPersianDigits(item.quantity)} {item.unit})
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
