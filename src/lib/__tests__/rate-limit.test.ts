/**
 * Tests for the rate-limit utility: applyRateLimit, getClientIP,
 * and the pre-configured limiter instances.
 */

import {
  createRateLimiter,
  applyRateLimit,
  getClientIP,
  apiLimiter,
  strictLimiter,
} from '@/lib/utils/rate-limit';
import { NextRequest } from 'next/server';

// ── Helper to create a fake NextRequest ──
function fakeReq(headers: Record<string, string> = {}): NextRequest {
  const req = new NextRequest('https://localhost/api/test', {
    headers: new Headers(headers),
  });
  return req;
}

// ════════════════════════════════════════════
// getClientIP
// ════════════════════════════════════════════
describe('getClientIP', () => {
  it('extracts IP from x-forwarded-for (first entry)', () => {
    const req = fakeReq({ 'x-forwarded-for': '1.2.3.4, 10.0.0.1' });
    expect(getClientIP(req)).toBe('1.2.3.4');
  });

  it('extracts IP from x-real-ip when x-forwarded-for is absent', () => {
    const req = fakeReq({ 'x-real-ip': '5.6.7.8' });
    expect(getClientIP(req)).toBe('5.6.7.8');
  });

  it('prefers x-forwarded-for over x-real-ip', () => {
    const req = fakeReq({
      'x-forwarded-for': '1.1.1.1',
      'x-real-ip': '2.2.2.2',
    });
    expect(getClientIP(req)).toBe('1.1.1.1');
  });

  it('returns "unknown" when no IP headers are present', () => {
    const req = fakeReq({});
    expect(getClientIP(req)).toBe('unknown');
  });
});

// ════════════════════════════════════════════
// applyRateLimit
// ════════════════════════════════════════════
describe('applyRateLimit', () => {
  it('returns null (allowed) for the first request', () => {
    const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 2 });
    const req = fakeReq({ 'x-forwarded-for': '10.0.0.1' });
    expect(applyRateLimit(req, limiter)).toBeNull();
  });

  it('returns a 429 response when limit is exceeded', async () => {
    const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 1 });
    const req1 = fakeReq({ 'x-forwarded-for': '10.0.0.2' });
    const req2 = fakeReq({ 'x-forwarded-for': '10.0.0.2' });

    // First request is allowed
    expect(applyRateLimit(req1, limiter)).toBeNull();

    // Second request is blocked
    const blocked = applyRateLimit(req2, limiter);
    expect(blocked).not.toBeNull();
    expect(blocked!.status).toBe(429);

    const body = await blocked!.json();
    expect(body.error).toBe('Too many requests');
  });

  it('includes Retry-After and X-RateLimit headers in 429 response', async () => {
    const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 1 });
    const ip = '10.0.0.3';
    applyRateLimit(fakeReq({ 'x-forwarded-for': ip }), limiter);
    const blocked = applyRateLimit(fakeReq({ 'x-forwarded-for': ip }), limiter);

    expect(blocked).not.toBeNull();
    expect(blocked!.headers.get('Retry-After')).toBeTruthy();
    expect(blocked!.headers.get('X-RateLimit-Limit')).toBe('1');
    expect(blocked!.headers.get('X-RateLimit-Remaining')).toBe('0');
  });

  it('tracks different IPs independently', () => {
    const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 1 });
    expect(applyRateLimit(fakeReq({ 'x-forwarded-for': '10.0.0.10' }), limiter)).toBeNull();
    expect(applyRateLimit(fakeReq({ 'x-forwarded-for': '10.0.0.11' }), limiter)).toBeNull();
  });

  it('uses apiLimiter as default when no limiter is provided', () => {
    // apiLimiter has 30 req/min — first request should always pass
    const req = fakeReq({ 'x-forwarded-for': '99.99.99.99' });
    expect(applyRateLimit(req)).toBeNull();
  });
});

// ════════════════════════════════════════════
// Pre-configured limiters
// ════════════════════════════════════════════
describe('pre-configured limiters', () => {
  it('apiLimiter allows 30 requests within a window', () => {
    const ip = 'api-test-ip';
    for (let i = 0; i < 30; i++) {
      const result = apiLimiter.check(ip);
      expect(result.allowed).toBe(true);
    }
    const result31 = apiLimiter.check(ip);
    expect(result31.allowed).toBe(false);
  });

  it('strictLimiter allows only 10 requests within a window', () => {
    const ip = 'strict-test-ip';
    for (let i = 0; i < 10; i++) {
      const result = strictLimiter.check(ip);
      expect(result.allowed).toBe(true);
    }
    const result11 = strictLimiter.check(ip);
    expect(result11.allowed).toBe(false);
  });
});
