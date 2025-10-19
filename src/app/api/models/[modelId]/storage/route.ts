import { createClient } from '@/lib/supabase/server';
import { type NextRequest, NextResponse } from 'next/server';
import path from 'path';

// Forzar el runtime de Node.js para manejar archivos
export const dynamic = 'force-dynamic';

const BUCKET_NAME = 'Book_Completo_iZ_Management';

// --- FUNCIÓN POST (Subir/Actualizar Imagen) ---
export async function POST(
  request: NextRequest,
  // --- CORRECCIÓN ---
  // Cambiamos la firma del argumento para que sea un objeto 'context'
  context: { params: { modelId: string } }
) {
  try {
    // Extraemos 'params' desde 'context'
    const { params } = context;
    const modelId = params.modelId;
    // --- FIN DE LA CORRECCIÓN ---
    
    const supabase = await createClient();

    // 1. Verificar autenticación
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // 2. Obtener los datos del formulario (FormData)
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const type = formData.get('type') as string | null;
    const slotIndex = formData.get('slotIndex') as string | null;

    if (!file || !type || !modelId) {
      return NextResponse.json({ error: 'Faltan datos (file, type o modelId)' }, { status: 400 });
    }

    // 3. Definir la ruta del archivo en Supabase Storage
    const extension = path.extname(file.name) || '.jpg';
    let filePath = '';

    if (type === 'cover') {
      filePath = `${modelId}/Portada/cover${extension}`;
    } else if (type === 'portfolio') {
      filePath = `${modelId}/Portfolio/portfolio${extension}`;
    } else if (type === 'comp-card' && slotIndex !== null) {
      filePath = `${modelId}/Contraportada/comp_${slotIndex}${extension}`;
    } else {
      return NextResponse.json({ error: 'Tipo de archivo no válido' }, { status: 400 });
    }

    // 4. Subir el archivo
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        upsert: true, // Sobrescribe si ya existe
        contentType: file.type,
      });

    if (error) {
      console.error('Error al subir a Supabase:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 5. Devolver una respuesta JSON
    return NextResponse.json({ success: true, path: filePath });

  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error('Error en POST /storage:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// --- FUNCIÓN DELETE (Eliminar Imagen) ---
export async function DELETE(
  request: NextRequest,
  // --- CORRECCIÓN ---
  // Aplicamos la misma corrección aquí
  context: { params: { modelId: string } }
) {
  try {
    // Extraemos 'params' desde 'context'
    const { params } = context;
    const modelId = params.modelId;
    // --- FIN DE LA CORRECCIÓN ---
    
    const supabase = await createClient();

    // 1. Verificar autenticación
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // 2. Obtener la ruta del archivo a borrar (viene en el body)
    const { filePath } = (await request.json()) as { filePath: string };
    
    if (!filePath) {
      return NextResponse.json({ error: 'Falta la ruta del archivo (filePath)' }, { status: 400 });
    }
    
    // 3. Medida de seguridad
    if (!filePath.startsWith(modelId)) {
        return NextResponse.json({ error: 'Ruta de archivo no válida (conflicto de ID)' }, { status: 403 });
    }

    // 4. Borrar el archivo
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      console.error('Error al borrar de Supabase:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // 5. Devolver una respuesta JSON
    return NextResponse.json({ success: true });

  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error('Error en DELETE /storage:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}