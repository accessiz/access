// Archivo: src/app/api/models/[modelId]/route.ts

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import path from 'path';

export const dynamic = 'force-dynamic';
const BUCKET_NAME = 'Book_Completo_iZ_Management';

// --- FUNCIÓN GET (Obtener URLs firmadas y rutas exactas) ---
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ modelId: string }> } // El tipo correcto es Promise
) {
  try {
    // --- CORRECCIÓN FINAL: Await params ---
    // Resolvemos la promesa ANTES de acceder a modelId
    const params = await context.params;
    const modelId = params.modelId;
    // --- FIN CORRECCIÓN FINAL ---

    const supabase = await createClient();

    if (!modelId) {
      return NextResponse.json(
        { success: false, error: 'Model ID is required.' },
        { status: 400 }
      );
    }

    let coverUrl: string | null = null;
    let compCardUrls: (string | null)[] = Array(4).fill(null);
    let portfolioUrl: string | null = null;
    let coverPath: string | null = null;
    let portfolioPath: string | null = null;
    let compCardPaths: (string | null)[] = Array(4).fill(null);


    // --- 1. Obtener la portada ---
    const { data: coverList, error: coverListError } = await supabase
      .storage
      .from(BUCKET_NAME)
      .list(`${modelId}/Portada/`, { limit: 1 });

    if (coverListError) {
      console.error(`❌ Error al listar portada para ${modelId}:`, coverListError);
    } else if (coverList && coverList.length > 0) {
      const actualCoverPath = `${modelId}/Portada/${coverList[0].name}`;
      coverPath = actualCoverPath;
      const { data: coverSignedUrl, error: coverError } = await supabase
        .storage
        .from(BUCKET_NAME)
        .createSignedUrl(actualCoverPath, 300);
      if (coverError) {
        console.error(`❌ Error al firmar URL de portada para ${modelId}:`, coverError);
      } else {
        coverUrl = coverSignedUrl?.signedUrl ?? null;
      }
    }

    // --- 2. Obtener la imagen de Portafolio ---
    const { data: portfolioList, error: portfolioListError } = await supabase
      .storage
      .from(BUCKET_NAME)
      .list(`${modelId}/Portfolio/`, { limit: 1 });

    if (portfolioListError) {
      console.error(`❌ Error al listar portafolio para ${modelId}:`, portfolioListError);
    } else if (portfolioList && portfolioList.length > 0) {
      const actualPortfolioPath = `${modelId}/Portfolio/${portfolioList[0].name}`;
      portfolioPath = actualPortfolioPath;
      const { data: portfolioSignedUrl, error: portfolioError } = await supabase
        .storage
        .from(BUCKET_NAME)
        .createSignedUrl(actualPortfolioPath, 300);
      if (portfolioError) {
        console.error(`❌ Error al firmar URL de portafolio para ${modelId}:`, portfolioError);
      } else {
        portfolioUrl = portfolioSignedUrl?.signedUrl ?? null;
      }
    }

    // --- 3. Obtener contraportadas ---
    const { data: fileList, error: listError } = await supabase
      .storage
      .from(BUCKET_NAME)
      .list(`${modelId}/Contraportada/`, {
        limit: 4,
        sortBy: { column: 'name', order: 'asc' },
      });

    if (listError) {
      console.error(`❌ Error al listar contraportadas para ${modelId}:`, listError);
    }

    if (fileList && fileList.length > 0) {
      const filePaths = fileList.map(file => `${modelId}/Contraportada/${file.name}`);

      fileList.forEach(file => {
          const match = file.name.match(/comp_(\d+)/);
          if (match && match[1]) {
              const index = parseInt(match[1], 10);
              if (index >= 0 && index < 4) {
                  compCardPaths[index] = `${modelId}/Contraportada/${file.name}`;
              }
          }
      });

      const { data: signedUrlsData, error: signedUrlError } = await supabase
        .storage
        .from(BUCKET_NAME)
        .createSignedUrls(filePaths, 300);

      if (signedUrlError) {
        console.error(`❌ Error al firmar URLs de contraportada para ${modelId}:`, signedUrlError);
      } else if (signedUrlsData) {
        const urlMap = new Map(signedUrlsData.map(item => item && item.path ? [item.path, item.signedUrl] : [null, null]));
        compCardUrls = compCardPaths.map(path => path ? urlMap.get(path) ?? null : null);
      }
    }
    while (compCardUrls.length < 4) compCardUrls.push(null);
    while (compCardPaths.length < 4) compCardPaths.push(null);
    compCardUrls = compCardUrls.slice(0, 4);
    compCardPaths = compCardPaths.slice(0, 4);


    return NextResponse.json({
      success: true,
      coverUrl,
      portfolioUrl,
      compCardUrls,
      coverPath,
      portfolioPath,
      compCardPaths,
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido.';
    console.error('🔥 Error general en GET /api/models/[modelId]:', errorMessage);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}


// --- FUNCIÓN POST (Subir/Actualizar Imagen) ---
// Esta ya estaba corregida en la versión anterior, usando context y params
export async function POST(
  request: NextRequest,
  context: { params: { modelId: string } }
) {
  try {
    const { params } = context; // Aquí no necesita await porque el tipo es diferente
    const modelId = params.modelId;

    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const type = formData.get('type') as 'cover' | 'comp-card' | 'portfolio' | null;
    const slotIndex = formData.get('slotIndex') as string | null;

    if (!file || !type || !modelId) {
      return NextResponse.json({ error: 'Faltan datos (file, type o modelId)' }, { status: 400 });
    }

    const extension = path.extname(file.name) || '.jpg';
    let filePath = '';

    if (type === 'cover') {
      filePath = `${modelId}/Portada/cover${extension}`;
    } else if (type === 'portfolio') {
      filePath = `${modelId}/Portfolio/portfolio${extension}`;
    } else if (type === 'comp-card' && slotIndex !== null) {
      const index = parseInt(slotIndex, 10);
      if (isNaN(index) || index < 0 || index > 3) {
        return NextResponse.json({ error: 'Índice de slot inválido' }, { status: 400 });
      }
      filePath = `${modelId}/Contraportada/comp_${index}${extension}`;
    } else {
      return NextResponse.json({ error: 'Tipo de archivo o índice no válido' }, { status: 400 });
    }

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type,
      });

    if (error) {
      console.error('Error al subir archivo a Supabase:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, path: filePath });

  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error('Error en POST /storage:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


// --- FUNCIÓN DELETE (Eliminar Imagen) ---
// Esta ya estaba corregida en la versión anterior, usando context y params
export async function DELETE(
  request: NextRequest,
  context: { params: { modelId: string } }
) {
  try {
    const { params } = context; // Aquí no necesita await
    const modelId = params.modelId;

    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { filePath } = await request.json() as { filePath: string };

    if (!filePath) {
      return NextResponse.json({ error: 'Falta la ruta del archivo a eliminar (filePath)' }, { status: 400 });
    }

    if (!filePath.startsWith(modelId)) {
      return NextResponse.json({ error: 'Ruta de archivo no válida (conflicto de ID)' }, { status: 403 });
    }

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      console.error('Error al eliminar archivo de Supabase:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error('Error en DELETE /storage:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}