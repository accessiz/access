
'use server';

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server'; // Para verificar al usuario
import { z } from 'zod';
import { logError } from "../utils/errors";
import { revalidatePath } from "next/cache";

// Configuración del cliente R2 (sin cambios)
const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const uploadSchema = z.object({
  file: z.instanceof(File),
  modelId: z.string().uuid(),
  category: z.enum(['Portada', 'Portfolio', 'Contraportada']),
  slotIndex: z.coerce.number().optional(),
});

/**
 * Server Action SEGURA para subir una imagen a R2 y actualizar la DB.
 */
export async function uploadModelImage(formData: FormData) {
  // 1. Obtener usuario autenticado CON EL CLIENTE DE SERVIDOR NORMAL
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Usuario no autenticado." };
  }
  
  // 2. Validar los datos del formulario
  const rawData = {
    file: formData.get('file'),
    modelId: formData.get('modelId'),
    category: formData.get('category'),
    slotIndex: formData.get('slotIndex'),
  };
  const validation = uploadSchema.safeParse(rawData);

  if (!validation.success) {
    logError(validation.error, { action: 'uploadModelImage.validation' });
    return { success: false, error: "Datos de subida inválidos." };
  }

  const { file, modelId, category, slotIndex } = validation.data;

  try {
    // 3. VERIFICAR PROPIEDAD: Usamos el cliente normal (consciente de RLS)
    const { error: ownerError } = await supabase
      .from('models')
      .select('id')
      .eq('id', modelId)
      .single(); // La política RLS se encargará de filtrar por user_id

    if (ownerError) {
      logError(ownerError, { action: 'uploadModelImage.ownershipCheck', modelId, userId: user.id });
      return { success: false, error: "No tienes permiso para modificar este modelo." };
    }

    // --- Si la verificación es exitosa, proceder con la subida y actualización ---
    
    const buffer = Buffer.from(await file.arrayBuffer());
    
    let fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\\-_]/g, '').toLowerCase()}`;
    if (category === 'Portada') {
        fileName = 'cover.webp';
    } else if (category === 'Portfolio') {
        fileName = 'portfolio.webp';
    } else if (category === 'Contraportada' && slotIndex !== undefined) {
        fileName = `comp_${slotIndex}.webp`;
    }
  
    const fullPath = `${modelId}/${category}/${fileName}`;

    // 4. Subir a R2 (con cliente admin)
    await r2.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: fullPath,
      Body: buffer,
      ContentType: file.type,
      ACL: 'public-read',
    }));

    const publicUrl = `${process.env.R2_PUBLIC_URL}/${fullPath}`;

    // 5. Actualizar Supabase (con cliente admin para evitar problemas de RLS en escritura)
    let dbError;
    if (category === 'Portada') {
      const { error } = await supabaseAdmin.from('models').update({ cover_path: fullPath }).eq('id', modelId);
      dbError = error;
    } else if (category === 'Portfolio') {
        const { error } = await supabaseAdmin.from('models').update({ portfolio_path: fullPath }).eq('id', modelId);
        dbError = error;
    } else if (category === 'Contraportada' && slotIndex !== undefined) {
        const { data: currentModel, error: fetchError } = await supabaseAdmin.from('models').select('comp_card_paths').eq('id', modelId).single();
        if (fetchError) throw new Error('No se pudo obtener la galería actual del modelo para actualizar.');
        
        const currentPaths = currentModel?.comp_card_paths || [];
        while (currentPaths.length <= slotIndex) { currentPaths.push(null); }
        currentPaths[slotIndex] = fullPath;

        const { error } = await supabaseAdmin.from('models').update({ comp_card_paths: currentPaths }).eq('id', modelId);
        dbError = error;
    }

    if (dbError) throw dbError;
    
    // 6. Revalidar y devolver éxito con timestamp para cache busting
    revalidatePath(`/dashboard/models/${modelId}`);
    return { success: true, path: fullPath, publicUrl, timestamp: Date.now() };

  } catch (err: any) {
    logError(err, { action: 'uploadModelImage.process', modelId, category });
    return { success: false, error: err.message || 'Error en el proceso de subida.' };
  }
}


/**
 * Server Action SEGURA para eliminar una imagen.
 */
export async function deleteModelImage(modelId: string, filePath: string, category: 'Portada' | 'Portfolio' | 'Contraportada', slotIndex?: number) {
    // 1. Obtener usuario autenticado con el cliente normal
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Usuario no autenticado." };
    }

    try {
        // 2. VERIFICAR PROPIEDAD: Usamos el cliente normal (consciente de RLS)
        const { error: ownerError } = await supabase
          .from('models')
          .select('id')
          .eq('id', modelId)
          .single();

        if (ownerError) {
          logError(ownerError, { action: 'deleteModelImage.ownershipCheck', modelId, userId: user.id });
          return { success: false, error: "No tienes permiso para modificar este modelo." };
        }

        // --- Si la verificación es exitosa, proceder con la eliminación ---
        
        let error;
        if (category === 'Portada') {
            const { error: updateError } = await supabaseAdmin.from('models').update({ cover_path: null }).eq('id', modelId);
            error = updateError;
        } else if (category === 'Portfolio') {
            const { error: updateError } = await supabaseAdmin.from('models').update({ portfolio_path: null }).eq('id', modelId);
            error = updateError;
        } else if (category === 'Contraportada' && slotIndex !== undefined) {
             const { data: currentModel, error: fetchError } = await supabaseAdmin.from('models').select('comp_card_paths').eq('id', modelId).single();
            if (fetchError) throw new Error('No se pudo obtener la galería actual del modelo para eliminar');
            
            const currentPaths = currentModel?.comp_card_paths || [];
            if(slotIndex >= 0 && slotIndex < currentPaths.length) {
                currentPaths[slotIndex] = null;
            }

            const { error: updateError } = await supabaseAdmin.from('models').update({ comp_card_paths: currentPaths }).eq('id', modelId);
            error = updateError;
        }

        if (error) throw error;

        // NOTA: No eliminamos el archivo de R2 para permitir recuperación y evitar borrados accidentales complejos.
        // Solo quitamos la referencia en la base de datos.

        revalidatePath(`/dashboard/models/${modelId}`);
        return { success: true };

    } catch (err: any) {
        logError(err, { action: 'deleteModelImage', modelId, filePath, category });
        return { success: false, error: err.message || 'Error al eliminar la referencia de la imagen.' };
    }
}
