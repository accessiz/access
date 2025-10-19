import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import path from 'path';

export const dynamic = 'force-dynamic';
const BUCKET_NAME = 'Book_Completo_iZ_Management';

// POST: Subir imagen
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ modelId: string }> }
) {
  const { modelId } = await context.params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const type = formData.get('type') as 'cover' | 'comp-card' | 'portfolio';
  const slotIndex = formData.get('slotIndex') as string | null;

  if (!file || !type) {
    return NextResponse.json({ error: 'Faltan datos (file o type)' }, { status: 400 });
  }

  const extension = path.extname(file.name) || '.jpg';
  let filePath = '';

  if (type === 'cover') {
    filePath = `${modelId}/Portada/cover${extension}`;
  } else if (type === 'portfolio') {
    filePath = `${modelId}/Portfolio/portfolio${extension}`;
  } else if (type === 'comp-card' && slotIndex !== null) {
    filePath = `${modelId}/Contraportada/comp_${slotIndex}${extension}`;
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
    console.error('Error al subir archivo:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, path: filePath });
}

// DELETE: Eliminar imagen
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ modelId: string }> }
) {
  const { modelId } = await context.params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { filePath } = await request.json();

  if (!filePath) {
    return NextResponse.json({ error: 'Falta la ruta del archivo a eliminar' }, { status: 400 });
  }

  if (!filePath.startsWith(modelId)) {
    return NextResponse.json({ error: 'Ruta de archivo no válida (conflicto de ID)' }, { status: 403 });
  }

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([filePath]);

  if (error) {
    console.error('Error al eliminar archivo:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
