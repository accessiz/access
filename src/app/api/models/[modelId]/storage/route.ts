import { NextResponse, type NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin'; // Usar el cliente admin para bypass RLS
import { createClient } from '@/lib/supabase/server'; // Usar el cliente normal para obtener el usuario
import { MAX_UPLOAD_BYTES } from '@/lib/constants';
import { logError } from '@/lib/utils/errors';
import { uploadImageToR2 } from '@/lib/storage';

export const dynamic = 'force-dynamic';

// POST: Subir imagen y actualizar Supabase
export async function POST(
  request: NextRequest,
  context: { params: { modelId: string } }
) {
  const { modelId } = context.params;
  
  // 1. Verificar autenticación del usuario con el cliente normal
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

  // Validar tamaño del archivo
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: `El archivo excede el límite de ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)}MB.` }, { status: 413 });
  }

  // Validar tipo de archivo
  const allowedMIMEs = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
  if (!allowedMIMEs.includes(file.type)) {
    return NextResponse.json({ error: 'Tipo de archivo no permitido.' }, { status: 415 });
  }

  try {
    // 2. Subir el archivo a R2 usando la Server Action
    const r2FormData = new FormData();
    r2FormData.append('file', file);
    r2FormData.append('talentId', modelId);
    r2FormData.append('category', type);
    if (slotIndex !== null) r2FormData.append('slotIndex', slotIndex);

    const { publicUrl, path: r2Path } = await uploadImageToR2(r2FormData);
    if (!publicUrl || !r2Path) {
      throw new Error("La subida a R2 no devolvió una URL o un path.");
    }
    
    // 3. Actualizar la tabla 'models' en Supabase con el nuevo R2 path usando el cliente ADMIN
    let dbUpdateData: Record<string, unknown> = {};

    if (type === 'cover') {
      dbUpdateData = { cover_path: r2Path };
    } else if (type === 'portfolio') {
      dbUpdateData = { portfolio_path: r2Path };
    } else if (type === 'comp-card' && slotIndex !== null) {
      const index = parseInt(slotIndex, 10);
      const { data: modelData } = await supabaseAdmin.from('models').select('comp_card_paths').eq('id', modelId).single();
      const existingPaths = (modelData?.comp_card_paths as string[] | null) || [];
      const newPaths: (string | null)[] = [...existingPaths];
      while (newPaths.length < 4) newPaths.push(null);
      newPaths[index] = r2Path;
      dbUpdateData = { comp_card_paths: newPaths };
    }

    const { error: dbError } = await supabaseAdmin.from('models').update(dbUpdateData).eq('id', modelId);

    if (dbError) {
      logError(dbError, { action: 'update model path after R2 upload', modelId, dbUpdateData });
      // Aquí podrías agregar lógica para eliminar el archivo de R2 si la actualización de la DB falla
      return NextResponse.json({ error: 'Archivo subido a R2, pero no se pudo actualizar la base de datos.' }, { status: 500 });
    }

    // 4. Devolver la URL pública para que el cliente la muestre
    return NextResponse.json({ success: true, path: r2Path, signedUrl: publicUrl });

  } catch (error) {
    logError(error, { action: 'POST /api/models/storage', modelId });
    const message = error instanceof Error ? error.message : 'Error desconocido.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


// DELETE: Eliminar imagen
export async function DELETE(
  request: NextRequest,
  context: { params: { modelId: string } }
) {
  const { modelId } = context.params;
  
  // 1. Verificar autenticación del usuario con el cliente normal
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

  // No eliminamos de R2 todavía, solo de la base de datos
  
  let dbUpdateData: Record<string, string | null | (string | null)[]> = {};

  if (type === 'cover') {
    dbUpdateData = { cover_path: null };
  } else if (type === 'portfolio') {
    dbUpdateData = { portfolio_path: null };
  } else if (type === 'comp-card' && slotIndex !== null && !isNaN(slotIndex) && slotIndex >= 0 && slotIndex < 4) {
      // Usar cliente admin para leer y escribir
      const { data: modelData, error: fetchError } = await supabaseAdmin
        .from('models')
        .select('comp_card_paths')
        .eq('id', modelId)
        .single();

      if (fetchError) {
        logError(fetchError, { action: 'fetch model for array update (delete)', modelId });
        return NextResponse.json({ error: 'No se pudo leer el modelo para actualizar.' }, { status: 500 });
      }

      const existingPaths = (modelData?.comp_card_paths as (string | null)[]) || [];
      const newPaths = [...existingPaths];
      if(newPaths[slotIndex]) newPaths[slotIndex] = null;
      dbUpdateData = { comp_card_paths: newPaths };
  } else {
     return NextResponse.json({ error: 'Tipo de archivo o índice no válido para borrar' }, { status: 400 });
  }

  // Usar cliente admin para la actualización
  const { error: dbError } = await supabaseAdmin
    .from('models')
    .update(dbUpdateData)
    .eq('id', modelId);

  if (dbError) {
    logError(dbError, { action: 'update model path null', modelId, dbUpdateData });
     return NextResponse.json({ error: 'No se pudo actualizar la base de datos.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}