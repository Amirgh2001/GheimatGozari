import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { hashPassword } from './auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isVercel = Boolean(process.env.VERCEL);
const DATA_DIR = isVercel ? '/tmp' : path.join(__dirname, 'data');
const SEED_FILE = path.join(__dirname, 'data', 'restaurant_data.json');
const DATA_FILE = path.join(DATA_DIR, 'restaurant_data.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (err) {
    console.warn('Could not create DATA_DIR:', err);
  }
}

export function getDefaultSeedData() {
  const adminAuth = hashPassword('admin123456');

  return {
    meta: {
      appName: 'سامانه جامع قیمت‌گذاری و رسپی‌بوک رستوران',
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      defaultProfitMultiplier: 2.5,
    },
    manager: {
      username: 'admin',
      fullName: 'مدیر ارشد مجموعه',
      salt: adminAuth.salt,
      passwordHash: adminAuth.hash,
      phone: '09123456789',
      restaurantName: 'رستوران و کیچن تخصصی ملل',
    },
    categories: [
      { id: 'cat-1', name: 'پروتئین', type: 'material' },
      { id: 'cat-2', name: 'سبزیجات و صیفی‌جات', type: 'material' },
      { id: 'cat-3', name: 'خشکبار و غلات', type: 'material' },
      { id: 'cat-4', name: 'لبنیات', type: 'material' },
      { id: 'cat-5', name: 'روغن و چربی', type: 'material' },
      { id: 'cat-6', name: 'چاشنی و سس', type: 'material' },
      { id: 'cat-7', name: 'پکیجینگ', type: 'material' },
      { id: 'cat-8', name: 'نان و شیرینی', type: 'material' },
      { id: 'cat-9', name: 'نوشیدنی', type: 'material' },
      { id: 'cat-10', name: 'سایر', type: 'material' },
      // Intermediates
      { id: 'cat-11', name: 'نیمه‌آماده گوشتی', type: 'intermediate' },
      { id: 'cat-12', name: 'نیمه‌آماده صیفی', type: 'intermediate' },
      { id: 'cat-13', name: 'سس و چاشنی نیمه‌آماده', type: 'intermediate' },
      // Products
      { id: 'cat-14', name: 'سوخاری', type: 'product' },
      { id: 'cat-15', name: 'پاستا', type: 'product' },
      { id: 'cat-16', name: 'برگر و ساندویچ', type: 'product' },
      { id: 'cat-17', name: 'پیتزا', type: 'product' },
      { id: 'cat-18', name: 'پیش‌غذا و سالاد', type: 'product' },
    ],
    purchaseUnits: [
      { id: 'u-1', name: 'کیلوگرم', category: 'وزنی' },
      { id: 'u-2', name: 'گرم', category: 'وزنی' },
      { id: 'u-3', name: 'تن', category: 'وزنی' },
      { id: 'u-4', name: 'لیتر', category: 'حجمی' },
      { id: 'u-5', name: 'میلی‌لیتر', category: 'حجمی' },
      { id: 'u-6', name: 'عدد', category: 'تعدادی' },
      { id: 'u-7', name: 'پرس', category: 'تعدادی' },
      { id: 'u-8', name: 'بسته', category: 'بسته‌بندی' },
      { id: 'u-9', name: 'کیسه', category: 'بسته‌بندی' },
      { id: 'u-10', name: 'کیسه بزرگ', category: 'بسته‌بندی' },
      { id: 'u-11', name: 'حلب', category: 'بسته‌بندی' },
      { id: 'u-12', name: 'قوطی', category: 'بسته‌بندی' },
      { id: 'u-13', name: 'کارتن', category: 'بسته‌بندی' },
      { id: 'u-14', name: 'کارتن مرغ', category: 'بسته‌بندی' },
      { id: 'u-15', name: 'کارتن تخم مرغ', category: 'بسته‌بندی' },
      { id: 'u-16', name: 'شانه', category: 'بسته‌بندی' },
      { id: 'u-17', name: 'بطری', category: 'بسته‌بندی' },
      { id: 'u-18', name: 'پاکت', category: 'بسته‌بندی' },
      { id: 'u-19', name: 'قالب', category: 'بسته‌بندی' },
    ],
    conversionChains: [
      {
        id: 'chain-1',
        title: 'تن به کیلوگرم و گرم',
        steps: [
          { amount: 1, unit: 'تن' },
          { amount: 1000, unit: 'کیلوگرم' },
          { amount: 1000000, unit: 'گرم' },
        ],
      },
      {
        id: 'chain-2',
        title: 'لیتر به میلی‌لیتر',
        steps: [
          { amount: 1, unit: 'لیتر' },
          { amount: 1000, unit: 'میلی‌لیتر' },
        ],
      },
      {
        id: 'chain-3',
        title: 'کارتن تخم مرغ به شانه و عدد',
        steps: [
          { amount: 1, unit: 'کارتن تخم مرغ' },
          { amount: 6, unit: 'شانه' },
          { amount: 180, unit: 'عدد' },
        ],
      },
      {
        id: 'chain-4',
        title: 'دوجین به عدد',
        steps: [
          { amount: 1, unit: 'دوجین' },
          { amount: 12, unit: 'عدد' },
        ],
      },
    ],
    globalUnitConversions: [],
    rawMaterials: [],
    intermediateGoods: [],
    products: [],
  };
}

class RestaurantDatabase {
  constructor() {
    this.data = null;
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const content = fs.readFileSync(DATA_FILE, 'utf-8');
        this.data = JSON.parse(content);
      } else if (fs.existsSync(SEED_FILE)) {
        const content = fs.readFileSync(SEED_FILE, 'utf-8');
        this.data = JSON.parse(content);
        if (isVercel) {
          this.save();
        }
      } else {
        this.data = getDefaultSeedData();
        this.save();
      }

      // Ensure new collections exist even on existing database files
      const defaults = getDefaultSeedData();
      if (!this.data.categories || this.data.categories.length === 0) {
        this.data.categories = defaults.categories;
      }
      if (!this.data.purchaseUnits || this.data.purchaseUnits.length === 0) {
        this.data.purchaseUnits = defaults.purchaseUnits;
      }
      if (!this.data.conversionChains || this.data.conversionChains.length === 0) {
        this.data.conversionChains = defaults.conversionChains;
      }
      this.save();
    } catch (err) {
      console.error('Error reading restaurant database, initializing seed:', err);
      this.data = getDefaultSeedData();
      this.save();
    }
  }

  save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      this.data.meta.lastUpdated = new Date().toISOString();
      const tempPath = `${DATA_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tempPath, DATA_FILE);
      return true;
    } catch (err) {
      console.error('Error saving restaurant database:', err);
      return false;
    }
  }

  // Backup data
  backup() {
    try {
      const backupDir = path.join(DATA_DIR, 'backups');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = path.join(backupDir, `backup_${timestamp}.json`);
      fs.writeFileSync(backupFile, JSON.stringify(this.data, null, 2), 'utf-8');
      return backupFile;
    } catch (err) {
      console.warn('Backup could not be written:', err);
      return null;
    }
  }

  // Reset to default
  resetToDefaults() {
    this.data = getDefaultSeedData();
    this.save();
    return this.data;
  }
}

export const db = new RestaurantDatabase();
