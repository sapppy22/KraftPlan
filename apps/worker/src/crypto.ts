import { SignJWT, jwtVerify } from 'jose';

// ── Password hashing (WebCrypto PBKDF2) ──────────────────────────────
// Runs on both Workers and Node 20+ (crypto.subtle). Replaces argon2,
// which is a native module and cannot run on Workers.
const ITERATIONS = 100_000;
const enc = new TextEncoder();

function toB64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}
function fromB64(s: string): Uint8Array {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function deriveBits(password: string, salt: Uint8Array, iterations: number): Promise<ArrayBuffer> {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  return crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations, hash: 'SHA-256' }, key, 256);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const bits = await deriveBits(password, salt, ITERATIONS);
  return `pbkdf2$${ITERATIONS}$${toB64(salt)}$${toB64(bits)}`;
}

export async function verifyPassword(stored: string, password: string): Promise<boolean> {
  const [scheme, iterStr, saltB64, hashB64] = stored.split('$');
  if (scheme !== 'pbkdf2') return false; // legacy (argon2) hashes are not verifiable here
  const bits = await deriveBits(password, fromB64(saltB64), parseInt(iterStr, 10));
  const a = new Uint8Array(bits);
  const b = fromB64(hashB64);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0; // constant-time compare
}

// ── JWT (jose — WebCrypto based, Workers-native) ─────────────────────
function secretKey(secret: string): Uint8Array {
  return enc.encode(secret);
}

export async function signAccessToken(payload: { userId: string; role: string }, secret: string): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .setIssuedAt()
    .sign(secretKey(secret));
}

export async function verifyToken<T>(token: string, secret: string): Promise<T> {
  const { payload } = await jwtVerify(token, secretKey(secret));
  return payload as unknown as T;
}
