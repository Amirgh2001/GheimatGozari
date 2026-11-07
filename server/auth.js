import crypto from 'node:crypto';

/**
 * Authentication module using Node.js built-in crypto
 * Secure, zero external dependencies, robust session management.
 */

// Active manager sessions cache: token -> payload (for fast local lookups)
const activeSessions = new Map();
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const AUTH_SECRET = process.env.SESSION_SECRET || process.env.JWT_SECRET || 'gheimatgozari-restaurant-auth-signature-key-2026-prod';

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
 * Sign payload string using HMAC-SHA256
 */
function signPayload(payloadStr) {
  return crypto.createHmac('sha256', AUTH_SECRET).update(payloadStr).digest('base64url');
}

/**
 * Create a new signed session token (serverless compatible across all instances)
 */
export function createSession(username) {
  const now = Date.now();
  const payload = {
    username,
    nonce: crypto.randomBytes(16).toString('hex'),
    createdAt: now,
    expiresAt: now + SESSION_TTL_MS,
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = signPayload(payloadB64);
  const token = `${payloadB64}.${signature}`;

  activeSessions.set(token, payload);
  return token;
}

/**
 * Validate a session token using stateless HMAC verification and in-memory cache
 */
export function validateSession(token) {
  if (!token || typeof token !== 'string') return null;

  // 1. Check in-memory cache first
  const cached = activeSessions.get(token);
  if (cached) {
    if (Date.now() > cached.expiresAt) {
      activeSessions.delete(token);
      return null;
    }
    return cached;
  }

  // 2. Stateless cryptographic HMAC verification
  const dotIndex = token.lastIndexOf('.');
  if (dotIndex === -1) return null;

  const payloadB64 = token.substring(0, dotIndex);
  const signature = token.substring(dotIndex + 1);

  if (!payloadB64 || !signature) return null;

  const expectedSignature = signPayload(payloadB64);

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expectedSignature);

  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const jsonStr = Buffer.from(payloadB64, 'base64url').toString('utf8');
    const payload = JSON.parse(jsonStr);

    if (!payload || !payload.username || !payload.expiresAt) {
      return null;
    }

    if (Date.now() > payload.expiresAt) {
      return null;
    }

    // Cache in current instance for rapid subsequent requests
    activeSessions.set(token, payload);
    return payload;
  } catch {
    return null;
  }
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
