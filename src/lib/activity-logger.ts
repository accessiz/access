'use server';

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export type ActivityCategory = 'project' | 'model' | 'client' | 'brand';

export interface LogActivityParams {
    category: ActivityCategory;
    title: string;
    message?: string;
    metadata?: {
        entity_id?: string;
        entity_type?: string;
        action?: string;
        [key: string]: unknown;
    };
    isUrgent?: boolean;
}

/**
 * Registra una actividad en el log para el usuario actual.
 * Se usa para alimentar la campanita de notificaciones y el dashboard.
 */
export async function logActivity(params: LogActivityParams): Promise<void> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return;

        await supabase.from('activity_logs').insert({
            user_id: user.id,
            category: params.category,
            title: params.title,
            message: params.message || null,
            metadata: params.metadata ? JSON.parse(JSON.stringify(params.metadata)) : null,
            is_urgent: params.isUrgent || false,
        });
    } catch (error) {
        // No queremos que un error de logging rompa la operación principal
        logger.fromError(error, { action: 'logActivity', category: params.category });
    }
}
