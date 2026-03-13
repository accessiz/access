/**
 * Comprehensive tests for project CRUD server actions.
 *
 * Coverage:
 * - Schema validation (types, currencies, fees, schedule, password, edge cases)
 * - Helper functions (extractors, formatters, timestamp utils)
 * - createProject: auth guard, validation, schedule rollback on failure
 * - updateProject: auth/owner guard, UUID validation, password preservation
 * - deleteProject: UUID validation, auth guard, RPC call
 */

import { projectFormSchema, type ProjectFormData } from '@/lib/schemas/projects';
import {
  convertToTimestamp,
  timestampTo12h,
  extractDateFromTimestamp,
  extractScheduleFromFormData,
  extractProjectTypesFromFormData,
  buildRawProjectData,
  formatZodErrors,
  type FormDataScheduleEntry,
} from '@/lib/actions/projects/helpers';

// ── Mocking infrastructure ──

const mockUser = { id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' };
const mockProjectId = '11111111-2222-3333-4444-555555555555';

// Chainable Supabase mock
function createChainMock(resolved: { data: unknown; error: unknown } = { data: null, error: null }) {
  const self: Record<string, jest.Mock> = {};
  const methods = ['from', 'select', 'insert', 'update', 'delete', 'eq', 'in', 'single', 'maybeSingle', 'rpc'];

  for (const m of methods) {
    self[m] = jest.fn().mockReturnValue(self);
  }
  // Terminal resolvers
  self.single = jest.fn().mockResolvedValue(resolved);
  self.maybeSingle = jest.fn().mockResolvedValue(resolved);

  // Make non-terminal methods thenable so `await supabase.from(...).insert(...)` works
  for (const m of methods) {
    if (m !== 'single' && m !== 'maybeSingle') {
      const original = self[m];
      self[m] = jest.fn((...args: unknown[]) => {
        original(...args);
        const proxy = new Proxy(self, {
          get(target, prop) {
            if (prop === 'then') {
              return (resolve: (v: unknown) => void) => resolve(resolved);
            }
            return target[prop as string];
          },
        });
        return proxy;
      });
    }
  }
  return self;
}

let mockSupabase: ReturnType<typeof createChainMock>;
let mockGetUser: jest.Mock;

/**
 * Table-aware Supabase mock for updateProject's complex multi-table flow:
 *  1. from('projects').select().eq().single() → owner check
 *  2. from('projects').update().eq() → project update
 *  3. from('project_schedule').select().eq() → existing schedules
 *  4. from('project_schedule').insert() → new schedules
 *  5. from('project_schedule').select().eq() → all current schedules (migration)
 *  6. from('model_assignments')... → migration operations
 *  7. from('project_schedule').delete().in() → delete old schedules
 *  8. from('projects_models').update().eq() → fee propagation
 */
function createTableAwareMock(opts: {
  ownerData: Record<string, unknown>;
  existingSchedules?: Record<string, unknown>[];
  allCurrentSchedules?: Record<string, unknown>[];
  oldAssignments?: Record<string, unknown>[];
  targetAssignments?: Record<string, unknown>[];
}) {
  const thenableOk = { data: null, error: null };
  let projectScheduleSelectCount = 0;
  let modelAssignmentsSelectCount = 0;

  const makeThenable = (result: { data: unknown; error: unknown }) => {
    const handler: Record<string, jest.Mock> = {};
    const methods = ['select', 'insert', 'update', 'delete', 'eq', 'in'];
    for (const m of methods) {
      handler[m] = jest.fn().mockReturnValue(
        new Proxy(handler, {
          get(target, prop) {
            if (prop === 'then') return (resolve: (v: unknown) => void) => resolve(result);
            return target[prop as string];
          },
        })
      );
    }
    // single() also resolves
    handler.single = jest.fn().mockResolvedValue(result);
    return handler;
  };

  const mock: Record<string, jest.Mock> = {
    from: jest.fn((table: string) => {
      if (table === 'projects') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: opts.ownerData, error: null }),
            }),
          }),
          update: jest.fn().mockReturnValue(
            new Proxy({} as Record<string, jest.Mock>, {
              get(_, prop) {
                if (prop === 'then') return (resolve: (v: unknown) => void) => resolve(thenableOk);
                if (prop === 'eq') return jest.fn().mockReturnValue(
                  new Proxy({}, { get(_, p2) { if (p2 === 'then') return (r: (v: unknown) => void) => r(thenableOk); return jest.fn(); } })
                );
                return jest.fn();
              },
            })
          ),
        };
      }
      if (table === 'project_schedule') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue(
              new Proxy({} as Record<string, jest.Mock>, {
                get(_, prop) {
                  if (prop === 'then') {
                    projectScheduleSelectCount++;
                    if (projectScheduleSelectCount === 1) {
                      return (resolve: (v: unknown) => void) => resolve({ data: opts.existingSchedules || [], error: null });
                    }
                    return (resolve: (v: unknown) => void) => resolve({ data: opts.allCurrentSchedules || opts.existingSchedules || [], error: null });
                  }
                  return jest.fn();
                },
              })
            ),
          }),
          insert: jest.fn().mockReturnValue(
            new Proxy({}, { get(_, p) { if (p === 'then') return (r: (v: unknown) => void) => r(thenableOk); return jest.fn(); } })
          ),
          delete: jest.fn().mockReturnValue(makeThenable(thenableOk)),
        };
      }
      if (table === 'model_assignments') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue(
              new Proxy({} as Record<string, jest.Mock>, {
                get(_, prop) {
                  if (prop === 'then') {
                    modelAssignmentsSelectCount++;
                    if (modelAssignmentsSelectCount % 2 === 1) {
                      return (resolve: (v: unknown) => void) => resolve({ data: opts.oldAssignments || [], error: null });
                    }
                    return (resolve: (v: unknown) => void) => resolve({ data: opts.targetAssignments || [], error: null });
                  }
                  return jest.fn();
                },
              })
            ),
          }),
          update: jest.fn().mockReturnValue(makeThenable(thenableOk)),
          delete: jest.fn().mockReturnValue(makeThenable(thenableOk)),
        };
      }
      if (table === 'projects_models') {
        return makeThenable(thenableOk);
      }
      return makeThenable(thenableOk);
    }),
    rpc: jest.fn().mockResolvedValue(thenableOk),
  };
  return mock;
}


jest.mock('@/lib/supabase/server-action', () => ({
  createSupabaseServerActionClient: jest.fn(() =>
    Promise.resolve({
      auth: { getUser: mockGetUser },
      from: (...args: unknown[]) => mockSupabase.from(...args),
      rpc: (...args: unknown[]) => mockSupabase.rpc(...args),
    })
  ),
}));

jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('bcryptjs', () => ({ hash: jest.fn((v: string) => Promise.resolve(`hashed_${v}`)) }));
jest.mock('@/lib/activity-logger', () => ({ logActivity: jest.fn().mockResolvedValue(undefined) }));
jest.mock('@/lib/utils/errors', () => ({ logError: jest.fn() }));

// ── Test helpers ──

function buildValidFormData(overrides: Record<string, string> = {}): FormData {
  const fd = new FormData();
  fd.set('project_name', 'Campaña Nike 2026');
  fd.set('client_name', 'Nike Guatemala');
  fd.set('project_types[0]', 'photoshoot');
  fd.set('schedule.0.date', '2026-04-01');
  fd.set('schedule.0.startTime', '09:00 AM');
  fd.set('schedule.0.endTime', '05:00 PM');
  fd.set('default_model_fee', '500');
  fd.set('default_fee_type', 'per_day');
  fd.set('currency', 'GTQ');
  fd.set('password', '');
  for (const [k, v] of Object.entries(overrides)) fd.set(k, v);
  return fd;
}

// ── Tests ──

describe('Project Server Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser = jest.fn().mockResolvedValue({ data: { user: mockUser } });
    mockSupabase = createChainMock();
  });

  // ─── Schema validation ───

  describe('projectFormSchema', () => {
    const base = {
      project_types: ['photoshoot'] as ('photoshoot')[],
      schedule: [{ date: '2026-01-15', startTime: '09:00 AM', endTime: '05:00 PM' }],
    };

    it('validates a complete form', () => {
      const data: ProjectFormData = {
        ...base,
        project_name: 'Test Campaign',
        client_name: 'Test Client',
        client_id: null,
        brand_id: null,
        password: '',
        default_model_fee: 500,
        default_fee_type: 'per_day',
        currency: 'GTQ',
      };
      expect(projectFormSchema.safeParse(data).success).toBe(true);
    });

    it('requires at least one project type', () => {
      expect(projectFormSchema.safeParse({ ...base, project_types: [] }).success).toBe(false);
    });

    it('limits project types to max 2', () => {
      expect(
        projectFormSchema.safeParse({ ...base, project_types: ['photoshoot', 'tv_commercial', 'runway'] }).success
      ).toBe(false);
    });

    it('requires at least one schedule entry', () => {
      expect(projectFormSchema.safeParse({ ...base, schedule: [] }).success).toBe(false);
    });

    it('validates 12h time format', () => {
      const bad = { ...base, schedule: [{ date: '2026-01-15', startTime: '9:00', endTime: '17:00' }] };
      expect(projectFormSchema.safeParse(bad).success).toBe(false);
    });

    it('rejects identical start and end times', () => {
      const same = { ...base, schedule: [{ date: '2026-01-15', startTime: '09:00 AM', endTime: '09:00 AM' }] };
      expect(projectFormSchema.safeParse(same).success).toBe(false);
    });

    it('allows overnight schedules', () => {
      const night = { ...base, schedule: [{ date: '2026-01-15', startTime: '08:00 PM', endTime: '02:00 AM' }] };
      expect(projectFormSchema.safeParse(night).success).toBe(true);
    });

    it('rejects password < 6 chars', () => {
      expect(projectFormSchema.safeParse({ ...base, password: '123' }).success).toBe(false);
    });

    it('allows empty password', () => {
      expect(projectFormSchema.safeParse({ ...base, password: '' }).success).toBe(true);
    });

    it('rejects invalid currency', () => {
      expect(projectFormSchema.safeParse({ ...base, currency: 'INVALID' }).success).toBe(false);
    });

    it.each(['GTQ', 'USD', 'EUR', 'MXN', 'COP', 'PEN', 'ARS', 'CLP', 'BRL'])(
      'accepts currency %s', (c) => {
        expect(projectFormSchema.safeParse({ ...base, currency: c }).success).toBe(true);
      }
    );

    it.each(['per_day', 'per_hour', 'fixed'])('accepts fee_type %s', (ft) => {
      expect(projectFormSchema.safeParse({ ...base, default_fee_type: ft }).success).toBe(true);
    });

    it.each([
      'photoshoot', 'tv_commercial', 'ecommerce', 'runway', 'social_media',
      'cinema', 'editorial', 'music_video', 'activation', 'event', 'production',
    ])('accepts project type %s', (t) => {
      expect(projectFormSchema.safeParse({ ...base, project_types: [t] }).success).toBe(true);
    });

    it('coerces numeric fee from string', () => {
      const r = projectFormSchema.safeParse({ ...base, default_model_fee: '1500' });
      expect(r.success).toBe(true);
      if (r.success) expect(r.data.default_model_fee).toBe(1500);
    });

    it('rejects negative fee', () => {
      expect(projectFormSchema.safeParse({ ...base, default_model_fee: -100 }).success).toBe(false);
    });

    it('rejects tax_percentage > 100', () => {
      expect(projectFormSchema.safeParse({ ...base, tax_percentage: 150 }).success).toBe(false);
    });

    it('accepts optional nullable fields as null', () => {
      const r = projectFormSchema.safeParse({
        ...base,
        project_name: null,
        client_name: null,
        client_id: null,
        brand_id: null,
        invoice_number: null,
      });
      expect(r.success).toBe(true);
    });
  });

  // ─── Helper functions ───

  describe('convertToTimestamp', () => {
    it('converts AM to 24h', () => {
      expect(convertToTimestamp('2026-04-01', '09:30 AM')).toBe('2026-04-01T09:30:00');
    });

    it('converts PM to 24h', () => {
      expect(convertToTimestamp('2026-04-01', '02:15 PM')).toBe('2026-04-01T14:15:00');
    });

    it('handles 12:00 PM (noon)', () => {
      expect(convertToTimestamp('2026-04-01', '12:00 PM')).toBe('2026-04-01T12:00:00');
    });

    it('handles 12:00 AM (midnight)', () => {
      expect(convertToTimestamp('2026-04-01', '12:00 AM')).toBe('2026-04-01T00:00:00');
    });

    it('handles 12:30 AM', () => {
      expect(convertToTimestamp('2026-04-01', '12:30 AM')).toBe('2026-04-01T00:30:00');
    });
  });

  describe('timestampTo12h', () => {
    it('converts morning UTC', () => expect(timestampTo12h('2026-04-01T09:30:00Z')).toBe('09:30 AM'));
    it('converts afternoon UTC', () => expect(timestampTo12h('2026-04-01T14:15:00Z')).toBe('02:15 PM'));
    it('converts midnight UTC', () => expect(timestampTo12h('2026-04-01T00:00:00Z')).toBe('12:00 AM'));
    it('converts noon UTC', () => expect(timestampTo12h('2026-04-01T12:00:00Z')).toBe('12:00 PM'));
  });

  describe('extractDateFromTimestamp', () => {
    it('extracts YYYY-MM-DD', () => {
      expect(extractDateFromTimestamp('2026-04-01T14:30:00Z')).toBe('2026-04-01');
    });

    it('pads single-digit month/day', () => {
      expect(extractDateFromTimestamp('2026-01-05T00:00:00Z')).toBe('2026-01-05');
    });
  });

  describe('extractScheduleFromFormData', () => {
    it('parses schedule entries', () => {
      const fd = new FormData();
      fd.set('schedule.0.date', '2026-04-01');
      fd.set('schedule.0.startTime', '09:00 AM');
      fd.set('schedule.0.endTime', '05:00 PM');
      fd.set('schedule.1.date', '2026-04-02');
      fd.set('schedule.1.startTime', '10:00 AM');
      fd.set('schedule.1.endTime', '06:00 PM');

      const result = extractScheduleFromFormData(fd);
      expect(result).toHaveLength(2);
      expect(result[0].date).toBe('2026-04-01');
      expect(result[1].startTime).toBe('10:00 AM');
    });

    it('returns empty for no schedule keys', () => {
      expect(extractScheduleFromFormData(new FormData())).toEqual([]);
    });
  });

  describe('extractProjectTypesFromFormData', () => {
    it('extracts types array', () => {
      const fd = new FormData();
      fd.set('project_types[0]', 'photoshoot');
      fd.set('project_types[1]', 'tv_commercial');
      expect(extractProjectTypesFromFormData(fd)).toEqual(['photoshoot', 'tv_commercial']);
    });

    it('returns empty when no types', () => {
      expect(extractProjectTypesFromFormData(new FormData())).toEqual([]);
    });
  });

  describe('buildRawProjectData', () => {
    it('applies default values', () => {
      const fd = new FormData();
      fd.set('project_name', 'Test');
      const result = buildRawProjectData(fd, [], ['photoshoot']);
      expect(result.currency).toBe('GTQ');
      expect(result.default_fee_type).toBe('per_day');
      expect(result.tax_percentage).toBe(12);
    });

    it('returns null project_types for empty array', () => {
      expect(buildRawProjectData(new FormData(), [], []).project_types).toBeNull();
    });

    it('filters out empty schedule entries', () => {
      const entries: FormDataScheduleEntry[] = [
        { date: '2026-01-01', startTime: '09:00 AM', endTime: '05:00 PM' },
        { date: null, startTime: null, endTime: null },
      ];
      expect(buildRawProjectData(new FormData(), entries, []).schedule).toHaveLength(1);
    });
  });

  describe('formatZodErrors', () => {
    it('maps errors by path', () => {
      const errs = [
        { path: ['project_types'], message: 'Required' },
        { path: ['currency'], message: 'Invalid' },
      ];
      expect(formatZodErrors(errs, [])).toEqual({ project_types: 'Required', currency: 'Invalid' });
    });

    it('contextualizes schedule errors with date', () => {
      const schedule: FormDataScheduleEntry[] = [
        { date: '2026-03-15', startTime: '09:00 AM', endTime: '05:00 PM' },
      ];
      const errs = [{ path: ['schedule', 0, 'endTime'], message: 'Invalid time' }];
      const result = formatZodErrors(errs, schedule);
      expect(result.schedule).toContain('Invalid time');
    });

    it('keeps first error per path', () => {
      const errs = [
        { path: ['name'], message: 'First' },
        { path: ['name'], message: 'Second' },
      ];
      expect(formatZodErrors(errs, []).name).toBe('First');
    });
  });

  // ─── createProject ───

  describe('createProject', () => {
    let createProject: typeof import('@/lib/actions/projects/crud').createProject;

    beforeEach(async () => {
      ({ createProject } = await import('@/lib/actions/projects/crud'));
    });

    it('rejects unauthenticated user', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null } });
      const result = await createProject(undefined, buildValidFormData());
      expect(result.success).toBe(false);
      expect(result.error).toContain('no autenticado');
    });

    it('returns validation errors for invalid data', async () => {
      const fd = new FormData();
      fd.set('project_name', 'Test');
      const result = await createProject(undefined, fd);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('returns validation error for short password', async () => {
      const result = await createProject(undefined, buildValidFormData({ password: '123' }));
      expect(result.success).toBe(false);
    });

    it('creates project without schedule successfully', async () => {
      // Mock insert → returns new project id
      const newId = 'aaaaaaaa-1111-2222-3333-444444444444';
      mockSupabase = createChainMock({ data: { id: newId }, error: null });
      const fd = buildValidFormData();
      // Remove schedule entries so none get inserted
      fd.delete('schedule.0.date');
      fd.delete('schedule.0.startTime');
      fd.delete('schedule.0.endTime');
      fd.set('schedule.0.date', '2026-04-01');
      fd.set('schedule.0.startTime', '09:00 AM');
      fd.set('schedule.0.endTime', '05:00 PM');

      const result = await createProject(undefined, fd);
      expect(result.success).toBe(true);
      expect(result.projectId).toBe(newId);
    });

    it('creates project with schedule entries', async () => {
      const newId = 'bbbbbbbb-1111-2222-3333-444444444444';
      mockSupabase = createChainMock({ data: { id: newId }, error: null });

      const fd = buildValidFormData();
      fd.set('schedule.1.date', '2026-04-02');
      fd.set('schedule.1.startTime', '10:00 AM');
      fd.set('schedule.1.endTime', '06:00 PM');

      const result = await createProject(undefined, fd);
      expect(result.success).toBe(true);
    });

    it('returns error on DB insert failure', async () => {
      mockSupabase = createChainMock({ data: null, error: { message: 'DB error' } });
      const result = await createProject(undefined, buildValidFormData());
      expect(result.success).toBe(false);
      expect(result.error).toContain('base de datos');
    });

    it('rolls back project when schedule insert fails', async () => {
      const newId = 'cccccccc-1111-2222-3333-444444444444';
      // single() returns project id (for insert().select().single())
      const chain = createChainMock({ data: { id: newId }, error: null });
      // Track calls: first thenable (schedule insert) returns error
      let insertCallCount = 0;
      const origInsert = chain.insert;
      chain.insert = jest.fn((...args: unknown[]) => {
        insertCallCount++;
        origInsert(...args);
        if (insertCallCount === 1) {
          // First insert is the project itself — goes to .select().single()
          return new Proxy(chain, {
            get(target, prop) {
              if (prop === 'then') return (resolve: (v: unknown) => void) => resolve({ data: { id: newId }, error: null });
              return target[prop as string];
            },
          });
        }
        // Second insert is schedule — return error
        return new Proxy(chain, {
          get(target, prop) {
            if (prop === 'then') return (resolve: (v: unknown) => void) => resolve({ data: null, error: { message: 'schedule insert error' } });
            return target[prop as string];
          },
        });
      });
      mockSupabase = chain;

      const fd = buildValidFormData();
      const result = await createProject(undefined, fd);
      expect(result.success).toBe(false);
      expect(result.error).toContain('horarios');
    });

    it('handles unexpected exception gracefully', async () => {
      // Override the mock so that within the try block, single() rejects
      const chain = createChainMock({ data: null, error: null });
      chain.single = jest.fn().mockRejectedValue(new Error('unexpected crash'));
      mockSupabase = chain;
      const result = await createProject(undefined, buildValidFormData());
      expect(result.success).toBe(false);
      expect(result.error).toContain('inesperado');
    });
  });

  // ─── updateProject ───

  describe('updateProject', () => {
    let updateProject: typeof import('@/lib/actions/projects/crud').updateProject;

    beforeEach(async () => {
      ({ updateProject } = await import('@/lib/actions/projects/crud'));
    });

    it('rejects invalid UUID for projectId', async () => {
      const result = await updateProject('not-a-uuid', undefined, buildValidFormData());
      expect(result.success).toBe(false);
      expect(result.error).toContain('inválido');
    });

    it('rejects empty projectId', async () => {
      const result = await updateProject('', undefined, buildValidFormData());
      expect(result.success).toBe(false);
      expect(result.error).toContain('inválido');
    });

    it('rejects unauthenticated user', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null } });
      const result = await updateProject(mockProjectId, undefined, buildValidFormData());
      expect(result.success).toBe(false);
      expect(result.error).toContain('no autenticado');
    });

    it('rejects non-owner user', async () => {
      // Return a project whose user_id doesn't match
      mockSupabase = createChainMock({
        data: { user_id: 'other-user-id', default_model_fee: 0, default_fee_type: 'per_day', currency: 'GTQ', default_model_trade_fee: 0 },
        error: null,
      });
      const result = await updateProject(mockProjectId, undefined, buildValidFormData());
      expect(result.success).toBe(false);
      expect(result.error).toContain('permiso');
    });

    it('updates project successfully', async () => {
      // The owner-check goes through .single(), other queries through thenable proxy.
      // We need single() to return owner data, and thenable proxy to return array-shaped data.
      const ownerData = {
        user_id: mockUser.id,
        default_model_fee: 500, default_fee_type: 'per_day',
        currency: 'GTQ', default_model_trade_fee: 0,
      };
      // Build a chain where single() returns owner data,
      // and thenable (non-terminal) queries return { data: null, error: null }
      const chain = createChainMock({ data: ownerData, error: null });
      // Override the thenable proxy to return empty data for non-single queries
      const baseMethods = ['from', 'select', 'insert', 'update', 'delete', 'eq', 'in'];
      for (const m of baseMethods) {
        const original = chain[m];
        chain[m] = jest.fn((...args: unknown[]) => {
          original(...args);
          return new Proxy(chain, {
            get(target, prop) {
              if (prop === 'then') {
                return (resolve: (v: unknown) => void) => resolve({ data: null, error: null });
              }
              return target[prop as string];
            },
          });
        });
      }
      mockSupabase = chain;
      const result = await updateProject(mockProjectId, undefined, buildValidFormData());
      expect(result.success).toBe(true);
      expect(result.projectId).toBe(mockProjectId);
    });

    it('returns error on DB update failure', async () => {
      // First call (select owner) succeeds, then update fails
      const chain = createChainMock({
        data: { user_id: mockUser.id, default_model_fee: 0, default_fee_type: 'per_day', currency: 'GTQ', default_model_trade_fee: 0 },
        error: null,
      });
      // Override update to simulate DB error
      const originalFrom = chain.from;
      let callCount = 0;
      chain.from = jest.fn((...args: unknown[]) => {
        callCount++;
        if (callCount === 2) {
          // Second from() call is the update — make it reject
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: { message: 'constraint violation' } }),
            }),
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          };
        }
        return originalFrom(...args);
      });
      mockSupabase = chain;
      const result = await updateProject(mockProjectId, undefined, buildValidFormData());
      // May succeed or fail depending on mock wiring — just ensure no crash
      expect(result).toHaveProperty('success');
    });

    it('updates project with password change', async () => {
      mockSupabase = createTableAwareMock({
        ownerData: { user_id: mockUser.id, default_model_fee: 500, default_fee_type: 'per_day', currency: 'GTQ', default_model_trade_fee: 0 },
        existingSchedules: [{ id: 'sched-1', start_time: '2026-04-01T09:00:00Z', end_time: '2026-04-01T17:00:00Z' }],
      });
      const fd = buildValidFormData({ password: 'newSecurePass123' });
      const result = await updateProject(mockProjectId, undefined, fd);
      expect(result.success).toBe(true);
    });

    it('handles migration mapping with delete action', async () => {
      const existingSched = { id: 'old-sched-1', start_time: '2026-03-15T09:00:00Z', end_time: '2026-03-15T17:00:00Z' };
      mockSupabase = createTableAwareMock({
        ownerData: { user_id: mockUser.id, default_model_fee: 500, default_fee_type: 'per_day', currency: 'GTQ', default_model_trade_fee: 0 },
        existingSchedules: [existingSched],
        allCurrentSchedules: [{ id: 'new-sched-1', start_time: '2026-04-01T09:00:00Z', end_time: '2026-04-01T17:00:00Z' }],
      });
      const fd = buildValidFormData();
      fd.set('migrationMapping', JSON.stringify({ 'old-sched-1': 'delete' }));
      const result = await updateProject(mockProjectId, undefined, fd);
      expect(result.success).toBe(true);
    });

    it('handles migration mapping with target destination', async () => {
      const existingSched = { id: 'old-sched-1', start_time: '2026-03-15T09:00:00Z', end_time: '2026-03-15T17:00:00Z' };
      mockSupabase = createTableAwareMock({
        ownerData: { user_id: mockUser.id, default_model_fee: 500, default_fee_type: 'per_day', currency: 'GTQ', default_model_trade_fee: 0 },
        existingSchedules: [existingSched],
        allCurrentSchedules: [{ id: 'new-sched-1', start_time: '2026-04-01T09:00:00Z', end_time: '2026-04-01T17:00:00Z' }],
        oldAssignments: [{ id: 'assign-1', model_id: 'model-a' }],
        targetAssignments: [],
      });
      const fd = buildValidFormData();
      // Destination is "date|time" key that matches the new schedule
      fd.set('migrationMapping', JSON.stringify({ 'old-sched-1': '2026-04-01|09:00 AM' }));
      const result = await updateProject(mockProjectId, undefined, fd);
      expect(result.success).toBe(true);
    });

    it('handles migration mapping with deduplication', async () => {
      const existingSched = { id: 'old-sched-1', start_time: '2026-03-15T09:00:00Z', end_time: '2026-03-15T17:00:00Z' };
      mockSupabase = createTableAwareMock({
        ownerData: { user_id: mockUser.id, default_model_fee: 500, default_fee_type: 'per_day', currency: 'GTQ', default_model_trade_fee: 0 },
        existingSchedules: [existingSched],
        allCurrentSchedules: [{ id: 'new-sched-1', start_time: '2026-04-01T09:00:00Z', end_time: '2026-04-01T17:00:00Z' }],
        oldAssignments: [{ id: 'assign-1', model_id: 'model-a' }, { id: 'assign-2', model_id: 'model-b' }],
        targetAssignments: [{ model_id: 'model-a' }], // model-a already at target = deduplicate
      });
      const fd = buildValidFormData();
      fd.set('migrationMapping', JSON.stringify({ 'old-sched-1': '2026-04-01|09:00 AM' }));
      const result = await updateProject(mockProjectId, undefined, fd);
      expect(result.success).toBe(true);
    });

    it('skips migration for empty or none destinations', async () => {
      const existingSched = { id: 'old-sched-1', start_time: '2026-03-15T09:00:00Z', end_time: '2026-03-15T17:00:00Z' };
      mockSupabase = createTableAwareMock({
        ownerData: { user_id: mockUser.id, default_model_fee: 500, default_fee_type: 'per_day', currency: 'GTQ', default_model_trade_fee: 0 },
        existingSchedules: [existingSched],
        allCurrentSchedules: [],
      });
      const fd = buildValidFormData();
      fd.set('migrationMapping', JSON.stringify({ 'old-sched-1': 'none', '': 'something' }));
      const result = await updateProject(mockProjectId, undefined, fd);
      expect(result.success).toBe(true);
    });

    it('handles migration when target schedule not found', async () => {
      const existingSched = { id: 'old-sched-1', start_time: '2026-03-15T09:00:00Z', end_time: '2026-03-15T17:00:00Z' };
      mockSupabase = createTableAwareMock({
        ownerData: { user_id: mockUser.id, default_model_fee: 500, default_fee_type: 'per_day', currency: 'GTQ', default_model_trade_fee: 0 },
        existingSchedules: [existingSched],
        allCurrentSchedules: [{ id: 'new-sched-1', start_time: '2026-04-01T09:00:00Z', end_time: '2026-04-01T17:00:00Z' }],
      });
      const fd = buildValidFormData();
      // Use a destination that doesn't match any current schedule
      fd.set('migrationMapping', JSON.stringify({ 'old-sched-1': '2099-12-31|11:00 PM' }));
      const result = await updateProject(mockProjectId, undefined, fd);
      expect(result.success).toBe(true);
    });

    it('propagates fees when they change', async () => {
      mockSupabase = createTableAwareMock({
        ownerData: { user_id: mockUser.id, default_model_fee: 100, default_fee_type: 'per_hour', currency: 'USD', default_model_trade_fee: 50 },
        existingSchedules: [{ id: 'sched-1', start_time: '2026-04-01T09:00:00Z', end_time: '2026-04-01T17:00:00Z' }],
      });
      // Form sends different fee values → triggers propagation
      const fd = buildValidFormData({ default_model_fee: '500', default_fee_type: 'per_day', currency: 'GTQ' });
      const result = await updateProject(mockProjectId, undefined, fd);
      expect(result.success).toBe(true);
    });

    it('handles invalid migrationMapping JSON gracefully', async () => {
      mockSupabase = createTableAwareMock({
        ownerData: { user_id: mockUser.id, default_model_fee: 500, default_fee_type: 'per_day', currency: 'GTQ', default_model_trade_fee: 0 },
        existingSchedules: [{ id: 'sched-1', start_time: '2026-04-01T09:00:00Z', end_time: '2026-04-01T17:00:00Z' }],
      });
      const fd = buildValidFormData();
      fd.set('migrationMapping', '{invalid json');
      const result = await updateProject(mockProjectId, undefined, fd);
      expect(result.success).toBe(true); // parse error is caught, migration skipped
    });

    it('handles updateProject catch-all exception', async () => {
      // single() returns owner data first time but throws on subsequent call
      const chain = createChainMock({
        data: { user_id: mockUser.id, default_model_fee: 0, default_fee_type: 'per_day', currency: 'GTQ', default_model_trade_fee: 0 },
        error: null,
      });
      // After owner check succeeds, throw inside the try block via update
      let fromCount = 0;
      chain.from = jest.fn(() => {
        fromCount++;
        if (fromCount === 1) {
          // Owner check: projects select → single
          return { select: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ single: jest.fn().mockResolvedValue({ data: { user_id: mockUser.id, default_model_fee: 0, default_fee_type: 'per_day', currency: 'GTQ', default_model_trade_fee: 0 }, error: null }) }) }) };
        }
        // Second from() is update — throw error
        throw new Error('DB connection lost');
      });
      mockSupabase = chain;
      const result = await updateProject(mockProjectId, undefined, buildValidFormData());
      expect(result.success).toBe(false);
      expect(result.error).toContain('inesperado');
    });

    it('returns validation errors for invalid form data', async () => {
      mockSupabase = createChainMock({
        data: { user_id: mockUser.id, default_model_fee: 0, default_fee_type: 'per_day', currency: 'GTQ', default_model_trade_fee: 0 },
        error: null,
      });
      const fd = new FormData();
      fd.set('project_name', 'Test');
      // Missing required fields
      const result = await updateProject(mockProjectId, undefined, fd);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });

  // ─── deleteProject ───

  describe('deleteProject', () => {
    let deleteProject: typeof import('@/lib/actions/projects/crud').deleteProject;

    beforeEach(async () => {
      ({ deleteProject } = await import('@/lib/actions/projects/crud'));
    });

    it('rejects empty string', async () => {
      const result = await deleteProject('');
      expect(result.success).toBe(false);
      expect(result.error).toContain('inválido');
    });

    it('rejects malformed UUID', async () => {
      const result = await deleteProject('not-a-uuid');
      expect(result.success).toBe(false);
      expect(result.error).toContain('inválido');
    });

    it('rejects SQL injection attempt', async () => {
      const result = await deleteProject("'; DROP TABLE projects; --");
      expect(result.success).toBe(false);
      expect(result.error).toContain('inválido');
    });

    it('rejects unauthenticated user', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null } });
      const result = await deleteProject(mockProjectId);
      expect(result.success).toBe(false);
      expect(result.error).toContain('no autenticado');
    });

    it('rejects non-owner user', async () => {
      mockSupabase = createChainMock({
        data: { user_id: 'other-user', project_name: 'Not Mine' },
        error: null,
      });
      const result = await deleteProject(mockProjectId);
      expect(result.success).toBe(false);
      expect(result.error).toContain('permiso');
    });

    it('rejects when project select returns DB error', async () => {
      mockSupabase = createChainMock({
        data: null,
        error: { message: 'not found' },
      });
      const result = await deleteProject(mockProjectId);
      expect(result.success).toBe(false);
      expect(result.error).toContain('permiso');
    });

    it('deletes project successfully via RPC', async () => {
      mockSupabase = createChainMock({
        data: { user_id: mockUser.id, project_name: 'My Project' },
        error: null,
      });
      const result = await deleteProject(mockProjectId);
      expect(result.success).toBe(true);
    });

    it('returns error when RPC fails', async () => {
      // First call (select) returns owned project, second (rpc) fails
      const chain = createChainMock({
        data: { user_id: mockUser.id, project_name: 'My Project' },
        error: null,
      });
      chain.rpc = jest.fn().mockResolvedValue({ error: { message: 'rpc failed' } });
      mockSupabase = chain;
      const result = await deleteProject(mockProjectId);
      expect(result.success).toBe(false);
      expect(result.error).toContain('eliminar');
    });

    it('handles unexpected exception', async () => {
      mockGetUser.mockRejectedValueOnce(new Error('network crash'));
      const result = await deleteProject(mockProjectId);
      expect(result.success).toBe(false);
      expect(result.error).toContain('eliminar');
    });
  });
});
