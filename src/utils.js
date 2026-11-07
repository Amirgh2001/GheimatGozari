/**
 * Formatting and Helper Utilities
 */

// Convert English digits to Persian digits
export function toPersianDigits(n) {
  if (n === null || n === undefined) return '';
  const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(n).replace(/[0-9]/g, (w) => farsiDigits[+w]);
}

// Convert Persian/Arabic digits to standard English digits
export function toEnglishDigits(str) {
  if (str === null || str === undefined) return '';
  const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  let result = String(str);
  for (let i = 0; i < 10; i++) {
    result = result.replaceAll(farsiDigits[i], String(i)).replaceAll(arabicDigits[i], String(i));
  }
  // Replace Persian/Arabic decimal separators with dot
  result = result.replace(/[/٫،]/g, '.');
  return result;
}

// Clean and filter number input string while typing
export function sanitizeNumberInput(val, allowDecimals = true) {
  if (val === null || val === undefined) return '';
  const converted = toEnglishDigits(val);
  if (allowDecimals) {
    const cleaned = converted.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('');
    }
    return cleaned;
  }
  return converted.replace(/[^0-9]/g, '');
}

// Convert number to Persian words (e.g. 1500000 -> یک میلیون و پانصد هزار تومان)
export function numberToPersianWords(num) {
  if (num === null || num === undefined || num === '') return '';
  const cleaned = toEnglishDigits(num).replace(/,/g, '');
  const n = Math.floor(Number(cleaned));
  if (isNaN(n)) return '';
  if (n === 0) return 'صفر تومان';
  if (n < 0) return 'منفی ' + numberToPersianWords(-n);

  const yekan = ['', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه'];
  const dahgan = ['', '', 'بیست', 'سی', 'چهل', 'پنجاه', 'شصت', 'هفتاد', 'هشتاد', 'نود'];
  const dahYek = ['ده', 'یازده', 'دوازده', 'سیزده', 'چهارده', 'پانزده', 'شانزده', 'هفده', 'هجده', 'نوزده'];
  const sadgan = ['', 'یکصد', 'دویست', 'سیصد', 'چهارصد', 'پانصد', 'ششصد', 'هفتصد', 'هشتصد', 'نهصد'];
  const scales = ['', 'هزار', 'میلیون', 'میلیارد', 'تریلیون'];

  function threeDigitsToWords(val) {
    const parts = [];
    const s = Math.floor(val / 100);
    const d = Math.floor((val % 100) / 10);
    const y = val % 10;

    if (s > 0) parts.push(sadgan[s]);
    if (d === 1) {
      parts.push(dahYek[y]);
    } else {
      if (d > 1) parts.push(dahgan[d]);
      if (y > 0) parts.push(yekan[y]);
    }
    return parts.join(' و ');
  }

  const chunks = [];
  let temp = n;
  while (temp > 0) {
    chunks.push(temp % 1000);
    temp = Math.floor(temp / 1000);
  }

  const words = [];
  for (let i = chunks.length - 1; i >= 0; i--) {
    const chunk = chunks[i];
    if (chunk > 0) {
      const chunkWord = threeDigitsToWords(chunk);
      const scale = scales[i];
      words.push(scale ? chunkWord + ' ' + scale : chunkWord);
    }
  }

  return words.join(' و ') + ' تومان';
}

// Format price with comma separation and Toman suffix
export function formatToman(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return '۰ تومان';
  const rounded = Math.round(Number(amount));
  const formatted = rounded.toLocaleString('fa-IR');
  return `${formatted} تومان`;
}

// Format number with decimals if needed
export function formatNumber(num, decimals = 1) {
  if (num === null || num === undefined || isNaN(num)) return '۰';
  const val = Number(num);
  const formatted = Number.isInteger(val) ? val.toLocaleString('fa-IR') : val.toFixed(decimals).replace('.', '/');
  return toPersianDigits(formatted);
}

// Format percentage
export function formatPercent(num) {
  if (num === null || num === undefined || isNaN(num)) return '۰٪';
  return `${toPersianDigits(Number(num).toFixed(1))}٪`;
}

// Category Badge Color Mapping
export function getCategoryBadgeClass(category) {
  switch (category) {
    case 'پروتئین':
    case 'نیمه‌آماده گوشتی':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'سبزیجات و صیفی‌جات':
    case 'نیمه‌آماده صیفی':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'خشکبار و غلات':
      return 'bg-amber-50 text-amber-800 border-amber-200';
    case 'لبنیات':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'روغن و چربی':
      return 'bg-yellow-50 text-yellow-800 border-yellow-200';
    case 'چاشنی و سس':
    case 'سس و چاشنی نیمه‌آماده':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'پکیجینگ':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'سوخاری':
    case 'نیمه‌آماده سوخاری':
      return 'bg-orange-50 text-orange-800 border-orange-200';
    case 'پاستا':
      return 'bg-teal-50 text-teal-800 border-teal-200';
    default:
      return 'bg-slate-100 text-slate-750 border-slate-200';
  }
}
