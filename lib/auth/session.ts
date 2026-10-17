import crypto from 'crypto';

// Server-side session secret (stable default or environment variable)
const SESSION_SECRET = process.env.SESSION_SECRET || 'mindvault-authoritative-session-secret-2026-secure-key';

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, key] = storedHash.split(':');
    if (!salt || !key) return false;
    const keyBuffer = Buffer.from(key, 'hex');
    const derivedKey = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512');
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch (err) {
    return false;
  }
}

export interface SessionPayload {
  userId: number;
  uid: string;
  sub: string;
  email: string;
  displayName: string;
  roles?: string[];
  isAdmin?: boolean;
  iat?: number;
  exp?: number;
}

export function createSessionToken(payload: SessionPayload): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 7 * 24 * 60 * 60; // 7 days validity

  const fullPayload = {
    ...payload,
    sub: payload.uid || payload.sub,
    iat,
    exp
  };

  const b64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
  const b64Payload = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  const data = `${b64Header}.${b64Payload}`;
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');

  return `${data}.${signature}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [b64Header, b64Payload, signature] = parts;
    const data = `${b64Header}.${b64Payload}`;
    const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');

    if (signature !== expectedSig) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(b64Payload, 'base64url').toString('utf8')) as SessionPayload;
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }

    return payload;
  } catch (err) {
    return null;
  }
}
