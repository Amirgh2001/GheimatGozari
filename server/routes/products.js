import express from 'express';
import { db } from '../db.js';
import { requireManagerAuth } from '../auth.js';
import { calculateProductCost, getAllConversions } from '../costEngine.js';

const router = express.Router();

function getMaps() {
  const materialsMap = new Map((db.data.rawMaterials || []).map((m) => [m.id, m]));
  const intermediatesMap = new Map((db.data.intermediateGoods || []).map((i) => [i.id, i]));
  return { materialsMap, intermediatesMap };
}

// Get all products with dynamic cost calculations
router.get('/', requireManagerAuth, (req, res) => {
  const { materialsMap, intermediatesMap } = getMaps();
  const globalConversions = getAllConversions(db);

  const results = (db.data.products || []).map((prod) => {
    return calculateProductCost(prod, intermediatesMap, materialsMap, globalConversions);
  });

  return res.json(results);
});

// Get single product with full recipe sheet
router.get('/:id', requireManagerAuth, (req, res) => {
  const { id } = req.params;
  const { materialsMap, intermediatesMap } = getMaps();
  const globalConversions = getAllConversions(db);

  const prod = (db.data.products || []).find((p) => p.id === id);
  if (!prod) {
    return res.status(404).json({ error: 'محصول نهایی مورد نظر یافت نشد.' });
  }

  const result = calculateProductCost(prod, intermediatesMap, materialsMap, globalConversions);
  return res.json(result);
});

// Create product
router.post('/', requireManagerAuth, (req, res) => {
  const {
    name,
    category,
    description,
    instructions,
    profitMultiplier,
    recipeItems,
    dineInPackaging,
    takeoutPackaging,
  } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'نام محصول نهایی الزامی است.' });
  }

  const id = `prod-${Date.now()}`;
  const newProduct = {
    id,
    name: String(name).trim(),
    category: category ? String(category).trim() : 'غذای اصلی',
    description: description ? String(description).trim() : '',
    instructions: instructions ? String(instructions).trim() : '',
    profitMultiplier: Number(profitMultiplier) || 2.5,
    recipeItems: Array.isArray(recipeItems) ? recipeItems : [],
    dineInPackaging: Array.isArray(dineInPackaging) ? dineInPackaging : [],
    takeoutPackaging: Array.isArray(takeoutPackaging) ? takeoutPackaging : [],
  };

  db.data.products.push(newProduct);
  db.save();

  const { materialsMap, intermediatesMap } = getMaps();
  const globalConversions = getAllConversions(db);
  const calculated = calculateProductCost(newProduct, intermediatesMap, materialsMap, globalConversions);

  return res.status(201).json(calculated);
});

// Update product
router.put('/:id', requireManagerAuth, (req, res) => {
  const { id } = req.params;
  const index = db.data.products.findIndex((p) => p.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'محصول نهایی یافت نشد.' });
  }

  const existing = db.data.products[index];
  const {
    name,
    category,
    description,
    instructions,
    profitMultiplier,
    recipeItems,
    dineInPackaging,
    takeoutPackaging,
  } = req.body;

  if (name !== undefined) existing.name = String(name).trim();
  if (category !== undefined) existing.category = String(category).trim();
  if (description !== undefined) existing.description = String(description).trim();
  if (instructions !== undefined) existing.instructions = String(instructions).trim();
  if (profitMultiplier !== undefined) existing.profitMultiplier = Number(profitMultiplier) || 2.5;
  delete existing.portionSize;
  delete existing.sellingPriceDineIn;
  delete existing.sellingPriceTakeout;
  if (recipeItems !== undefined) existing.recipeItems = recipeItems;
  if (dineInPackaging !== undefined) existing.dineInPackaging = dineInPackaging;
  if (takeoutPackaging !== undefined) existing.takeoutPackaging = takeoutPackaging;

  db.save();

  const { materialsMap, intermediatesMap } = getMaps();
  const globalConversions = getAllConversions(db);
  const calculated = calculateProductCost(existing, intermediatesMap, materialsMap, globalConversions);

  return res.json(calculated);
});

// Delete product
router.delete('/:id', requireManagerAuth, (req, res) => {
  const { id } = req.params;
  const index = db.data.products.findIndex((p) => p.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'محصول نهایی یافت نشد.' });
  }

  const deleted = db.data.products.splice(index, 1)[0];
  db.save();

  return res.json({ success: true, message: 'محصول نهایی با موفقیت حذف شد.', deleted });
});

// Quick update of profit multiplier
router.patch('/:id/multiplier', requireManagerAuth, (req, res) => {
  const { id } = req.params;
  const { profitMultiplier } = req.body;

  const product = (db.data.products || []).find((p) => p.id === id);
  if (!product) {
    return res.status(404).json({ error: 'محصول یافت نشد.' });
  }

  if (profitMultiplier === undefined || Number(profitMultiplier) <= 0) {
    return res.status(400).json({ error: 'ضریب سود باید یک عدد مثبت باشد.' });
  }

  product.profitMultiplier = Number(profitMultiplier);
  db.save();

  const { materialsMap, intermediatesMap } = getMaps();
  const globalConversions = getAllConversions(db);
  const calculated = calculateProductCost(product, intermediatesMap, materialsMap, globalConversions);

  return res.json(calculated);
});

export default router;
