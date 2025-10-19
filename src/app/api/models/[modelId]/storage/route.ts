import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const BUCKET_NAME = 'Book_Completo_iZ_Management';

// --- FUNCIÓN POST para subir archivos ---
export async function POST(
  req: Request,
  { params }: { params: { modelId: string } }
) {
  const supabase = await createClient(); // ✅ await aquí
  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const type = formData.get('type') as 'cover' | 'comp-card' | 'portfolio';
  const slotIndex = formData.get('slotIndex') as string | null;

  if (!file) {
    return NextResponse.json({ error: 'No se encontró el archivo.' }, { status: 400 });
  }

  let filePath = '';
  if (type === 'cover') {
    filePath = `${params.modelId}/Portada/cover.jpg`;
  } else if (type === 'comp-card' && slotIndex !== null) {
    filePath = `${params.modelId}/Contraportada/comp_${slotIndex}.jpg`;
  } else if (type === 'portfolio') {
    filePath = `${params.modelId}/Portfolio/portfolio.jpg`;
  } else {
    return NextResponse.json({ error: 'Tipo de imagen o índice no válido.' }, { status: 400 });
  }

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (error) {
    console.error('Supabase upload error:', error);
    return NextResponse.json({ error: 'Error al subir el archivo a Supabase.' }, { status: 500 });
  }

  return NextResponse.json({ success: true, path: filePath });
}

// --- FUNCIÓN DELETE para borrar archivos ---
export async function DELETE(
  req: Request,
  { params }: { params: { modelId: string } }
) {
  const supabase = await createClient(); // ✅ await aquí también
  const { filePath } = await req.json();

  if (!filePath) {
    return NextResponse.json({ error: 'Falta la ruta del archivo a eliminar.' }, { status: 400 });
  }

  if (!filePath.startsWith(params.modelId)) {
    return NextResponse.json({ error: 'No tienes permiso para eliminar este archivo.' }, { status: 403 });
  }

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([filePath]);

  if (error) {
    console.error('Supabase delete error:', error);
    return NextResponse.json({ error: 'Error al eliminar el archivo de Supabase.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}