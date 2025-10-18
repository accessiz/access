import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// Usa el nombre correcto de tu bucket
const BUCKET_NAME = 'Book_Completo_iZ_Management';

// --- FUNCIÓN GET corregida ---
export async function GET(
  req: Request,
  context: { params: Promise<{ modelId: string }> }
) {
  try {
    // ✅ Esperamos los parámetros dinámicos
    const { modelId } = await context.params;

    // ✅ Esperamos el cliente Supabase
    const supabase = await createClient();

    if (!supabase) {
      throw new Error('No se pudo inicializar el cliente de Supabase.');
    }

    if (!modelId) {
      return NextResponse.json(
        { success: false, error: 'Model ID is required.' },
        { status: 400 }
      );
    }

    let coverUrl: string | null = null;
    let compCardUrls: string[] = [];
    let portfolioUrl: string | null = null;

    // --- 1. Obtener la portada ---
    const { data: coverList, error: coverListError } = await supabase
      .storage
      .from(BUCKET_NAME)
      .list(`${modelId}/Portada/`, { limit: 1 });

    if (coverListError) {
      console.error(`❌ Error al listar portada para ${modelId}:`, coverListError);
    } else if (coverList && coverList.length > 0) {
      const coverPath = `${modelId}/Portada/${coverList[0].name}`;
      const { data: coverSignedUrl, error: coverError } = await supabase
        .storage
        .from(BUCKET_NAME)
        .createSignedUrl(coverPath, 300);
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
      const portfolioPath = `${modelId}/Portfolio/${portfolioList[0].name}`;
      const { data: portfolioSignedUrl, error: portfolioError } = await supabase
        .storage
        .from(BUCKET_NAME)
        .createSignedUrl(portfolioPath, 300);
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
      const { data: signedUrlsData, error: signedUrlError } = await supabase
        .storage
        .from(BUCKET_NAME)
        .createSignedUrls(filePaths, 300);

      if (signedUrlError) {
        console.error(`❌ Error al firmar URLs de contraportada para ${modelId}:`, signedUrlError);
      } else if (signedUrlsData) {
        compCardUrls = signedUrlsData
          .map(item => item?.signedUrl)
          .filter(Boolean) as string[];
      }
    }

    // --- 4. Respuesta final ---
    return NextResponse.json({
      success: true,
      coverUrl,
      portfolioUrl,
      compCardUrls,
    });

  } catch (error: any) {
    console.error('🔥 Error general en /api/models/[modelId]:', error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}