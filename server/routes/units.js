import express from 'express';
import { db } from '../db.js';
import { requireManagerAuth } from '../auth.js';
import { STANDARD_UNITS } from '../costEngine.js';

const router = express.Router();

// Get standard units, categories, purchase units, and conversion chains
router.get('/', requireManagerAuth, (req, res) => {
  return res.json({
    standardUnits: STANDARD_UNITS,
    categories: db.data.categories || [],
    purchaseUnits: db.data.purchaseUnits || [],
    conversionChains: db.data.conversionChains || [],
    globalConversions: [
      ...(db.data.conversionChains || []),
      ...(db.data.globalUnitConversions || []),
    ],
  });
});

// =================== CATEGORIES CRUD ===================

// Add Category
router.post('/categories', requireManagerAuth, (req, res) => {
  const { name, type = 'material' } = req.body;
  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: 'نام دسته‌بندی الزامی است.' });
  }

  const trimmedName = String(name).trim();
  if (!db.data.categories) db.data.categories = [];

  const existing = db.data.categories.find(
    (c) => c.name.toLowerCase() === trimmedName.toLowerCase() && c.type === type
  );
  if (existing) {
    return res.status(400).json({ error: 'این دسته‌بندی قبلاً تعریف شده است.' });
  }

  const newCat = {
    id: `cat-${Date.now()}`,
    name: trimmedName,
    type: String(type).trim(),
  };

  db.data.categories.push(newCat);
  db.save();

  return res.status(201).json(newCat);
});

// Update Category
router.put('/categories/:id', requireManagerAuth, (req, res) => {
  const { id } = req.params;
  const { name, type } = req.body;

  if (!db.data.categories) db.data.categories = [];
  const cat = db.data.categories.find((c) => c.id === id);
  if (!cat) {
    return res.status(404).json({ error: 'دسته‌بندی یافت نشد.' });
  }

  if (name !== undefined) cat.name = String(name).trim();
  if (type !== undefined) cat.type = String(type).trim();

  db.save();
  return res.json(cat);
});

// Delete Category
router.delete('/categories/:id', requireManagerAuth, (req, res) => {
  const { id } = req.params;
  if (!db.data.categories) db.data.categories = [];

  const idx = db.data.categories.findIndex((c) => c.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'دسته‌بندی یافت نشد.' });
  }

  const deleted = db.data.categories.splice(idx, 1)[0];
  db.save();

  return res.json({ success: true, message: 'دسته‌بندی حذف شد.', deleted });
});

// =================== PURCHASE UNITS CRUD ===================

// Add Purchase Unit
router.post('/purchase-units', requireManagerAuth, (req, res) => {
  const { name, category = 'سایر' } = req.body;
  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: 'نام واحد خرید الزامی است.' });
  }

  const trimmedName = String(name).trim();
  if (!db.data.purchaseUnits) db.data.purchaseUnits = [];

  const existing = db.data.purchaseUnits.find(
    (u) => u.name.toLowerCase() === trimmedName.toLowerCase()
  );
  if (existing) {
    return res.status(400).json({ error: 'این واحد قبلاً تعریف شده است.' });
  }

  const newUnit = {
    id: `u-${Date.now()}`,
    name: trimmedName,
    category: String(category).trim(),
  };

  db.data.purchaseUnits.push(newUnit);
  db.save();

  return res.status(201).json(newUnit);
});

// Update Purchase Unit
router.put('/purchase-units/:id', requireManagerAuth, (req, res) => {
  const { id } = req.params;
  const { name, category } = req.body;

  if (!db.data.purchaseUnits) db.data.purchaseUnits = [];
  const u = db.data.purchaseUnits.find((unit) => unit.id === id);
  if (!u) {
    return res.status(404).json({ error: 'واحد یافت نشد.' });
  }

  if (name !== undefined) u.name = String(name).trim();
  if (category !== undefined) u.category = String(category).trim();

  db.save();
  return res.json(u);
});

// Delete Purchase Unit
router.delete('/purchase-units/:id', requireManagerAuth, (req, res) => {
  const { id } = req.params;
  if (!db.data.purchaseUnits) db.data.purchaseUnits = [];

  const idx = db.data.purchaseUnits.findIndex((u) => u.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'واحد یافت نشد.' });
  }

  const deleted = db.data.purchaseUnits.splice(idx, 1)[0];
  db.save();

  return res.json({ success: true, message: 'واحد خرید حذف شد.', deleted });
});

// =================== MULTI-STEP CONVERSION CHAINS ===================

// Add Multi-step Conversion Chain
router.post('/chains', requireManagerAuth, (req, res) => {
  const { title, steps } = req.body;

  if (!steps || !Array.isArray(steps) || steps.length < 2) {
    return res.status(400).json({ error: 'حداقل ۲ مرحله برای زنجیره تبدیل واحد الزامی است.' });
  }

  for (const step of steps) {
    if (!step.unit || Number(step.amount) <= 0) {
      return res.status(400).json({ error: 'مقدار و واحد برای تمامی مراحل تبدیل الزامی است.' });
    }
  }

  const id = `chain-${Date.now()}`;
  const newChain = {
    id,
    title: title ? String(title).trim() : `تبدیل ${steps[0].unit} به ${steps[steps.length - 1].unit}`,
    steps: steps.map((s) => ({
      amount: Number(s.amount),
      unit: String(s.unit).trim(),
    })),
  };

  if (!db.data.conversionChains) db.data.conversionChains = [];
  db.data.conversionChains.push(newChain);
  db.save();

  return res.status(201).json(newChain);
});

// Update Conversion Chain
router.put('/chains/:id', requireManagerAuth, (req, res) => {
  const { id } = req.params;
  const { title, steps } = req.body;

  if (!db.data.conversionChains) db.data.conversionChains = [];
  const chain = db.data.conversionChains.find((c) => c.id === id);
  if (!chain) {
    return res.status(404).json({ error: 'زنجیره تبدیل یافت نشد.' });
  }

  if (steps && Array.isArray(steps) && steps.length >= 2) {
    chain.steps = steps.map((s) => ({
      amount: Number(s.amount),
      unit: String(s.unit).trim(),
    }));
  }
  if (title !== undefined) chain.title = String(title).trim();

  db.save();
  return res.json(chain);
});

// Delete Conversion Chain
router.delete('/chains/:id', requireManagerAuth, (req, res) => {
  const { id } = req.params;
  if (!db.data.conversionChains) db.data.conversionChains = [];

  const idx = db.data.conversionChains.findIndex((c) => c.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'زنجیره تبدیل یافت نشد.' });
  }

  const deleted = db.data.conversionChains.splice(idx, 1)[0];
  db.save();

  return res.json({ success: true, message: 'زنجیره تبدیل حذف شد.', deleted });
});

// Legacy single conversion support
router.post('/conversions', requireManagerAuth, (req, res) => {
  const { fromUnit, toUnit, factor, notes } = req.body;
  if (!fromUnit || !toUnit || !factor) {
    return res.status(400).json({ error: 'واحدها و ضریب تبدیل الزامی است.' });
  }

  const newChain = {
    id: `chain-${Date.now()}`,
    title: notes || `تبدیل ${fromUnit} به ${toUnit}`,
    steps: [
      { amount: 1, unit: String(fromUnit).trim() },
      { amount: Number(factor), unit: String(toUnit).trim() },
    ],
  };

  if (!db.data.conversionChains) db.data.conversionChains = [];
  db.data.conversionChains.push(newChain);
  db.save();

  return res.status(201).json(newChain);
});

router.delete('/conversions/:id', requireManagerAuth, (req, res) => {
  const { id } = req.params;
  if (!db.data.conversionChains) db.data.conversionChains = [];

  const idx = db.data.conversionChains.findIndex((c) => c.id === id);
  if (idx !== -1) {
    const deleted = db.data.conversionChains.splice(idx, 1)[0];
    db.save();
    return res.json({ success: true, deleted });
  }

  return res.status(404).json({ error: 'تبدیل یافت نشد.' });
});

export default router;
