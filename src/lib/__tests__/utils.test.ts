/**
 * Tests for core utility functions: cn(), toTitleCase(), toPublicUrl()
 */

import { cn, toTitleCase, toPublicUrl } from '@/lib/utils';

// ════════════════════════════════════════════
// cn() — Tailwind class merging
// ════════════════════════════════════════════
describe('cn', () => {
  it('merges simple class strings', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1');
  });

  it('resolves conflicting Tailwind classes (last wins)', () => {
    const result = cn('px-2', 'px-4');
    expect(result).toBe('px-4');
  });

  it('handles conditional classes', () => {
    const result = cn('base', false && 'hidden', true && 'visible');
    expect(result).toBe('base visible');
  });

  it('handles undefined and null inputs', () => {
    expect(cn('a', undefined, null, 'b')).toBe('a b');
  });

  it('returns empty string for no inputs', () => {
    expect(cn()).toBe('');
  });

  it('preserves NYXA typography tokens alongside text colors', () => {
    // The custom extendTailwindMerge config should NOT strip text-body when combined with text-red-500
    const result = cn('text-body', 'text-red-500');
    expect(result).toContain('text-body');
    expect(result).toContain('text-red-500');
  });
});

// ════════════════════════════════════════════
// toTitleCase() — Spanish-aware
// ════════════════════════════════════════════
describe('toTitleCase', () => {
  it('capitalizes first letter of each word', () => {
    expect(toTitleCase('hello world')).toBe('Hello World');
  });

  it('handles ALL CAPS input', () => {
    expect(toTitleCase('HELLO WORLD')).toBe('Hello World');
  });

  it('keeps Spanish connectors lowercase', () => {
    expect(toTitleCase('juan de los santos')).toBe('Juan de los Santos');
  });

  it('capitalizes first word even if it is a connector', () => {
    expect(toTitleCase('de la torre')).toBe('De la Torre');
  });

  it('returns empty string for null/undefined', () => {
    expect(toTitleCase(null)).toBe('');
    expect(toTitleCase(undefined)).toBe('');
    expect(toTitleCase('')).toBe('');
  });

  it('handles single word', () => {
    expect(toTitleCase('test')).toBe('Test');
  });

  it('trims extra spaces', () => {
    expect(toTitleCase('  hello   world  ')).toBe('Hello World');
  });
});

// ════════════════════════════════════════════
// toPublicUrl()
// ════════════════════════════════════════════
describe('toPublicUrl', () => {
  it('returns null for empty or null input', () => {
    expect(toPublicUrl(null)).toBeNull();
    expect(toPublicUrl(undefined)).toBeNull();
    expect(toPublicUrl('')).toBeNull();
  });

  it('prepends R2_PUBLIC_URL to a relative path', () => {
    const result = toPublicUrl('some/path/img.webp');
    // In test env, R2_PUBLIC_URL is a placeholder — result should still contain the path
    expect(result).toContain('some/path/img.webp');
    expect(result).not.toBeNull();
  });

  it('does not double-prefix URLs that already have a scheme', () => {
    const fullUrl = 'https://example.com/img.webp';
    const result = toPublicUrl(fullUrl);
    expect(result).toBe(fullUrl);
  });
});
