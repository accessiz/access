import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // evita los errores de Edge con Supabase

const BUCKET_NAME = 'Book_Completo_iZ_Management';

// ✅ tipo correcto para rutas dinámicas en Next.js 15
interface RouteContext {
  params: {
    modelId: string;
  };
}

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { modelId } = context.params;
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
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Error desconocido');
    console.error('Error inesperado:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor.' },
      { status: 500 }
    );
  }
}
