import express from 'express';
import { db } from '../db.js';
import { requireManagerAuth } from '../auth.js';
import { convertUnit, findUnit, getMaterialScale, getAllConversions } from '../costEngine.js';

const router = express.Router();

// Helper to calculate effective unit prices strictly by material scale
function enrichMaterial(mat, globalConversions = []) {
  const purchasePrice = Number(mat.purchasePrice) || 0;
  const purchaseUnit = mat.purchaseUnit;
  const customConversions = mat.customConversions || [];
  const scale = getMaterialScale(mat);

  let pricePerGram = null;
  let pricePerKg = null;
  let pricePerMl = null;
  let pricePerLiter = null;
  let pricePerPiece = null;

  if (scale === 'volume') {
    const qtyInMl = convertUnit(1, purchaseUnit, 'میلی‌لیتر', customConversions, globalConversions);
    if (qtyInMl > 0) {
      pricePerMl = Math.round(purchasePrice / qtyInMl);
      pricePerLiter = Math.round(pricePerMl * 1000);
    } else if (purchaseUnit === 'لیتر') {
      pricePerLiter = purchasePrice;
      pricePerMl = Math.round(purchasePrice / 1000);
    } else if (purchaseUnit === 'میلی‌لیتر') {
      pricePerMl = purchasePrice;
      pricePerLiter = purchasePrice * 1000;
    }

    // Check if it has a piece/bottle conversion (e.g. carton has bottles)
    if (purchaseUnit !== 'عدد') {
      const qtyInPiece = convertUnit(1, purchaseUnit, 'عدد', customConversions, globalConversions);
      if (qtyInPiece > 0) {
        pricePerPiece = Math.round(purchasePrice / qtyInPiece);
      }
    }
  } else if (scale === 'count') {
    if (purchaseUnit === 'عدد') {
      pricePerPiece = purchasePrice;
    } else {
      const qtyInPiece = convertUnit(1, purchaseUnit, 'عدد', customConversions, globalConversions);
      if (qtyInPiece > 0) {
        pricePerPiece = Math.round(purchasePrice / qtyInPiece);
      }
    }
  } else {
    // Default: weight items
    const qtyInG = convertUnit(1, purchaseUnit, 'گرم', customConversions, globalConversions);
    if (qtyInG > 0) {
      pricePerGram = Math.round(purchasePrice / qtyInG);
      pricePerKg = Math.round(pricePerGram * 1000);
    } else if (purchaseUnit === 'کیلوگرم') {
      pricePerKg = purchasePrice;
      pricePerGram = Math.round(purchasePrice / 1000);
    } else if (purchaseUnit === 'گرم') {
      pricePerGram = purchasePrice;
      pricePerKg = purchasePrice * 1000;
    }
  }

  return {
    ...mat,
    scale,
    pricePerGram,
    pricePerKg,
    pricePerMl,
    pricePerLiter,
    pricePerPiece,
  };
}

// Get all raw materials
router.get('/', requireManagerAuth, (req, res) => {
  const materials = db.data.rawMaterials || [];
  const globalConversions = getAllConversions(db);
  const enriched = materials.map((m) => enrichMaterial(m, globalConversions));
  return res.json(enriched);
});

// Create raw material
router.post('/', requireManagerAuth, (req, res) => {
  const {
    name,
    category,
    purchaseUnit,
    purchasePrice,
    wastagePercentage,
    customConversions,
    notes,
  } = req.body;

  if (!name || !purchaseUnit || purchasePrice === undefined) {
    return res.status(400).json({ error: 'نام ماده اولیه، واحد خرید و قیمت خرید الزامی است.' });
  }

  const id = `mat-${Date.now()}`;
  const newMaterial = {
    id,
    name: String(name).trim(),
    category: category ? String(category).trim() : 'سایر',
    purchaseUnit: String(purchaseUnit).trim(),
    purchasePrice: Number(purchasePrice) || 0,
    wastagePercentage: Number(wastagePercentage) || 0,
    customConversions: Array.isArray(customConversions) ? customConversions : [],
    notes: notes ? String(notes).trim() : '',
  };

  db.data.rawMaterials.push(newMaterial);
  db.save();

  const globalConversions = getAllConversions(db);
  return res.status(201).json(enrichMaterial(newMaterial, globalConversions));
});

// Update raw material
router.put('/:id', requireManagerAuth, (req, res) => {
  const { id } = req.params;
  const index = db.data.rawMaterials.findIndex((m) => m.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'ماده اولیه مورد نظر یافت نشد.' });
  }

  const existing = db.data.rawMaterials[index];
  const {
    name,
    category,
    purchaseUnit,
    purchasePrice,
    wastagePercentage,
    customConversions,
    notes,
  } = req.body;

  if (name !== undefined) existing.name = String(name).trim();
  if (category !== undefined) existing.category = String(category).trim();
  if (purchaseUnit !== undefined) existing.purchaseUnit = String(purchaseUnit).trim();
  if (purchasePrice !== undefined) existing.purchasePrice = Number(purchasePrice) || 0;
  if (wastagePercentage !== undefined) existing.wastagePercentage = Number(wastagePercentage) || 0;
  if (customConversions !== undefined) existing.customConversions = customConversions;
  if (notes !== undefined) existing.notes = String(notes).trim();

  db.save();

  const globalConversions = getAllConversions(db);
  return res.json(enrichMaterial(existing, globalConversions));
});

// Delete raw material
router.delete('/:id', requireManagerAuth, (req, res) => {
  const { id } = req.params;
  const index = db.data.rawMaterials.findIndex((m) => m.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'ماده اولیه یافت نشد.' });
  }

  // Check if used in intermediate goods
  const usedInIntermediates = (db.data.intermediateGoods || []).filter((item) =>
    (item.ingredients || []).some((ing) => ing.materialId === id)
  );

  // Check if used in products
  const usedInProducts = (db.data.products || []).filter((prod) =>
    (prod.recipeItems || []).some((item) => item.materialId === id) ||
    (prod.dineInPackaging || []).some((pkg) => pkg.materialId === id) ||
    (prod.takeoutPackaging || []).some((pkg) => pkg.materialId === id)
  );

  if (usedInIntermediates.length > 0 || usedInProducts.length > 0) {
    const interNames = usedInIntermediates.map((i) => i.name).join('، ');
    const prodNames = usedInProducts.map((p) => p.name).join('، ');
    return res.status(400).json({
      error: `این ماده اولیه در حال حاضر در کالاهای واسط (${interNames || 'هیچ'}) یا محصولات نهایی (${prodNames || 'هیچ'}) استفاده شده است و حذف آن مجاز نیست.`,
      usedInIntermediates: usedInIntermediates.map((i) => ({ id: i.id, name: i.name })),
      usedInProducts: usedInProducts.map((p) => ({ id: p.id, name: p.name })),
    });
  }

  const deleted = db.data.rawMaterials.splice(index, 1)[0];
  db.save();

  return res.json({ success: true, message: 'ماده اولیه با موفقیت حذف شد.', deleted });
});

export default router;
