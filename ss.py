import os

# Define la ruta base de tu proyecto.
PROJECT_BASE_PATH = "." 

# Diccionario con la única corrección necesaria.
corrections = {
    "src/app/api/models/[modelId]/storage/route.ts": r"""
import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const BUCKET_NAME = 'Book_Completo_iZ_Management';

// --- FUNCIÓN POST para subir archivos ---
export async function POST(
  req: NextRequest,
  context: { params: { modelId: string } }
) {
  const { modelId } = context.params;
  const supabase = await createClient();
  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const type = formData.get('type') as 'cover' | 'comp-card' | 'portfolio';
  const slotIndex = formData.get('slotIndex') as string | null;

  if (!file) {
    return NextResponse.json({ error: 'No se encontró el archivo.' }, { status: 400 });
  }

  let filePath = '';
  if (type === 'cover') {
    filePath = `${modelId}/Portada/cover.jpg`;
  } else if (type === 'comp-card' && slotIndex !== null) {
    filePath = `${modelId}/Contraportada/comp_${slotIndex}.jpg`;
  } else if (type === 'portfolio') {
    filePath = `${modelId}/Portfolio/portfolio.jpg`;
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
  req: NextRequest,
  context: { params: { modelId: string } }
) {
  const { modelId } = context.params;
  const supabase = await createClient();
  const { filePath } = await req.json();

  if (!filePath) {
    return NextResponse.json({ error: 'Falta la ruta del archivo a eliminar.' }, { status: 400 });
  }

  if (!filePath.startsWith(modelId)) {
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
"""
}

def apply_final_fix():
    base_path = os.path.abspath(PROJECT_BASE_PATH)
    print(f"Aplicando corrección final en: {base_path}\n")

    if not os.path.isdir(base_path):
        print(f"❌ ERROR: La ruta base '{base_path}' no es un directorio válido.")
        return

    for relative_path, new_content in corrections.items():
        file_path_parts = relative_path.replace("\\", "/").split("/")
        absolute_path = os.path.join(base_path, *file_path_parts)
        
        try:
            if os.path.exists(absolute_path):
                content_to_write = new_content.lstrip('\n')
                with open(absolute_path, 'w', encoding='utf-8') as f:
                    f.write(content_to_write)
                print(f"✅ Archivo corregido: {relative_path}")
            else:
                print(f"⚠️  ADVERTENCIA: No se encontró el archivo: {relative_path}")

        except Exception as e:
            print(f"❌ ERROR al procesar el archivo {relative_path}: {e}")

if __name__ == "__main__":
    apply_final_fix()
    print("\n🎉 Proceso completado. ¡Sube los cambios a GitHub y prueba el despliegue de nuevo!")

