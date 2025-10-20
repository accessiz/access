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
  let dbUpdateData: Record<string, string | null | (string[] | null)> = {};

  if (type === 'cover') {
    filePath = `${modelId}/Portada/cover${extension}`;
    dbUpdateData = { cover_path: filePath };
  } else if (type === 'portfolio') {
    filePath = `${modelId}/Portfolio/portfolio${extension}`;
    dbUpdateData = { portfolio_path: filePath };
  } else if (type === 'comp-card' && slotIndex !== null) {
    const index = parseInt(slotIndex, 10);
    if (isNaN(index) || index < 0 || index > 3) {
      return NextResponse.json({ error: 'Índice de slot inválido' }, { status: 400 });
    }
    filePath = `${modelId}/Contraportada/comp_${index}${extension}`;

    // Leer valor actual y actualizar el array
    const { data: modelData, error: fetchError } = await supabase
      .from('models')
      .select('comp_card_paths')
      .eq('id', modelId)
      .single();

    if (fetchError) {
      console.error('Error fetching model for array update:', fetchError);
      return NextResponse.json({ error: 'No se pudo leer el modelo para actualizar.' }, { status: 500 });
    }

    const existingPaths = (modelData && (modelData as { comp_card_paths?: (string | null)[] }).comp_card_paths) || null;
    const newPaths = Array.isArray(existingPaths) ? [...existingPaths] : Array(4).fill(null);
    newPaths[index] = filePath;
    dbUpdateData = { comp_card_paths: newPaths };

  } else {
    return NextResponse.json({ error: 'Tipo de archivo o índice no válido' }, { status: 400 });
  }

  // 1. Subir el archivo
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

  // 2. Actualizar la tabla 'models' con la nueva ruta
  const { error: dbError } = await supabase
    .from('models')
    .update(dbUpdateData)
    .eq('id', modelId);

  if (dbError) {
    console.error('Error updating model path:', dbError);
    return NextResponse.json({ error: 'Archivo subido, pero no se pudo actualizar la base de datos.' }, { status: 500 });
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

  const { filePath, type, slotIndex: slotIndexStr } = await request.json() as {
    filePath: string;
    type: 'cover' | 'comp-card' | 'portfolio';
    slotIndex?: string;
  };
  const slotIndex = slotIndexStr ? parseInt(slotIndexStr, 10) : null;

  if (!filePath) {
    return NextResponse.json({ error: 'Falta la ruta del archivo a eliminar' }, { status: 400 });
  }
  
  if (!filePath.startsWith(modelId)) {
    return NextResponse.json({ error: 'Ruta de archivo no válida (conflicto de ID)' }, { status: 403 });
  }

  // 1. Eliminar el archivo del Storage
  const { error: removeError } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([filePath]);

  if (removeError) {
    console.error('Error al eliminar archivo:', removeError);
    // No fallamos si el archivo no existe (algunos SDKs retornan 404 en message),
    // pero sí en otros errores. Revisamos message/status si existe.
    const errorStr = String(removeError);
    if (!/not found|404/i.test(errorStr)) {
      return NextResponse.json({ error: removeError.message || 'Error removing file' }, { status: 500 });
    }
  }

  // 2. Actualizar la tabla 'models' para quitar la ruta (setear a null)
  let dbUpdateData: Record<string, string | null | (string[] | null)> = {};

  if (type === 'cover') {
    dbUpdateData = { cover_path: null };
  } else if (type === 'portfolio') {
    dbUpdateData = { portfolio_path: null };
  } else if (type === 'comp-card' && slotIndex !== null) {
      const { data: modelData, error: fetchError } = await supabase
        .from('models')
        .select('comp_card_paths')
        .eq('id', modelId)
        .single();

      if (fetchError) {
        console.error('Error fetching model for array update:', fetchError);
        return NextResponse.json({ error: 'No se pudo leer el modelo para actualizar.' }, { status: 500 });
      }
    
      const existingPaths = (modelData && (modelData as { comp_card_paths?: (string | null)[] }).comp_card_paths) || null;
      const newPaths = Array.isArray(existingPaths) ? [...existingPaths] : Array(4).fill(null);
      newPaths[slotIndex] = null; // Setea el slot específico a null
      dbUpdateData = { comp_card_paths: newPaths };
  } else {
     return NextResponse.json({ error: 'Tipo de archivo o índice no válido para borrar' }, { status: 400 });
  }

  const { error: dbError } = await supabase
    .from('models')
    .update(dbUpdateData)
    .eq('id', modelId);

  if (dbError) {
     console.error('Error updating model path to null:', dbError);
     return NextResponse.json({ error: 'Archivo eliminado, pero no se pudo actualizar la base de datos.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
