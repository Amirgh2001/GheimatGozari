import express from 'express';
import { db } from '../db.js';
import { requireManagerAuth } from '../auth.js';
import { calculateIntermediateGoodCost, calculateBatchYield, getAllConversions } from '../costEngine.js';

const router = express.Router();

function getMaps() {
  const materialsMap = new Map((db.data.rawMaterials || []).map((m) => [m.id, m]));
  const intermediatesMap = new Map((db.data.intermediateGoods || []).map((i) => [i.id, i]));
  return { materialsMap, intermediatesMap };
}

// Get all intermediate goods with calculated costs
router.get('/', requireManagerAuth, (req, res) => {
  const { materialsMap, intermediatesMap } = getMaps();
  const globalConversions = getAllConversions(db);

  const results = (db.data.intermediateGoods || []).map((item) => {
    return calculateIntermediateGoodCost(item.id, intermediatesMap, materialsMap, globalConversions);
  });

  return res.json(results);
});

// Get single intermediate good
router.get('/:id', requireManagerAuth, (req, res) => {
  const { id } = req.params;
  const { materialsMap, intermediatesMap } = getMaps();
  const globalConversions = getAllConversions(db);

  const item = intermediatesMap.get(id);
  if (!item) {
    return res.status(404).json({ error: 'کالای واسط مورد نظر یافت نشد.' });
  }

  const result = calculateIntermediateGoodCost(id, intermediatesMap, materialsMap, globalConversions);
  return res.json(result);
});

// Create intermediate good
router.post('/', requireManagerAuth, (req, res) => {
  const {
    name,
    category,
    batchDescription,
    yieldQuantity,
    yieldUnit,
    cookingLossPercentage,
    outputUnits,
    customConversions,
    ingredients,
  } = req.body;

  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: 'نام کالای واسط الزامی است.' });
  }

  const { materialsMap, intermediatesMap } = getMaps();
  const globalConversions = getAllConversions(db);

  // Compute yield automatically from ingredients weights and cooking loss
  const computedYield = calculateBatchYield(
    ingredients || [],
    Number(cookingLossPercentage) || 0,
    materialsMap,
    intermediatesMap,
    globalConversions
  );

  const finalYieldQty = Number(yieldQuantity) > 0 ? Number(yieldQuantity) : computedYield.yieldQuantity;
  const finalYieldUnit = yieldUnit ? String(yieldUnit).trim() : computedYield.yieldUnit;

  const id = `inter-${Date.now()}`;
  const newItem = {
    id,
    name: String(name).trim(),
    category: category ? String(category).trim() : 'کالای واسط',
    batchDescription: batchDescription ? String(batchDescription).trim() : '',
    yieldQuantity: finalYieldQty,
    yieldUnit: finalYieldUnit,
    cookingLossPercentage: Number(cookingLossPercentage) || 0,
    outputUnits: Array.isArray(outputUnits) ? outputUnits : [],
    customConversions: Array.isArray(customConversions) ? customConversions : [],
    ingredients: Array.isArray(ingredients) ? ingredients : [],
  };

  db.data.intermediateGoods.push(newItem);
  db.save();

  // Re-fetch maps with the newly added intermediate
  const updatedMaps = getMaps();
  const calculated = calculateIntermediateGoodCost(id, updatedMaps.intermediatesMap, updatedMaps.materialsMap, globalConversions);

  return res.status(201).json(calculated);
});

// Update intermediate good
router.put('/:id', requireManagerAuth, (req, res) => {
  const { id } = req.params;
  const index = db.data.intermediateGoods.findIndex((p) => p.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'کالای واسط یافت نشد.' });
  }

  const existing = db.data.intermediateGoods[index];
  const {
    name,
    category,
    batchDescription,
    yieldQuantity,
    yieldUnit,
    cookingLossPercentage,
    outputUnits,
    customConversions,
    ingredients,
  } = req.body;

  const { materialsMap, intermediatesMap } = getMaps();
  const globalConversions = getAllConversions(db);

  if (name !== undefined) existing.name = String(name).trim();
  if (category !== undefined) existing.category = String(category).trim();
  if (batchDescription !== undefined) existing.batchDescription = String(batchDescription).trim();
  if (cookingLossPercentage !== undefined) existing.cookingLossPercentage = Number(cookingLossPercentage) || 0;
  if (outputUnits !== undefined) existing.outputUnits = Array.isArray(outputUnits) ? outputUnits : [];
  if (customConversions !== undefined) existing.customConversions = customConversions;
  if (ingredients !== undefined) existing.ingredients = ingredients;

  // Auto-compute yield if needed
  const computedYield = calculateBatchYield(
    existing.ingredients || [],
    existing.cookingLossPercentage || 0,
    materialsMap,
    intermediatesMap,
    globalConversions
  );

  if (yieldQuantity !== undefined && Number(yieldQuantity) > 0) {
    existing.yieldQuantity = Number(yieldQuantity);
  } else {
    existing.yieldQuantity = computedYield.yieldQuantity;
  }

  if (yieldUnit !== undefined && String(yieldUnit).trim()) {
    existing.yieldUnit = String(yieldUnit).trim();
  } else {
    existing.yieldUnit = computedYield.yieldUnit;
  }

  db.save();

  const updatedMaps = getMaps();
  const calculated = calculateIntermediateGoodCost(id, updatedMaps.intermediatesMap, updatedMaps.materialsMap, globalConversions);

  return res.json(calculated);
});

// Delete intermediate good
router.delete('/:id', requireManagerAuth, (req, res) => {
  const { id } = req.params;
  const index = db.data.intermediateGoods.findIndex((i) => i.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'کالای واسط یافت نشد.' });
  }

  // Check if used in other intermediate goods
  const usedInIntermediates = (db.data.intermediateGoods || []).filter((item) =>
    item.id !== id && (item.ingredients || []).some((ing) => ing.intermediateId === id)
  );

  // Check if used in products
  const usedInProducts = (db.data.products || []).filter((prod) =>
    (prod.recipeItems || []).some((item) => item.intermediateId === id)
  );

  if (usedInIntermediates.length > 0 || usedInProducts.length > 0) {
    const interNames = usedInIntermediates.map((i) => i.name).join('، ');
    const prodNames = usedInProducts.map((p) => p.name).join('، ');
    return res.status(400).json({
      error: `این کالای واسط در حال حاضر در سایر اقلام واسط (${interNames || 'هیچ'}) یا محصولات منو (${prodNames || 'هیچ'}) استفاده شده است و حذف آن مجاز نیست.`,
      usedInIntermediates: usedInIntermediates.map((i) => ({ id: i.id, name: i.name })),
      usedInProducts: usedInProducts.map((p) => ({ id: p.id, name: p.name })),
    });
  }

  const deleted = db.data.intermediateGoods.splice(index, 1)[0];
  db.save();

  return res.json({ success: true, message: 'کالای واسط با موفقیت حذف شد.', deleted });
});

export default router;
