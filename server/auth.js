import crypto from 'node:crypto';

/**
 * Authentication module using Node.js built-in crypto
 * Secure, zero external dependencies, robust session management.
 */

// Active manager sessions: token -> { createdAt, expiresAt }
const activeSessions = new Map();
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Hash password with salt using PBKDF2
 */
export function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

/**
 * Verify password against stored salt and hash
 */
export function verifyPassword(password, salt, storedHash) {
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return hash === storedHash;
}

/**
 * Create a new session token
 */
export function createSession(username) {
  const token = crypto.randomBytes(32).toString('hex');
  const now = Date.now();
  const session = {
    username,
    createdAt: now,
    expiresAt: now + SESSION_TTL_MS,
  };
  activeSessions.set(token, session);
  return token;
}

/**
 * Validate a session token
 */
export function validateSession(token) {
  if (!token) return null;
  const session = activeSessions.get(token);
  if (!session) return null;

  if (Date.now() > session.expiresAt) {
    activeSessions.delete(token);
    return null;
  }

  return session;
}

/**
 * Destroy a session token
 */
export function destroySession(token) {
  if (token) {
    activeSessions.delete(token);
  }
}

/**
 * Express middleware to require manager authentication
 */
export function requireManagerAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.cookies && req.cookies.manager_session) {
    token = req.cookies.manager_session;
  }

  const session = validateSession(token);
  if (!session) {
    return res.status(401).json({
      error: 'دسترسی غیرمجاز. لطفاً به عنوان مدیر مجموعه وارد شوید.',
      authenticated: false,
    });
  }

  req.manager = session;
  req.token = token;
  next();
}
