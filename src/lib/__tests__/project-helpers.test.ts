/**
 * Tests for src/lib/actions/projects/helpers.ts
 *
 * Pure functions: convertToTimestamp, timestampTo12h, extractDateFromTimestamp,
 * extractScheduleFromFormData, extractProjectTypesFromFormData,
 * buildRawProjectData, formatZodErrors.
 */
import {
  convertToTimestamp,
  timestampTo12h,
  extractDateFromTimestamp,
  extractScheduleFromFormData,
  extractProjectTypesFromFormData,
  buildRawProjectData,
  formatZodErrors,
} from '@/lib/actions/projects/helpers';

// ── convertToTimestamp ──

describe('convertToTimestamp', () => {
  it('converts AM time correctly', () => {
    expect(convertToTimestamp('2026-03-04', '09:30 AM')).toBe('2026-03-04T09:30:00');
  });

  it('converts PM time correctly', () => {
    expect(convertToTimestamp('2026-03-04', '02:00 PM')).toBe('2026-03-04T14:00:00');
  });

  it('converts 12:00 PM to 12:00', () => {
    expect(convertToTimestamp('2026-06-15', '12:00 PM')).toBe('2026-06-15T12:00:00');
  });

  it('converts 12:00 AM to 00:00 (midnight)', () => {
    expect(convertToTimestamp('2026-06-15', '12:00 AM')).toBe('2026-06-15T00:00:00');
  });

  it('handles single-digit hours with padding', () => {
    expect(convertToTimestamp('2026-01-01', '1:05 AM')).toBe('2026-01-01T01:05:00');
  });
});

// ── timestampTo12h ──

describe('timestampTo12h', () => {
  it('converts morning timestamp', () => {
    expect(timestampTo12h('2026-03-04T09:30:00Z')).toBe('09:30 AM');
  });

  it('converts afternoon timestamp', () => {
    expect(timestampTo12h('2026-03-04T14:00:00Z')).toBe('02:00 PM');
  });

  it('converts midnight', () => {
    expect(timestampTo12h('2026-03-04T00:00:00Z')).toBe('12:00 AM');
  });

  it('converts noon', () => {
    expect(timestampTo12h('2026-03-04T12:00:00Z')).toBe('12:00 PM');
  });

  it('handles 11:59 PM', () => {
    expect(timestampTo12h('2026-03-04T23:59:00Z')).toBe('11:59 PM');
  });
});

// ── extractDateFromTimestamp ──

describe('extractDateFromTimestamp', () => {
  it('extracts YYYY-MM-DD from UTC timestamp', () => {
    expect(extractDateFromTimestamp('2026-03-04T14:30:00Z')).toBe('2026-03-04');
  });

  it('handles single-digit months & days', () => {
    expect(extractDateFromTimestamp('2026-01-05T00:00:00Z')).toBe('2026-01-05');
  });

  it('handles end-of-year', () => {
    expect(extractDateFromTimestamp('2026-12-31T23:59:59Z')).toBe('2026-12-31');
  });
});

// ── extractScheduleFromFormData ──

describe('extractScheduleFromFormData', () => {
  it('extracts schedule entries from FormData', () => {
    const fd = new FormData();
    fd.append('schedule.0.date', '2026-04-01');
    fd.append('schedule.0.startTime', '09:00 AM');
    fd.append('schedule.0.endTime', '05:00 PM');
    fd.append('schedule.1.date', '2026-04-02');
    fd.append('schedule.1.startTime', '10:00 AM');
    fd.append('schedule.1.endTime', '06:00 PM');

    const result = extractScheduleFromFormData(fd);
    expect(result).toHaveLength(2);
    expect(result[0].date).toBe('2026-04-01');
    expect(result[0].startTime).toBe('09:00 AM');
    expect(result[1].endTime).toBe('06:00 PM');
  });

  it('returns empty array when no schedule keys present', () => {
    const fd = new FormData();
    fd.append('project_name', 'Test');
    expect(extractScheduleFromFormData(fd)).toEqual([]);
  });

  it('handles sparse indices', () => {
    const fd = new FormData();
    fd.append('schedule.2.date', '2026-05-01');
    const result = extractScheduleFromFormData(fd);
    // Index 0 and 1 will be empty/undefined, index 2 will have data
    expect(result[2]).toBeDefined();
    expect(result[2].date).toBe('2026-05-01');
  });
});

// ── extractProjectTypesFromFormData ──

describe('extractProjectTypesFromFormData', () => {
  it('extracts project types array', () => {
    const fd = new FormData();
    fd.append('project_types[0]', 'fotografia');
    fd.append('project_types[1]', 'video');
    fd.append('project_types[2]', 'pasarela');

    expect(extractProjectTypesFromFormData(fd)).toEqual(['fotografia', 'video', 'pasarela']);
  });

  it('returns empty array when no types present', () => {
    const fd = new FormData();
    expect(extractProjectTypesFromFormData(fd)).toEqual([]);
  });
});

// ── buildRawProjectData ──

describe('buildRawProjectData', () => {
  it('builds data object from FormData with defaults', () => {
    const fd = new FormData();
    fd.append('project_name', 'Campaña Verano');
    fd.append('client_name', 'Acme Corp');

    const schedule = [{ date: '2026-04-01', startTime: '09:00 AM', endTime: '05:00 PM' }];
    const types = ['fotografia'];

    const result = buildRawProjectData(fd, schedule, types);

    expect(result.project_name).toBe('Campaña Verano');
    expect(result.client_name).toBe('Acme Corp');
    expect(result.client_id).toBeNull();
    expect(result.project_types).toEqual(['fotografia']);
    expect(result.currency).toBe('GTQ');
    expect(result.default_fee_type).toBe('per_day');
    expect(result.default_model_payment_type).toBe('cash');
    expect(result.client_payment_status).toBe('pending');
    expect(result.client_payment_type).toBe('cash');
    expect(result.tax_percentage).toBe(12);
    expect(result.schedule).toEqual(schedule);
  });

  it('uses empty project_types as null', () => {
    const fd = new FormData();
    fd.append('project_name', 'Test');
    fd.append('client_name', 'Client');

    const result = buildRawProjectData(fd, [], []);
    expect(result.project_types).toBeNull();
  });

  it('filters schedule entries without any data', () => {
    const fd = new FormData();
    fd.append('project_name', 'Test');
    fd.append('client_name', 'Client');

    const schedule = [
      { date: '2026-04-01', startTime: '09:00 AM', endTime: '05:00 PM' },
      { date: undefined, startTime: undefined, endTime: undefined },
    ];

    const result = buildRawProjectData(fd, schedule as any, []);
    expect(result.schedule).toHaveLength(1);
  });
});

// ── formatZodErrors ──

describe('formatZodErrors', () => {
  it('formats flat field errors', () => {
    const zodErrors = [
      { path: ['project_name'], message: 'Requerido' },
      { path: ['client_name'], message: 'Requerido' },
    ];

    const result = formatZodErrors(zodErrors, []);
    expect(result).toEqual({
      project_name: 'Requerido',
      client_name: 'Requerido',
    });
  });

  it('does not overwrite first error for same path', () => {
    const zodErrors = [
      { path: ['email'], message: 'Formato inválido' },
      { path: ['email'], message: 'Requerido' },
    ];

    const result = formatZodErrors(zodErrors, []);
    expect(result.email).toBe('Formato inválido');
  });

  it('formats schedule errors with date context', () => {
    const schedule = [
      { date: '2026-04-01', startTime: '09:00 AM', endTime: '05:00 PM' },
    ];
    const zodErrors = [
      { path: ['schedule', '0', 'startTime'], message: 'Hora inválida' },
    ];

    const result = formatZodErrors(zodErrors, schedule as any);
    expect(result.schedule).toContain('Hora inválida');
    // Should include a formatted date reference
    expect(result.schedule).toContain('abr');
  });

  it('falls back to generic path for schedule errors without date', () => {
    const zodErrors = [
      { path: ['schedule', '0', 'date'], message: 'Requerido' },
    ];

    const result = formatZodErrors(zodErrors, [{ date: undefined } as any]);
    // Without a date, falls through to generic path
    expect(result['schedule.0.date']).toBe('Requerido');
  });
});
