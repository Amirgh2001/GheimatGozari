import React, { useState } from 'react';
import {
  Scale,
  Plus,
  Trash2,
  Lock,
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  Shield,
  Tag,
  Package,
  Layers,
  Edit2,
  X,
  Check,
  ArrowLeftRight,
  Info,
  FileSpreadsheet,
  FileCode,
  Database,
} from 'lucide-react';
import { api } from '../api.js';
import NumericInput from './NumericInput.jsx';
import { toPersianDigits, formatNumber } from '../utils.js';

export default function UnitsSettingsView({
  unitsData = { standardUnits: [], categories: [], purchaseUnits: [], conversionChains: [] },
  manager = {},
  onRefreshData,
  onOpenBackupModal,
}) {
  const [subTab, setSubTab] = useState('chains'); // 'chains', 'units', 'categories', 'security'

  // Multi-step chain form state
  const [newChain, setNewChain] = useState({
    title: '',
    steps: [
      { amount: '1', unit: 'تن' },
      { amount: '1000', unit: 'کیلوگرم' },
      { amount: '1000000', unit: 'گرم' },
    ],
  });

  // Category form state
  const [newCategory, setNewCategory] = useState({ name: '', type: 'material' });
  const [editingCategory, setEditingCategory] = useState(null);

  // Purchase Unit form state
  const [newUnit, setNewUnit] = useState({ name: '', category: 'بسته‌بندی' });
  const [editingUnit, setEditingUnit] = useState(null);

  // Security / Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordErr, setPasswordErr] = useState('');

  // Profile form
  const [profileForm, setProfileForm] = useState({
    restaurantName: manager?.restaurantName || '',
    fullName: manager?.fullName || '',
    phone: manager?.phone || '',
  });
  const [profileMsg, setProfileMsg] = useState('');

  const purchaseUnitsList = unitsData.purchaseUnits || [];
  const categoriesList = unitsData.categories || [];
  const conversionChainsList = unitsData.conversionChains || [];

  // =================== CONVERSION CHAINS HANDLERS ===================
  const handleAddStepToNewChain = () => {
    setNewChain((prev) => ({
      ...prev,
      steps: [...prev.steps, { amount: '', unit: purchaseUnitsList[0]?.name || 'گرم' }],
    }));
  };

  const handleRemoveStepFromNewChain = (index) => {
    if (newChain.steps.length <= 2) {
      alert('حداقل ۲ واحد برای تعریف تبدیل الزامی است.');
      return;
    }
    const updated = [...newChain.steps];
    updated.splice(index, 1);
    setNewChain((prev) => ({ ...prev, steps: updated }));
  };

  const handleUpdateStep = (index, field, value) => {
    const updated = [...newChain.steps];
    updated[index] = { ...updated[index], [field]: value };
    setNewChain((prev) => ({ ...prev, steps: updated }));
  };

  const handleSaveChain = async (e) => {
    e.preventDefault();
    for (const step of newChain.steps) {
      if (!step.unit || !step.amount || Number(step.amount) <= 0) {
        alert('لطفاً مقدار و واحد را برای تمامی مراحل تبدیل وارد نمایید.');
        return;
      }
    }

    try {
      await api.createConversionChain({
        title: newChain.title.trim() || undefined,
        steps: newChain.steps.map((s) => ({ amount: Number(s.amount), unit: s.unit })),
      });
      setNewChain({
        title: '',
        steps: [
          { amount: '1', unit: purchaseUnitsList[0]?.name || 'کیلوگرم' },
          { amount: '1000', unit: purchaseUnitsList[1]?.name || 'گرم' },
        ],
      });
      if (onRefreshData) onRefreshData();
    } catch (err) {
      alert(err.message || 'خطا در ثبت تبدیل واحد');
    }
  };

  const handleDeleteChain = async (id) => {
    if (!window.confirm('آیا از حذف این تبدیل واحد اطمینان دارید؟')) return;
    try {
      await api.deleteConversionChain(id);
      if (onRefreshData) onRefreshData();
    } catch (err) {
      alert(err.message || 'خطا در حذف');
    }
  };

  // =================== CATEGORIES HANDLERS ===================
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.name.trim()) return;
    try {
      await api.createCategory(newCategory);
      setNewCategory({ name: '', type: 'material' });
      if (onRefreshData) onRefreshData();
    } catch (err) {
      alert(err.message || 'خطا در افزودن دسته‌بندی');
    }
  };

  const handleSaveEditCategory = async () => {
    if (!editingCategory || !editingCategory.name.trim()) return;
    try {
      await api.updateCategory(editingCategory.id, editingCategory);
      setEditingCategory(null);
      if (onRefreshData) onRefreshData();
    } catch (err) {
      alert(err.message || 'خطا در ویرایش دسته‌بندی');
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('آیا از حذف این دسته‌بندی اطمینان دارید؟')) return;
    try {
      await api.deleteCategory(id);
      if (onRefreshData) onRefreshData();
    } catch (err) {
      alert(err.message || 'خطا در حذف دسته‌بندی');
    }
  };

  // =================== PURCHASE UNITS HANDLERS ===================
  const handleAddPurchaseUnit = async (e) => {
    e.preventDefault();
    if (!newUnit.name.trim()) return;
    try {
      await api.createPurchaseUnit(newUnit);
      setNewUnit({ name: '', category: 'بسته‌بندی' });
      if (onRefreshData) onRefreshData();
    } catch (err) {
      alert(err.message || 'خطا در افزودن واحد');
    }
  };

  const handleSaveEditUnit = async () => {
    if (!editingUnit || !editingUnit.name.trim()) return;
    try {
      await api.updatePurchaseUnit(editingUnit.id, editingUnit);
      setEditingUnit(null);
      if (onRefreshData) onRefreshData();
    } catch (err) {
      alert(err.message || 'خطا در ویرایش واحد');
    }
  };

  const handleDeletePurchaseUnit = async (id) => {
    if (!window.confirm('آیا از حذف این واحد خرید اطمینان دارید؟')) return;
    try {
      await api.deletePurchaseUnit(id);
      if (onRefreshData) onRefreshData();
    } catch (err) {
      alert(err.message || 'خطا در حذف واحد');
    }
  };

  // =================== SECURITY & BACKUP HANDLERS ===================
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMsg('');
    setPasswordErr('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordErr('کلمه عبور جدید و تکرار آن یکسان نیستند.');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordErr('کلمه عبور باید حداقل ۶ کاراکتر باشد.');
      return;
    }

    try {
      const res = await api.changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword
      );
      setPasswordMsg(res.message || 'کلمه عبور با موفقیت به‌روزرسانی شد.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPasswordErr(err.message || 'خطا در تغییر کلمه عبور');
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileMsg('');
    try {
      await api.updateProfile(profileForm);
      setProfileMsg('اطلاعات مجموعه با موفقیت ذخیره شد.');
      if (onRefreshData) onRefreshData();
    } catch (err) {
      alert(err.message || 'خطا در به‌روزرسانی مشخصات');
    }
  };

  const handleResetSeed = async () => {
    if (!window.confirm('هشدار: آیا می‌خواهید مقادیر پیش‌فرض اولیه بازگردانی شوند؟')) return;
    try {
      await api.resetData();
      alert('داده‌ها بازنشانی شدند.');
      if (onRefreshData) onRefreshData();
    } catch (err) {
      alert(err.message || 'خطا در بازگردانی');
    }
  };

  const handleFileImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    const isExcel = ext === 'xlsx' || ext === 'xls';
    const isJson = ext === 'json';

    if (!isExcel && !isJson) {
      alert('فرمت فایل پشتیبانی نمی‌شود. لطفاً فایل با پسوند .xlsx یا .json انتخاب فرمایید.');
      return;
    }

    if (!window.confirm(`آیا از بازیابی اطلاعات از فایل «${file.name}» اطمینان دارید؟ داده‌های فعلی سامانه با این فایل جایگزین خواهند شد.`)) {
      return;
    }

    try {
      if (isExcel) {
        const buffer = await file.arrayBuffer();
        let binary = '';
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64 = window.btoa(binary);
        const res = await api.importExcelData(base64);
        alert(res.message || 'فایل اکسل با موفقیت بازیابی شد.');
      } else {
        const text = await file.text();
        const json = JSON.parse(text);
        const res = await api.importData(json);
        alert(res.message || 'فایل JSON با موفقیت بازیابی شد.');
      }
      if (onRefreshData) onRefreshData();
    } catch (err) {
      alert('خطا در بازیابی فایل: ' + (err.message || 'فایل نامعتبر است.'));
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Scale className="w-5 h-5 text-amber-500" />
          <span>تبدیل واحدها و مقادیر پیش‌فرض</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          مدیریت واحدهای خرید، دسته‌بندی‌ها، قوانین تبدیل واحد چندمرحله‌ای (مانند ۱ تن = ۱۰۰۰ کیلو = ۱۰۰۰۰۰۰ گرم) و تنظیمات امنیت مدیر
        </p>
      </div>

      {/* Sub Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setSubTab('chains')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer whitespace-nowrap ${
            subTab === 'chains'
              ? 'bg-amber-500 text-slate-950 shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ArrowLeftRight className="w-4 h-4" />
          <span>تبدیل واحدها (چندمرحله‌ای)</span>
          <span className="text-[10px] bg-slate-900/10 px-1.5 py-0.5 rounded-full font-mono">
            {conversionChainsList.length}
          </span>
        </button>

        <button
          onClick={() => setSubTab('units')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer whitespace-nowrap ${
            subTab === 'units'
              ? 'bg-amber-500 text-slate-950 shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>واحدهای خرید و شمارش</span>
          <span className="text-[10px] bg-slate-900/10 px-1.5 py-0.5 rounded-full font-mono">
            {purchaseUnitsList.length}
          </span>
        </button>

        <button
          onClick={() => setSubTab('categories')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer whitespace-nowrap ${
            subTab === 'categories'
              ? 'bg-amber-500 text-slate-950 shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>دسته‌بندی‌های منو و مواد</span>
          <span className="text-[10px] bg-slate-900/10 px-1.5 py-0.5 rounded-full font-mono">
            {categoriesList.length}
          </span>
        </button>

        <button
          onClick={() => setSubTab('security')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer whitespace-nowrap ${
            subTab === 'security'
              ? 'bg-amber-500 text-slate-950 shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>امنیت و پشتیبان‌گیری</span>
        </button>
      </div>

      {/* ===================== TAB 1: CONVERSION CHAINS ===================== */}
      {subTab === 'chains' && (
        <div className="space-y-6">
          {/* Builder Box */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <ArrowLeftRight className="w-4 h-4 text-amber-500" />
                  <span>تعریف تبدیل واحد زنجیره‌ای (دو مرحله‌ای یا بیشتر)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  هم مقدار و هم واحد در هر گام قابل انتخاب هستند. مثال: ۱ تن = ۱۰۰۰ کیلوگرم = ۱۰۰۰۰۰۰ گرم
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveChain} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  عنوان زنجیره تبدیل (اختیاری):
                </label>
                <input
                  type="text"
                  placeholder="مثال: تبدیل تن به کیلوگرم و گرم، یا کارتن تخم مرغ به شانه و عدد"
                  value={newChain.title}
                  onChange={(e) => setNewChain({ ...newChain, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm"
                />
              </div>

              {/* Dynamic Steps Row */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    مراحل برابری تبدیل واحد (با علامت مساوی =):
                  </span>
                  <button
                    type="button"
                    onClick={handleAddStepToNewChain}
                    className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-amber-400" />
                    <span>افزودن مرحله برابری بعدی (=)</span>
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {newChain.steps.map((step, idx) => (
                    <React.Fragment key={idx}>
                      {idx > 0 && (
                        <span className="text-base font-black text-amber-600 px-1 select-none">
                          =
                        </span>
                      )}

                      <div className="flex items-center gap-1.5 bg-white p-2 rounded-xl border border-slate-200 shadow-2xs">
                        <NumericInput
                          placeholder="مقدار"
                          value={step.amount}
                          onChange={(val) => handleUpdateStep(idx, 'amount', val)}
                          className="w-24 bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold"
                        />

                        <select
                          value={step.unit}
                          onChange={(e) => handleUpdateStep(idx, 'unit', e.target.value)}
                          className="bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-900 cursor-pointer font-semibold"
                        >
                          {purchaseUnitsList.map((u) => (
                            <option key={u.id} value={u.name}>
                              {u.name}
                            </option>
                          ))}
                        </select>

                        {newChain.steps.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveStepFromNewChain(idx)}
                            className="text-red-400 hover:text-red-600 p-1 cursor-pointer"
                            title="حذف این گام"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>ذخیره زنجیره تبدیل واحد در دیتابیس</span>
                </button>
              </div>
            </form>
          </div>

          {/* Existing Chains List */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center justify-between pb-2 border-b border-slate-100">
              <span>زنجیره‌های تبدیل واحد فعال در سامانه:</span>
              <span className="text-xs text-slate-400 font-mono">
                {toPersianDigits(conversionChainsList.length)} قانون
              </span>
            </h2>

            {conversionChainsList.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                هیچ تبدیل واحدی ثبت نشده است. از فرم بالا برای ثبت تبدیل زنجیره‌ای استفاده کنید.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {conversionChainsList.map((chain) => (
                  <div
                    key={chain.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:border-amber-300 transition flex flex-col justify-between gap-3"
                  >
                    <div>
                      {chain.title && (
                        <div className="text-xs font-bold text-slate-800 mb-1.5">
                          {chain.title}
                        </div>
                      )}
                      <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
                        {(chain.steps || []).map((step, idx) => (
                          <React.Fragment key={idx}>
                            {idx > 0 && <span className="font-bold text-amber-600">=</span>}
                            <span className="bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-slate-900 font-bold">
                              {toPersianDigits(step.amount)} {step.unit}
                            </span>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-end pt-2 border-t border-slate-200/60">
                      <button
                        onClick={() => handleDeleteChain(chain.id)}
                        className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>حذف</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================== TAB 2: PURCHASE UNITS ===================== */}
      {subTab === 'units' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-amber-500" />
                  <span>مدیریت واحدهای خرید و شمارش (واحدهای قابل انتخاب در فاکتور)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  واحدهایی که در فاکتور تأمین‌کنندگان ثبت می‌شوند و در فرم افزودن ماده اولیه قابل انتخاب هستند
                </p>
              </div>
            </div>

            {/* Add Unit Form */}
            <form onSubmit={handleAddPurchaseUnit} className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                required
                placeholder="نام واحد جدید (مثلاً کارتن مرغ، شانه، حلب ۱۶ لیتری...)"
                value={newUnit.name}
                onChange={(e) => setNewUnit({ ...newUnit, name: e.target.value })}
                className="flex-1 min-w-[220px] bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:bg-white"
              />

              <select
                value={newUnit.category}
                onChange={(e) => setNewUnit({ ...newUnit, category: e.target.value })}
                className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 cursor-pointer"
              >
                <option value="بسته‌بندی">بسته‌بندی</option>
                <option value="وزنی">وزنی</option>
                <option value="حجمی">حجمی</option>
                <option value="تعدادی">تعدادی</option>
              </select>

              <button
                type="submit"
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>افزودن واحد</span>
              </button>
            </form>

            {/* Units Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
              {purchaseUnitsList.map((u) => {
                const isEditing = editingUnit && editingUnit.id === u.id;
                return (
                  <div
                    key={u.id}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between text-xs"
                  >
                    {isEditing ? (
                      <div className="flex items-center gap-1 w-full">
                        <input
                          type="text"
                          value={editingUnit.name}
                          onChange={(e) => setEditingUnit({ ...editingUnit, name: e.target.value })}
                          className="flex-1 bg-white border border-slate-300 rounded px-1.5 py-1 text-xs"
                          autoFocus
                        />
                        <button
                          onClick={handleSaveEditUnit}
                          className="text-emerald-600 p-1 cursor-pointer"
                          title="ذخیره"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingUnit(null)}
                          className="text-slate-400 p-1 cursor-pointer"
                          title="انصراف"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div>
                          <div className="font-bold text-slate-900">{u.name}</div>
                          <span className="text-[10px] text-slate-400">{u.category}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditingUnit({ ...u })}
                            className="text-slate-400 hover:text-amber-600 p-1 cursor-pointer"
                            title="ویرایش"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeletePurchaseUnit(u.id)}
                            className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                            title="حذف"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 3: CATEGORIES ===================== */}
      {subTab === 'categories' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-amber-500" />
                  <span>مدیریت دسته‌بندی‌ها (مواد اولیه، کالای واسط و محصولات منو)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  تعریف و ویرایش دسته‌بندی‌هایی که در تمامی فرم‌های تعریف غذا و مواد اولیه نمایش داده می‌شوند
                </p>
              </div>
            </div>

            {/* Add Category Form */}
            <form onSubmit={handleAddCategory} className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                required
                placeholder="نام دسته‌بندی جدید (مثلاً برگر، نوشیدنی، سس...)"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                className="flex-1 min-w-[220px] bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:bg-white"
              />

              <select
                value={newCategory.type}
                onChange={(e) => setNewCategory({ ...newCategory, type: e.target.value })}
                className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 cursor-pointer"
              >
                <option value="material">دسته‌بندی مواد اولیه</option>
                <option value="intermediate">دسته‌بندی کالاهای واسط</option>
                <option value="product">دسته‌بندی محصولات منو</option>
              </select>

              <button
                type="submit"
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>افزودن دسته‌بندی</span>
              </button>
            </form>

            {/* Categories List Grouped */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* Material categories */}
              <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/50 space-y-2">
                <div className="text-xs font-bold text-amber-800 pb-1 border-b border-slate-200">
                  دسته‌بندی‌های مواد اولیه
                </div>
                <div className="space-y-1.5 max-h-80 overflow-y-auto">
                  {categoriesList
                    .filter((c) => c.type === 'material')
                    .map((cat) => (
                      <div
                        key={cat.id}
                        className="bg-white p-2 rounded-lg border border-slate-200 flex items-center justify-between text-xs"
                      >
                        {editingCategory && editingCategory.id === cat.id ? (
                          <div className="flex items-center gap-1 w-full">
                            <input
                              type="text"
                              value={editingCategory.name}
                              onChange={(e) =>
                                setEditingCategory({ ...editingCategory, name: e.target.value })
                              }
                              className="flex-1 bg-slate-50 border border-slate-300 rounded px-1.5 py-0.5 text-xs"
                              autoFocus
                            />
                            <button
                              onClick={handleSaveEditCategory}
                              className="text-emerald-600 p-0.5 cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingCategory(null)}
                              className="text-slate-400 p-0.5 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="font-semibold text-slate-800">{cat.name}</span>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setEditingCategory({ ...cat })}
                                className="text-slate-400 hover:text-amber-600 p-0.5 cursor-pointer"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteCategory(cat.id)}
                                className="text-slate-400 hover:text-red-600 p-0.5 cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                </div>
              </div>

              {/* Intermediate categories */}
              <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/50 space-y-2">
                <div className="text-xs font-bold text-purple-800 pb-1 border-b border-slate-200">
                  دسته‌بندی‌های کالای واسط
                </div>
                <div className="space-y-1.5 max-h-80 overflow-y-auto">
                  {categoriesList
                    .filter((c) => c.type === 'intermediate')
                    .map((cat) => (
                      <div
                        key={cat.id}
                        className="bg-white p-2 rounded-lg border border-slate-200 flex items-center justify-between text-xs"
                      >
                        <span className="font-semibold text-slate-800">{cat.name}</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="text-slate-400 hover:text-red-600 p-0.5 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Product categories */}
              <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/50 space-y-2">
                <div className="text-xs font-bold text-emerald-800 pb-1 border-b border-slate-200">
                  دسته‌بندی‌های منوی نهایی
                </div>
                <div className="space-y-1.5 max-h-80 overflow-y-auto">
                  {categoriesList
                    .filter((c) => c.type === 'product')
                    .map((cat) => (
                      <div
                        key={cat.id}
                        className="bg-white p-2 rounded-lg border border-slate-200 flex items-center justify-between text-xs"
                      >
                        <span className="font-semibold text-slate-800">{cat.name}</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="text-slate-400 hover:text-red-600 p-0.5 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 4: SECURITY & BACKUP ===================== */}
      {subTab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Change Password */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <Lock className="w-4 h-4 text-amber-500" />
              <span>تغییر کلمه عبور مدیر مجموعه</span>
            </h2>

            {passwordMsg && (
              <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-medium">
                {passwordMsg}
              </div>
            )}
            {passwordErr && (
              <div className="p-2.5 bg-red-50 text-red-700 rounded-lg text-xs font-medium">
                {passwordErr}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-2.5">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  کلمه عبور فعلی:
                </label>
                <input
                  type="password"
                  required
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    کلمه عبور جدید:
                  </label>
                  <input
                    type="password"
                    required
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    تکرار کلمه عبور جدید:
                  </label>
                  <input
                    type="password"
                    required
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-lg transition cursor-pointer"
              >
                ذخیره کلمه عبور جدید
              </button>
            </form>
          </div>

          {/* Database Backup & Restore */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100 gap-2">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-emerald-600" />
                <span>پشتیبان‌گیری و بازیابی داده‌ها (انتخاب اکسل XLSX یا JSON)</span>
              </h2>
              {onOpenBackupModal && (
                <button
                  type="button"
                  onClick={onOpenBackupModal}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1 self-start sm:self-auto cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>مرکز پیشرفته پشتیبان‌گیری و بازیابی</span>
                </button>
              )}
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              خروجی اکسل شامل ۷ شیت تفکیک‌شده و مرتب با اطلاعات جامع مواد اولیه، کالاهای واسط، رسپی محصولات منو، واحدهای خرید و ضرایب است. همچنین می‌توانید با آپلود مجدد همان فایل اکسل یا فایل JSON، داده‌های سیستم را به سادگی بازیابی نمایید.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              {/* Excel Download Button */}
              <button
                type="button"
                onClick={() => api.downloadBackup('xlsx')}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>دانلود نسخه اکسل (.xlsx)</span>
              </button>

              {/* JSON Download Button */}
              <button
                type="button"
                onClick={() => api.downloadBackup('json')}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <FileCode className="w-4 h-4 text-amber-400" />
                <span>دانلود نسخه جیسان (.json)</span>
              </button>

              {/* Import Button supporting .xlsx and .json */}
              <label className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer border border-slate-200">
                <Upload className="w-4 h-4 text-indigo-600" />
                <span>بازیابی از فایل (اکسل یا JSON)</span>
                <input
                  type="file"
                  accept=".xlsx,.xls,.json"
                  onChange={handleFileImport}
                  className="hidden"
                />
              </label>

              {/* Reset Default Seed */}
              <button
                type="button"
                onClick={handleResetSeed}
                className="bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-xs px-3 py-2 rounded-xl flex items-center gap-1 transition cursor-pointer border border-red-200 mr-auto"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>بازنشانی به پیش‌فرض</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
