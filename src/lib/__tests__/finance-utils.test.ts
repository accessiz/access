/**
 * Tests for src/lib/finance/utils.ts — formatDateRange, getCurrentMonthInGuatemala, getCurrentYearInGuatemala
 */
import {
  formatDateRange,
  getCurrentMonthInGuatemala,
  getCurrentYearInGuatemala,
} from '@/lib/finance/utils';

// ── formatDateRange ──

describe('formatDateRange', () => {
  it('formats a single day (same start and end)', () => {
    const result = formatDateRange('2026-03-04', '2026-03-04');
    expect(result).toContain('4');
    expect(result).toContain('mar');
    expect(result).toContain('2026');
  });

  it('formats a range within the same month', () => {
    const result = formatDateRange('2026-03-01', '2026-03-15');
    expect(result).toContain('1');
    expect(result).toContain('15');
    expect(result).toContain('mar');
  });

  it('formats a range across months', () => {
    const result = formatDateRange('2026-03-28', '2026-04-05');
    expect(result).toContain('mar');
    expect(result).toContain('abr');
  });

  it('returns "-" for invalid dates', () => {
    expect(formatDateRange('not-a-date', 'also-not')).toBe('-');
  });
});

// ── getCurrentMonthInGuatemala ──

describe('getCurrentMonthInGuatemala', () => {
  it('returns a number between 1 and 12', () => {
    const month = getCurrentMonthInGuatemala();
    expect(month).toBeGreaterThanOrEqual(1);
    expect(month).toBeLessThanOrEqual(12);
  });
});

// ── getCurrentYearInGuatemala ──

describe('getCurrentYearInGuatemala', () => {
  it('returns a reasonable year', () => {
    const year = getCurrentYearInGuatemala();
    expect(year).toBeGreaterThanOrEqual(2025);
    expect(year).toBeLessThanOrEqual(2030);
  });
});
