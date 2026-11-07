import React, { useState, useMemo } from 'react';
import { Layers, Plus, Edit2, Trash2, ChevronDown, ChevronUp, Sparkles, Scale, Info, Search } from 'lucide-react';
import { formatToman, formatNumber, formatPercent, toPersianDigits, getCategoryBadgeClass } from '../utils.js';

export default function IntermediatesView({
  intermediates = [],
  onAddIntermediate,
  onEditIntermediate,
  onDeleteIntermediate,
  availableCategories = [],
}) {
  const [expandedId, setExpandedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const categories = useMemo(() => {
    const fromItems = intermediates.map((i) => i.category).filter(Boolean);
    const fromAvailable = availableCategories.map((c) => (typeof c === 'string' ? c : c?.name)).filter(Boolean);
    const set = new Set([...fromItems, ...fromAvailable]);
    return ['all', ...Array.from(set)];
  }, [intermediates, availableCategories]);

  const filteredIntermediates = useMemo(() => {
    return intermediates.filter((item) => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        (item.category && item.category.toLowerCase().includes(q)) ||
        (item.batchDescription && item.batchDescription.toLowerCase().includes(q)) ||
        (item.ingredients && item.ingredients.some((ing) => ing.name && ing.name.toLowerCase().includes(q)));
      const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [intermediates, searchTerm, selectedCategory]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-500" />
              <span>کالاهای واسط و مواد نیمه‌آماده (Sub-Recipes)</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              محاسبه خودکار بهای تمام شده اقلام آماده‌سازی شده از ترکیب مواد اولیه خام یا سایر اقلام واسط با محاسبه دقیق افت پخت
            </p>
          </div>

          <button
            onClick={() => onAddIntermediate(selectedCategory !== 'all' ? selectedCategory : undefined)}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>تعریف کالای واسط جدید</span>
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
              placeholder="جستجو در نام کالای واسط یا مواد تشکیل‌دهنده..."
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
                {cat === 'all' ? 'همه دسته‌ها' : cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Intermediates Cards Grid */}
      {filteredIntermediates.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 space-y-2 shadow-xs">
          <Layers className="w-10 h-10 mx-auto text-slate-300" />
          <div className="text-sm font-bold text-slate-700">کالای واسطی با این مشخصات یافت نشد.</div>
          <p className="text-xs text-slate-400">
            برای ایجاد کالای واسط جدید روی دکمه «تعریف کالای واسط جدید» کلیک کنید.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredIntermediates.map((item) => {
            const isExpanded = expandedId === item.id;
            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition overflow-hidden flex flex-col"
              >
                {/* Card Header */}
                <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-base text-slate-900">{item.name}</span>
                      <span className={`px-2 py-0.5 rounded-full border text-[10px] ${getCategoryBadgeClass(item.category)}`}>
                        {item.category}
                      </span>
                    </div>
                    {item.batchDescription && (
                      <p className="text-xs text-slate-500 line-clamp-2">
                        {item.batchDescription}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditIntermediate(item)}
                      title="ویرایش"
                      className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteIntermediate(item.id)}
                      title="حذف"
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Cost Summary Box */}
                <div className="px-5 py-4 bg-slate-50/70 border-b border-slate-100 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="text-slate-400 text-[11px] mb-0.5">مقدار کل بچ:</div>
                    <div className="font-bold text-slate-800 text-sm font-mono">
                      {toPersianDigits(item.yieldQuantity)} {item.yieldUnit}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      هزینه کل بچ: <strong className="text-slate-700">{formatToman(item.totalBatchCost)}</strong>
                    </div>
                  </div>

                  <div className="text-left bg-white p-2.5 rounded-xl border border-slate-200">
                    <div className="text-amber-700 text-[11px] font-semibold mb-0.5">
                      بهای تمام شده هر واحد:
                    </div>
                    <div className="font-black text-slate-900 text-base">
                      {formatToman(item.unitCost)}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                      به ازای هر ۱ {item.yieldUnit}
                    </div>
                  </div>
                </div>

                {/* Ingredients Breakdown */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2">
                      <span>مواد تشکیل‌دهنده این کالای واسط:</span>
                      <span className="text-[11px] text-slate-400 font-normal">
                        {toPersianDigits(item.ingredients?.length || 0)} قلم
                      </span>
                    </div>

                    <div className="space-y-2">
                      {(item.ingredients || []).slice(0, isExpanded ? undefined : 3).map((ing, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-800 font-medium flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                              {ing.name}
                              <span className="text-[10px] text-slate-400 font-mono">
                                ({toPersianDigits(ing.quantity)} {ing.unit})
                              </span>
                            </span>
                            <span className="font-semibold text-slate-700 font-mono text-[11px]">
                              {formatToman(ing.calculatedCost)}{' '}
                              <span className="text-[10px] text-slate-400">({formatPercent(ing.costPercentage)})</span>
                            </span>
                          </div>
                          {/* Progress Bar of Cost Share */}
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                ing.type === 'intermediate' ? 'bg-purple-500' : 'bg-amber-500'
                              }`}
                              style={{ width: `${Math.min(ing.costPercentage || 0, 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {(item.ingredients?.length || 0) > 3 && (
                      <button
                        onClick={() => toggleExpand(item.id)}
                        className="mt-2 text-xs text-amber-600 hover:text-amber-700 font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <span>{isExpanded ? 'بستن لیست کامل' : `نمایش تمام اقلام (${item.ingredients.length})`}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
