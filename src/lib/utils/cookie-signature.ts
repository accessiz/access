/**
 * @module cookie-signature
 *
 * HMAC-SHA256 cookie signing & verification.
 * Used by `verifyProjectPassword` (projects) and `verifyAccess` (client_actions)
 * to prevent trivial cookie forgery on the client portal.
 *
 * Secret resolution order:
 *   1. COOKIE_SECRET
 *   2. NEXTAUTH_SECRET
 *   3. SUPABASE_SERVICE_ROLE_KEY
 */
import { createHmac } from 'crypto';

/**
 * Signs a cookie value with HMAC-SHA256.
 * Returns a tamper-proof `value.signature` string.
 */
export function signCookie(value: string, secret: string): string {
  const sig = createHmac('sha256', secret).update(value).digest('hex');
  return `${value}.${sig}`;
}

/**
 * Verifies a signed cookie value.
 * Returns `true` if the signature is valid; `false` otherwise.
 */
export function verifyCookie(signed: string, secret: string): boolean {
  const idx = signed.lastIndexOf('.');
  if (idx === -1) return false;
  const value = signed.slice(0, idx);
  const sig = signed.slice(idx + 1);
  const expected = createHmac('sha256', secret).update(value).digest('hex');

  // Constant-time comparison to prevent timing attacks
  if (sig.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < sig.length; i++) {
    mismatch |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return mismatch === 0;
}

/** Common secret accessor — falls back to NEXTAUTH_SECRET → SUPABASE_SERVICE_ROLE_KEY. */
export function getCookieSecret(): string {
  const secret = process.env.COOKIE_SECRET || 
                 process.env.NEXTAUTH_SECRET || 
                 process.env.SUPABASE_SERVICE_ROLE_KEY || 
                 process.env.SUPABASE_SERVICE_KEY;
  if (!secret) {
    throw new Error('COOKIE_SECRET (or NEXTAUTH_SECRET / SUPABASE_SERVICE_ROLE_KEY) env var is required for cookie signing.');
  }
  return secret;
}
