'use server'

import { getModelApplicationStats } from '@/lib/api/dashboard'

export async function getTopApprovedModelIds(limit = 20): Promise<string[]> {
    try {
        const rankings = await getModelApplicationStats(limit)
        return rankings.mostApproved.map(m => m.model_id)
    } catch (err) {
        console.error('[getTopApprovedModelIds] Error:', err)
        return []
    }
}
