/**
 * Tests for src/lib/utils/currency.ts
 *
 * Pure functions: convertToGTQ, formatCurrency, formatWithConversion, getCurrencySymbol.
 * Async functions: fetchCurrentRate, getTodayRate.
 */

// ── Mock Supabase client before import ──
const mockSingle = jest.fn()
const mockEq = jest.fn(() => ({ single: mockSingle }))
const mockSelect = jest.fn(() => ({ eq: mockEq }))
const mockFrom = jest.fn(() => ({ select: mockSelect }))

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({ from: mockFrom })),
}))

import {
  convertToGTQ,
  formatCurrency,
  formatWithConversion,
  getCurrencySymbol,
  fetchCurrentRate,
  getTodayRate,
} from '@/lib/utils/currency';

// ── fetchCurrentRate ──

describe('fetchCurrentRate', () => {
  const originalFetch = global.fetch

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('returns rate from API on success', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ result: 'success', rates: { GTQ: 7.85 } }),
    })
    const rate = await fetchCurrentRate()
    expect(rate).toBe(7.85)
  })

  it('returns fallback rate when response is not ok', async () => {
    const spy = jest.spyOn(console, 'warn').mockImplementation()
    global.fetch = jest.fn().mockResolvedValue({ ok: false })
    const rate = await fetchCurrentRate()
    expect(rate).toBe(7.70)
    spy.mockRestore()
  })

  it('returns fallback rate when rates.GTQ is missing', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ result: 'success', rates: {} }),
    })
    const rate = await fetchCurrentRate()
    expect(rate).toBe(7.70)
  })

  it('returns fallback rate on network error', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation()
    global.fetch = jest.fn().mockRejectedValue(new Error('network down'))
    const rate = await fetchCurrentRate()
    expect(rate).toBe(7.70)
    spy.mockRestore()
  })
})

// ── getTodayRate ──

describe('getTodayRate', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns cached rate when available', async () => {
    mockSingle.mockResolvedValueOnce({ data: { usd_to_gtq: 7.90 }, error: null })
    const rate = await getTodayRate()
    expect(rate).toBe(7.90)
    expect(mockFrom).toHaveBeenCalledWith('exchange_rates')
  })

  it('fetches from API when no cached rate', async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: null })
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ result: 'success', rates: { GTQ: 7.95 } }),
    })
    const rate = await getTodayRate()
    expect(rate).toBe(7.95)
  })
})

// ── convertToGTQ ──

describe('convertToGTQ', () => {
  it('returns same amount for GTQ', () => {
    expect(convertToGTQ(100, 'GTQ', 7.8)).toBe(100);
  });

  it('converts USD to GTQ using rate', () => {
    expect(convertToGTQ(100, 'USD', 7.8)).toBe(780);
  });

  it('converts EUR to GTQ using rate', () => {
    expect(convertToGTQ(50, 'EUR', 8.5)).toBe(425);
  });

  it('handles zero amount', () => {
    expect(convertToGTQ(0, 'USD', 7.8)).toBe(0);
  });

  it('handles fractional amounts', () => {
    const result = convertToGTQ(10.5, 'USD', 7.8);
    expect(result).toBeCloseTo(81.9);
  });
});

// ── formatCurrency ──

describe('formatCurrency', () => {
  it('formats GTQ correctly', () => {
    const result = formatCurrency(1500, 'GTQ');
    expect(result).toContain('1');
    expect(result).toContain('500');
    expect(result).toContain('00');
  });

  it('formats USD correctly', () => {
    const result = formatCurrency(150, 'USD');
    expect(result).toContain('150');
    expect(result).toContain('00');
  });

  it('formats EUR correctly', () => {
    const result = formatCurrency(200, 'EUR');
    expect(result).toContain('200');
  });

  it('returns "-" for null amount', () => {
    expect(formatCurrency(null)).toBe('-');
  });

  it('returns "-" for undefined amount', () => {
    expect(formatCurrency(undefined)).toBe('-');
  });

  it('formats zero', () => {
    const result = formatCurrency(0, 'GTQ');
    expect(result).toContain('0');
  });

  it('defaults to GTQ for unknown currency', () => {
    // Unknown currency falls back to GTQ config
    const result = formatCurrency(100, 'XYZ');
    expect(result).toBeTruthy();
  });
});

// ── formatWithConversion ──

describe('formatWithConversion', () => {
  it('returns just GTQ format when currency is GTQ', () => {
    const result = formatWithConversion(1000, 'GTQ', 7.8);
    expect(result).not.toContain('≈');
  });

  it('returns original + converted format for USD', () => {
    const result = formatWithConversion(100, 'USD', 7.8);
    // Should have both the original USD amount and the ≈ GTQ conversion
    expect(result).toContain('≈');
    expect(result).toContain('100');
  });

  it('returns "-" for null amount', () => {
    expect(formatWithConversion(null, 'USD', 7.8)).toBe('-');
  });

  it('returns "-" for undefined amount', () => {
    expect(formatWithConversion(undefined, 'EUR', 8.5)).toBe('-');
  });
});

// ── getCurrencySymbol ──

describe('getCurrencySymbol', () => {
  it('returns Q for GTQ', () => {
    expect(getCurrencySymbol('GTQ')).toBe('Q');
  });

  it('returns $ for USD', () => {
    expect(getCurrencySymbol('USD')).toBe('$');
  });

  it('returns € for EUR', () => {
    expect(getCurrencySymbol('EUR')).toBe('€');
  });
});
