import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // Necesario para Supabase (no Edge)

const BUCKET_NAME = 'Book_Completo_iZ_Management';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB límite, ajustable según necesidades

// Tipo explícito para el tipo de archivo
type FileType = 'cover' | 'comp-card' | 'portfolio';

// Handler para la ruta POST
export async function POST(req: NextRequest, context: { params: Promise<{ modelId: string }> }) {
  try {
    const { modelId } = await context.params; // Await para Promise en params

    // Validar modelId
    if (!modelId || typeof modelId !== 'string' || modelId.trim() === '') {
      return NextResponse.json(
        { error: 'ID de modelo inválido.' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const formData = await req.formData();

    const file = formData.get('file') as File | null;
    const type = formData.get('type') as FileType | null;
    const slotIndex = formData.get('slotIndex') as string | null;

    // Validar archivo
    if (!file) {
      return NextResponse.json(
        { error: 'No se encontró el archivo.' },
        { status: 400 }
      );
    }

    // Validar tamaño del archivo
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `El archivo excede el límite de ${MAX_FILE_SIZE / (1024 * 1024)}MB.` },
        { status: 400 }
      );
    }

    // Validar tipo de archivo
    if (!type || !['cover', 'comp-card', 'portfolio'].includes(type)) {
      return NextResponse.json(
        { error: 'Tipo de archivo inválido. Debe ser "cover", "comp-card" o "portfolio".' },
        { status: 400 }
      );
    }

    let filePath = '';
    if (type === 'cover') {
      filePath = `${modelId}/Portada/cover.jpg`;
    } else if (type === 'comp-card' || type === 'portfolio') {
      if (slotIndex === null || isNaN(parseInt(slotIndex))) {
        return NextResponse.json(
          { error: `Índice de slot inválido para ${type}.` },
          { status: 400 }
        );
      }
      filePath = `${modelId}/${type === 'comp-card' ? 'Contraportada' : 'Portfolio'}/${type}_${slotIndex}.jpg`;
    }

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, { upsert: true });

    if (error) {
      console.error('Error al subir el archivo:', error);
      return NextResponse.json(
        { error: `Error al subir el archivo: ${error.message}` },
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