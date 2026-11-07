import React, { useState, useEffect, useMemo } from 'react';
import { X, Plus, Trash2, Layers, Check, Info, Flame, Scale, Sparkles, PieChart } from 'lucide-react';
import NumericInput from './NumericInput.jsx';
import { formatToman, toPersianDigits, formatNumber } from '../utils.js';
import {
  calculateBatchYield,
  getValidUnitsForMaterial,
  getValidUnitsForIntermediate,
  convertUnit,
  calculateMaterialUsageCost,
} from '../costEngine.js';

export default function EditIntermediateModal({
  intermediate,
  isOpen,
  onClose,
  onSave,
  rawMaterials = [],
  allIntermediates = [],
  availableUnits = [],
  availableCategories = [],
  globalConversions = [],
}) {
  const safeRawMaterials = Array.isArray(rawMaterials) ? rawMaterials : [];
  const safeAllIntermediates = Array.isArray(allIntermediates) ? allIntermediates : [];
  const safeCategories = Array.isArray(availableCategories) ? availableCategories : [];

  const categoryNames = useMemo(() => {
    const list = safeCategories.length > 0
      ? safeCategories.map((c) => (typeof c === 'string' ? c : c?.name)).filter(Boolean)
      : ['نیمه‌آماده گوشتی', 'نیمه‌آماده صیفی', 'سس و چاشنی نیمه‌آماده', 'سایر'];
    if (intermediate?.category && !list.includes(intermediate.category)) {
      list.unshift(intermediate.category);
    }
    return list.length > 0 ? list : ['نیمه‌آماده گوشتی'];
  }, [safeCategories, intermediate?.category]);

  const defaultCategory = categoryNames[0] || 'نیمه‌آماده گوشتی';

  const [formData, setFormData] = useState({
    name: '',
    category: defaultCategory,
    batchDescription: '',
    cookingLossPercentage: '0',
    ingredients: [],
    outputUnits: [],
  });

  const [newItem, setNewItem] = useState({
    type: 'raw',
    id: '',
    quantity: '',
    unit: 'گرم',
  });

  const [newOutputUnit, setNewOutputUnit] = useState({
    name: '',
    amount: '',
    unit: 'گرم',
  });

  const availableIntermediates = useMemo(() => {
    return safeAllIntermediates.filter((i) => i && (!intermediate || i.id !== intermediate.id));
  }, [safeAllIntermediates, intermediate]);

  // Lookup maps for fast calculation
  const materialsMap = useMemo(() => {
    return new Map(safeRawMaterials.map((m) => [m.id, m]));
  }, [safeRawMaterials]);

  const intermediatesMap = useMemo(() => {
    return new Map(safeAllIntermediates.map((i) => [i.id, i]));
  }, [safeAllIntermediates]);

  // Selected item object for new ingredient row
  const selectedEntity = useMemo(() => {
    if (!newItem.id) return null;
    if (newItem.type === 'raw') {
      return materialsMap.get(newItem.id) || null;
    } else {
      return intermediatesMap.get(newItem.id) || null;
    }
  }, [newItem.id, newItem.type, materialsMap, intermediatesMap]);

  // Dynamically calculate valid units for the selected ingredient
  const validUnitsForNewItem = useMemo(() => {
    if (!selectedEntity) {
      return ['گرم', 'کیلوگرم', 'میلی‌لیتر', 'لیتر', 'عدد'];
    }
    if (newItem.type === 'raw') {
      return getValidUnitsForMaterial(selectedEntity, globalConversions);
    } else {
      return getValidUnitsForIntermediate(selectedEntity);
    }
  }, [selectedEntity, newItem.type, globalConversions]);

  // Calculate live batch yield & cost
  const batchCalculation = useMemo(() => {
    const computed = calculateBatchYield(
      formData.ingredients,
      formData.cookingLossPercentage,
      materialsMap,
      intermediatesMap,
      globalConversions
    );

    // Calculate approximate total food cost of the batch
    let totalBatchCost = 0;
    const ingredientsWithCost = (formData.ingredients || []).map((ing) => {
      let cost = 0;
      let weightInG = 0;

      if (ing.type === 'raw' || ing.materialId) {
        const mat = materialsMap.get(ing.materialId || ing.id);
        if (mat) {
          const usage = calculateMaterialUsageCost(mat, ing.quantity, ing.unit, globalConversions);
          cost = usage.cost;
          weightInG = convertUnit(ing.quantity, ing.unit, 'گرم', mat.customConversions || [], globalConversions);
        }
      } else {
        const child = intermediatesMap.get(ing.intermediateId || ing.id);
        if (child) {
          const qtyInYield = convertUnit(ing.quantity, ing.unit, child.yieldUnit || 'گرم', child.customConversions || [], globalConversions);
          cost = Math.round(qtyInYield * (child.unitCost || 0));
          weightInG = convertUnit(ing.quantity, ing.unit, 'گرم', child.customConversions || [], globalConversions);
        }
      }

      totalBatchCost += cost;
      return {
        ...ing,
        calculatedCost: cost,
        weightInG: Math.round(weightInG * 10) / 10,
      };
    });

    const yieldQty = computed.yieldQuantity || 1;
    const unitCost = yieldQty > 0 ? Math.round(totalBatchCost / yieldQty) : totalBatchCost;

    // Calculate metrics for each output unit (portions)
    const calculatedOutputUnits = (formData.outputUnits || []).map((ou) => {
      const portionAmount = Number(ou.amount || ou.weight) || 1;
      const countPerBatch = portionAmount > 0 && yieldQty > 0 ? Number((yieldQty / portionAmount).toFixed(2)) : 0;
      const costPerPortion = Math.round(portionAmount * unitCost);
      return {
        ...ou,
        amount: portionAmount,
        unit: ou.unit || computed.yieldUnit || 'گرم',
        countPerBatch,
        costPerPortion,
      };
    });

    return {
      rawTotal: computed.rawTotal,
      yieldQuantity: yieldQty,
      yieldUnit: computed.yieldUnit,
      scale: computed.scale,
      totalBatchCost,
      unitCost,
      ingredientsWithCost,
      calculatedOutputUnits,
    };
  }, [formData.ingredients, formData.cookingLossPercentage, formData.outputUnits, materialsMap, intermediatesMap, globalConversions]);

  // Sync state on intermediate prop change
  useEffect(() => {
    if (intermediate && intermediate.id) {
      setFormData({
        name: intermediate.name || '',
        category: intermediate.category || defaultCategory,
        batchDescription: intermediate.batchDescription || '',
        cookingLossPercentage: intermediate.cookingLossPercentage !== undefined ? String(intermediate.cookingLossPercentage) : '0',
        ingredients: intermediate.ingredients
          ? intermediate.ingredients.map((ing) => ({
              type: ing.type || (ing.materialId ? 'raw' : 'intermediate'),
              materialId: ing.materialId || (ing.type === 'raw' ? ing.id : undefined),
              intermediateId: ing.intermediateId || (ing.type === 'intermediate' ? ing.id : undefined),
              quantity: ing.quantity,
              unit: ing.unit,
            }))
          : [],
        outputUnits: Array.isArray(intermediate.outputUnits)
          ? intermediate.outputUnits.map((ou) => ({
              id: ou.id || `out-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              name: ou.name || '',
              amount: ou.amount !== undefined ? ou.amount : ou.weight || '',
              unit: ou.unit || intermediate.yieldUnit || 'گرم',
            }))
          : [],
      });
    } else {
      setFormData({
        name: '',
        category: intermediate?.category || defaultCategory,
        batchDescription: '',
        cookingLossPercentage: '0',
        ingredients: [],
        outputUnits: [],
      });
    }

    setNewItem({
      type: 'raw',
      id: '',
      quantity: '',
      unit: 'گرم',
    });

    setNewOutputUnit({
      name: '',
      amount: '',
      unit: 'گرم',
    });
  }, [intermediate, isOpen, defaultCategory]);

  if (!isOpen) return null;

  const handleAddIngredient = () => {
    if (!newItem.id || !newItem.quantity || Number(newItem.quantity) <= 0 || !newItem.unit) {
      return;
    }

    const entry = {
      type: newItem.type,
      materialId: newItem.type === 'raw' ? newItem.id : undefined,
      intermediateId: newItem.type === 'intermediate' ? newItem.id : undefined,
      quantity: Number(newItem.quantity),
      unit: newItem.unit.trim(),
    };

    setFormData((prev) => ({
      ...prev,
      ingredients: [...prev.ingredients, entry],
    }));

    setNewItem({
      type: 'raw',
      id: '',
      quantity: '',
      unit: 'گرم',
    });
  };

  const handleRemoveIngredient = (index) => {
    const list = [...formData.ingredients];
    list.splice(index, 1);
    setFormData((prev) => ({ ...prev, ingredients: list }));
  };

  const handleAddOutputUnit = () => {
    if (!newOutputUnit.name.trim() || !newOutputUnit.amount || Number(newOutputUnit.amount) <= 0) {
      return;
    }

    const entry = {
      id: `out-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: newOutputUnit.name.trim(),
      amount: Number(newOutputUnit.amount),
      unit: newOutputUnit.unit || batchCalculation.yieldUnit || 'گرم',
    };

    setFormData((prev) => ({
      ...prev,
      outputUnits: [...(prev.outputUnits || []), entry],
    }));

    setNewOutputUnit({
      name: '',
      amount: '',
      unit: batchCalculation.yieldUnit || 'گرم',
    });
  };

  const handleRemoveOutputUnit = (index) => {
    const list = [...(formData.outputUnits || [])];
    list.splice(index, 1);
    setFormData((prev) => ({ ...prev, outputUnits: list }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.ingredients.length === 0) {
      alert('حداقل یک ماده اولیه یا کالای واسط برای فرمول تشکیل‌دهنده این بچ اضافه نمایید.');
      return;
    }

    onSave({
      ...formData,
      outputUnits: formData.outputUnits || [],
      yieldQuantity: batchCalculation.yieldQuantity,
      yieldUnit: batchCalculation.yieldUnit,
      cookingLossPercentage: Number(formData.cookingLossPercentage) || 0,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-400" />
            <h2 className="font-bold text-base">
              {intermediate && intermediate.id ? 'ویرایش کالای واسط / نیمه‌آماده' : 'تعریف کالای واسط جدید (رسپی بوک واسط)'}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                نام کالای واسط *
              </label>
              <input
                type="text"
                required
                placeholder="مثال: مرغ پاستا، سس آلفردو، خمیر پیتزا"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                دسته‌بندی *
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

          {/* Automatic Batch Yield Card (No manual typing required!) */}
          <div className="bg-linear-to-br from-amber-500/10 via-amber-50/50 to-orange-500/10 p-4 rounded-2xl border border-amber-300/80 space-y-3 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-amber-200/60">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>محاسبه خودکار خروجی بچ و راندمان پخت</span>
              </div>
              <span className="text-[11px] text-amber-800 font-medium">
                (نیازی به تایپ مقدار خروجی نیست، سیستم بر اساس وزن مواد و افت پخت محاسبه می‌کند)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
              {/* Cooking loss input */}
              <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-2xs">
                <label className="block text-xs font-semibold text-slate-800 mb-1 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-orange-500" />
                  <span>درصد افت پخت/حرارت (٪)</span>
                </label>
                <NumericInput
                  placeholder="مثلاً ۱۰ یا ۱۵"
                  value={formData.cookingLossPercentage}
                  onChange={(val) => setFormData({ ...formData, cookingLossPercentage: val })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  تبخیر حین پخت یا سرخ کردن
                </span>
              </div>

              {/* Total Raw Weight */}
              <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-2xs">
                <div className="text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Scale className="w-3.5 h-3.5 text-amber-600" />
                  <span>مجموع وزن خام مواد</span>
                </div>
                <div className="text-base font-black text-slate-900 font-mono">
                  {toPersianDigits(batchCalculation.rawTotal)} {batchCalculation.yieldUnit}
                </div>
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  جمع وزن تک‌تک مواد تشکیل‌دهنده
                </span>
              </div>

              {/* Auto Net Yield Result */}
              <div className="bg-linear-to-r from-amber-500 to-amber-600 text-slate-950 p-3 rounded-xl shadow-xs">
                <div className="text-xs font-bold flex items-center justify-between">
                  <span>خروجی خالص تولیدی بچ:</span>
                  <span className="text-[10px] bg-slate-950/20 px-1.5 py-0.2 rounded-full font-bold">خودکار</span>
                </div>
                <div className="text-lg font-black font-mono mt-0.5">
                  {toPersianDigits(batchCalculation.yieldQuantity)} {batchCalculation.yieldUnit}
                </div>
                <div className="text-[11px] font-medium opacity-90 mt-0.5">
                  بهای هر ۱ {batchCalculation.yieldUnit}: <strong>{formatNumber(batchCalculation.unitCost)} ت</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Output Units & Portioning Section */}
          <div className="bg-amber-500/5 p-4 rounded-2xl border border-amber-300/80 space-y-3 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-amber-200/60">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950">
                <PieChart className="w-4 h-4 text-amber-600" />
                <span>واحدهای خروجی و پورشن‌بندی بچ (چونه، پرس، برش و پورشن‌ها)</span>
              </div>
              <span className="text-[11px] text-amber-800 font-medium">
                (اختیاری: جهت استفاده آسان در رسپی محصولات نهایی)
              </span>
            </div>

            <p className="text-[11px] text-slate-600 leading-relaxed">
              اگر خروجی این بچ به صورت قطعات مشخص (مثل چونه خمیر، پورشن گوشت، یا اسلایس) آماده می‌شود، نام و وزن هر واحد را وارد کنید تا تعداد در هر بچ و بهای تمام‌شده هر پورشن به شکل خودکار محاسبه شود:
            </p>

            {/* Output Units List */}
            {batchCalculation.calculatedOutputUnits && batchCalculation.calculatedOutputUnits.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {batchCalculation.calculatedOutputUnits.map((ou, idx) => (
                  <div
                    key={ou.id || idx}
                    className="bg-white border border-amber-200 rounded-xl p-3 shadow-2xs flex items-center justify-between gap-2"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 text-xs truncate">{ou.name}</span>
                        <span className="text-[10px] bg-amber-100 text-amber-900 font-mono px-1.5 py-0.2 rounded-md font-semibold">
                          {toPersianDigits(ou.amount)} {ou.unit}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2">
                        <span>خروجی از بچ: <strong className="text-slate-800 font-mono">{toPersianDigits(ou.countPerBatch)}</strong> عدد</span>
                        <span>•</span>
                        <span>بهای هر واحد: <strong className="text-amber-700 font-mono">{formatNumber(ou.costPerPortion)} ت</strong></span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveOutputUnit(idx)}
                      className="text-red-400 hover:text-red-600 p-1.5 transition cursor-pointer rounded-lg hover:bg-red-50"
                      title="حذف این واحد خروجی"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Output Unit Row */}
            <div className="bg-white p-3 rounded-xl border border-amber-200/90 flex flex-wrap items-center gap-2 shadow-2xs">
              <div className="flex-1 min-w-[130px]">
                <input
                  type="text"
                  placeholder="نام واحد (مثلاً: چونه، پورشن رومن)"
                  value={newOutputUnit.name}
                  onChange={(e) => setNewOutputUnit({ ...newOutputUnit, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:bg-white focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="w-24">
                <NumericInput
                  placeholder="وزن/مقدار"
                  value={newOutputUnit.amount}
                  onChange={(val) => setNewOutputUnit({ ...newOutputUnit, amount: val })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-slate-900 font-mono focus:bg-white focus:ring-1 focus:ring-amber-500 text-center"
                />
              </div>

              <div className="w-20">
                <select
                  value={newOutputUnit.unit}
                  onChange={(e) => setNewOutputUnit({ ...newOutputUnit, unit: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-slate-800 font-semibold cursor-pointer"
                >
                  <option value="گرم">گرم</option>
                  <option value="کیلوگرم">کیلوگرم</option>
                  <option value="میلی‌لیتر">میلی‌لیتر</option>
                  <option value="لیتر">لیتر</option>
                  <option value="عدد">عدد</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleAddOutputUnit}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>افزودن واحد</span>
              </button>
            </div>
          </div>

          {/* Ingredients Builder */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span>فرمول و مواد تشکیل‌دهنده این بچ</span>
                <span className="text-[11px] font-normal text-slate-500">
                  (مواد اولیه یا سایر کالاهای واسط با محاسبه دقیق وزن)
                </span>
              </label>
              <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                هزینه کل مواد بچ: {formatToman(batchCalculation.totalBatchCost)}
              </span>
            </div>

            {/* Existing Ingredients Table */}
            {batchCalculation.ingredientsWithCost.length > 0 ? (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">نوع</th>
                      <th className="py-2.5 px-3">نام قلم تشکیل‌دهنده</th>
                      <th className="py-2.5 px-3">مقدار رسپی</th>
                      <th className="py-2.5 px-3">وزن محاسباتی</th>
                      <th className="py-2.5 px-3">هزینه</th>
                      <th className="py-2.5 px-3 text-center">حذف</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {batchCalculation.ingredientsWithCost.map((ing, idx) => {
                      const isRaw = ing.type === 'raw';
                      const itemObj = isRaw
                        ? materialsMap.get(ing.materialId)
                        : intermediatesMap.get(ing.intermediateId);

                      return (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                isRaw ? 'bg-amber-100 text-amber-800' : 'bg-purple-100 text-purple-800'
                              }`}
                            >
                              {isRaw ? 'ماده اولیه' : 'کالای واسط'}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-semibold text-slate-800">
                            {itemObj ? itemObj.name : 'قلم حذف شده'}
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-slate-900">
                            {toPersianDigits(ing.quantity)} {ing.unit}
                          </td>
                          <td className="py-2 px-3 font-mono text-slate-600">
                            {toPersianDigits(ing.weightInG)} گرم
                          </td>
                          <td className="py-2 px-3 font-mono text-slate-700">
                            {formatToman(ing.calculatedCost)}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveIngredient(idx)}
                              className="text-red-500 hover:text-red-700 p-1 transition cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-xs text-slate-400">
                هنوز هیچ ماده اولیه‌ای به این فرمول اضافه نشده است. از ردیف زیر برای افزودن مواد استفاده کنید.
              </div>
            )}

            {/* Add ingredient row with filtered unit dropdown */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-wrap items-center gap-2">
              <select
                value={newItem.type}
                onChange={(e) => {
                  setNewItem({ ...newItem, type: e.target.value, id: '', unit: 'گرم' });
                }}
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-semibold"
              >
                <option value="raw">ماده اولیه خام</option>
                <option value="intermediate">کالای واسط دیگر</option>
              </select>

              <select
                value={newItem.id}
                onChange={(e) => {
                  const id = e.target.value;
                  let defUnit = 'گرم';
                  if (newItem.type === 'raw') {
                    const m = materialsMap.get(id);
                    if (m) {
                      const units = getValidUnitsForMaterial(m, globalConversions);
                      defUnit = units.includes('گرم') ? 'گرم' : units[0] || m.purchaseUnit;
                    }
                  } else {
                    const i = intermediatesMap.get(id);
                    if (i) {
                      defUnit = i.yieldUnit || 'گرم';
                    }
                  }
                  setNewItem({ ...newItem, id, unit: defUnit });
                }}
                className="flex-1 min-w-[160px] bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
              >
                <option value="">-- انتخاب قلم تشکیل‌دهنده --</option>
                {newItem.type === 'raw'
                  ? safeRawMaterials.map((m) =>
                      m ? (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.purchaseUnit})
                        </option>
                      ) : null
                    )
                  : availableIntermediates.map((i) =>
                      i ? (
                        <option key={i.id} value={i.id}>
                          {i.name} (واحد خروجی: {i.yieldUnit || 'گرم'})
                        </option>
                      ) : null
                    )}
              </select>

              <NumericInput
                placeholder="مقدار"
                value={newItem.quantity}
                onChange={(val) => setNewItem({ ...newItem, quantity: val })}
                className="w-20 bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-slate-800"
              />

              {/* Unit dropdown - ONLY displays valid & convertible units for this specific material */}
              <select
                value={newItem.unit}
                onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                className="w-24 bg-white border border-amber-300 rounded-lg px-2 py-1.5 text-xs text-slate-900 font-bold cursor-pointer"
              >
                {validUnitsForNewItem.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleAddIngredient}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>افزودن</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              دستورالعمل آماده‌سازی یا یادداشت بچ
            </label>
            <textarea
              rows="2"
              placeholder="نکات مرینیت، دمای نگهداری، مدت زمان ماندگاری در یخچال..."
              value={formData.batchDescription}
              onChange={(e) => setFormData({ ...formData, batchDescription: e.target.value })}
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
              <span>ذخیره کالای واسط</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
