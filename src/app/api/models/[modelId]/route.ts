import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SUPABASE_BUCKET } from '@/lib/constants';
import { logError } from '@/lib/utils/errors';

// Forzar el runtime de Node.js, necesario para operaciones de sistema de archivos
export const dynamic = 'force-dynamic';
const BUCKET_NAME = SUPABASE_BUCKET;

// --- FUNCIÓN GET (Obtener URLs firmadas y rutas de archivo) ---
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ modelId: string }> }
) {
  try {
    // CORRECCIÓN: Resolvemos la promesa 'params' antes de usar sus propiedades
    const params = await context.params;
    const modelId = params.modelId;

    const supabase = await createClient();

    if (!modelId) {
      return NextResponse.json(
        { success: false, error: 'Model ID is required.' },
        { status: 400 }
      );
    }

    // Nuevo flujo: leer rutas desde la BD y firmarlas en lote (evita listar Storage por modelo)
    const { data: modelRecord, error: modelError } = await supabase
      .from('models')
      .select('cover_path, portfolio_path, comp_card_paths')
      .eq('id', modelId)
      .single();

    if (modelError || !modelRecord) {
      logError(modelError || new Error('No modelRecord'), { action: 'get model paths', modelId });
      return NextResponse.json({ success: false, error: 'Modelo no encontrado.' }, { status: 404 });
    }

    const coverPath = modelRecord.cover_path || null;
    const portfolioPath = modelRecord.portfolio_path || null;
    const compCardPaths: (string | null)[] = (modelRecord.comp_card_paths || []).slice(0, 4);
    while (compCardPaths.length < 4) compCardPaths.push(null);

    const pathsToSign: string[] = [];
    if (coverPath) pathsToSign.push(coverPath);
    if (portfolioPath) pathsToSign.push(portfolioPath);
    for (const p of compCardPaths) if (p) pathsToSign.push(p as string);

    const signedUrlMap = new Map<string, string>();
    if (pathsToSign.length > 0) {
      const { data: signedUrlsData, error: signError } = await supabase.storage.from(BUCKET_NAME).createSignedUrls(pathsToSign, 300);
      if (signError) {
        logError(signError, { action: 'sign urls model', modelId, pathsToSign });
      } else if (signedUrlsData) {
        for (const item of signedUrlsData) {
          if (item.path && item.signedUrl) signedUrlMap.set(item.path, item.signedUrl);
        }
      }
    }

    const coverUrl = coverPath ? signedUrlMap.get(coverPath) || null : null;
    const portfolioUrl = portfolioPath ? signedUrlMap.get(portfolioPath) || null : null;
    const compCardUrls = compCardPaths.map(p => p ? signedUrlMap.get(p as string) || null : null);

    return NextResponse.json({ success: true, coverUrl, portfolioUrl, compCardUrls, coverPath, portfolioPath, compCardPaths });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido.';
    logError(error, { route: 'GET /api/models/[modelId]', errorMessage });
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

