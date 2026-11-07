import express from 'express';
import { db } from '../db.js';
import { verifyPassword, hashPassword, createSession, destroySession, requireManagerAuth } from '../auth.js';

const router = express.Router();

// Manager Login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'نام کاربری و کلمه عبور الزامی است.' });
  }

  const manager = db.data.manager;
  if (manager.username.toLowerCase() !== String(username).trim().toLowerCase()) {
    return res.status(401).json({ error: 'نام کاربری یا کلمه عبور نادرست است.' });
  }

  const isValid = verifyPassword(password, manager.salt, manager.passwordHash);
  if (!isValid) {
    return res.status(401).json({ error: 'نام کاربری یا کلمه عبور نادرست است.' });
  }

  const token = createSession(manager.username);

  // Set HTTP-only cookie
  res.cookie('manager_session', token, {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: 'lax',
  });

  return res.json({
    success: true,
    message: 'ورود موفقیت‌آمیز بود.',
    token,
    manager: {
      username: manager.username,
      fullName: manager.fullName,
      phone: manager.phone,
      restaurantName: manager.restaurantName,
    },
  });
});

// Manager Logout
router.post('/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  let token = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.cookies && req.cookies.manager_session) {
    token = req.cookies.manager_session;
  }

  destroySession(token);
  res.clearCookie('manager_session');
  return res.json({ success: true, message: 'خروج از حساب انجام شد.' });
});

// Check Session / Current User
router.get('/me', requireManagerAuth, (req, res) => {
  const manager = db.data.manager;
  return res.json({
    authenticated: true,
    manager: {
      username: manager.username,
      fullName: manager.fullName,
      phone: manager.phone,
      restaurantName: manager.restaurantName,
    },
  });
});

// Change Password
router.post('/change-password', requireManagerAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'کلمه عبور فعلی و جدید الزامی است.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'کلمه عبور جدید باید حداقل ۶ کاراکتر باشد.' });
  }

  const manager = db.data.manager;
  const isValid = verifyPassword(currentPassword, manager.salt, manager.passwordHash);
  if (!isValid) {
    return res.status(400).json({ error: 'کلمه عبور فعلی اشتباه است.' });
  }

  const { salt, hash } = hashPassword(newPassword);
  manager.salt = salt;
  manager.passwordHash = hash;
  db.save();

  return res.json({ success: true, message: 'کلمه عبور با موفقیت به‌روزرسانی شد.' });
});

// Update Restaurant / Manager Profile
router.post('/profile', requireManagerAuth, (req, res) => {
  const { fullName, restaurantName, phone } = req.body;
  const manager = db.data.manager;

  if (fullName !== undefined) manager.fullName = String(fullName).trim();
  if (restaurantName !== undefined) manager.restaurantName = String(restaurantName).trim();
  if (phone !== undefined) manager.phone = String(phone).trim();

  db.save();
  return res.json({
    success: true,
    message: 'اطلاعات پروفایل به‌روزرسانی شد.',
    manager: {
      username: manager.username,
      fullName: manager.fullName,
      phone: manager.phone,
      restaurantName: manager.restaurantName,
    },
  });
});

export default router;
