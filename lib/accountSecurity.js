const crypto = require('crypto');

function clean(value, max = 500) { return String(value == null ? '' : value).trim().slice(0, max); }
function normalizeEmail(value) {
  const raw = clean(value, 220).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw) ? raw : '';
}
function base64url(buffer) { return Buffer.from(buffer).toString('base64url'); }
function hashToken(token) { return crypto.createHash('sha256').update(String(token || '')).digest('hex'); }
function hashPassword(password, salt = crypto.randomBytes(16)) {
  const derived = crypto.scryptSync(String(password), salt, 64, { N:16384, r:8, p:1 });
  return { salt:base64url(salt), hash:base64url(derived) };
}
function verifyPassword(password, account) {
  try {
    const salt = Buffer.from(account.passwordSalt, 'base64url');
    const expected = Buffer.from(account.passwordHash, 'base64url');
    const actual = crypto.scryptSync(String(password), salt, expected.length, { N:16384, r:8, p:1 });
    return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
  } catch { return false; }
}
function parseCookies(req) {
  const result = {};
  for (const part of String(req?.headers?.cookie || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) result[decodeURIComponent(part.slice(0, i).trim())] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return result;
}
function cookie(name, token, options = {}) {
  const clear = Boolean(options.clear);
  const secure = options.secure == null ? (process.env.NODE_ENV === 'production' || Boolean(process.env.RENDER)) : Boolean(options.secure);
  const maxAge = clear ? 0 : Math.max(1, Number(options.maxAgeSeconds || 86400));
  const sameSite = ['Strict','Lax','None'].includes(options.sameSite) ? options.sameSite : 'Lax';
  return `${name}=${clear ? '' : encodeURIComponent(token)}; Path=${options.path || '/'}; HttpOnly; SameSite=${sameSite}; Max-Age=${maxAge}${secure ? '; Secure' : ''}`;
}

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
function base32Encode(buffer) {
  let bits = '';
  for (const byte of Buffer.from(buffer)) bits += byte.toString(2).padStart(8, '0');
  let output = '';
  for (let i = 0; i < bits.length; i += 5) output += BASE32_ALPHABET[parseInt(bits.slice(i, i + 5).padEnd(5, '0'), 2)];
  return output;
}
function base32Decode(value) {
  const normalized = String(value || '').toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = '';
  for (const char of normalized) {
    const index = BASE32_ALPHABET.indexOf(char);
    if (index < 0) continue;
    bits += index.toString(2).padStart(5, '0');
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}
function generateTotpSecret(bytes = 20) { return base32Encode(crypto.randomBytes(bytes)); }
function hotp(secret, counter, digits = 6) {
  const key = base32Decode(secret);
  const buffer = Buffer.alloc(8);
  const high = Math.floor(Number(counter) / 0x100000000);
  const low = Number(counter) >>> 0;
  buffer.writeUInt32BE(high >>> 0, 0);
  buffer.writeUInt32BE(low, 4);
  const digest = crypto.createHmac('sha1', key).update(buffer).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const code = ((digest[offset] & 0x7f) << 24) | ((digest[offset + 1] & 0xff) << 16) | ((digest[offset + 2] & 0xff) << 8) | (digest[offset + 3] & 0xff);
  return String(code % (10 ** digits)).padStart(digits, '0');
}
function totp(secret, at = Date.now(), stepSeconds = 30, digits = 6) { return hotp(secret, Math.floor(Number(at) / 1000 / stepSeconds), digits); }
function verifyTotp(secret, code, options = {}) {
  const normalized = String(code || '').replace(/\D/g, '');
  if (!/^\d{6}$/.test(normalized)) return false;
  const at = Number(options.at || Date.now());
  const window = Math.max(0, Math.min(3, Number(options.window == null ? 1 : options.window)));
  for (let offset = -window; offset <= window; offset += 1) {
    const expected = totp(secret, at + offset * 30000);
    if (expected.length === normalized.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(normalized))) return true;
  }
  return false;
}
function generateRecoveryCodes(count = 10) {
  return Array.from({ length:Math.max(1, Math.min(20, Number(count) || 10)) }, () => `${crypto.randomBytes(4).toString('hex').toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`);
}
function hashRecoveryCodes(codes = []) { return codes.map(hashToken); }
function consumeRecoveryCode(code, hashes = []) {
  const target = hashToken(String(code || '').trim().toUpperCase());
  const index = hashes.findIndex(value => value === target);
  return index < 0 ? { valid:false, remaining:hashes } : { valid:true, remaining:hashes.filter((_, i) => i !== index) };
}
function otpAuthUri({ issuer='Smarter Justice', label='', secret='' } = {}) {
  const accountLabel = encodeURIComponent(`${issuer}:${label}`);
  return `otpauth://totp/${accountLabel}?secret=${encodeURIComponent(secret)}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}

module.exports = {
  clean, normalizeEmail, hashToken, hashPassword, verifyPassword, parseCookies, cookie,
  generateTotpSecret, totp, verifyTotp, generateRecoveryCodes, hashRecoveryCodes, consumeRecoveryCode, otpAuthUri
};
