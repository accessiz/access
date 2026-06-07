import { autoCloseAllExpiredProjects } from '@/lib/services/projectAutoClose';

// Chainable Supabase mock
function createChainMock(resolved: { data: any; error: any } = { data: null, error: null }) {
  const self: Record<string, jest.Mock> = {};
  const methods = ['from', 'select', 'insert', 'update', 'delete', 'eq', 'in', 'single', 'maybeSingle', 'not'];

  for (const m of methods) {
    self[m] = jest.fn().mockReturnValue(self);
  }
  self.single = jest.fn().mockResolvedValue(resolved);
  self.maybeSingle = jest.fn().mockResolvedValue(resolved);

  for (const m of methods) {
    if (m !== 'single' && m !== 'maybeSingle') {
      const original = self[m];
      self[m] = jest.fn((...args: any[]) => {
        original(...args);
        const proxy = new Proxy(self, {
          get(target, prop) {
            if (prop === 'then') {
              return (resolve: (v: any) => void) => resolve(resolved);
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

let mockSupabase: any;

jest.mock('@/lib/supabase/admin', () => ({
  get supabaseAdmin() {
    return mockSupabase;
  }
}));

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

jest.mock('@/lib/utils/errors', () => ({
  logError: jest.fn(),
}));

// Mock getGuatemalaToday to return a fixed date: 2026-06-06
jest.mock('@/lib/constants/finance', () => {
  const actual = jest.requireActual('@/lib/constants/finance');
  return {
    ...actual,
    getGuatemalaToday: jest.fn().mockReturnValue(new Date('2026-06-06T00:00:00')),
  };
});

describe('autoCloseAllExpiredProjects service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('handles database select error gracefully', async () => {
    mockSupabase = createChainMock({ data: null, error: { message: 'Database query failed' } });
    const result = await autoCloseAllExpiredProjects();
    expect(result.success).toBe(false);
    expect(result.closedCount).toBe(0);
    expect(result.error).toBe('Database query failed');
  });

  it('returns success if no projects found', async () => {
    mockSupabase = createChainMock({ data: [], error: null });
    const result = await autoCloseAllExpiredProjects();
    expect(result.success).toBe(true);
    expect(result.closedCount).toBe(0);
  });

  it('closes expired projects and skips future projects', async () => {
    // Current date is mocked as 2026-06-06
    const mockProjects = [
      {
        id: 'expired-id',
        status: 'in-review',
        schedule: [{ date: '2026-06-05' }],
        public_id: 'expired-pub'
      },
      {
        id: 'future-id',
        status: 'sent',
        schedule: [{ date: '2026-06-07' }],
        public_id: 'future-pub'
      }
    ];

    // Mock query logic:
    // 1. First fetch returns mockProjects
    // 2. Subsequent updates return success
    const chain = createChainMock({ data: mockProjects, error: null });
    
    // Custom mock for update to verify it is called for the expired project
    let updateCalls: Array<{ table: string; eqVal: string }> = [];
    chain.from = jest.fn((table: string) => {
      return {
        select: jest.fn().mockReturnValue({
          not: jest.fn().mockReturnValue(
            new Proxy({}, {
              get(target, prop) {
                if (prop === 'then') {
                  return (resolve: any) => resolve({ data: mockProjects, error: null });
                }
                return (chain as any)[prop];
              }
            })
          )
        }),
        update: jest.fn((payload: any) => {
          return {
            eq: jest.fn((col: string, val: string) => {
              updateCalls.push({ table, eqVal: val });
              return new Proxy({}, {
                get(target, prop) {
                  if (prop === 'then') {
                    return (resolve: any) => resolve({ data: null, error: null });
                  }
                  return (chain as any)[prop];
                }
              });
            })
          };
        })
      };
    });

    mockSupabase = chain;

    const result = await autoCloseAllExpiredProjects();
    
    expect(result.success).toBe(true);
    expect(result.closedCount).toBe(1);
    expect(result.closedIds).toEqual(['expired-id']);

    // Check that projects_models and projects table updates were targeted for expired-id
    const updatedExpiredProjects = updateCalls.filter(c => c.eqVal === 'expired-id');
    expect(updatedExpiredProjects.length).toBe(2); // One for projects_models, one for projects
    
    // Check that future-id was not updated
    const updatedFutureProjects = updateCalls.filter(c => c.eqVal === 'future-id');
    expect(updatedFutureProjects.length).toBe(0);
  });
});
