'use server'

import { getModelApplicationStats } from '@/lib/api/dashboard'
import { createSupabaseServerActionClient } from '@/lib/supabase/server-action'
import { logError } from '@/lib/utils/errors'

export async function getTopApprovedModelIds(limit = 20): Promise<string[]> {
    try {
        // ─── Auth guard ───
        const supabase = await createSupabaseServerActionClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return []

        const rankings = await getModelApplicationStats(limit)
        return rankings.mostApproved.map(m => m.model_id)
    } catch (err) {
        logError(err, { action: 'getTopApprovedModelIds' })
        return []
    }
}
