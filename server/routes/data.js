import express from 'express';
import { db } from '../db.js';
import { requireManagerAuth } from '../auth.js';
import { exportDatabaseToExcel, importDatabaseFromExcel } from '../excelConverter.js';

const router = express.Router();

// Export database: JSON or Excel (.xlsx)
router.get('/export', requireManagerAuth, (req, res) => {
  const format = String(req.query.format || '').toLowerCase();
  const dateStr = new Date().toISOString().slice(0, 10);

  if (format === 'xlsx' || format === 'excel') {
    const excelBuffer = exportDatabaseToExcel(db.data);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="restaurant_costing_backup_${dateStr}.xlsx"`);
    return res.send(excelBuffer);
  }

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="restaurant_costing_backup_${dateStr}.json"`);
  return res.send(JSON.stringify(db.data, null, 2));
});

// Explicit Excel export endpoint
router.get('/export-excel', requireManagerAuth, (req, res) => {
  const dateStr = new Date().toISOString().slice(0, 10);
  const excelBuffer = exportDatabaseToExcel(db.data);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="restaurant_costing_backup_${dateStr}.xlsx"`);
  return res.send(excelBuffer);
});

// Import JSON or Excel (.xlsx/.xls)
router.post('/import', requireManagerAuth, (req, res) => {
  try {
    let incomingData = req.body;

    // Check if uploaded as Excel format payload: { format: 'xlsx', base64: '...' }
    if (incomingData && (incomingData.format === 'xlsx' || incomingData.format === 'excel') && incomingData.base64) {
      const buffer = Buffer.from(incomingData.base64, 'base64');
      incomingData = importDatabaseFromExcel(buffer, db.data);
    }

    if (!incomingData || !Array.isArray(incomingData.rawMaterials) || !Array.isArray(incomingData.products)) {
      return res.status(400).json({ error: 'فرمت فایل پشتیبان نامعتبر است یا ساختار داده‌ها ناقص است.' });
    }

    db.backup(); // create backup before overwrite
    db.data = incomingData;
    db.save();

    return res.json({
      success: true,
      message: 'اطلاعات با موفقیت بازیابی شد.',
      stats: {
        materials: incomingData.rawMaterials.length,
        intermediates: (incomingData.intermediateGoods || []).length,
        products: incomingData.products.length,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: 'خطا در بارگذاری داده‌ها: ' + err.message });
  }
});

// Reset to default seed
router.post('/reset', requireManagerAuth, (req, res) => {
  db.backup();
  db.resetToDefaults();
  return res.json({ success: true, message: 'سامانه به داده‌های پیش‌فرض اولیه بازگردانی شد.' });
});

export default router;
