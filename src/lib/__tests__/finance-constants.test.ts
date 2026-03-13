/**
 * Tests for src/lib/constants/finance.ts
 *
 * Business-logic functions: convertToGTQ, getGuatemalaTodayString,
 * isProjectDatePassed, meetsFinanceConditions.
 */
import {
  convertToGTQ,
  getGuatemalaToday,
  getGuatemalaTodayString,
  isProjectDatePassed,
  meetsFinanceConditions,
  TIMEZONE,
  CURRENCY,
  STATUS_LABELS,
  MODEL_PAYMENT_STATUSES,
  CLIENT_PAYMENT_STATUSES,
  PAYMENT_TYPES,
  TRADE_CATEGORIES,
} from '@/lib/constants/finance';

// ── Constants sanity checks ──

describe('Finance constants', () => {
  it('TIMEZONE is Guatemala', () => {
    expect(TIMEZONE).toBe('America/Guatemala');
  });

  it('CURRENCY has GTQ as primary', () => {
    expect(CURRENCY.PRIMARY).toBe('GTQ');
  });

  it('CURRENCY has exchange rates for USD and GTQ', () => {
    expect(CURRENCY.EXCHANGE_RATES.USD).toBeGreaterThan(0);
    expect(CURRENCY.EXCHANGE_RATES.GTQ).toBe(1);
  });

  it('STATUS_LABELS has all expected keys', () => {
    expect(STATUS_LABELS.pending).toBe('Pendiente');
    expect(STATUS_LABELS.invoiced).toBe('Facturado');
    expect(STATUS_LABELS.paid).toBe('Cobrado');
  });

  it('MODEL_PAYMENT_STATUSES is a readonly tuple', () => {
    expect(MODEL_PAYMENT_STATUSES).toContain('pending');
    expect(MODEL_PAYMENT_STATUSES).toContain('paid');
  });

  it('CLIENT_PAYMENT_STATUSES includes all 3 states', () => {
    expect(CLIENT_PAYMENT_STATUSES).toEqual(['pending', 'invoiced', 'paid']);
  });

  it('PAYMENT_TYPES includes cash, trade, mixed', () => {
    expect(PAYMENT_TYPES).toEqual(['cash', 'trade', 'mixed']);
  });

  it('TRADE_CATEGORIES has 6 items', () => {
    expect(TRADE_CATEGORIES).toHaveLength(6);
    expect(TRADE_CATEGORIES).toContain('products');
    expect(TRADE_CATEGORIES).toContain('services');
  });
});

// ── convertToGTQ ──

describe('convertToGTQ (finance)', () => {
  it('converts USD to GTQ', () => {
    const result = convertToGTQ(100, 'USD');
    expect(result).toBe(100 * CURRENCY.EXCHANGE_RATES.USD);
  });

  it('returns same amount for GTQ', () => {
    expect(convertToGTQ(500, 'GTQ')).toBe(500);
  });

  it('uses rate 1 for unknown currencies', () => {
    expect(convertToGTQ(200, 'JPY')).toBe(200);
  });

  it('handles zero', () => {
    expect(convertToGTQ(0, 'USD')).toBe(0);
  });
});

// ── getGuatemalaToday ──

describe('getGuatemalaToday', () => {
  it('returns a Date object', () => {
    const today = getGuatemalaToday();
    expect(today).toBeInstanceOf(Date);
  });

  it('has time set to midnight', () => {
    const today = getGuatemalaToday();
    expect(today.getHours()).toBe(0);
    expect(today.getMinutes()).toBe(0);
    expect(today.getSeconds()).toBe(0);
  });
});

// ── getGuatemalaTodayString ──

describe('getGuatemalaTodayString', () => {
  it('returns a YYYY-MM-DD string', () => {
    const dateStr = getGuatemalaTodayString();
    expect(dateStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('returns current year', () => {
    const dateStr = getGuatemalaTodayString();
    const year = parseInt(dateStr.split('-')[0]);
    expect(year).toBeGreaterThanOrEqual(2025);
  });
});

// ── isProjectDatePassed ──

describe('isProjectDatePassed', () => {
  it('returns false for null schedule', () => {
    expect(isProjectDatePassed(null)).toBe(false);
  });

  it('returns false for undefined schedule', () => {
    expect(isProjectDatePassed(undefined)).toBe(false);
  });

  it('returns false for empty schedule', () => {
    expect(isProjectDatePassed([])).toBe(false);
  });

  it('returns true for past date', () => {
    const schedule = [{ date: '2020-01-01' }];
    expect(isProjectDatePassed(schedule)).toBe(true);
  });

  it('returns false for future date', () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const schedule = [{ date: futureDate.toISOString().split('T')[0] }];
    expect(isProjectDatePassed(schedule)).toBe(false);
  });

  it('uses last date in schedule array', () => {
    const schedule = [
      { date: '2020-01-01' }, // past
      { date: '2099-12-31' }, // far future
    ];
    expect(isProjectDatePassed(schedule)).toBe(false);
  });
});

// ── meetsFinanceConditions ──

describe('meetsFinanceConditions', () => {
  const pastSchedule = [{ date: '2020-01-01' }];
  const futureSchedule = [{ date: '2099-12-31' }];

  it('returns true when all 4 conditions are met', () => {
    expect(meetsFinanceConditions({
      clientSelection: 'approved',
      projectStatus: 'completed',
      schedule: pastSchedule,
      hasAssignment: true,
    })).toBe(true);
  });

  it('returns false when clientSelection is not approved', () => {
    expect(meetsFinanceConditions({
      clientSelection: 'pending',
      projectStatus: 'completed',
      schedule: pastSchedule,
      hasAssignment: true,
    })).toBe(false);
  });

  it('returns false when projectStatus is not completed', () => {
    expect(meetsFinanceConditions({
      clientSelection: 'approved',
      projectStatus: 'active',
      schedule: pastSchedule,
      hasAssignment: true,
    })).toBe(false);
  });

  it('returns false when schedule is in future', () => {
    expect(meetsFinanceConditions({
      clientSelection: 'approved',
      projectStatus: 'completed',
      schedule: futureSchedule,
      hasAssignment: true,
    })).toBe(false);
  });

  it('returns false when no assignment', () => {
    expect(meetsFinanceConditions({
      clientSelection: 'approved',
      projectStatus: 'completed',
      schedule: pastSchedule,
      hasAssignment: false,
    })).toBe(false);
  });

  it('defaults hasAssignment to true', () => {
    expect(meetsFinanceConditions({
      clientSelection: 'approved',
      projectStatus: 'completed',
      schedule: pastSchedule,
    })).toBe(true);
  });

  it('returns false for null clientSelection', () => {
    expect(meetsFinanceConditions({
      clientSelection: null,
      projectStatus: 'completed',
      schedule: pastSchedule,
    })).toBe(false);
  });

  it('returns false for null projectStatus', () => {
    expect(meetsFinanceConditions({
      clientSelection: 'approved',
      projectStatus: null,
      schedule: pastSchedule,
    })).toBe(false);
  });
});
