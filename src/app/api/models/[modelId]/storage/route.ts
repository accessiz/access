import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const BUCKET_NAME = 'Book_Completo_iZ_Management';

// --- FUNCIÓN POST para subir archivos ---
export async function POST(
  req: NextRequest,
  { params }: { params: { modelId: string } }
) {
  try {
    const { modelId } = params;
    const supabase = await createClient();
    const formData = await req.formData();

    const file = formData.get('file') as File | null;
    const type = formData.get('type') as 'cover' | 'comp-card' | 'portfolio';
    const slotIndex = formData.get('slotIndex') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No se encontró el archivo.' },
        { status: 400 }
      );
    }

    // Determinar ruta dentro del bucket según tipo
    let filePath = '';
    if (type === 'cover') {
      filePath = `${modelId}/Portada/cover.jpg`;
    } else if (type === 'comp-card' && slotIndex !== null) {
      filePath = `${modelId}/Contraportada/comp_${slotIndex}.jpg`;
    } else if (type === 'portfolio' && slotIndex !== null) {
      filePath = `${modelId}/Portfolio/portfolio_${slotIndex}.jpg`;
    } else {
      return NextResponse.json(
        { error: 'Tipo de archivo o índice inválido.' },
        { status: 400 }
      );
    }

    // Subir archivo al bucket de Supabase
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, { upsert: true });

    if (error) {
      console.error('Error al subir el archivo:', error);
      return NextResponse.json(
        { error: 'Error al subir el archivo: ' + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Archivo subido correctamente.',
      path: filePath,
    });
  } catch (err: any) {
    console.error('Error inesperado:', err);
    return NextResponse.json(
      { error: 'Error interno del servidor.' },
      { status: 500 }
    );
  }
}
