import { GET } from '@/app/api/cron/close-projects/route';
import { autoCloseAllExpiredProjects } from '@/lib/services/projectAutoClose';

jest.mock('@/lib/services/projectAutoClose', () => ({
    autoCloseAllExpiredProjects: jest.fn(),
}));

jest.mock('@/lib/env', () => ({
    serverEnv: {
        get CRON_SECRET() { return 'test-cron-secret'; }
    }
}));

jest.mock('@/lib/logger', () => ({
    logger: {
        warn: jest.fn(),
        info: jest.fn(),
        error: jest.fn(),
    }
}));

describe('Cron Close Projects API Route', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns 401 if unauthorized', async () => {
        const req = new Request('http://localhost/api/cron/close-projects', {
            headers: {
                'authorization': 'Bearer wrong-secret'
            }
        });

        const res = await GET(req);
        expect(res.status).toBe(401);
    });

    it('returns 200 with closed details if successful', async () => {
        (autoCloseAllExpiredProjects as jest.Mock).mockResolvedValue({
            success: true,
            closedCount: 2,
            closedIds: ['proj-1', 'proj-2']
        });

        const req = new Request('http://localhost/api/cron/close-projects', {
            headers: {
                'authorization': 'Bearer test-cron-secret'
            }
        });

        const res = await GET(req);
        expect(res.status).toBe(200);

        const data = await res.json();
        expect(data).toEqual({
            success: true,
            closedCount: 2,
            closedIds: ['proj-1', 'proj-2']
        });
    });

    it('returns 500 if service fails', async () => {
        (autoCloseAllExpiredProjects as jest.Mock).mockResolvedValue({
            success: false,
            error: 'Service database failure',
            closedCount: 0,
            closedIds: []
        });

        const req = new Request('http://localhost/api/cron/close-projects', {
            headers: {
                'authorization': 'Bearer test-cron-secret'
            }
        });

        const res = await GET(req);
        expect(res.status).toBe(500);

        const data = await res.json();
        expect(data).toEqual({
            success: false,
            error: 'Service database failure'
        });
    });
});
