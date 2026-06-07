import { NextResponse } from 'next/server';
import { serverEnv } from '@/lib/env';
import { autoCloseAllExpiredProjects } from '@/lib/services/projectAutoClose';
import { logger } from '@/lib/logger';

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('authorization');
        const cronSecret = serverEnv.CRON_SECRET;
        
        if (authHeader !== `Bearer ${cronSecret}`) {
            logger.warn('[Cron Close Projects] Unauthorized attempt');
            return new NextResponse('Unauthorized', { status: 401 });
        }

        logger.info('[Cron Close Projects] Starting project auto-close execution');
        const result = await autoCloseAllExpiredProjects();

        if (result.success) {
            logger.info(`[Cron Close Projects] Successfully completed. Closed projects count: ${result.closedCount}`, {
                closedIds: result.closedIds
            });
            return NextResponse.json({
                success: true,
                closedCount: result.closedCount,
                closedIds: result.closedIds
            });
        } else {
            logger.error('[Cron Close Projects] Execution failed', { error: result.error });
            return NextResponse.json({
                success: false,
                error: result.error
            }, { status: 500 });
        }
    } catch (error) {
        logger.error('[Cron Close Projects] Unexpected error', { error });
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal Server Error'
        }, { status: 500 });
    }
}
