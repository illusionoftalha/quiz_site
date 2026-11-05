'use strict';
const crypto = require('node:crypto');
const { promisify } = require('node:util');
const scrypt = promisify(crypto.scrypt);
const COOKIE_NAME = 'quiz_auth';
const MAX_AGE = 8 * 60 * 60;
const PARAMS = { N: 16384, r: 8, p: 1 };

async function hashPassword(password) {
  if (typeof password !== 'string' || password.length < 12 || password.length > 256) {
    throw new Error('Passwords must be 12 to 256 characters');
  }
  const salt = crypto.randomBytes(16);
  const hash = await scrypt(password, salt, 64, PARAMS);
  return 'scrypt$16384$' + salt.toString('hex') + '$' + hash.toString('hex');
}

async function verifyPassword(password, encoded) {
  if (typeof password !== 'string' || password.length > 256 || typeof encoded !== 'string') return false;
  const match = /^scrypt\$16384\$([0-9a-f]{32})\$([0-9a-f]{128})$/.exec(encoded);
  if (!match) return false;
  const actual = await scrypt(password, Buffer.from(match[1], 'hex'), 64, PARAMS);
  return crypto.timingSafeEqual(actual, Buffer.from(match[2], 'hex'));
}

function authCookie(token, origin) {
  const secure = origin && new URL(origin).protocol === 'https:';
  return COOKIE_NAME + '=' + token + '; Path=/; HttpOnly; SameSite=Strict; Max-Age=' + MAX_AGE +
    (secure ? '; Secure' : '');
}
function clearAuthCookie(origin) {
  return authCookie('', origin).replace('Max-Age=' + MAX_AGE, 'Max-Age=0');
}
function tokenFromRequest(req) {
  const raw = req.headers.cookie || '';
  const match = raw.match(/(?:^|;\s*)quiz_auth=([A-Za-z0-9_-]{43})(?:;|$)/);
  return match ? match[1] : null;
}
function tokenHash(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}
async function createSession(pool, role, subject) {
  const token = crypto.randomBytes(32).toString('base64url');
  await pool.query(
    'INSERT INTO auth_sessions (token_hash, role, subject, expires_at) VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 8 HOUR))',
    [tokenHash(token), role, subject]
  );
  return token;
}
function requireRole(pool, role) {
  return async (req, res, next) => {
    try {
      const token = tokenFromRequest(req);
      if (!token) return res.status(401).json({ error: 'Authentication required' });
      const [rows] = await pool.query(
        'SELECT role, subject FROM auth_sessions WHERE token_hash=? AND revoked_at IS NULL AND expires_at > NOW() LIMIT 1',
        [tokenHash(token)]
      );
      if (!rows.length) return res.status(401).json({ error: 'Authentication required' });
      if (role && rows[0].role !== role) return res.status(403).json({ error: 'Forbidden' });
      req.principal = rows[0];
      req.authTokenHash = tokenHash(token);
      next();
    } catch (error) {
      next(error);
    }
  };
}

const failures = new Map();
function loginLimited(req, identity) {
  const key = String(req.ip || 'unknown') + ':' + String(identity || '').slice(0, 64);
  const now = Date.now();
  const entry = failures.get(key);
  if (failures.size > 10000) failures.clear(); // Single-process defense; use edge/Redis limits in production.
  return entry && entry.count >= 5 && now - entry.time < 15 * 60 * 1000;
}
function loginFailed(req, identity) {
  const key = String(req.ip || 'unknown') + ':' + String(identity || '').slice(0, 64);
  const now = Date.now();
  const entry = failures.get(key);
  const count = entry && now - entry.time < 15 * 60 * 1000 ? entry.count + 1 : 1;
  failures.set(key, { count, time: now });
}
function loginSucceeded(req, identity) {
  failures.delete(String(req.ip || 'unknown') + ':' + String(identity || '').slice(0, 64));
}
function sameOrigin(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const configured = process.env.APP_ORIGIN;
  if (!configured) return res.status(503).json({ error: 'APP_ORIGIN is not configured' });
  if (req.get('origin') !== configured) return res.status(403).json({ error: 'Invalid request origin' });
  if (!req.is('application/json')) return res.status(415).json({ error: 'JSON required' });
  next();
}
module.exports = {
  hashPassword, verifyPassword, createSession, requireRole, authCookie, clearAuthCookie,
  tokenFromRequest, tokenHash, sameOrigin, loginLimited, loginFailed, loginSucceeded
};
