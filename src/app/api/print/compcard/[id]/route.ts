import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createRateLimiter } from '@/lib/utils/rate-limit';
import { serverEnv } from '@/lib/env';
import { logger } from '@/lib/logger';

// Rate limiter: 20 requests per minute per IP
// Print manifests are expensive (DB query + URL construction) and rarely
// need to be fetched more than a few times per session.
const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 20 });

/**
 * GET /api/print/compcard/[id]
 *
 * Serves original high-resolution comp-card images for PDF/print workflows.
 * Returns a JSON manifest with direct R2 URLs to the master files.
 *
 * Rate limited: 20 req/min per IP.
 * Authentication required — only logged-in users can access print-ready assets.
 *
 * Response shape:
 * ```json
 * {
 *   "modelId": "uuid",
 *   "alias": "Model Name",
 *   "cover": "https://r2.dev/.../Portada/...-cover.webp",
 *   "coverBlur": "data:image/webp;base64,...",
 *   "compCards": ["https://r2.dev/.../comp_0_...", null, null, "https://r2.dev/.../comp_3_..."],
 *   "compCardBlurs": ["data:...", null, null, "data:..."],
 *   "printReady": true
 * }
 * ```
 */
export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    // ─── Rate limit check ───
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      ?? req.headers.get('x-real-ip')
      ?? 'unknown';
    const rateResult = limiter.check(ip);

    if (!rateResult.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil(rateResult.retryAfterMs / 1000)),
            'X-RateLimit-Limit': String(rateResult.limit),
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }

    const params = await props.params;
    const modelId = params?.id;

    if (!modelId || !/^[0-9a-f-]{36}$/i.test(modelId)) {
      return NextResponse.json(
        { error: 'Invalid model ID format' },
        { status: 400 }
      );
    }

    // ─── Auth check ───
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // ─── Fetch model data (including blur hashes) ───
    const { data: model, error } = await supabaseAdmin
      .from('models')
      .select('id, alias, full_name, cover_path, comp_card_paths, cover_blur_hash, comp_card_blur_hashes')
      .eq('id', modelId)
      .single();

    if (error || !model) {
      return NextResponse.json(
        { error: 'Model not found' },
        { status: 404 }
      );
    }

    // ─── Build print URLs ───
    const r2Base = serverEnv.R2_PUBLIC_URL.replace(/\/$/, '');

    function toFullUrl(path: string | null | undefined): string | null {
      if (!path) return null;
      if (path.startsWith('http')) return path;
      return r2Base ? `${r2Base}/${path.replace(/^\//, '')}` : null;
    }

    const compCards: (string | null)[] = Array.isArray(model.comp_card_paths)
      ? model.comp_card_paths.map((p: string | null) => toFullUrl(p))
      : [null, null, null, null];

    // Pad to 4 slots
    while (compCards.length < 4) compCards.push(null);

    const compCardBlurs: (string | null)[] = Array.isArray(model.comp_card_blur_hashes)
      ? model.comp_card_blur_hashes.slice(0, 4)
      : [null, null, null, null];
    while (compCardBlurs.length < 4) compCardBlurs.push(null);

    return NextResponse.json(
      {
        modelId: model.id,
        alias: model.alias ?? model.full_name,
        cover: toFullUrl(model.cover_path),
        coverBlur: model.cover_blur_hash ?? null,
        compCards,
        compCardBlurs,
        printReady: true,
      },
      {
        headers: {
          'Cache-Control': 'private, max-age=60',
          'X-RateLimit-Limit': String(rateResult.limit),
          'X-RateLimit-Remaining': String(rateResult.remaining),
        },
      }
    );
  } catch (err) {
    logger.fromError(err, { route: 'print/compcard', action: 'GET' });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
