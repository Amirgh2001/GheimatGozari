import React, { useState, useMemo } from 'react';
import {
  Wheat,
  Search,
  Plus,
  Edit2,
  Trash2,
  Scale,
  Percent,
  CheckCircle2,
  AlertCircle,
  ArrowUpDown,
} from 'lucide-react';
import { formatToman, formatNumber, formatPercent, toPersianDigits, getCategoryBadgeClass } from '../utils.js';

export default function RawMaterialsView({
  materials = [],
  onAddMaterial,
  onEditMaterial,
  onDeleteMaterial,
  availableCategories = [],
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = useMemo(() => {
    const fromMaterials = materials.map((m) => m.category).filter(Boolean);
    const fromAvailable = availableCategories.map((c) => (typeof c === 'string' ? c : c.name)).filter(Boolean);
    const set = new Set([...fromMaterials, ...fromAvailable]);
    return ['all', ...Array.from(set)];
  }, [materials, availableCategories]);

  // Clean, uncluttered effective price renderer
  const renderEffectivePrice = (mat) => {
    const pUnit = mat.purchaseUnit;

    // 1. Volume items (Oil, Beverage, Milk, etc.)
    if (mat.scale === 'volume' || mat.category === 'روغن و چربی' || mat.category === 'نوشیدنی' || pUnit === 'لیتر' || pUnit === 'میلی‌لیتر') {
      if (mat.pricePerLiter) {
        if (pUnit === 'لیتر') {
          return (
            <div className="font-bold text-slate-900 font-mono">
              {formatNumber(mat.pricePerMl)} تومان <span className="text-[10px] text-slate-500 font-normal">/ میلی‌لیتر</span>
            </div>
          );
        }
        return (
          <div className="space-y-0.5">
            <div className="font-bold text-slate-900 font-mono">
              {formatToman(mat.pricePerLiter)} <span className="text-[10px] text-slate-500 font-normal">/ لیتر</span>
            </div>
            {mat.pricePerPiece ? (
              <div className="text-[11px] text-amber-800 font-mono font-medium">
                {formatToman(mat.pricePerPiece)} <span className="text-slate-400 font-normal">/ بطری</span>
              </div>
            ) : null}
          </div>
        );
      }
    }

    // 2. Count items (Eggs, Packaging, Portions)
    if (mat.scale === 'count' || mat.category === 'پکیجینگ' || pUnit === 'عدد') {
      if (pUnit === 'عدد') {
        return <span className="text-slate-400 text-xs">— مستقیم —</span>;
      }
      if (mat.pricePerPiece) {
        return (
          <div className="font-bold text-slate-900 font-mono">
            {formatToman(mat.pricePerPiece)} <span className="text-[10px] text-slate-500 font-normal">/ عدد</span>
          </div>
        );
      }
    }

    // 3. Weight items (Meat, Chicken, Flour, Spices, Vegetables)
    // If purchased directly in kg: show per-gram price (avoid repeating kg price from purchase column)
    if (pUnit === 'کیلوگرم') {
      if (mat.pricePerGram) {
        return (
          <div className="font-bold text-slate-900 font-mono">
            {formatNumber(mat.pricePerGram)} تومان <span className="text-[10px] text-slate-500 font-normal">/ گرم</span>
          </div>
        );
      }
      return <span className="text-slate-400 text-xs">— مستقیم —</span>;
    }

    // If purchased in bulk/container (کیسه بزرگ, کارتن مرغ, بسته, دسته, قالب, سطل)
    if (mat.pricePerKg && pUnit !== 'کیلوگرم') {
      return (
        <div className="space-y-0.5">
          <div className="font-bold text-slate-900 font-mono">
            {formatToman(mat.pricePerKg)} <span className="text-[10px] text-slate-500 font-normal">/ کیلو</span>
          </div>
          {mat.pricePerGram ? (
            <div className="text-[10px] text-slate-400 font-mono">
              {formatNumber(mat.pricePerGram)} تومان / گرم
            </div>
          ) : null}
        </div>
      );
    }

    if (pUnit === 'گرم' && mat.pricePerKg) {
      return (
        <div className="font-bold text-slate-900 font-mono">
          {formatToman(mat.pricePerKg)} <span className="text-[10px] text-slate-500 font-normal">/ کیلو</span>
        </div>
      );
    }

    if (mat.pricePerGram) {
      return (
        <div className="font-bold text-slate-900 font-mono">
          {formatNumber(mat.pricePerGram)} تومان <span className="text-[10px] text-slate-500 font-normal">/ گرم</span>
        </div>
      );
    }

    if (mat.pricePerPiece) {
      return (
        <div className="font-bold text-slate-900 font-mono">
          {formatToman(mat.pricePerPiece)} <span className="text-[10px] text-slate-500 font-normal">/ عدد</span>
        </div>
      );
    }

    return <span className="text-slate-400 text-xs">— مستقیم —</span>;
  };

  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      const matchesSearch =
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.notes && m.notes.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategory === 'all' || m.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [materials, searchTerm, selectedCategory]);

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Wheat className="w-5 h-5 text-amber-500" />
              <span>مدیریت مواد اولیه و نرخ‌های خرید</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              تعریف نرخ خرید مواد اولیه بر اساس واحد دلخواه تأمین‌کننده (کیسه، حلب، بسته یا کیلوگرم) با تبدیل خودکار
            </p>
          </div>

          <button
            onClick={() => onAddMaterial(selectedCategory !== 'all' ? selectedCategory : undefined)}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>افزودن ماده اولیه جدید</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2 border-t border-slate-100">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="جستجو در نام ماده اولیه یا یادداشت‌ها..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pr-9 pl-3 py-2 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
            />
          </div>

          {/* Category Pills */}
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
                {cat === 'all' ? 'همه اقلام' : cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Materials Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">ماده اولیه</th>
                <th className="py-3 px-3">واحد و قیمت خرید</th>
                <th className="py-3 px-3">تبدیل واحد اختصاصی</th>
                <th className="py-3 px-3">قیمت موثر پایه</th>
                <th className="py-3 px-3 text-center">افت / دورریز</th>
                <th className="py-3 px-4 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMaterials.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">
                    ماده اولیه‌ای با این مشخصات یافت نشد.
                  </td>
                </tr>
              ) : (
                filteredMaterials.map((mat) => (
                  <tr key={mat.id} className="hover:bg-slate-50/70 transition">
                    {/* Name & Category */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{mat.name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded-full border text-[10px] ${getCategoryBadgeClass(mat.category)}`}>
                          {mat.category}
                        </span>
                        {mat.notes && (
                          <span className="text-[11px] text-slate-400 line-clamp-1">
                            {mat.notes}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Purchase unit & price */}
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-slate-800">
                        {formatToman(mat.purchasePrice)}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        هر {mat.purchaseUnit}
                      </div>
                    </td>

                    {/* Custom conversions */}
                    <td className="py-3.5 px-3">
                      {mat.customConversions && mat.customConversions.length > 0 ? (
                        <div className="space-y-1">
                          {mat.customConversions.map((conv, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-mono"
                            >
                              <span>۱ {conv.fromUnit} = {conv.factor} {conv.toUnit}</span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">— مستقیم —</span>
                      )}
                    </td>

                    {/* Effective unit prices */}
                    <td className="py-3.5 px-3">
                      {renderEffectivePrice(mat)}
                    </td>

                    {/* Wastage */}
                    <td className="py-3.5 px-3 text-center">
                      {mat.wastagePercentage > 0 ? (
                        <span className="inline-block px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 font-bold text-xs border border-orange-200 font-mono">
                          {formatPercent(mat.wastagePercentage)}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">۰٪</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onEditMaterial(mat)}
                          title="ویرایش"
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteMaterial(mat.id)}
                          title="حذف"
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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
