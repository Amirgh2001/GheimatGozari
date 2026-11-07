/**
 * Cost Calculation & Unit Conversion Engine
 * Graph-based Unit Conversion (BFS) + Recursive BOM Tree Evaluation + Dynamic Restaurant Pricing
 */

export const GLOBAL_WEIGHT_UNITS = ['گرم', 'کیلوگرم', 'تن'];
export const GLOBAL_VOLUME_UNITS = ['میلی‌لیتر', 'لیتر'];
export const GLOBAL_COUNT_UNITS = ['عدد', 'دوجین', 'پرس'];

export const PACKAGING_UNITS_WEIGHT = [
  'کارتن مرغ',
  'کیسه بزرگ',
  'کیسه',
  'بسته',
  'دسته',
  'کارتن',
  'قالب',
  'جعبه',
  'سطل',
];

export const PACKAGING_UNITS_VOLUME = [
  'حلب',
  'بطری',
  'قوطی',
  'گالن',
  'بشکه',
  'پاکت',
];

export const PACKAGING_UNITS_COUNT = [
  'کارتن تخم مرغ',
  'شانه',
  'بسته',
  'کارتن',
  'جعبه',
  'پاکت',
];

export const STANDARD_UNITS = [
  // Weight (Base: gram)
  { id: 'g', name: 'گرم', aliases: ['g', 'gram', 'grams', 'گرم'], category: 'weight', baseFactor: 1, baseUnit: 'g' },
  { id: 'kg', name: 'کیلوگرم', aliases: ['kg', 'kilogram', 'کیلوگرم', 'کیلو'], category: 'weight', baseFactor: 1000, baseUnit: 'g' },
  { id: 'ton', name: 'تن', aliases: ['ton', 'تن'], category: 'weight', baseFactor: 1000000, baseUnit: 'g' },

  // Volume (Base: milliliter)
  { id: 'ml', name: 'میلی‌لیتر', aliases: ['ml', 'milliliter', 'میلی‌لیتر', 'سی‌سی', 'cc'], category: 'volume', baseFactor: 1, baseUnit: 'ml' },
  { id: 'l', name: 'لیتر', aliases: ['l', 'liter', 'liters', 'لیتر'], category: 'volume', baseFactor: 1000, baseUnit: 'ml' },

  // Count / Packaging
  { id: 'piece', name: 'عدد', aliases: ['piece', 'عدد', 'تکه', 'دانه'], category: 'count', baseFactor: 1, baseUnit: 'piece' },
  { id: 'portion', name: 'پرس', aliases: ['portion', 'پرس'], category: 'count', baseFactor: 1, baseUnit: 'portion' },
  { id: 'pack', name: 'بسته', aliases: ['pack', 'بسته'], category: 'package', baseFactor: 1, baseUnit: 'pack' },
  { id: 'bag', name: 'کیسه', aliases: ['bag', 'کیسه', 'کیسه بزرگ'], category: 'package', baseFactor: 1, baseUnit: 'bag' },
  { id: 'can', name: 'قوطی', aliases: ['can', 'قوطی'], category: 'package', baseFactor: 1, baseUnit: 'can' },
  { id: 'box', name: 'کارتن', aliases: ['box', 'کارتن'], category: 'package', baseFactor: 1, baseUnit: 'box' },
  { id: 'bottle', name: 'بطری', aliases: ['bottle', 'بطری'], category: 'package', baseFactor: 1, baseUnit: 'bottle' },
  { id: 'tray', name: 'شانه', aliases: ['tray', 'شانه'], category: 'package', baseFactor: 1, baseUnit: 'tray' },
  { id: 'tin', name: 'حلب', aliases: ['tin', 'حلب'], category: 'package', baseFactor: 1, baseUnit: 'tin' },
  { id: 'bar', name: 'قالب', aliases: ['bar', 'قالب'], category: 'package', baseFactor: 1, baseUnit: 'bar' },
  { id: 'carton', name: 'پاکت', aliases: ['carton', 'پاکت'], category: 'package', baseFactor: 1, baseUnit: 'carton' },
];

/**
 * Normalize unit string for lookup
 */
export function normalizeUnit(unitStr) {
  if (!unitStr) return '';
  return String(unitStr).trim().toLowerCase();
}

/**
 * Find standard unit object by id or alias
 */
export function findUnit(unitKey) {
  if (!unitKey) return null;
  const key = normalizeUnit(unitKey);
  return (
    STANDARD_UNITS.find(
      (u) =>
        u.id.toLowerCase() === key ||
        u.name === unitKey ||
        normalizeUnit(u.name) === key ||
        (u.aliases && u.aliases.some((a) => normalizeUnit(a) === key))
    ) || null
  );
}

/**
 * Determine physical measurement scale: 'weight', 'volume', or 'count'
 */
export function getMaterialScale(material) {
  if (!material) return 'weight';

  const pUnit = normalizeUnit(material.purchaseUnit);

  if (['کیلوگرم', 'گرم', 'تن', 'kg', 'g', 'ton'].includes(pUnit)) return 'weight';
  if (['لیتر', 'میلی‌لیتر', 'سی‌سی', 'l', 'ml', 'cc'].includes(pUnit)) return 'volume';
  if (['عدد', 'دوجین', 'پرس', 'piece', 'portion'].includes(pUnit)) return 'count';

  // Check custom conversions
  for (const c of material.customConversions || []) {
    const toU = normalizeUnit(c.toUnit);
    const fromU = normalizeUnit(c.fromUnit);
    if (['کیلوگرم', 'گرم', 'تن', 'kg', 'g'].includes(toU) || ['کیلوگرم', 'گرم', 'تن'].includes(fromU)) return 'weight';
    if (['لیتر', 'میلی‌لیتر', 'l', 'ml'].includes(toU) || ['لیتر', 'میلی‌لیتر'].includes(fromU)) return 'volume';
    if (['عدد', 'piece'].includes(toU) || ['عدد', 'piece'].includes(fromU)) return 'count';
  }

  // Check category
  const cat = String(material.category || '').trim();
  if (['روغن و چربی', 'نوشیدنی'].includes(cat)) return 'volume';
  if (['پکیجینگ'].includes(cat)) return 'count';

  return 'weight';
}

/**
 * Get valid units for a raw material (only relevant & defined units)
 */
/**
 * Helper to get all combined conversion chains from db
 */
export function getAllConversions(db) {
  return [
    ...(db.data?.conversionChains || []),
    ...(db.data?.globalUnitConversions || []),
  ];
}

/**
 * Get valid units for a raw material (only relevant & defined units)
 */
export function getValidUnitsForMaterial(material, globalConversions = []) {
  if (!material) return ['گرم', 'کیلوگرم', 'عدد'];

  const unitsSet = new Set();
  const pUnit = material.purchaseUnit;
  if (pUnit) unitsSet.add(pUnit);

  const customConversions = material.customConversions || [];

  // Add all units explicitly in custom conversions
  for (const c of customConversions) {
    if (c.fromUnit) unitsSet.add(c.fromUnit);
    if (c.toUnit) unitsSet.add(c.toUnit);
    if (c.steps && Array.isArray(c.steps)) {
      c.steps.forEach((s) => {
        if (s.unit) unitsSet.add(s.unit);
      });
    }
  }

  // Add all units in global conversions that connect with any current units
  for (const c of globalConversions || []) {
    if (c.steps && Array.isArray(c.steps)) {
      const stepUnits = c.steps.map((s) => s.unit);
      if (stepUnits.some((u) => unitsSet.has(u))) {
        stepUnits.forEach((u) => unitsSet.add(u));
      }
    } else if (c.fromUnit && c.toUnit) {
      if (unitsSet.has(c.fromUnit) || unitsSet.has(c.toUnit)) {
        unitsSet.add(c.fromUnit);
        unitsSet.add(c.toUnit);
      }
    }
  }

  // Standard units reachable from purchase unit:
  const candidateStandards = ['گرم', 'کیلوگرم', 'تن', 'میلی‌لیتر', 'لیتر', 'عدد', 'پرس'];
  for (const candidate of candidateStandards) {
    if (pUnit) {
      const forward = convertUnit(1, pUnit, candidate, customConversions, globalConversions);
      const backward = convertUnit(1, candidate, pUnit, customConversions, globalConversions);
      if (forward > 0 || backward > 0) {
        unitsSet.add(candidate);
      }
    }
  }

  // If purchase unit is standard weight or volume or count, ensure its core family is available
  const pStd = findUnit(pUnit);
  if (pStd?.category === 'weight' || ['کیلوگرم', 'گرم', 'تن'].includes(pUnit)) {
    unitsSet.add('گرم');
    unitsSet.add('کیلوگرم');
  } else if (pStd?.category === 'volume' || ['لیتر', 'میلی‌لیتر'].includes(pUnit)) {
    unitsSet.add('میلی‌لیتر');
    unitsSet.add('لیتر');
    unitsSet.add('گرم');
  } else if (pStd?.category === 'count' || ['عدد'].includes(pUnit)) {
    unitsSet.add('عدد');
  }

  return Array.from(unitsSet).filter(Boolean);
}

/**
 * Get valid units for an intermediate good
 */
export function getValidUnitsForIntermediate(intermediate) {
  if (!intermediate) return ['گرم', 'کیلوگرم', 'عدد'];
  const unitsSet = new Set();

  // Add custom output units (portions) first so they appear prominently
  for (const ou of intermediate.outputUnits || []) {
    if (ou && ou.name && ou.name.trim()) {
      unitsSet.add(ou.name.trim());
    }
  }

  const yUnit = intermediate.yieldUnit || 'گرم';
  unitsSet.add(yUnit);

  if (['گرم', 'کیلوگرم', 'تن'].includes(yUnit)) {
    unitsSet.add('گرم');
    unitsSet.add('کیلوگرم');
  } else if (['میلی‌لیتر', 'لیتر'].includes(yUnit)) {
    unitsSet.add('میلی‌لیتر');
    unitsSet.add('لیتر');
    unitsSet.add('گرم');
  } else if (['عدد', 'پرس'].includes(yUnit)) {
    unitsSet.add('عدد');
  }

  for (const c of intermediate.customConversions || []) {
    if (c.fromUnit) unitsSet.add(c.fromUnit);
    if (c.toUnit) unitsSet.add(c.toUnit);
  }

  return Array.from(unitsSet).filter(Boolean);
}

/**
 * Build conversion graph and find conversion factor via BFS
 */
export function convertUnit(quantity, fromUnit, toUnit, itemCustomConversions = [], globalConversions = []) {
  if (quantity === 0 || quantity === null || quantity === undefined) return 0;
  const q = Number(quantity);
  if (isNaN(q)) return 0;

  const fUnit = String(fromUnit || '').trim();
  const tUnit = String(toUnit || '').trim();

  if (fUnit === tUnit || normalizeUnit(fUnit) === normalizeUnit(tUnit)) {
    return q;
  }

  // Construct adjacency list for BFS: node -> Map(targetNode -> factor)
  const graph = new Map();

  function addEdge(u1, u2, factor) {
    if (!u1 || !u2 || !factor || factor <= 0) return;
    const n1 = normalizeUnit(u1);
    const n2 = normalizeUnit(u2);
    if (n1 === n2) return;

    if (!graph.has(n1)) graph.set(n1, new Map());
    if (!graph.has(n2)) graph.set(n2, new Map());

    graph.get(n1).set(n2, factor);
    graph.get(n2).set(n1, 1 / factor);
  }

  // 1. Add standard units edges
  // Weight:
  addEdge('کیلوگرم', 'گرم', 1000);
  addEdge('kg', 'g', 1000);
  addEdge('کیلوگرم', 'g', 1000);
  addEdge('kg', 'گرم', 1000);
  addEdge('تن', 'کیلوگرم', 1000);
  addEdge('ton', 'kg', 1000);
  addEdge('تن', 'گرم', 1000000);
  addEdge('ton', 'g', 1000000);

  // Volume:
  addEdge('لیتر', 'میلی‌لیتر', 1000);
  addEdge('l', 'ml', 1000);
  addEdge('لیتر', 'ml', 1000);
  addEdge('l', 'میلی‌لیتر', 1000);
  addEdge('سی‌سی', 'میلی‌لیتر', 1);
  addEdge('cc', 'ml', 1);
  addEdge('سی‌سی', 'لیتر', 0.001);
  addEdge('cc', 'l', 0.001);

  // Count:
  addEdge('دوجین', 'عدد', 12);
  addEdge('تکه', 'عدد', 1);
  addEdge('پرس', 'عدد', 1);

  // Culinary liquid equivalence (1 ml = 1 g, 1 l = 1000 g, 1 l = 1 kg)
  addEdge('لیتر', 'گرم', 1000);
  addEdge('میلی‌لیتر', 'گرم', 1);
  addEdge('l', 'g', 1000);
  addEdge('ml', 'g', 1);
  addEdge('لیتر', 'کیلوگرم', 1);
  addEdge('l', 'kg', 1);
  addEdge('میلی‌لیتر', 'کیلوگرم', 0.001);
  addEdge('ml', 'kg', 0.001);

  // 2. Add global conversions and multi-step chains
  for (const c of globalConversions || []) {
    if (c.steps && Array.isArray(c.steps) && c.steps.length >= 2) {
      for (let i = 0; i < c.steps.length; i++) {
        for (let j = i + 1; j < c.steps.length; j++) {
          const s1 = c.steps[i];
          const s2 = c.steps[j];
          const a1 = Number(s1.amount);
          const a2 = Number(s2.amount);
          if (a1 > 0 && a2 > 0 && s1.unit && s2.unit) {
            addEdge(s1.unit, s2.unit, a2 / a1);
          }
        }
      }
    } else if (c.fromUnit && c.toUnit) {
      addEdge(c.fromUnit, c.toUnit, Number(c.factor));
    }
  }

  // 3. Add item-specific custom conversions (highest priority)
  for (const c of itemCustomConversions || []) {
    if (c.steps && Array.isArray(c.steps) && c.steps.length >= 2) {
      for (let i = 0; i < c.steps.length; i++) {
        for (let j = i + 1; j < c.steps.length; j++) {
          const s1 = c.steps[i];
          const s2 = c.steps[j];
          const a1 = Number(s1.amount);
          const a2 = Number(s2.amount);
          if (a1 > 0 && a2 > 0 && s1.unit && s2.unit) {
            addEdge(s1.unit, s2.unit, a2 / a1);
          }
        }
      }
    } else if (c.fromUnit && c.toUnit) {
      addEdge(c.fromUnit, c.toUnit, Number(c.factor));
    }
  }

  const startNode = normalizeUnit(fUnit);
  const endNode = normalizeUnit(tUnit);

  // BFS search for conversion path
  const queue = [{ node: startNode, cumulativeFactor: 1 }];
  const visited = new Set([startNode]);

  while (queue.length > 0) {
    const { node, cumulativeFactor } = queue.shift();

    if (node === endNode) {
      return q * cumulativeFactor;
    }

    const neighbors = graph.get(node);
    if (neighbors) {
      for (const [nextNeighbor, edgeFactor] of neighbors.entries()) {
        if (!visited.has(nextNeighbor)) {
          visited.add(nextNeighbor);
          queue.push({
            node: nextNeighbor,
            cumulativeFactor: cumulativeFactor * edgeFactor,
          });
        }
      }
    }
  }

  // If BFS didn't find path, check if both match standard categories directly
  const fStd = findUnit(fUnit);
  const tStd = findUnit(tUnit);
  if (fStd && tStd && fStd.category === tStd.category && fStd.baseFactor && tStd.baseFactor) {
    return (q * fStd.baseFactor) / tStd.baseFactor;
  }

  // Safety guard against runaway cost if unit is packaging / incompatible
  const allPkgUnits = [
    ...PACKAGING_UNITS_WEIGHT,
    ...PACKAGING_UNITS_VOLUME,
    ...PACKAGING_UNITS_COUNT,
  ];
  const isFromPkg = allPkgUnits.includes(fUnit) || fStd?.category === 'package';
  const isToPkg = allPkgUnits.includes(tUnit) || tStd?.category === 'package';

  if (isFromPkg || isToPkg || (fStd && tStd && fStd.category !== tStd.category)) {
    console.warn(`[convertUnit] No conversion path found between "${fUnit}" and "${tUnit}". Returning 0 to prevent runaway calculation.`);
    return 0;
  }

  return q;
}

/**
 * Calculate batch yield automatically:
 * Batch Output = (Sum of ingredient weights) * (1 - cookingLossPercentage / 100)
 */
export function calculateBatchYield(
  ingredients = [],
  cookingLossPercentage = 0,
  allMaterialsMap = new Map(),
  allIntermediatesMap = new Map(),
  globalConversions = []
) {
  let totalRawWeightGrams = 0;
  let hasWeightItems = false;
  let totalCount = 0;
  let isCountOnly = true;

  for (const ing of ingredients) {
    const qty = Number(ing.quantity) || 0;
    if (qty <= 0) continue;

    if (ing.type === 'raw' || ing.materialId) {
      const mat = allMaterialsMap.get(ing.materialId || ing.id);
      const customConversions = mat?.customConversions || [];

      const convertedG = convertUnit(qty, ing.unit, 'گرم', customConversions, globalConversions);
      const isWeight = ['گرم', 'کیلوگرم', 'تن'].includes(ing.unit) || 
                       (mat && ['کیلوگرم', 'گرم'].includes(mat.purchaseUnit)) ||
                       convertedG > 0;

      if (isWeight && convertedG > 0) {
        totalRawWeightGrams += convertedG;
        hasWeightItems = true;
        isCountOnly = false;
      } else {
        totalCount += qty;
      }
    } else if (ing.type === 'intermediate' || ing.intermediateId) {
      const child = allIntermediatesMap.get(ing.intermediateId || ing.id);
      let effectiveQty = qty;
      let effectiveUnit = ing.unit;

      const childOutput = (child?.outputUnits || []).find(
        (ou) => ou && ou.name && ou.name.trim() === ing.unit?.trim()
      );
      if (childOutput) {
        effectiveQty = qty * Number(childOutput.amount || childOutput.weight || 1);
        effectiveUnit = childOutput.unit || child?.yieldUnit || 'گرم';
      }

      const customConvs = [
        ...(child?.customConversions || []),
        ...(child?.outputUnits || []).map((ou) => ({
          fromUnit: ou.name,
          toUnit: ou.unit || child?.yieldUnit || 'گرم',
          factor: Number(ou.amount || ou.weight || 1),
        })),
      ];

      const convertedG = convertUnit(effectiveQty, effectiveUnit, 'گرم', customConvs, globalConversions);
      if (convertedG > 0) {
        totalRawWeightGrams += convertedG;
        hasWeightItems = true;
        isCountOnly = false;
      } else {
        totalCount += qty;
      }
    }
  }

  const loss = Math.min(99.9, Math.max(0, Number(cookingLossPercentage) || 0));
  const lossFactor = 1 - loss / 100;

  if (hasWeightItems || !isCountOnly || totalCount === 0) {
    const rawWeight = Math.round(totalRawWeightGrams * 10) / 10;
    const yieldQty = Math.round(rawWeight * lossFactor * 10) / 10;
    return {
      rawTotal: rawWeight,
      yieldQuantity: Math.max(1, yieldQty),
      yieldUnit: 'گرم',
      scale: 'weight',
    };
  } else {
    const yieldQty = Math.round(totalCount * lossFactor * 10) / 10;
    return {
      rawTotal: totalCount,
      yieldQuantity: Math.max(1, yieldQty),
      yieldUnit: 'عدد',
      scale: 'count',
    };
  }
}

/**
 * Calculate the cost of using a specific amount of a raw material.
 */
export function calculateMaterialUsageCost(material, quantity, unit, globalConversions = []) {
  if (!material || !quantity) return { cost: 0, convertedQuantity: 0, effectiveUnit: unit };

  const purchasePrice = Number(material.purchasePrice || 0);
  const purchaseUnit = material.purchaseUnit;
  const customConversions = material.customConversions || [];

  const qtyInPurchaseUnit = convertUnit(
    quantity,
    unit,
    purchaseUnit,
    customConversions,
    globalConversions
  );

  const wastagePercent = Number(material.wastagePercentage || 0);
  const wastageFactor = wastagePercent > 0 && wastagePercent < 100 ? 1 / (1 - wastagePercent / 100) : 1;

  const cost = Math.round(qtyInPurchaseUnit * purchasePrice * wastageFactor);

  return {
    cost,
    qtyInPurchaseUnit,
    effectiveUnit: purchaseUnit,
    unitPurchasePrice: purchasePrice,
    wastagePercentage: wastagePercent,
  };
}

/**
 * Recursively calculate intermediate good cost.
 */
export function calculateIntermediateGoodCost(
  intermediateId,
  allIntermediatesMap,
  allMaterialsMap,
  globalConversions = [],
  visited = new Set()
) {
  if (visited.has(intermediateId)) {
    console.warn(`Circular dependency detected in intermediate good: ${intermediateId}`);
    return {
      id: intermediateId,
      name: 'چرخه نامعتبر',
      totalBatchCost: 0,
      unitCost: 0,
      yieldQuantity: 1,
      yieldUnit: 'عدد',
      ingredients: [],
      error: 'چرخه وابستگی تکراری یافت شد',
    };
  }

  const intermediate = allIntermediatesMap.get(intermediateId);
  if (!intermediate) {
    return {
      id: intermediateId,
      name: 'کالای نامشخص',
      totalBatchCost: 0,
      unitCost: 0,
      yieldQuantity: 1,
      yieldUnit: 'عدد',
      ingredients: [],
      error: 'کالای واسط یافت نشد',
    };
  }

  visited.add(intermediateId);

  let totalBatchCost = 0;
  const ingredientsBreakdown = [];

  const rawIngredients = intermediate.ingredients || [];
  for (const ing of rawIngredients) {
    if (ing.type === 'raw' || ing.materialId) {
      const materialId = ing.materialId || ing.id;
      const material = allMaterialsMap.get(materialId);
      if (material) {
        const usage = calculateMaterialUsageCost(material, ing.quantity, ing.unit, globalConversions);
        totalBatchCost += usage.cost;
        ingredientsBreakdown.push({
          type: 'raw',
          id: material.id,
          name: material.name,
          category: material.category || 'مواد اولیه',
          quantity: ing.quantity,
          unit: ing.unit,
          purchaseUnit: material.purchaseUnit,
          purchasePrice: material.purchasePrice,
          calculatedCost: usage.cost,
          qtyInPurchaseUnit: usage.qtyInPurchaseUnit,
        });
      }
    } else if (ing.type === 'intermediate' || ing.intermediateId) {
      const childId = ing.intermediateId || ing.id;
      const childCostResult = calculateIntermediateGoodCost(
        childId,
        allIntermediatesMap,
        allMaterialsMap,
        globalConversions,
        new Set(visited)
      );

      const childYieldUnit = childCostResult.yieldUnit;
      const childUnitCost = childCostResult.unitCost;

      const outputUnit = (childCostResult.outputUnits || []).find(
        (ou) => ou && ou.name && ou.name.trim() === ing.unit?.trim()
      );

      let convertedChildQty = 0;
      let portionAmount = null;
      let portionUnit = null;

      if (outputUnit) {
        portionAmount = Number(outputUnit.amount || outputUnit.weight || 1);
        portionUnit = outputUnit.unit || childYieldUnit || 'گرم';
        const effectiveWeight = Number(ing.quantity) * portionAmount;
        convertedChildQty = convertUnit(
          effectiveWeight,
          portionUnit,
          childYieldUnit,
          childCostResult.customConversions || [],
          globalConversions
        );
      } else {
        convertedChildQty = convertUnit(
          ing.quantity,
          ing.unit,
          childYieldUnit,
          intermediate.customConversions || [],
          globalConversions
        );
      }

      const subtotal = Math.round(convertedChildQty * childUnitCost);
      totalBatchCost += subtotal;

      ingredientsBreakdown.push({
        type: 'intermediate',
        id: childCostResult.id,
        name: childCostResult.name,
        category: 'کالای واسط',
        quantity: ing.quantity,
        unit: ing.unit,
        portionAmount,
        portionUnit,
        childYieldUnit,
        childUnitCost,
        calculatedCost: subtotal,
        subBreakdown: childCostResult.ingredients,
      });
    }
  }

  const cookingLossPercent = Number(intermediate.cookingLossPercentage || 0);

  // Compute yield automatically if not explicitly given or if formula based
  let yieldQuantity = Number(intermediate.yieldQuantity);
  let yieldUnit = intermediate.yieldUnit;

  if (!yieldQuantity || yieldQuantity <= 0) {
    const computedYield = calculateBatchYield(
      intermediate.ingredients || [],
      cookingLossPercent,
      allMaterialsMap,
      allIntermediatesMap,
      globalConversions
    );
    yieldQuantity = computedYield.yieldQuantity;
    yieldUnit = computedYield.yieldUnit;
  }
  if (!yieldUnit) yieldUnit = 'گرم';

  const unitCost = yieldQuantity > 0 ? Math.round(totalBatchCost / yieldQuantity) : totalBatchCost;

  const ingredientsWithPercentage = ingredientsBreakdown.map((item) => ({
    ...item,
    costPercentage: totalBatchCost > 0 ? Number(((item.calculatedCost / totalBatchCost) * 100).toFixed(1)) : 0,
  }));

  // Calculate metrics for each output unit (portions)
  const calculatedOutputUnits = (intermediate.outputUnits || []).map((ou) => {
    const portionWeight = Number(ou.amount || ou.weight) || 1;
    const countPerBatch = portionWeight > 0 && yieldQuantity > 0 ? Number((yieldQuantity / portionWeight).toFixed(2)) : 0;
    const costPerPortion = Math.round(portionWeight * unitCost);
    return {
      id: ou.id,
      name: ou.name,
      amount: portionWeight,
      unit: ou.unit || yieldUnit,
      countPerBatch,
      costPerPortion,
    };
  });

  visited.delete(intermediateId);

  return {
    id: intermediate.id,
    name: intermediate.name,
    category: intermediate.category || 'کالای واسط',
    batchDescription: intermediate.batchDescription || '',
    yieldQuantity,
    yieldUnit,
    cookingLossPercentage: cookingLossPercent,
    totalBatchCost,
    unitCost,
    outputUnits: intermediate.outputUnits || [],
    calculatedOutputUnits,
    customConversions: intermediate.customConversions || [],
    ingredients: ingredientsWithPercentage,
  };
}

/**
 * Calculate Product Cost & Suggested Selling Price
 */
export function calculateProductCost(product, allIntermediatesMap, allMaterialsMap, globalConversions = []) {
  if (!product) return null;

  let foodCost = 0;
  const recipeBreakdown = [];

  // 1. Process Recipe Items (Food Cost)
  const items = product.recipeItems || [];
  for (const item of items) {
    if (item.type === 'raw' || item.materialId) {
      const matId = item.materialId || item.id;
      const material = allMaterialsMap.get(matId);
      if (material) {
        const usage = calculateMaterialUsageCost(material, item.quantity, item.unit, globalConversions);
        foodCost += usage.cost;
        recipeBreakdown.push({
          type: 'raw',
          id: material.id,
          name: material.name,
          category: material.category || 'مواد اولیه',
          quantity: item.quantity,
          unit: item.unit,
          purchaseUnit: material.purchaseUnit,
          purchasePrice: material.purchasePrice,
          calculatedCost: usage.cost,
        });
      }
    } else if (item.type === 'intermediate' || item.intermediateId) {
      const interId = item.intermediateId || item.id;
      const interCostResult = calculateIntermediateGoodCost(
        interId,
        allIntermediatesMap,
        allMaterialsMap,
        globalConversions
      );

      const outputUnit = (interCostResult.outputUnits || []).find(
        (ou) => ou && ou.name && ou.name.trim() === item.unit?.trim()
      );

      let convertedQty = 0;
      let portionAmount = null;
      let portionUnit = null;

      if (outputUnit) {
        portionAmount = Number(outputUnit.amount || outputUnit.weight || 1);
        portionUnit = outputUnit.unit || interCostResult.yieldUnit || 'گرم';
        const effectiveWeight = Number(item.quantity) * portionAmount;
        convertedQty = convertUnit(
          effectiveWeight,
          portionUnit,
          interCostResult.yieldUnit,
          interCostResult.customConversions || [],
          globalConversions
        );
      } else {
        convertedQty = convertUnit(
          item.quantity,
          item.unit,
          interCostResult.yieldUnit,
          interCostResult.customConversions || [],
          globalConversions
        );
      }

      const subtotal = Math.round(convertedQty * interCostResult.unitCost);
      foodCost += subtotal;

      recipeBreakdown.push({
        type: 'intermediate',
        id: interCostResult.id,
        name: interCostResult.name,
        category: 'کالای واسط',
        quantity: item.quantity,
        unit: item.unit,
        portionAmount,
        portionUnit,
        outputUnitMatch: outputUnit ? outputUnit.name : null,
        unitCost: interCostResult.unitCost,
        yieldUnit: interCostResult.yieldUnit,
        calculatedCost: subtotal,
        subIngredients: interCostResult.ingredients,
      });
    }
  }

  // 2. Process Dine-in Packaging Items
  let dineInPackagingCost = 0;
  const dineInPackagingBreakdown = [];
  for (const pkg of product.dineInPackaging || []) {
    const mat = allMaterialsMap.get(pkg.materialId || pkg.id);
    if (mat) {
      const usage = calculateMaterialUsageCost(mat, pkg.quantity || 1, pkg.unit || mat.purchaseUnit, globalConversions);
      dineInPackagingCost += usage.cost;
      dineInPackagingBreakdown.push({
        id: mat.id,
        name: mat.name,
        quantity: pkg.quantity || 1,
        unit: pkg.unit || mat.purchaseUnit,
        calculatedCost: usage.cost,
      });
    } else if (pkg.fixedCost) {
      const cost = Number(pkg.fixedCost) || 0;
      dineInPackagingCost += cost;
      dineInPackagingBreakdown.push({
        name: pkg.name || 'هزینه بسته‌بندی سالن',
        quantity: 1,
        unit: 'عدد',
        calculatedCost: cost,
      });
    }
  }

  // 3. Process Takeout Packaging Items
  let takeoutPackagingCost = 0;
  const takeoutPackagingBreakdown = [];
  for (const pkg of product.takeoutPackaging || []) {
    const mat = allMaterialsMap.get(pkg.materialId || pkg.id);
    if (mat) {
      const usage = calculateMaterialUsageCost(mat, pkg.quantity || 1, pkg.unit || mat.purchaseUnit, globalConversions);
      takeoutPackagingCost += usage.cost;
      takeoutPackagingBreakdown.push({
        id: mat.id,
        name: mat.name,
        quantity: pkg.quantity || 1,
        unit: pkg.unit || mat.purchaseUnit,
        calculatedCost: usage.cost,
      });
    } else if (pkg.fixedCost) {
      const cost = Number(pkg.fixedCost) || 0;
      takeoutPackagingCost += cost;
      takeoutPackagingBreakdown.push({
        name: pkg.name || 'هزینه بسته‌بندی بیرون‌بر',
        quantity: 1,
        unit: 'عدد',
        calculatedCost: cost,
      });
    }
  }

  // 4. Pricing & Profit Multiplier
  const profitMultiplier = Number(product.profitMultiplier) || 2.5;

  const baseFoodMarkupPrice = Math.round(foodCost * profitMultiplier);

  const suggestedDineInPrice = Math.round(baseFoodMarkupPrice + dineInPackagingCost);
  const suggestedTakeoutPrice = Math.round(baseFoodMarkupPrice + takeoutPackagingCost);

  const totalDineInCost = Math.round(foodCost + dineInPackagingCost);
  const totalTakeoutCost = Math.round(foodCost + takeoutPackagingCost);

  const actualSellingPriceDineIn = suggestedDineInPrice;
  const actualSellingPriceTakeout = suggestedTakeoutPrice;

  const foodCostPercentDineIn = actualSellingPriceDineIn > 0
    ? Number(((totalDineInCost / actualSellingPriceDineIn) * 100).toFixed(1))
    : 0;

  const foodCostPercentTakeout = actualSellingPriceTakeout > 0
    ? Number(((totalTakeoutCost / actualSellingPriceTakeout) * 100).toFixed(1))
    : 0;

  const grossProfitMarginDineIn = actualSellingPriceDineIn > 0
    ? Number((((actualSellingPriceDineIn - totalDineInCost) / actualSellingPriceDineIn) * 100).toFixed(1))
    : 0;

  const grossProfitMarginTakeout = actualSellingPriceTakeout > 0
    ? Number((((actualSellingPriceTakeout - totalTakeoutCost) / actualSellingPriceTakeout) * 100).toFixed(1))
    : 0;

  const recipeWithPercentage = recipeBreakdown.map((item) => ({
    ...item,
    costPercentage: foodCost > 0 ? Number(((item.calculatedCost / foodCost) * 100).toFixed(1)) : 0,
  }));

  return {
    id: product.id,
    name: product.name,
    category: product.category || 'عمومی',
    description: product.description || '',
    instructions: product.instructions || '',
    profitMultiplier,

    // Costs
    foodCost,
    dineInPackagingCost,
    takeoutPackagingCost,
    totalDineInCost,
    totalTakeoutCost,

    // Suggested Prices
    baseFoodMarkupPrice,
    suggestedDineInPrice,
    suggestedTakeoutPrice,

    // Actual Menu Prices
    actualSellingPriceDineIn,
    actualSellingPriceTakeout,

    // Metrics
    foodCostPercentDineIn,
    foodCostPercentTakeout,
    grossProfitMarginDineIn,
    grossProfitMarginTakeout,

    // Breakdowns
    recipeBreakdown: recipeWithPercentage,
    dineInPackagingBreakdown,
    takeoutPackagingBreakdown,
  };
}
