import * as XLSX from 'xlsx';

/**
 * Excel Data Converter for Restaurant Costing & Recipe Book
 * Exports full system data to readable, human-friendly, right-to-left Persian Excel sheets.
 * Imports and parses Excel sheets back into full system JSON structure.
 */

// Helper to sanitize cell values
function cleanStr(val) {
  if (val === null || val === undefined) return '';
  return String(val).trim();
}

/**
 * Export complete database JSON into an Excel (.xlsx) Buffer
 */
export function exportDatabaseToExcel(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('داده‌های ارسالی برای ساخت اکسل نامعتبر است.');
  }

  const wb = XLSX.utils.book_new();

  // Maps for human-friendly names
  const rawMaterials = Array.isArray(data.rawMaterials) ? data.rawMaterials : [];
  const intermediateGoods = Array.isArray(data.intermediateGoods) ? data.intermediateGoods : [];
  const products = Array.isArray(data.products) ? data.products : [];
  const purchaseUnits = Array.isArray(data.purchaseUnits) ? data.purchaseUnits : [];
  const conversionChains = Array.isArray(data.conversionChains) ? data.conversionChains : [];
  const categories = Array.isArray(data.categories) ? data.categories : [];
  const globalUnitConversions = Array.isArray(data.globalUnitConversions) ? data.globalUnitConversions : [];

  const matsMap = new Map(rawMaterials.map((m) => [m.id, m]));
  const intersMap = new Map(intermediateGoods.map((i) => [i.id, i]));

  // ----------------------------------------------------
  // Sheet 1: مواد اولیه (Raw Materials)
  // ----------------------------------------------------
  const rawMatRows = rawMaterials.map((m) => {
    const convStr = (m.customConversions || [])
      .map((c) => `1 ${c.fromUnit} = ${c.factor} ${c.toUnit}`)
      .join(' | ');

    return {
      'شناسه': m.id || '',
      'نام ماده اولیه': m.name || '',
      'دسته‌بندی': m.category || '',
      'واحد خرید': m.purchaseUnit || '',
      'قیمت خرید (تومان)': m.purchasePrice !== undefined ? Number(m.purchasePrice) : '',
      'درصد دورریز (%)': m.wastagePercentage !== undefined ? Number(m.wastagePercentage) : 0,
      'تبدیل‌های سفارشی': convStr,
      'یادداشت‌ها': m.notes || '',
    };
  });
  const wsMaterials = XLSX.utils.json_to_sheet(rawMatRows);
  wsMaterials['!views'] = [{ RTL: true }];
  XLSX.utils.book_append_sheet(wb, wsMaterials, 'مواد اولیه');

  // ----------------------------------------------------
  // Sheet 2: کالاهای واسط (Intermediate Goods)
  // ----------------------------------------------------
  const interRows = intermediateGoods.map((inter) => {
    const ingsStr = (inter.ingredients || [])
      .map((ing) => {
        const isRaw = ing.type === 'raw' || Boolean(ing.materialId);
        const id = ing.materialId || ing.intermediateId || ing.id || '';
        const name = isRaw ? (matsMap.get(id)?.name || id) : (intersMap.get(id)?.name || id);
        const typeLabel = isRaw ? 'خام' : 'واسط';
        return `[${typeLabel}: ${name} (${id})] ${ing.quantity} ${ing.unit}`;
      })
      .join(' | ');

    const ouStr = (inter.outputUnits || [])
      .map((ou) => {
        const id = ou.id || '';
        const amount = ou.amount !== undefined ? ou.amount : ou.weight || '';
        return `[${id}] ${ou.name}: ${amount} ${ou.unit || 'گرم'}`;
      })
      .join(' | ');

    return {
      'شناسه': inter.id || '',
      'نام کالای واسط': inter.name || '',
      'دسته‌بندی': inter.category || '',
      'درصد افت پخت (%)': inter.cookingLossPercentage !== undefined ? Number(inter.cookingLossPercentage) : 0,
      'مقدار خروجی بچ': inter.yieldQuantity !== undefined ? Number(inter.yieldQuantity) : '',
      'واحد خروجی بچ': inter.yieldUnit || 'گرم',
      'مواد تشکیل‌دهنده': ingsStr,
      'واحدهای خروجی و پورشن‌بندی': ouStr,
      'دستورالعمل آماده‌سازی': inter.batchDescription || '',
    };
  });
  const wsIntermediates = XLSX.utils.json_to_sheet(interRows);
  wsIntermediates['!views'] = [{ RTL: true }];
  XLSX.utils.book_append_sheet(wb, wsIntermediates, 'کالاهای واسط');

  // ----------------------------------------------------
  // Sheet 3: محصولات منو (Final Products)
  // ----------------------------------------------------
  const prodRows = products.map((prod) => {
    const recipeStr = (prod.recipeItems || [])
      .map((item) => {
        const isRaw = item.type === 'raw' || Boolean(item.materialId);
        const id = item.materialId || item.intermediateId || item.id || '';
        const name = isRaw ? (matsMap.get(id)?.name || id) : (intersMap.get(id)?.name || id);
        const typeLabel = isRaw ? 'خام' : 'واسط';
        return `[${typeLabel}: ${name} (${id})] ${item.quantity} ${item.unit}`;
      })
      .join(' | ');

    const dineInPkgStr = (prod.dineInPackaging || [])
      .map((pkg) => {
        const id = pkg.materialId || pkg.id || '';
        const name = matsMap.get(id)?.name || id;
        return `[${name} (${id})] ${pkg.quantity} ${pkg.unit || 'عدد'}`;
      })
      .join(' | ');

    const takeoutPkgStr = (prod.takeoutPackaging || [])
      .map((pkg) => {
        const id = pkg.materialId || pkg.id || '';
        const name = matsMap.get(id)?.name || id;
        return `[${name} (${id})] ${pkg.quantity} ${pkg.unit || 'عدد'}`;
      })
      .join(' | ');

    return {
      'شناسه': prod.id || '',
      'نام محصول منو': prod.name || '',
      'دسته‌بندی': prod.category || '',
      'ضریب سود': prod.profitMultiplier !== undefined ? Number(prod.profitMultiplier) : 2.5,
      'اقلام رسپی (فرمول غذا)': recipeStr,
      'پکیجینگ سالن': dineInPkgStr,
      'پکیجینگ بیرون‌بر': takeoutPkgStr,
      'توضیحات': prod.description || '',
      'دستورالعمل پخت': prod.instructions || '',
    };
  });
  const wsProducts = XLSX.utils.json_to_sheet(prodRows);
  wsProducts['!views'] = [{ RTL: true }];
  XLSX.utils.book_append_sheet(wb, wsProducts, 'محصولات منو');

  // ----------------------------------------------------
  // Sheet 4: واحدهای خرید و شمارش (Purchase Units)
  // ----------------------------------------------------
  const unitRows = purchaseUnits.map((u) => ({
    'شناسه': u.id || '',
    'نام واحد': u.name || '',
    'دسته‌بندی واحد': u.category || '',
  }));
  const wsUnits = XLSX.utils.json_to_sheet(unitRows);
  wsUnits['!views'] = [{ RTL: true }];
  XLSX.utils.book_append_sheet(wb, wsUnits, 'واحدهای خرید و شمارش');

  // ----------------------------------------------------
  // Sheet 5: تبدیل واحدها (Conversion Chains)
  // ----------------------------------------------------
  const chainRows = conversionChains.map((chain) => {
    const stepsStr = (chain.steps || [])
      .map((s) => `${s.amount} ${s.unit}`)
      .join(' = ');

    return {
      'شناسه': chain.id || '',
      'عنوان زنجیره تبدیل': chain.title || '',
      'مراحل تبدیل': stepsStr,
    };
  });
  const wsChains = XLSX.utils.json_to_sheet(chainRows);
  wsChains['!views'] = [{ RTL: true }];
  XLSX.utils.book_append_sheet(wb, wsChains, 'تبدیل واحدها');

  // ----------------------------------------------------
  // Sheet 6: دسته‌بندی‌ها (Categories)
  // ----------------------------------------------------
  const catRows = categories.map((c) => ({
    'شناسه': c.id || '',
    'نام دسته‌بندی': c.name || '',
    'نوع دسته‌بندی': c.type || '',
  }));
  const wsCats = XLSX.utils.json_to_sheet(catRows);
  wsCats['!views'] = [{ RTL: true }];
  XLSX.utils.book_append_sheet(wb, wsCats, 'دسته‌بندی‌ها');

  // ----------------------------------------------------
  // Sheet 7: تنظیمات سیستم (Settings & Manager)
  // ----------------------------------------------------
  const meta = data.meta || {};
  const manager = data.manager || {};
  const settingRows = [
    { 'کلید': 'appName', 'عنوان تنظیمات': 'نام سامانه', 'مقدار': meta.appName || 'سامانه جامع قیمت‌گذاری و رسپی‌بوک رستوران' },
    { 'کلید': 'restaurantName', 'عنوان تنظیمات': 'نام مجموعه / رستوران', 'مقدار': manager.restaurantName || '' },
    { 'کلید': 'fullName', 'عنوان تنظیمات': 'نام مدیر ارشد', 'مقدار': manager.fullName || '' },
    { 'کلید': 'username', 'عنوان تنظیمات': 'نام کاربری', 'مقدار': manager.username || 'admin' },
    { 'کلید': 'phone', 'عنوان تنظیمات': 'شماره تماس', 'مقدار': manager.phone || '' },
    { 'کلید': 'defaultProfitMultiplier', 'عنوان تنظیمات': 'ضریب سود پیش‌فرض', 'مقدار': meta.defaultProfitMultiplier || 2.5 },
    { 'کلید': 'backupDate', 'عنوان تنظیمات': 'تاریخ پشتیبان‌گیری', 'مقدار': new Date().toISOString() },
    { 'کلید': 'version', 'عنوان تنظیمات': 'نسخه نرم‌افزار', 'مقدار': meta.version || '1.0.0' },
    { 'کلید': 'passwordHash', 'عنوان تنظیمات': 'هش امنیتی رمز عبور', 'مقدار': manager.passwordHash || '' },
    { 'کلید': 'salt', 'عنوان تنظیمات': 'سالت رمز عبور', 'مقدار': manager.salt || '' },
  ];
  const wsSettings = XLSX.utils.json_to_sheet(settingRows);
  wsSettings['!views'] = [{ RTL: true }];
  XLSX.utils.book_append_sheet(wb, wsSettings, 'تنظیمات سیستم');

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

/**
 * Helper to parse custom conversions string:
 * "1 بسته = 20 کیلوگرم | 1 کارتن = 10 بسته"
 */
function parseCustomConversions(str) {
  if (!str) return [];
  const result = [];
  const parts = String(str).split(/[|;]/);

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    // Format: 1 unitA = 20 unitB  OR  unitA = 20 unitB
    const match = trimmed.match(/^(?:(\d+(?:\.\d+)?)\s+)?([^\s=]+)\s*=\s*(\d+(?:\.\d+)?)\s+([^\s=]+)$/);
    if (match) {
      const baseQty = Number(match[1]) || 1;
      const fromUnit = match[2].trim();
      const targetFactor = Number(match[3]) || 1;
      const toUnit = match[4].trim();
      result.push({
        fromUnit,
        toUnit,
        factor: Number((targetFactor / baseQty).toFixed(4)),
      });
    }
  }
  return result;
}

/**
 * Helper to parse ingredients and recipe items string:
 * "[خام: فیله مرغ خام (mat-123)] 1 کیلوگرم | [واسط: سس (inter-456)] 200 گرم"
 */
function parseRecipeOrIngredients(str, matsByName, intersByName) {
  if (!str) return [];
  const items = [];
  const segments = String(str).split(/[|;\n]/);

  for (const seg of segments) {
    const trimmed = seg.trim();
    if (!trimmed) continue;

    let type = 'raw';
    let id = '';
    let quantity = 1;
    let unit = 'گرم';

    // 1. Check brackets: [type: Name (ID)] or [Name (ID)] or [ID]
    const bracketMatch = trimmed.match(/\[(.*?)\]/);
    let remainder = trimmed;

    if (bracketMatch) {
      const inside = bracketMatch[1].trim();
      remainder = trimmed.replace(bracketMatch[0], '').trim();

      if (inside.includes('واسط') || inside.toLowerCase().includes('intermediate')) {
        type = 'intermediate';
      }

      // Check ID in parens e.g. (mat-123) or (inter-456)
      const idMatch = inside.match(/\((mat-[0-9a-zA-Z_\-]+|inter-[0-9a-zA-Z_\-]+|[a-zA-Z0-9_\-]+)\)/);
      if (idMatch) {
        id = idMatch[1];
      } else {
        // Try to match by name
        const cleanName = inside.replace(/^(خام|واسط|raw|intermediate):\s*/i, '').trim();
        if (type === 'raw') {
          id = matsByName.get(cleanName)?.id || '';
        } else {
          id = intersByName.get(cleanName)?.id || '';
        }
      }
    }

    // 2. Parse quantity and unit from remainder: "1 کیلوگرم" or "250 گرم"
    const qtyUnitMatch = remainder.match(/(\d+(?:\.\d+)?)\s*(.*)$/);
    if (qtyUnitMatch) {
      quantity = Number(qtyUnitMatch[1]) || 1;
      unit = qtyUnitMatch[2].trim() || (type === 'raw' ? 'کیلوگرم' : 'گرم');
    }

    if (id || remainder) {
      items.push({
        type,
        ...(type === 'raw' ? { materialId: id } : { intermediateId: id }),
        quantity,
        unit,
      });
    }
  }

  return items;
}

/**
 * Helper to parse packaging string:
 * "[کرافت بزرگ (mat-123)] 1 عدد | [جعبه (mat-456)] 2 عدد"
 */
function parsePackaging(str, matsByName) {
  if (!str) return [];
  const items = [];
  const segments = String(str).split(/[|;\n]/);

  for (const seg of segments) {
    const trimmed = seg.trim();
    if (!trimmed) continue;

    let materialId = '';
    let quantity = 1;
    let unit = 'عدد';

    const bracketMatch = trimmed.match(/\[(.*?)\]/);
    let remainder = trimmed;

    if (bracketMatch) {
      const inside = bracketMatch[1].trim();
      remainder = trimmed.replace(bracketMatch[0], '').trim();

      const idMatch = inside.match(/\((mat-[0-9a-zA-Z_\-]+|[a-zA-Z0-9_\-]+)\)/);
      if (idMatch) {
        materialId = idMatch[1];
      } else {
        materialId = matsByName.get(inside)?.id || '';
      }
    }

    const qtyUnitMatch = remainder.match(/(\d+(?:\.\d+)?)\s*(.*)$/);
    if (qtyUnitMatch) {
      quantity = Number(qtyUnitMatch[1]) || 1;
      unit = qtyUnitMatch[2].trim() || 'عدد';
    }

    if (materialId) {
      items.push({
        materialId,
        quantity,
        unit,
      });
    }
  }

  return items;
}

/**
 * Helper to parse output units string:
 * "[out-1] چونه خمیر ناپل: 320 گرم | چونه مینی: 180 گرم"
 */
function parseOutputUnits(str) {
  if (!str) return [];
  const units = [];
  const segments = String(str).split(/[|;\n]/);

  for (const seg of segments) {
    const trimmed = seg.trim();
    if (!trimmed) continue;

    let id = `out-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    let remainder = trimmed;

    const bracketMatch = trimmed.match(/\[(.*?)\]/);
    if (bracketMatch) {
      id = bracketMatch[1].trim() || id;
      remainder = trimmed.replace(bracketMatch[0], '').trim();
    }

    // Name: Amount Unit -> "چونه خمیر ناپل: 320 گرم"
    const parts = remainder.split(':');
    let name = '';
    let amount = 1;
    let unit = 'گرم';

    if (parts.length >= 2) {
      name = parts[0].trim();
      const amtUnitMatch = parts[1].trim().match(/(\d+(?:\.\d+)?)\s*(.*)$/);
      if (amtUnitMatch) {
        amount = Number(amtUnitMatch[1]) || 1;
        unit = amtUnitMatch[2].trim() || 'گرم';
      }
    } else {
      name = remainder.trim();
    }

    if (name) {
      units.push({
        id,
        name,
        amount,
        unit,
      });
    }
  }

  return units;
}

/**
 * Helper to parse conversion chains string:
 * "1 تن = 1000 کیلوگرم = 1000000 گرم"
 */
function parseChainSteps(str) {
  if (!str) return [];
  const parts = String(str).split('=');
  const steps = [];

  for (const part of parts) {
    const match = part.trim().match(/(\d+(?:\.\d+)?)\s*(.*)$/);
    if (match) {
      steps.push({
        amount: Number(match[1]) || 1,
        unit: match[2].trim(),
      });
    }
  }

  return steps;
}

/**
 * Import and reconstruct complete database JSON from an Excel (.xlsx/.xls) buffer
 */
export function importDatabaseFromExcel(buffer, existingData = {}) {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const sheetNames = wb.SheetNames || [];

  const findSheet = (keywords) => {
    return sheetNames.find((s) => {
      const lower = s.toLowerCase();
      return keywords.some((k) => lower.includes(k.toLowerCase()));
    });
  };

  const restored = {
    meta: {
      appName: 'سامانه جامع قیمت‌گذاری و رسپی‌بوک رستوران',
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      defaultProfitMultiplier: 2.5,
      ...(existingData.meta || {}),
    },
    manager: {
      username: 'admin',
      fullName: 'مدیر ارشد مجموعه',
      salt: 'cf6b5b617398181d0a35125ee73f3a3f',
      passwordHash: '3bd0ae75e44dd9bc50ca4c0b113f2e5387149a53af108128a1a0a185dc3b1e5b6bab45d86a208f95c98c19bea9a2ad68baf6ae92321ea4eaaed12881de2115db',
      phone: '09123456789',
      restaurantName: 'رستوران و کیچن تخصصی ملل',
      ...(existingData.manager || {}),
    },
    globalUnitConversions: Array.isArray(existingData.globalUnitConversions) ? existingData.globalUnitConversions : [],
    rawMaterials: [],
    intermediateGoods: [],
    products: [],
    purchaseUnits: [],
    conversionChains: [],
    categories: [],
  };

  // 1. Settings & Manager
  const settingsSheetName = findSheet(['تنظیمات', 'settings', 'مدیر', 'meta']);
  if (settingsSheetName) {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[settingsSheetName]) || [];
    for (const r of rows) {
      const key = cleanStr(r['کلید'] || r['key']);
      const title = cleanStr(r['عنوان تنظیمات'] || r['title'] || r['ویژگی']);
      const val = r['مقدار'] !== undefined ? r['مقدار'] : r['value'];

      if (key === 'appName' || title.includes('سامانه')) restored.meta.appName = String(val);
      if (key === 'restaurantName' || title.includes('رستوران') || title.includes('مجموعه')) restored.manager.restaurantName = String(val);
      if (key === 'fullName' || title.includes('مدیر')) restored.manager.fullName = String(val);
      if (key === 'username' || title.includes('کاربری')) restored.manager.username = String(val);
      if (key === 'phone' || title.includes('تماس') || title.includes('تلفن')) restored.manager.phone = String(val);
      if (key === 'defaultProfitMultiplier' || title.includes('ضریب سود')) restored.meta.defaultProfitMultiplier = Number(val) || 2.5;
      if (key === 'passwordHash' || title.includes('هش')) if (val) restored.manager.passwordHash = String(val);
      if (key === 'salt' || title.includes('سالت')) if (val) restored.manager.salt = String(val);
    }
  }

  // 2. Categories
  const catSheetName = findSheet(['دسته‌بندی', 'categories']);
  if (catSheetName) {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[catSheetName]) || [];
    restored.categories = rows.map((r, idx) => ({
      id: cleanStr(r['شناسه'] || r['id']) || `cat-${Date.now()}-${idx}`,
      name: cleanStr(r['نام دسته‌بندی'] || r['نام'] || r['name']),
      type: cleanStr(r['نوع دسته‌بندی'] || r['نوع'] || r['type']) || 'material',
    })).filter((c) => Boolean(c.name));
  }

  // 3. Purchase Units
  const unitsSheetName = findSheet(['واحدهای خرید', 'units', 'واحد']);
  if (unitsSheetName) {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[unitsSheetName]) || [];
    restored.purchaseUnits = rows.map((r, idx) => ({
      id: cleanStr(r['شناسه'] || r['id']) || `u-${Date.now()}-${idx}`,
      name: cleanStr(r['نام واحد'] || r['نام'] || r['name']),
      category: cleanStr(r['دسته‌بندی واحد'] || r['دسته‌بندی'] || r['category']) || 'تعدادی',
    })).filter((u) => Boolean(u.name));
  }

  // 4. Conversion Chains
  const chainsSheetName = findSheet(['تبدیل واحد', 'chains', 'زنجیره']);
  if (chainsSheetName) {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[chainsSheetName]) || [];
    restored.conversionChains = rows.map((r, idx) => ({
      id: cleanStr(r['شناسه'] || r['id']) || `chain-${Date.now()}-${idx}`,
      title: cleanStr(r['عنوان زنجیره تبدیل'] || r['عنوان'] || r['title']),
      steps: parseChainSteps(r['مراحل تبدیل'] || r['مراحل'] || r['steps']),
    })).filter((c) => Boolean(c.title && c.steps.length > 0));
  }

  // 5. Raw Materials
  const matsSheetName = findSheet(['مواد اولیه', 'materials', 'مواد']);
  if (matsSheetName) {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[matsSheetName]) || [];
    restored.rawMaterials = rows.map((r, idx) => ({
      id: cleanStr(r['شناسه'] || r['id']) || `mat-${Date.now()}-${idx}`,
      name: cleanStr(r['نام ماده اولیه'] || r['نام'] || r['name']),
      category: cleanStr(r['دسته‌بندی'] || r['category']) || 'سایر',
      purchaseUnit: cleanStr(r['واحد خرید'] || r['purchaseUnit']) || 'کیلوگرم',
      purchasePrice: Number(r['قیمت خرید (تومان)'] !== undefined ? r['قیمت خرید (تومان)'] : r['purchasePrice']) || 0,
      wastagePercentage: Number(r['درصد دورریز (%)'] !== undefined ? r['درصد دورریز (%)'] : r['wastagePercentage']) || 0,
      customConversions: parseCustomConversions(r['تبدیل‌های سفارشی'] || r['customConversions']),
      notes: cleanStr(r['یادداشت‌ها'] || r['notes']),
    })).filter((m) => Boolean(m.name));
  }

  // Maps for resolving ingredients & packaging
  const matsByName = new Map(restored.rawMaterials.map((m) => [m.name, m]));

  // 6. Intermediate Goods
  const interSheetName = findSheet(['کالاهای واسط', 'intermediates', 'نیمه‌آماده', 'واسط']);
  if (interSheetName) {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[interSheetName]) || [];
    restored.intermediateGoods = rows.map((r, idx) => {
      const name = cleanStr(r['نام کالای واسط'] || r['نام'] || r['name']);
      const id = cleanStr(r['شناسه'] || r['id']) || `inter-${Date.now()}-${idx}`;
      return {
        id,
        name,
        category: cleanStr(r['دسته‌بندی'] || r['category']) || 'نیمه‌آماده گوشتی',
        cookingLossPercentage: Number(r['درصد افت پخت (%)'] !== undefined ? r['درصد افت پخت (%)'] : r['cookingLossPercentage']) || 0,
        yieldQuantity: Number(r['مقدار خروجی بچ'] || 1) || 1,
        yieldUnit: cleanStr(r['واحد خروجی بچ'] || r['yieldUnit']) || 'گرم',
        ingredients: parseRecipeOrIngredients(r['مواد تشکیل‌دهنده'] || r['ingredients'], matsByName, new Map()),
        outputUnits: parseOutputUnits(r['واحدهای خروجی و پورشن‌بندی'] || r['outputUnits']),
        batchDescription: cleanStr(r['دستورالعمل آماده‌سازی'] || r['batchDescription'] || r['توضیحات']),
      };
    }).filter((i) => Boolean(i.name));
  }

  const intersByName = new Map(restored.intermediateGoods.map((i) => [i.name, i]));

  // 7. Products
  const prodSheetName = findSheet(['محصولات منو', 'products', 'محصولات', 'غذا']);
  if (prodSheetName) {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[prodSheetName]) || [];
    restored.products = rows.map((r, idx) => {
      const name = cleanStr(r['نام محصول منو'] || r['نام'] || r['name']);
      const id = cleanStr(r['شناسه'] || r['id']) || `prod-${Date.now()}-${idx}`;
      return {
        id,
        name,
        category: cleanStr(r['دسته‌بندی'] || r['category']) || 'سوخاری',
        profitMultiplier: Number(r['ضریب سود'] !== undefined ? r['ضریب سود'] : r['profitMultiplier']) || 2.5,
        recipeItems: parseRecipeOrIngredients(r['اقلام رسپی (فرمول غذا)'] || r['recipeItems'] || r['رسپی'], matsByName, intersByName),
        dineInPackaging: parsePackaging(r['پکیجینگ سالن'] || r['dineInPackaging'], matsByName),
        takeoutPackaging: parsePackaging(r['پکیجینگ بیرون‌بر'] || r['takeoutPackaging'], matsByName),
        description: cleanStr(r['توضیحات'] || r['description']),
        instructions: cleanStr(r['دستورالعمل پخت'] || r['instructions']),
      };
    }).filter((p) => Boolean(p.name));
  }

  // Fallbacks if some sheets were omitted
  if (restored.categories.length === 0 && existingData.categories?.length > 0) {
    restored.categories = existingData.categories;
  }
  if (restored.purchaseUnits.length === 0 && existingData.purchaseUnits?.length > 0) {
    restored.purchaseUnits = existingData.purchaseUnits;
  }
  if (restored.conversionChains.length === 0 && existingData.conversionChains?.length > 0) {
    restored.conversionChains = existingData.conversionChains;
  }

  return restored;
}
