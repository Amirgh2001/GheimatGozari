import React, { useState, useEffect, useMemo } from 'react';
import { X, Plus, Trash2, ShoppingBag, Check, Package, Utensils, Percent } from 'lucide-react';
import NumericInput from './NumericInput.jsx';
import { formatToman, toPersianDigits } from '../utils.js';
import { getValidUnitsForMaterial, getValidUnitsForIntermediate, convertUnit } from '../costEngine.js';

export default function EditProductModal({
  product,
  isOpen,
  onClose,
  onSave,
  rawMaterials = [],
  intermediateGoods = [],
  availableUnits = [],
  availableCategories = [],
  globalConversions = [],
}) {
  const safeRawMaterials = Array.isArray(rawMaterials) ? rawMaterials : [];
  const safeIntermediateGoods = Array.isArray(intermediateGoods) ? intermediateGoods : [];
  const safeUnits = Array.isArray(availableUnits) ? availableUnits : [];
  const safeCategories = Array.isArray(availableCategories) ? availableCategories : [];

  const categoryNames = useMemo(() => {
    const list = safeCategories.length > 0
      ? safeCategories.map((c) => (typeof c === 'string' ? c : c?.name)).filter(Boolean)
      : ['سوخاری', 'پاستا', 'برگر و ساندویچ', 'پیتزا', 'پیش‌غذا و سالاد', 'نوشیدنی', 'سایر'];
    const prodCat = typeof product?.category === 'string' ? product.category.trim() : null;
    if (prodCat && !list.includes(prodCat)) {
      list.unshift(prodCat);
    }
    return list.length > 0 ? list : ['سوخاری'];
  }, [safeCategories, product?.category]);

  const unitNames = useMemo(() => {
    const list = safeUnits.length > 0
      ? safeUnits.map((u) => (typeof u === 'string' ? u : u?.name)).filter(Boolean)
      : ['عدد', 'گرم', 'کیلوگرم', 'میلی‌لیتر', 'لیتر', 'پرس', 'بسته'];
    return list.length > 0 ? list : ['عدد'];
  }, [safeUnits]);

  const defaultCategory = categoryNames[0] || 'سوخاری';
  const defaultUnit = unitNames[0] || 'عدد';

  const [formData, setFormData] = useState({
    name: '',
    category: (typeof product?.category === 'string' && product.category.trim()) || defaultCategory,
    description: '',
    instructions: '',
    profitMultiplier: '2.5',
    recipeItems: [],
    dineInPackaging: [],
    takeoutPackaging: [],
  });

  const [newRecipeItem, setNewRecipeItem] = useState({
    type: 'intermediate',
    id: '',
    quantity: '',
    unit: defaultUnit,
  });

  const [newDineInPkg, setNewDineInPkg] = useState({ materialId: '', quantity: '1', unit: 'عدد' });
  const [newTakeoutPkg, setNewTakeoutPkg] = useState({ materialId: '', quantity: '1', unit: 'عدد' });

  // Strictly items belonging to 'پکیجینگ' category
  const packagingMaterials = useMemo(() => {
    return safeRawMaterials.filter((m) => m && (m.category === 'پکیجینگ' || m.category?.trim() === 'پکیجینگ'));
  }, [safeRawMaterials]);

  const validUnitsForNewItem = useMemo(() => {
    if (!newRecipeItem.id) {
      return ['گرم', 'کیلوگرم', 'میلی‌لیتر', 'لیتر', 'عدد'];
    }
    if (newRecipeItem.type === 'raw') {
      const m = safeRawMaterials.find((x) => x && x.id === newRecipeItem.id);
      return m ? getValidUnitsForMaterial(m) : ['گرم', 'کیلوگرم'];
    } else {
      const i = safeIntermediateGoods.find((x) => x && x.id === newRecipeItem.id);
      return i ? getValidUnitsForIntermediate(i) : ['گرم', 'عدد'];
    }
  }, [newRecipeItem.id, newRecipeItem.type, safeRawMaterials, safeIntermediateGoods]);

  useEffect(() => {
    if (product && product.id) {
      // Robust resolution for recipeItems:
      let initialRecipeItems = [];
      if (Array.isArray(product.recipeItems) && product.recipeItems.length > 0) {
        initialRecipeItems = product.recipeItems.map((item) => ({
          type: item.type || (item.intermediateId ? 'intermediate' : 'raw'),
          materialId: item.materialId || (item.type === 'raw' ? item.id : undefined),
          intermediateId: item.intermediateId || (item.type === 'intermediate' ? item.id : undefined),
          quantity: item.quantity,
          unit: item.unit,
        }));
      } else if (Array.isArray(product.recipeBreakdown) && product.recipeBreakdown.length > 0) {
        initialRecipeItems = product.recipeBreakdown.map((item) => ({
          type: item.type || (item.intermediateId ? 'intermediate' : 'raw'),
          materialId: item.type === 'raw' ? (item.materialId || item.id) : undefined,
          intermediateId: item.type === 'intermediate' ? (item.intermediateId || item.id) : undefined,
          quantity: item.quantity,
          unit: item.unit,
        }));
      }

      // Robust resolution for dineInPackaging:
      let initialDineInPkg = [];
      if (Array.isArray(product.dineInPackaging) && product.dineInPackaging.length > 0) {
        initialDineInPkg = product.dineInPackaging.map((pkg) => ({
          materialId: pkg.materialId || pkg.id,
          quantity: pkg.quantity || 1,
          unit: pkg.unit || 'عدد',
        }));
      } else if (Array.isArray(product.dineInPackagingBreakdown) && product.dineInPackagingBreakdown.length > 0) {
        initialDineInPkg = product.dineInPackagingBreakdown.map((pkg) => ({
          materialId: pkg.materialId || pkg.id,
          quantity: pkg.quantity || 1,
          unit: pkg.unit || 'عدد',
        }));
      }

      // Robust resolution for takeoutPackaging:
      let initialTakeoutPkg = [];
      if (Array.isArray(product.takeoutPackaging) && product.takeoutPackaging.length > 0) {
        initialTakeoutPkg = product.takeoutPackaging.map((pkg) => ({
          materialId: pkg.materialId || pkg.id,
          quantity: pkg.quantity || 1,
          unit: pkg.unit || 'عدد',
        }));
      } else if (Array.isArray(product.takeoutPackagingBreakdown) && product.takeoutPackagingBreakdown.length > 0) {
        initialTakeoutPkg = product.takeoutPackagingBreakdown.map((pkg) => ({
          materialId: pkg.materialId || pkg.id,
          quantity: pkg.quantity || 1,
          unit: pkg.unit || 'عدد',
        }));
      }

      setFormData({
        name: product.name || '',
        category: (typeof product.category === 'string' && product.category.trim()) || defaultCategory,
        description: product.description || '',
        instructions: product.instructions || '',
        profitMultiplier: product.profitMultiplier !== undefined ? String(product.profitMultiplier) : '2.5',
        recipeItems: initialRecipeItems,
        dineInPackaging: initialDineInPkg,
        takeoutPackaging: initialTakeoutPkg,
      });
    } else {
      setFormData({
        name: '',
        category: (typeof product?.category === 'string' && product.category.trim()) || defaultCategory,
        description: '',
        instructions: '',
        profitMultiplier: '2.5',
        recipeItems: [],
        dineInPackaging: [],
        takeoutPackaging: [],
      });
    }
  }, [product, isOpen, defaultCategory]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAddRecipeItem = () => {
    if (!newRecipeItem.id || !newRecipeItem.quantity || Number(newRecipeItem.quantity) <= 0 || !newRecipeItem.unit) {
      return;
    }
    const entry = {
      type: newRecipeItem.type,
      materialId: newRecipeItem.type === 'raw' ? newRecipeItem.id : undefined,
      intermediateId: newRecipeItem.type === 'intermediate' ? newRecipeItem.id : undefined,
      quantity: Number(newRecipeItem.quantity),
      unit: newRecipeItem.unit.trim(),
    };
    setFormData({
      ...formData,
      recipeItems: [...formData.recipeItems, entry],
    });
    setNewRecipeItem({
      type: 'intermediate',
      id: '',
      quantity: '',
      unit: defaultUnit,
    });
  };

  const handleRemoveRecipeItem = (index) => {
    const list = [...formData.recipeItems];
    list.splice(index, 1);
    setFormData({ ...formData, recipeItems: list });
  };

  const handleAddDineInPkg = () => {
    if (!newDineInPkg.materialId) return;
    setFormData({
      ...formData,
      dineInPackaging: [
        ...formData.dineInPackaging,
        {
          materialId: newDineInPkg.materialId,
          quantity: Number(newDineInPkg.quantity) || 1,
          unit: newDineInPkg.unit,
        },
      ],
    });
    setNewDineInPkg({ materialId: '', quantity: '1', unit: 'عدد' });
  };

  const handleRemoveDineInPkg = (index) => {
    const list = [...formData.dineInPackaging];
    list.splice(index, 1);
    setFormData({ ...formData, dineInPackaging: list });
  };

  const handleAddTakeoutPkg = () => {
    if (!newTakeoutPkg.materialId) return;
    setFormData({
      ...formData,
      takeoutPackaging: [
        ...formData.takeoutPackaging,
        {
          materialId: newTakeoutPkg.materialId,
          quantity: Number(newTakeoutPkg.quantity) || 1,
          unit: newTakeoutPkg.unit,
        },
      ],
    });
    setNewTakeoutPkg({ materialId: '', quantity: '1', unit: 'عدد' });
  };

  const handleRemoveTakeoutPkg = (index) => {
    const list = [...formData.takeoutPackaging];
    list.splice(index, 1);
    setFormData({ ...formData, takeoutPackaging: list });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.recipeItems.length === 0) {
      alert('حداقل یک قلم تشکیل‌دهنده (کالای واسط یا ماده اولیه) برای رسپی محصول اضافه کنید.');
      return;
    }

    onSave({
      ...formData,
      profitMultiplier: Number(formData.profitMultiplier) || 2.5,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs p-3 sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="min-h-full flex items-start justify-center"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-4 sm:my-8"
          onClick={(e) => e.stopPropagation()}
        >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-amber-400" />
            <h2 className="font-bold text-base">
              {product && product.id ? 'ویرایش محصول نهایی منو' : 'تعریف محصول نهایی منو و پکیجینگ'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition p-1 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Main Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                نام محصول نهایی منو *
              </label>
              <input
                type="text"
                required
                placeholder="مثال: باکس فیله سوخاری ۳ تکه، پاستا آلفردو"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                دسته‌بندی منو *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white cursor-pointer font-semibold"
              >
                {categoryNames.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Profit Multiplier Card */}
          <div className="bg-purple-50/70 border border-purple-200/80 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <label className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                <Percent className="w-4 h-4 text-purple-600" />
                <span>ضریب سود مدیریت (Markup) *</span>
              </label>
              <p className="text-[11px] text-purple-700">
                قیمت پیشنهادی فروش سالن و بیرون‌بر = بهای مواد اولیه تشکیل‌دهنده × این ضریب + بهای پکیجینگ اختصاصی
              </p>
            </div>
            <div className="w-full sm:w-44">
              <NumericInput
                required
                placeholder="تایپ ضریب (مثلاً ۲.۵)"
                value={formData.profitMultiplier}
                onChange={(val) => setFormData({ ...formData, profitMultiplier: val })}
                className="w-full bg-white border border-purple-300 rounded-xl px-3 py-2 text-sm text-purple-900 font-bold focus:outline-none focus:ring-2 focus:ring-purple-500 text-center"
              />
            </div>
          </div>

          {/* Recipe Items Section */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Utensils className="w-4 h-4 text-amber-500" />
                <span>رسپی اصلی غذا (اقلام واسط و مواد اولیه تشکیل‌دهنده)</span>
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                {toPersianDigits(formData.recipeItems.length)} قلم
              </span>
            </div>

            {/* List */}
            {(formData.recipeItems || []).length > 0 && (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {(formData.recipeItems || []).map((item, idx) => {
                  const isInter = item.type === 'intermediate';
                  const entity = isInter
                    ? safeIntermediateGoods.find((i) => i && i.id === item.intermediateId)
                    : safeRawMaterials.find((m) => m && m.id === item.materialId);

                  const matchedOu = isInter && entity?.outputUnits
                    ? entity.outputUnits.find((ou) => ou && ou.name && ou.name.trim() === item.unit?.trim())
                    : null;

                  let matchedWeight = null;
                  if (isInter && entity) {
                    const conv = convertUnit(Number(item.quantity), item.unit, entity.yieldUnit || 'گرم', entity.customConversions || [], globalConversions);
                    if (conv > 0 && item.unit !== entity.yieldUnit) {
                      matchedWeight = conv;
                    } else if (matchedOu) {
                      matchedWeight = Number(item.quantity) * Number(matchedOu.amount || 1);
                    }
                  }

                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-slate-200 text-xs"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            isInter ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {isInter ? 'کالای واسط' : 'ماده خام'}
                        </span>
                        <strong className="text-slate-800">{entity ? entity.name : 'قلم حذف شده'}</strong>
                        <span className="text-slate-600 font-mono font-bold">
                          ({toPersianDigits(item.quantity)} {item.unit})
                        </span>
                        {matchedWeight !== null && (
                          <span className="text-[11px] text-amber-800 font-medium bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-mono">
                            معادل {toPersianDigits(matchedWeight)} {entity?.yieldUnit || 'گرم'}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveRecipeItem(idx)}
                        className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add Recipe Item Row */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200">
              <select
                value={newRecipeItem.type}
                onChange={(e) =>
                  setNewRecipeItem({
                    ...newRecipeItem,
                    type: e.target.value,
                    id: '',
                    unit: defaultUnit,
                  })
                }
                className="bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-slate-800 font-semibold"
              >
                <option value="intermediate">کالای واسط</option>
                <option value="raw">ماده اولیه خام</option>
              </select>

              <select
                value={newRecipeItem.id}
                onChange={(e) => {
                  const id = e.target.value;
                  let defUnit = 'گرم';
                  if (newRecipeItem.type === 'intermediate') {
                    const i = safeIntermediateGoods.find((x) => x && x.id === id);
                    if (i) {
                      const units = getValidUnitsForIntermediate(i);
                      if (i.outputUnits && i.outputUnits.length > 0 && i.outputUnits[0]?.name) {
                        defUnit = i.outputUnits[0].name.trim();
                      } else {
                        defUnit = units.includes('گرم') ? 'گرم' : units[0] || i.yieldUnit;
                      }
                    }
                  } else {
                    const m = safeRawMaterials.find((x) => x && x.id === id);
                    if (m) {
                      const units = getValidUnitsForMaterial(m);
                      defUnit = units.includes('گرم') ? 'گرم' : units[0] || m.purchaseUnit;
                    }
                  }
                  setNewRecipeItem({ ...newRecipeItem, id, unit: defUnit });
                }}
                className="flex-1 min-w-[160px] bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
              >
                <option value="">-- انتخاب قلم رسپی --</option>
                {newRecipeItem.type === 'intermediate'
                  ? safeIntermediateGoods.map((i) =>
                      i ? (
                        <option key={i.id} value={i.id}>
                          {i.name} (واحد خروجی: {i.yieldUnit || defaultUnit}{i.outputUnits && i.outputUnits.length > 0 ? ` | ${i.outputUnits.map(ou => ou.name).join('، ')}` : ''})
                        </option>
                      ) : null
                    )
                  : safeRawMaterials.map((m) =>
                      m ? (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.purchaseUnit || defaultUnit})
                        </option>
                      ) : null
                    )}
              </select>

              <NumericInput
                placeholder="مقدار تایپی"
                value={newRecipeItem.quantity}
                onChange={(val) => setNewRecipeItem({ ...newRecipeItem, quantity: val })}
                className="w-24 bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-slate-800 font-mono text-center"
              />

              <select
                value={newRecipeItem.unit}
                onChange={(e) => setNewRecipeItem({ ...newRecipeItem, unit: e.target.value })}
                className="w-32 bg-white border border-amber-300 rounded-lg px-2 py-1.5 text-xs text-slate-900 font-bold cursor-pointer"
              >
                {validUnitsForNewItem.map((u) => {
                  let label = u;
                  if (newRecipeItem.type === 'intermediate') {
                    const inter = safeIntermediateGoods.find((x) => x && x.id === newRecipeItem.id);
                    const ou = inter?.outputUnits?.find((o) => o && o.name && o.name.trim() === u.trim());
                    if (ou || inter) {
                      const conv = convertUnit(1, u, inter?.yieldUnit || 'گرم', inter?.customConversions || [], globalConversions);
                      if (conv > 0 && u !== inter?.yieldUnit) {
                        label = `${u} (${toPersianDigits(conv)} ${inter?.yieldUnit || 'گرم'})`;
                      } else if (ou) {
                        label = `${u} (${toPersianDigits(ou.amount)} ${ou.unit || inter?.yieldUnit || 'گرم'})`;
                      }
                    }
                  }
                  return (
                    <option key={u} value={u}>
                      {label}
                    </option>
                  );
                })}
              </select>

              <button
                type="button"
                onClick={handleAddRecipeItem}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>افزودن به رسپی</span>
              </button>
            </div>
          </div>

          {/* Dine-in vs Takeout Packaging */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Dine-in Packaging */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span>پکیجینگ و مصرفی سالن (Dine-in)</span>
                <span className="text-[10px] text-slate-500 font-normal">کاغذ سینی، دستمال...</span>
              </div>

              {(formData.dineInPackaging || []).map((pkg, idx) => {
                const mat = safeRawMaterials.find((m) => m && m.id === pkg.materialId);
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs"
                  >
                    <span>{mat ? mat.name : 'قلم پکیجینگ'} ({toPersianDigits(pkg.quantity)} {pkg.unit})</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveDineInPkg(idx)}
                      className="text-red-500 hover:text-red-700 p-0.5 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}

              <div className="flex items-center gap-1.5 pt-1">
                <select
                  value={newDineInPkg.materialId}
                  onChange={(e) => setNewDineInPkg({ ...newDineInPkg, materialId: e.target.value })}
                  className="flex-1 bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs"
                >
                  <option value="">انتخاب پکیجینگ سالن...</option>
                  {packagingMaterials.length === 0 ? (
                    <option value="" disabled>ماده اولیه‌ای با دسته‌بندی «پکیجینگ» تعریف نشده است</option>
                  ) : (
                    packagingMaterials.map((m) =>
                      m ? (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ) : null
                    )
                  )}
                </select>
                <NumericInput
                  placeholder="تعداد"
                  value={newDineInPkg.quantity}
                  onChange={(val) => setNewDineInPkg({ ...newDineInPkg, quantity: val })}
                  className="w-16 bg-white border border-slate-300 rounded-lg px-1.5 py-1 text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddDineInPkg}
                  className="bg-slate-800 hover:bg-slate-700 text-white text-xs px-2 py-1 rounded-lg cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            {/* Takeout Packaging */}
            <div className="bg-indigo-50/50 p-3.5 rounded-xl border border-indigo-200/60 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-indigo-950">
                <span>پکیجینگ کامل بیرون‌بر (Takeout)</span>
                <span className="text-[10px] text-indigo-600 font-normal">جعبه، ساک، پک قاشق...</span>
              </div>

              {(formData.takeoutPackaging || []).map((pkg, idx) => {
                const mat = safeRawMaterials.find((m) => m && m.id === pkg.materialId);
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-indigo-200 text-xs"
                  >
                    <span>{mat ? mat.name : 'قلم پکیجینگ'} ({toPersianDigits(pkg.quantity)} {pkg.unit})</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTakeoutPkg(idx)}
                      className="text-red-500 hover:text-red-700 p-0.5 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}

              <div className="flex items-center gap-1.5 pt-1">
                <select
                  value={newTakeoutPkg.materialId}
                  onChange={(e) => setNewTakeoutPkg({ ...newTakeoutPkg, materialId: e.target.value })}
                  className="flex-1 bg-white border border-indigo-300 rounded-lg px-2 py-1 text-xs"
                >
                  <option value="">انتخاب پکیجینگ بیرون‌بر...</option>
                  {packagingMaterials.length === 0 ? (
                    <option value="" disabled>ماده اولیه‌ای با دسته‌بندی «پکیجینگ» تعریف نشده است</option>
                  ) : (
                    packagingMaterials.map((m) =>
                      m ? (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ) : null
                    )
                  )}
                </select>
                <NumericInput
                  placeholder="تعداد"
                  value={newTakeoutPkg.quantity}
                  onChange={(val) => setNewTakeoutPkg({ ...newTakeoutPkg, quantity: val })}
                  className="w-16 bg-white border border-indigo-300 rounded-lg px-1.5 py-1 text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddTakeoutPkg}
                  className="bg-indigo-700 hover:bg-indigo-600 text-white text-xs px-2 py-1 rounded-lg cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              دستورالعمل طبخ و نحوه سرو سرآشپز
            </label>
            <textarea
              rows="2"
              placeholder="مراحل سرخ کردن، دمای فر، زمان آماده‌سازی، گارنیش و نحوه بسته‌بندی..."
              value={formData.instructions}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2 rounded-xl text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>ذخیره محصول منو</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
);
}
