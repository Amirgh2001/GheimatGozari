import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Plus,
  Trash2,
  Scale,
  Info,
  Check,
  Sparkles,
  AlertCircle,
  ArrowLeftRight,
  Package,
  Calculator,
  Coins,
} from 'lucide-react';
import NumericInput from './NumericInput.jsx';
import { numberToPersianWords, toPersianDigits, formatToman, formatNumber } from '../utils.js';
import {
  GLOBAL_WEIGHT_UNITS,
  GLOBAL_VOLUME_UNITS,
  GLOBAL_COUNT_UNITS,
  PACKAGING_UNITS_WEIGHT,
  PACKAGING_UNITS_VOLUME,
  PACKAGING_UNITS_COUNT,
  convertUnit,
  findUnit,
} from '../costEngine.js';

export default function EditMaterialModal({
  material,
  isOpen,
  onClose,
  onSave,
  availableUnits = [],
  availableCategories = [],
  globalConversions = [],
}) {
  const safeUnits = Array.isArray(availableUnits) ? availableUnits : [];
  const safeCategories = Array.isArray(availableCategories) ? availableCategories : [];

  const categoryNames = useMemo(() => {
    const list = safeCategories.length > 0
      ? safeCategories.map((c) => (typeof c === 'string' ? c : c?.name)).filter(Boolean)
      : ['پروتئین', 'سبزیجات و صیفی‌جات', 'خشکبار و غلات', 'لبنیات', 'روغن و چربی', 'چاشنی و سس', 'پکیجینگ', 'نان و شیرینی', 'نوشیدنی', 'سایر'];
    const matCat = typeof material?.category === 'string' ? material.category.trim() : null;
    if (matCat && !list.includes(matCat)) {
      return [matCat, ...list];
    }
    return list;
  }, [safeCategories, material?.category]);

  const defaultCategory = categoryNames[0] || 'پروتئین';

  // Form main data
  const [formData, setFormData] = useState({
    name: '',
    category: (typeof material?.category === 'string' && material.category.trim()) || defaultCategory,
    purchaseUnit: 'کیلوگرم',
    purchasePrice: '',
    wastagePercentage: '0',
    notes: '',
    customConversions: [],
  });

  // Flexible pricing unit state: Which unit is the user actively entering price for?
  const [pricingUnit, setPricingUnit] = useState('کیلوگرم');
  const [pricingPrice, setPricingPrice] = useState('');

  // New conversion step row
  const [newStep, setNewStep] = useState({
    fromUnit: '',
    factor: '',
    toUnit: 'عدد',
  });

  // All packaging unit names
  const allPackagingUnitNames = useMemo(() => {
    const set = new Set([
      ...PACKAGING_UNITS_WEIGHT,
      ...PACKAGING_UNITS_VOLUME,
      ...PACKAGING_UNITS_COUNT,
      'کارتن', 'کیسه بزرگ', 'کیسه', 'بسته', 'بطری', 'حلب', 'شانه', 'قالب', 'جعبه', 'قوطی', 'گالن', 'بشکه', 'پاکت', 'دسته', 'سطل',
    ]);
    safeUnits.forEach((u) => {
      const name = typeof u === 'string' ? u : u?.name;
      if (name) set.add(name);
    });
    return Array.from(set);
  }, [safeUnits]);

  // Is the current purchaseUnit a packaging unit?
  const isPackagingUnit = useMemo(() => {
    const standardGlobals = ['کیلوگرم', 'گرم', 'تن', 'لیتر', 'میلی‌لیتر', 'عدد', 'دوجین', 'پرس'];
    return !standardGlobals.includes(formData.purchaseUnit);
  }, [formData.purchaseUnit]);

  // List of candidate units for purchaseUnit dropdown
  const purchaseUnitOptions = useMemo(() => {
    const standards = [
      { label: 'واحدهای وزنی', units: ['کیلوگرم', 'گرم', 'تن'] },
      { label: 'واحدهای حجمی', units: ['لیتر', 'میلی‌لیتر'] },
      { label: 'واحدهای تعدادی', units: ['عدد', 'دوجین', 'پرس'] },
    ];

    const packagingUnits = allPackagingUnitNames.filter(
      (u) => !['کیلوگرم', 'گرم', 'تن', 'لیتر', 'میلی‌لیتر', 'عدد', 'دوجین', 'پرس'].includes(u)
    );

    return { standards, packagingUnits };
  }, [allPackagingUnitNames]);

  // Populate data when modal opens
  useEffect(() => {
    if (material && material.id) {
      const pUnit = material.purchaseUnit || 'کیلوگرم';
      const pPrice = material.purchasePrice !== undefined ? String(material.purchasePrice) : '';
      const conversions = Array.isArray(material.customConversions) ? [...material.customConversions] : [];

      setFormData({
        name: material.name || '',
        category: (typeof material.category === 'string' && material.category.trim()) || defaultCategory,
        purchaseUnit: pUnit,
        purchasePrice: pPrice,
        wastagePercentage: material.wastagePercentage !== undefined ? String(material.wastagePercentage) : '0',
        notes: material.notes || '',
        customConversions: conversions,
      });

      setPricingUnit(pUnit);
      setPricingPrice(pPrice);

      setNewStep({
        fromUnit: pUnit,
        factor: '',
        toUnit: 'عدد',
      });
    } else {
      const initCat = (typeof material?.category === 'string' && material.category.trim()) || defaultCategory;
      const initUnit = initCat === 'روغن و چربی' || initCat === 'نوشیدنی' ? 'لیتر' : 'کیلوگرم';

      setFormData({
        name: '',
        category: initCat,
        purchaseUnit: initUnit,
        purchasePrice: '',
        wastagePercentage: '0',
        notes: '',
        customConversions: [],
      });

      setPricingUnit(initUnit);
      setPricingPrice('');

      setNewStep({
        fromUnit: initUnit,
        factor: '',
        toUnit: 'عدد',
      });
    }
  }, [material, isOpen, defaultCategory]);

  // Connected units that can be priced or converted
  const connectedUnits = useMemo(() => {
    const set = new Set();
    const pUnit = formData.purchaseUnit;
    if (pUnit) set.add(pUnit);

    formData.customConversions.forEach((c) => {
      if (c.fromUnit) set.add(c.fromUnit);
      if (c.toUnit) set.add(c.toUnit);
    });

    const candidates = ['کیلوگرم', 'گرم', 'لیتر', 'میلی‌لیتر', 'عدد'];
    candidates.forEach((cand) => {
      if (pUnit) {
        const factor = convertUnit(1, cand, pUnit, formData.customConversions, globalConversions);
        if (factor > 0) set.add(cand);
      }
    });

    return Array.from(set).filter(Boolean);
  }, [formData.purchaseUnit, formData.customConversions, globalConversions]);

  // Real-time calculated price per unit for the live summary card
  const calculatedUnitPrices = useMemo(() => {
    const baseCartonPrice = Number(formData.purchasePrice) || 0;
    if (baseCartonPrice <= 0 || !formData.purchaseUnit) return [];

    const results = [];
    for (const u of connectedUnits) {
      const qtyInPurchaseUnit = convertUnit(1, u, formData.purchaseUnit, formData.customConversions, globalConversions);
      if (qtyInPurchaseUnit > 0) {
        const effectivePrice = Math.round(baseCartonPrice * qtyInPurchaseUnit);
        results.push({
          unit: u,
          price: effectivePrice,
          isPurchaseUnit: u === formData.purchaseUnit,
          isPricingUnit: u === pricingUnit,
        });
      }
    }

    return results;
  }, [formData.purchasePrice, formData.purchaseUnit, formData.customConversions, connectedUnits, globalConversions, pricingUnit]);

  if (!isOpen) return null;

  // Handle changing purchase unit
  const handlePurchaseUnitChange = (newUnit) => {
    setFormData((prev) => ({
      ...prev,
      purchaseUnit: newUnit,
    }));
    setPricingUnit(newUnit);
    setNewStep((prev) => ({
      ...prev,
      fromUnit: newUnit,
    }));
  };

  // Handle changing the pricing unit (e.g. from کارتن to لیتر)
  const handlePricingUnitChange = (newPricingUnit) => {
    setPricingUnit(newPricingUnit);

    if (formData.purchasePrice && Number(formData.purchasePrice) > 0) {
      const factor = convertUnit(1, newPricingUnit, formData.purchaseUnit, formData.customConversions, globalConversions);
      if (factor > 0) {
        const converted = Math.round(Number(formData.purchasePrice) * factor);
        setPricingPrice(String(converted));
      }
    }
  };

  // Handle typing price in the flexible pricing input
  const handlePricingPriceChange = (typedVal) => {
    setPricingPrice(typedVal);

    const numVal = Number(typedVal);
    if (!numVal || numVal <= 0) {
      setFormData((prev) => ({ ...prev, purchasePrice: '' }));
      return;
    }

    if (pricingUnit === formData.purchaseUnit) {
      setFormData((prev) => ({ ...prev, purchasePrice: typedVal }));
    } else {
      // Convert typed price in pricingUnit to price in purchaseUnit
      const factorToPricing = convertUnit(1, formData.purchaseUnit, pricingUnit, formData.customConversions, globalConversions);
      if (factorToPricing > 0) {
        const equivPurchasePrice = Math.round(numVal * factorToPricing);
        setFormData((prev) => ({ ...prev, purchasePrice: String(equivPurchasePrice) }));
      } else {
        // If no direct path yet, store typed directly
        setFormData((prev) => ({ ...prev, purchasePrice: typedVal }));
      }
    }
  };

  // Add conversion step
  const handleAddConversionStep = () => {
    const fUnit = (newStep.fromUnit || formData.purchaseUnit).trim();
    const tUnit = (newStep.toUnit || 'عدد').trim();
    const factorNum = Number(newStep.factor);

    if (!fUnit || !tUnit || !factorNum || factorNum <= 0) {
      alert('لطفاً مقادیر گام تبدیل را به طور کامل وارد فرمایید.');
      return;
    }

    if (fUnit === tUnit) {
      alert('واحد مبدأ و مقصد تبدیل نمی‌توانند یکسان باشند.');
      return;
    }

    // Filter out existing exact pair if any
    const updated = formData.customConversions.filter(
      (c) => !(c.fromUnit === fUnit && c.toUnit === tUnit)
    );

    const newConvs = [...updated, { fromUnit: fUnit, toUnit: tUnit, factor: factorNum }];

    // If adding a bottle-to-volume step (e.g. 1 عدد = 1250 میلی‌لیتر) and purchase is carton (12 عدد):
    // Auto-derive carton -> liter shortcut for maximum engine resilience!
    const cartonToPiece = newConvs.find((c) => c.fromUnit === formData.purchaseUnit && c.toUnit === 'عدد');
    const pieceToMl = newConvs.find((c) => c.fromUnit === 'عدد' && (c.toUnit === 'میلی‌لیتر' || c.toUnit === 'ml'));
    if (cartonToPiece && pieceToMl) {
      const totalLiters = (cartonToPiece.factor * pieceToMl.factor) / 1000;
      if (totalLiters > 0 && !newConvs.some((c) => c.fromUnit === formData.purchaseUnit && c.toUnit === 'لیتر')) {
        newConvs.push({
          fromUnit: formData.purchaseUnit,
          toUnit: 'لیتر',
          factor: totalLiters,
        });
      }
    }

    setFormData((prev) => ({
      ...prev,
      customConversions: newConvs,
    }));

    setNewStep({
      fromUnit: tUnit, // Suggest next step starting from current target!
      factor: '',
      toUnit: tUnit === 'عدد' ? 'میلی‌لیتر' : 'گرم',
    });
  };

  // Remove conversion step
  const handleRemoveConversionStep = (index) => {
    const updated = [...formData.customConversions];
    updated.splice(index, 1);
    setFormData((prev) => ({
      ...prev,
      customConversions: updated,
    }));
  };

  // Form submit
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('لطفاً نام ماده اولیه را وارد کنید.');
      return;
    }

    if (!formData.purchasePrice || Number(formData.purchasePrice) <= 0) {
      alert('لطفاً قیمت خرید معتبر را وارد کنید.');
      return;
    }

    if (isPackagingUnit && formData.customConversions.length === 0) {
      const confirmed = window.confirm(
        `واحد خرید «${formData.purchaseUnit}» یک واحد بسته‌بندی است ولی هیچ تبدیل واحدی (مثلاً هر ۱ ${formData.purchaseUnit} چند عدد یا چند کیلوگرم/لیتر است) برای آن ثبت نشده است.\n\nآیا مایلید بدون تبدیل ذخیره شود؟`
      );
      if (!confirmed) return;
    }

    onSave({
      ...formData,
      purchasePrice: Number(formData.purchasePrice) || 0,
      wastagePercentage: Number(formData.wastagePercentage) || 0,
      customConversions: formData.customConversions,
    });
  };

  const persianWordsPrice = numberToPersianWords(pricingPrice);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm sm:text-base">
                {material && material.id ? 'ویرایش ماده اولیه و نرخ‌های خرید' : 'افزودن ماده اولیه جدید'}
              </h2>
              <span className="text-[11px] text-slate-400">
                پشتیبانی از خرید کارتنی/بسته‌ای با زنجیره تبدیل خودکار و قیمت‌گذاری انعطاف‌پذیر
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition p-1.5 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[85vh] overflow-y-auto">
          {/* Main Attributes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                نام ماده اولیه *
              </label>
              <input
                type="text"
                required
                placeholder="مثال: روغن سرخ‌کردنی غنچه، فیله مرغ، سیب‌زمینی"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                دسته‌بندی انبار و منو *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white cursor-pointer"
              >
                {categoryNames.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Official Purchase Unit (واحد فاکتور) */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-amber-500" />
                <span>واحد خرید رسمی در فاکتور تأمین‌کننده:</span>
              </label>
              <span className="text-[11px] text-slate-500">
                (واحدی که فاکتور با آن صادر می‌شود، مثل کارتن، کیسه یا کیلوگرم)
              </span>
            </div>

            <select
              value={formData.purchaseUnit}
              onChange={(e) => handlePurchaseUnitChange(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer shadow-xs"
            >
              <optgroup label="📦 بسته‌بندی و ظروف کلان تأمین‌کننده">
                {purchaseUnitOptions.packagingUnits.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </optgroup>
              {purchaseUnitOptions.standards.map((group) => (
                <optgroup key={group.label} label={group.label}>
                  {group.units.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Packaging / Unit Conversion Chain Builder */}
          <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4 text-amber-700" />
                <h3 className="text-xs font-bold text-amber-950">
                  زنجیره تبدیل واحد و مقیاس بسته‌بندی
                </h3>
              </div>
              <span className="text-[11px] text-amber-800">
                (مثال روغن غنچه: ۱ کارتن = ۱۲ عدد، و ۱ عدد = ۱۲۵۰ میلی‌لیتر)
              </span>
            </div>

            {/* List of defined conversions */}
            {formData.customConversions.length > 0 ? (
              <div className="space-y-1.5">
                {formData.customConversions.map((conv, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-amber-200 text-xs shadow-xs"
                  >
                    <div className="flex items-center gap-2 font-mono">
                      <span className="font-bold text-slate-800">۱ {conv.fromUnit}</span>
                      <span className="text-slate-400">=</span>
                      <strong className="text-amber-700 font-black">{toPersianDigits(conv.factor)}</strong>
                      <span className="font-bold text-slate-800">{conv.toUnit}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveConversionStep(idx)}
                      title="حذف این گام"
                      className="text-red-500 hover:text-red-700 p-1 rounded-md transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white/80 p-2.5 rounded-lg border border-dashed border-amber-300 text-center text-xs text-amber-800">
                {isPackagingUnit ? (
                  <span>
                    برای این کالای بسته‌ای ({formData.purchaseUnit}) هنوز تبدیلی تعریف نشده است. لطفاً گام‌های تبدیل آن را در زیر ثبت کنید.
                  </span>
                ) : (
                  <span>
                    این کالا با واحد استاندارد ({formData.purchaseUnit}) ثبت شده است. در صورت نیاز به تعریف بسته یا کیسه اختصاصی می‌توانید در زیر اضافه فرمایید.
                  </span>
                )}
              </div>
            )}

            {/* Add Conversion Step Row */}
            <div className="bg-white p-3 rounded-xl border border-amber-200 space-y-2">
              <div className="text-[11px] font-semibold text-slate-700">
                افزودن گام تبدیل جدید:
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-700">هر ۱</span>
                <select
                  value={newStep.fromUnit || formData.purchaseUnit}
                  onChange={(e) => setNewStep({ ...newStep, fromUnit: e.target.value })}
                  className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 cursor-pointer"
                >
                  <option value={formData.purchaseUnit}>{formData.purchaseUnit}</option>
                  {formData.customConversions.map((c, i) => (
                    <option key={i} value={c.toUnit}>
                      {c.toUnit}
                    </option>
                  ))}
                  <option value="عدد">عدد</option>
                  <option value="بسته">بسته</option>
                  <option value="بطری">بطری</option>
                  <option value="شانه">شانه</option>
                </select>

                <span className="text-xs font-bold text-slate-500">=</span>

                <NumericInput
                  placeholder="مقدار (مثلاً ۱۲ یا ۱۲۵۰)"
                  value={newStep.factor}
                  onChange={(val) => setNewStep({ ...newStep, factor: val })}
                  className="w-28 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 font-mono"
                />

                <select
                  value={newStep.toUnit}
                  onChange={(e) => setNewStep({ ...newStep, toUnit: e.target.value })}
                  className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 cursor-pointer"
                >
                  <option value="عدد">عدد</option>
                  <option value="میلی‌لیتر">میلی‌لیتر</option>
                  <option value="لیتر">لیتر</option>
                  <option value="گرم">گرم</option>
                  <option value="کیلوگرم">کیلوگرم</option>
                  <option value="بسته">بسته</option>
                  <option value="شانه">شانه</option>
                  <option value="بطری">بطری</option>
                  <option value="پرس">پرس</option>
                </select>

                <button
                  type="button"
                  onClick={handleAddConversionStep}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-xs transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>افزودن گام</span>
                </button>
              </div>
            </div>
          </div>

          {/* Flexible Pricing Section (قیمت‌گذاری بر اساس واحد دلخواه) */}
          <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold text-white">
                  قیمت خرید و مبنای فاکتور
                </h3>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-400">قیمت‌گذاری بر اساس واحد:</span>
                <select
                  value={pricingUnit}
                  onChange={(e) => handlePricingUnitChange(e.target.value)}
                  className="bg-slate-800 text-amber-400 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-bold cursor-pointer focus:ring-1 focus:ring-amber-500"
                >
                  {connectedUnits.map((u) => (
                    <option key={u} value={u}>
                      {u} {u === formData.purchaseUnit ? '(واحد فاکتور)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Price Input */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                مبلغ خرید برای هر ۱ <strong className="text-amber-400">{pricingUnit}</strong> (تومان) *
              </label>
              <NumericInput
                required
                placeholder="تایپ عدد (مثلاً ۷۰۰۰۰۰۰ یا ۴۸۰۰۰۰)"
                value={pricingPrice}
                onChange={handlePricingPriceChange}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-base font-bold text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
              />

              {/* Price in Persian Words */}
              {persianWordsPrice ? (
                <div className="text-xs text-amber-300 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20 mt-2 flex items-center gap-1.5 font-medium animate-fadeIn">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>مبلغ به حروف:</span>
                  <strong className="text-white font-bold">{persianWordsPrice} تومان برای هر {pricingUnit}</strong>
                </div>
              ) : null}
            </div>

            {/* Live Synchronized Breakdown Card */}
            {calculatedUnitPrices.length > 0 && (
              <div className="pt-2 border-t border-slate-800 space-y-1.5">
                <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                  <Calculator className="w-3 h-3 text-amber-400" />
                  <span>محاسبه خودکار نرخ در تمام واحدهای مرتبط:</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {calculatedUnitPrices.map((item) => (
                    <div
                      key={item.unit}
                      className={`p-2 rounded-lg border transition ${
                        item.isPricingUnit
                          ? 'bg-amber-400/15 border-amber-400/40 text-amber-200'
                          : 'bg-slate-800/70 border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="text-[10px] text-slate-400">
                        هر ۱ {item.unit}:
                      </div>
                      <div className="font-bold font-mono text-xs sm:text-sm text-white mt-0.5">
                        {formatToman(item.price)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Wastage and Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                درصد افت / دورریز پاکسازی (٪)
              </label>
              <NumericInput
                placeholder="تایپ عدد (مثلاً ۰ یا ۲۰)"
                value={formData.wastagePercentage}
                onChange={(val) => setFormData({ ...formData, wastagePercentage: val })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                افت پوست‌گیری، چربی، ساقه سبزیجات و...
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                یادداشت یا برند تأمین‌کننده
              </label>
              <input
                type="text"
                placeholder="مثلاً: برند غنچه، کشتار روز، بار تهران..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Footer Actions */}
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
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>ذخیره ماده اولیه</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
