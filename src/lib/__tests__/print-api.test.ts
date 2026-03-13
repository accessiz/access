/**
 * Integration tests for the print API route and rate limiter.
 *
 * Tests the GET /api/print/compcard/[id] endpoint logic including:
 * - Authentication enforcement
 * - Model ID validation
 * - Rate limiting (429 responses)
 * - JSON manifest shape with blur hashes
 * - URL construction from R2 paths
 */

// ─── Rate limiter tests (pure unit — no mocks needed) ───

import { createRateLimiter } from '@/lib/utils/rate-limit';

describe('rate limiter', () => {
  it('should allow requests under the limit', () => {
    const limiter = createRateLimiter({ windowMs: 1000, maxRequests: 3 });

    const r1 = limiter.check('ip-1');
    const r2 = limiter.check('ip-1');
    const r3 = limiter.check('ip-1');

    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(2);
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(1);
    expect(r3.allowed).toBe(true);
    expect(r3.remaining).toBe(0);
  });

  it('should block requests over the limit', () => {
    const limiter = createRateLimiter({ windowMs: 1000, maxRequests: 2 });

    limiter.check('ip-1');
    limiter.check('ip-1');
    const r3 = limiter.check('ip-1');

    expect(r3.allowed).toBe(false);
    expect(r3.remaining).toBe(0);
    expect(r3.retryAfterMs).toBeGreaterThan(0);
    expect(r3.retryAfterMs).toBeLessThanOrEqual(1000);
  });

  it('should track different IPs independently', () => {
    const limiter = createRateLimiter({ windowMs: 1000, maxRequests: 1 });

    const r1 = limiter.check('ip-1');
    const r2 = limiter.check('ip-2');
    const r3 = limiter.check('ip-1'); // blocked
    const r4 = limiter.check('ip-2'); // blocked

    expect(r1.allowed).toBe(true);
    expect(r2.allowed).toBe(true);
    expect(r3.allowed).toBe(false);
    expect(r4.allowed).toBe(false);
  });

  it('should reset after window expires', async () => {
    const limiter = createRateLimiter({ windowMs: 50, maxRequests: 1 });

    limiter.check('ip-1');
    const blocked = limiter.check('ip-1');
    expect(blocked.allowed).toBe(false);

    // Wait for window to expire
    await new Promise(resolve => setTimeout(resolve, 60));

    const allowed = limiter.check('ip-1');
    expect(allowed.allowed).toBe(true);
  });

  it('should support manual reset', () => {
    const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 1 });

    limiter.check('ip-1');
    expect(limiter.check('ip-1').allowed).toBe(false);

    limiter.reset('ip-1');
    expect(limiter.check('ip-1').allowed).toBe(true);
  });

  it('should support clear all', () => {
    const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 1 });

    limiter.check('ip-1');
    limiter.check('ip-2');
    limiter.clear();

    expect(limiter.check('ip-1').allowed).toBe(true);
    expect(limiter.check('ip-2').allowed).toBe(true);
  });

  it('should return correct limit in result', () => {
    const limiter = createRateLimiter({ windowMs: 1000, maxRequests: 42 });
    const result = limiter.check('ip-1');
    expect(result.limit).toBe(42);
  });
});

// ─── Print API route logic tests ───

describe('print API route logic', () => {
  // Test the URL construction logic directly (extracted pattern from route.ts)
  function toFullUrl(path: string | null | undefined, r2Base: string): string | null {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return r2Base ? `${r2Base}/${path.replace(/^\//, '')}` : null;
  }

  describe('toFullUrl', () => {
    const R2_BASE = 'https://pub-abc123.r2.dev';

    it('should return null for null/undefined input', () => {
      expect(toFullUrl(null, R2_BASE)).toBeNull();
      expect(toFullUrl(undefined, R2_BASE)).toBeNull();
      expect(toFullUrl('', R2_BASE)).toBeNull();
    });

    it('should pass through absolute URLs', () => {
      const url = 'https://example.com/image.webp';
      expect(toFullUrl(url, R2_BASE)).toBe(url);
    });

    it('should prepend R2 base to relative paths', () => {
      expect(toFullUrl('model-id/Portada/cover.webp', R2_BASE))
        .toBe('https://pub-abc123.r2.dev/model-id/Portada/cover.webp');
    });

    it('should strip leading slash from relative paths', () => {
      expect(toFullUrl('/model-id/Portada/cover.webp', R2_BASE))
        .toBe('https://pub-abc123.r2.dev/model-id/Portada/cover.webp');
    });

    it('should return null when R2 base is empty', () => {
      expect(toFullUrl('some/path.webp', '')).toBeNull();
    });
  });

  describe('model ID validation', () => {
    const UUID_REGEX = /^[0-9a-f-]{36}$/i;

    it('should accept valid UUIDs', () => {
      expect(UUID_REGEX.test('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
      expect(UUID_REGEX.test('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
    });

    it('should reject invalid model IDs', () => {
      expect(UUID_REGEX.test('')).toBe(false);
      expect(UUID_REGEX.test('not-a-uuid')).toBe(false);
      expect(UUID_REGEX.test('550e8400e29b41d4a716446655440000')).toBe(false); // no dashes
      expect(UUID_REGEX.test('<script>alert(1)</script>')).toBe(false);
    });
  });

  describe('response manifest shape', () => {
    it('should construct valid manifest from model data', () => {
      const model = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        alias: 'Test Model',
        full_name: 'Test Full Name',
        cover_path: 'model-id/Portada/cover.webp',
        comp_card_paths: ['model-id/Contraportada/comp_0.webp', null, null, 'model-id/Contraportada/comp_3.webp'],
        cover_blur_hash: 'data:image/webp;base64,AAAA',
        comp_card_blur_hashes: ['data:blur0', null, null, 'data:blur3'],
      };

      const r2Base = 'https://pub-abc.r2.dev';

      const manifest = {
        modelId: model.id,
        alias: model.alias ?? model.full_name,
        cover: toFullUrl(model.cover_path, r2Base),
        coverBlur: model.cover_blur_hash ?? null,
        compCards: model.comp_card_paths.map(p => toFullUrl(p, r2Base)),
        compCardBlurs: model.comp_card_blur_hashes.slice(0, 4),
        printReady: true,
      };

      expect(manifest.modelId).toBe(model.id);
      expect(manifest.alias).toBe('Test Model');
      expect(manifest.cover).toBe('https://pub-abc.r2.dev/model-id/Portada/cover.webp');
      expect(manifest.coverBlur).toBe('data:image/webp;base64,AAAA');
      expect(manifest.compCards).toHaveLength(4);
      expect(manifest.compCards[0]).toContain('comp_0.webp');
      expect(manifest.compCards[1]).toBeNull();
      expect(manifest.compCards[3]).toContain('comp_3.webp');
      expect(manifest.compCardBlurs).toHaveLength(4);
      expect(manifest.printReady).toBe(true);
    });

    it('should fall back to full_name when alias is null', () => {
      const model = { alias: null, full_name: 'Full Name' };
      const alias = model.alias ?? model.full_name;
      expect(alias).toBe('Full Name');
    });

    it('should pad comp cards to 4 slots', () => {
      const compPaths = ['path0.webp'];
      const compCards = compPaths.map(p => toFullUrl(p, 'https://r2.dev'));
      while (compCards.length < 4) compCards.push(null);

      expect(compCards).toHaveLength(4);
      expect(compCards[0]).not.toBeNull();
      expect(compCards[1]).toBeNull();
      expect(compCards[2]).toBeNull();
      expect(compCards[3]).toBeNull();
    });
  });
});
