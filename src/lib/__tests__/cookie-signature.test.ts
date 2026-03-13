/**
 * Tests for src/lib/utils/cookie-signature.ts
 *
 * Security-critical HMAC-SHA256 cookie signing & verification.
 */
import { signCookie, verifyCookie, getCookieSecret } from '@/lib/utils/cookie-signature';

const SECRET = 'test-secret-32-chars-long-enough';

describe('signCookie', () => {
  it('returns value.signature format', () => {
    const signed = signCookie('abc123', SECRET);
    expect(signed).toMatch(/^abc123\.[a-f0-9]{64}$/);
  });

  it('produces deterministic output for same input', () => {
    const a = signCookie('hello', SECRET);
    const b = signCookie('hello', SECRET);
    expect(a).toBe(b);
  });

  it('produces different signatures for different values', () => {
    const a = signCookie('value1', SECRET);
    const b = signCookie('value2', SECRET);
    expect(a).not.toBe(b);
  });

  it('produces different signatures for different secrets', () => {
    const a = signCookie('same', 'secret-1-xxxxxxxxxxxxxxxxxx');
    const b = signCookie('same', 'secret-2-xxxxxxxxxxxxxxxxxx');
    expect(a).not.toBe(b);
  });
});

describe('verifyCookie', () => {
  it('returns true for a valid signed cookie', () => {
    const signed = signCookie('myValue', SECRET);
    expect(verifyCookie(signed, SECRET)).toBe(true);
  });

  it('returns false for a tampered value', () => {
    const signed = signCookie('myValue', SECRET);
    const tampered = signed.replace('myValue', 'hackedValue');
    expect(verifyCookie(tampered, SECRET)).toBe(false);
  });

  it('returns false for a tampered signature', () => {
    const signed = signCookie('myValue', SECRET);
    const tampered = signed.slice(0, -4) + 'dead';
    expect(verifyCookie(tampered, SECRET)).toBe(false);
  });

  it('returns false for a string without dot separator', () => {
    expect(verifyCookie('no-dot-here', SECRET)).toBe(false);
  });

  it('returns false with wrong secret', () => {
    const signed = signCookie('data', SECRET);
    expect(verifyCookie(signed, 'wrong-secret-xxxxxxxxxxxxxxxxxx')).toBe(false);
  });

  it('handles values containing dots', () => {
    const value = 'project.123.access';
    const signed = signCookie(value, SECRET);
    expect(verifyCookie(signed, SECRET)).toBe(true);
  });

  it('is resistant to empty strings', () => {
    const signed = signCookie('', SECRET);
    expect(verifyCookie(signed, SECRET)).toBe(true);
  });
});

describe('getCookieSecret', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    delete process.env.COOKIE_SECRET;
    delete process.env.NEXTAUTH_SECRET;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('returns COOKIE_SECRET when set', () => {
    process.env.COOKIE_SECRET = 'primary-secret';
    process.env.NEXTAUTH_SECRET = 'fallback';
    expect(getCookieSecret()).toBe('primary-secret');
  });

  it('falls back to NEXTAUTH_SECRET', () => {
    process.env.NEXTAUTH_SECRET = 'next-auth-secret';
    expect(getCookieSecret()).toBe('next-auth-secret');
  });

  it('falls back to SUPABASE_SERVICE_ROLE_KEY', () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';
    expect(getCookieSecret()).toBe('service-role-key');
  });

  it('throws when no secret is available', () => {
    expect(() => getCookieSecret()).toThrow('COOKIE_SECRET');
  });
});
