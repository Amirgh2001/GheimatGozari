import express from 'express';
import { db } from '../db.js';
import { requireManagerAuth } from '../auth.js';

const router = express.Router();

// Export full database JSON
router.get('/export', requireManagerAuth, (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="restaurant_costing_backup.json"');
  return res.send(JSON.stringify(db.data, null, 2));
});

// Import JSON
router.post('/import', requireManagerAuth, (req, res) => {
  try {
    const incomingData = req.body;
    if (!incomingData || !incomingData.rawMaterials || !incomingData.products) {
      return res.status(400).json({ error: 'فرمت فایل پشتیبان نامعتبر است.' });
    }

    db.backup(); // create backup before overwrite
    db.data = incomingData;
    db.save();

    return res.json({ success: true, message: 'اطلاعات با موفقیت بازیابی شد.' });
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
