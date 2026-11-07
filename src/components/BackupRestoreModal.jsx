import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  Upload,
  FileSpreadsheet,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Database,
  Layers,
  ShoppingBag,
  Wheat,
  Scale,
} from 'lucide-react';
import { api } from '../api.js';

export default function BackupRestoreModal({
  isOpen,
  onClose,
  onRefreshData,
}) {
  const [downloadingFormat, setDownloadingFormat] = useState(null); // 'xlsx' | 'json' | null
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileDetails, setFileDetails] = useState(null);
  const [importing, setImporting] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null); // { type: 'success' | 'error', text: '' }

  // Escape key & body scroll lock
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

  // Reset state when closed
  useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null);
      setFileDetails(null);
      setStatusMsg(null);
      setImporting(false);
      setDownloadingFormat(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle Export Download
  const handleDownload = async (format) => {
    setDownloadingFormat(format);
    setStatusMsg(null);
    try {
      await api.downloadBackup(format);
      setStatusMsg({
        type: 'success',
        text: `فایل پشتیبان ${format === 'xlsx' ? 'اکسل (.xlsx)' : 'جیسان (.json)'} با موفقیت دانلود شد.`,
      });
    } catch (err) {
      setStatusMsg({
        type: 'error',
        text: err.message || 'خطا در دریافت فایل پشتیبان از سرور.',
      });
    } finally {
      setDownloadingFormat(null);
    }
  };

  // Handle File Selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    const isExcel = ext === 'xlsx' || ext === 'xls';
    const isJson = ext === 'json';

    if (!isExcel && !isJson) {
      setStatusMsg({
        type: 'error',
        text: 'فرمت فایل انتخاب‌شده پشتیبانی نمی‌شود. لطفاً فایل با پسوند .xlsx یا .json انتخاب نمایید.',
      });
      return;
    }

    setSelectedFile(file);
    setFileDetails({
      name: file.name,
      sizeKb: Math.round(file.size / 1024),
      type: isExcel ? 'excel' : 'json',
    });
    setStatusMsg(null);
  };

  // Execute Restore (Import)
  const handleExecuteImport = async () => {
    if (!selectedFile) return;

    if (!window.confirm(`آیا از بازیابی اطلاعات از فایل «${selectedFile.name}» اطمینان دارید؟ داده‌های فعلی سیستم با این فایل جایگزین خواهند شد.`)) {
      return;
    }

    setImporting(true);
    setStatusMsg(null);

    try {
      const ext = selectedFile.name.split('.').pop()?.toLowerCase();
      const isExcel = ext === 'xlsx' || ext === 'xls';

      if (isExcel) {
        // Read as ArrayBuffer and send as base64
        const buffer = await selectedFile.arrayBuffer();
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64 = window.btoa(binary);

        const res = await api.importExcelData(base64);
        setStatusMsg({
          type: 'success',
          text: res.message || 'اطلاعات فایل اکسل با موفقیت بازخوانی و در سیستم جایگزین شد.',
        });
      } else {
        // Read as Text JSON
        const text = await selectedFile.text();
        const json = JSON.parse(text);
        const res = await api.importData(json);
        setStatusMsg({
          type: 'success',
          text: res.message || 'اطلاعات فایل JSON با موفقیت بازیابی شد.',
        });
      }

      if (onRefreshData) {
        await onRefreshData();
      }
      setSelectedFile(null);
      setFileDetails(null);
    } catch (err) {
      console.error('Error importing backup:', err);
      setStatusMsg({
        type: 'error',
        text: 'خطا در بازیابی اطلاعات: ' + (err.message || 'فایل نامعتبر است.'),
      });
    } finally {
      setImporting(false);
    }
  };

  // Handle Reset to Default Seed
  const handleResetDefaults = async () => {
    if (!window.confirm('هشدار جدی: آیا می‌خواهید تمام داده‌های سامانه به مقادیر پیش‌فرض اولیه بازنشانی شوند؟')) {
      return;
    }

    try {
      await api.resetData();
      setStatusMsg({
        type: 'success',
        text: 'داده‌های سامانه با موفقیت به مقادیر اولیه پیش‌فرض بازنشانی شدند.',
      });
      if (onRefreshData) onRefreshData();
    } catch (err) {
      setStatusMsg({
        type: 'error',
        text: err.message || 'خطا در بازنشانی داده‌ها.',
      });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/75 backdrop-blur-xs p-3 sm:p-6"
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
          className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-4 sm:my-8"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-sm sm:text-base">
                  مرکز پشتیبان‌گیری و بازیابی اطلاعات سامانه
                </h2>
                <span className="text-[11px] text-slate-400">
                  خروجی و ورودی داده‌ها با پشتیبانی کامل از فایل اکسل (XLSX) و جیسان (JSON)
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

          <div className="p-6 space-y-6">
            {/* Status Alert Banner */}
            {statusMsg && (
              <div
                className={`p-3.5 rounded-xl text-xs sm:text-sm flex items-start gap-2.5 ${
                  statusMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {statusMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                )}
                <span className="font-medium leading-relaxed">{statusMsg.text}</span>
              </div>
            )}

            {/* Section 1: Backup Export Choices */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-emerald-600" />
                  <span>دانلود نسخه پشتیبان (خروجی دیتا)</span>
                </h3>
                <span className="text-[11px] text-slate-400 font-medium">
                  فرمت دلخواه خود را انتخاب کنید
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Option 1: Excel (.xlsx) */}
                <div className="p-4 rounded-xl border-2 border-emerald-500/30 bg-emerald-50/20 hover:bg-emerald-50/40 hover:border-emerald-500 transition space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                          X
                        </div>
                        <span className="font-bold text-slate-900 text-xs sm:text-sm">
                          خروجی اکسل (Excel .xlsx)
                        </span>
                      </div>
                      <span className="text-[10px] bg-emerald-600/10 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-600/20">
                        پیشنهادی
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      ۷ شیت مجزا و مرتب با جهت راست‌چین: مواد اولیه، کالاهای واسط، محصولات منو، واحدهای خرید، زنجیره‌های تبدیل، دسته‌بندی‌ها و تنظیمات سیستم.
                    </p>
                  </div>

                  <button
                    onClick={() => handleDownload('xlsx')}
                    disabled={downloadingFormat !== null}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 text-white font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>
                      {downloadingFormat === 'xlsx' ? 'در حال آماده‌سازی اکسل...' : 'دانلود فایل اکسل (.xlsx)'}
                    </span>
                  </button>
                </div>

                {/* Option 2: JSON (.json) */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 hover:border-slate-300 transition space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-slate-800 text-amber-400 flex items-center justify-center font-bold text-xs">
                          { }
                        </div>
                        <span className="font-bold text-slate-900 text-xs sm:text-sm">
                          خروجی جیسان (JSON)
                        </span>
                      </div>
                      <span className="text-[10px] bg-slate-200 text-slate-700 font-semibold px-2 py-0.5 rounded-full">
                        فرمت فنی
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      فایل ساختاریافته استاندارد جهت ذخیره امن در دیتابیس‌ها، آرشیوهای دوره‌ای، سرورهای دیگر یا انتقال نرم‌افزاری.
                    </p>
                  </div>

                  <button
                    onClick={() => handleDownload('json')}
                    disabled={downloadingFormat !== null}
                    className="w-full bg-slate-800 hover:bg-slate-700 disabled:bg-slate-300 text-white font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer"
                  >
                    <FileCode className="w-4 h-4 text-amber-400" />
                    <span>
                      {downloadingFormat === 'json' ? 'در حال ساخت فایل...' : 'دانلود فایل JSON (.json)'}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-100" />

            {/* Section 2: Restore from Backup (JSON / Excel) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-indigo-600" />
                  <span>بازیابی نسخه پشتیبان (آپلود اکسل یا جیسان)</span>
                </h3>
                <span className="text-[10px] bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded-full border border-indigo-100">
                  پشتیبانی از XLSX و JSON
                </span>
              </div>

              <div className="border-2 border-dashed border-slate-200 hover:border-amber-400 rounded-2xl p-5 text-center transition bg-slate-50/50">
                <input
                  type="file"
                  id="backup-file-input"
                  accept=".xlsx,.xls,.json"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {!selectedFile ? (
                  <label
                    htmlFor="backup-file-input"
                    className="flex flex-col items-center justify-center cursor-pointer space-y-2 py-2"
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 hover:underline">
                        برای انتخاب فایل پشتیبان (اکسل یا JSON) کلیک کنید
                      </span>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        فایل‌های اکسل خروجی گرفته‌شده از سامانه (.xlsx) یا فایل‌های JSON
                      </p>
                    </div>
                  </label>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 text-right">
                      <div className="flex items-center gap-2.5">
                        {fileDetails?.type === 'excel' ? (
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                            XLSX
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
                            JSON
                          </div>
                        )}
                        <div>
                          <div className="text-xs font-bold text-slate-900 truncate max-w-xs sm:max-w-md">
                            {fileDetails?.name}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            حجم فایل: {fileDetails?.sizeKb} کیلوبایت • فرمت: {fileDetails?.type === 'excel' ? 'اکسل مایکروسافت' : 'جیسان استاندارد'}
                          </div>
                        </div>
                      </div>

                      <label
                        htmlFor="backup-file-input"
                        className="text-xs text-amber-600 hover:text-amber-700 font-bold hover:underline cursor-pointer pr-3"
                      >
                        تغییر فایل
                      </label>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFile(null);
                          setFileDetails(null);
                        }}
                        className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer"
                      >
                        انصراف از این فایل
                      </button>

                      <button
                        type="button"
                        onClick={handleExecuteImport}
                        disabled={importing}
                        className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>
                          {importing ? 'در حال بازخوانی و اعمال اطلاعات...' : 'شروع بازیابی اطلاعات در سامانه'}
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer and Reset Seed */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <button
                type="button"
                onClick={handleResetDefaults}
                className="text-red-600 hover:text-red-700 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>بازنشانی به داده‌های پیش‌فرض اولیه</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-800 transition cursor-pointer"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
