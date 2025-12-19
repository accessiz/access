'use server';

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { supabaseAdmin } from '@/lib/supabase/admin';
import { z } from 'zod';
import { logError } from "../utils/errors";
import { revalidatePath } from "next/cache";

// Configuración del cliente R2
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
 * Server Action para subir una imagen a R2 y actualizar la DB.
 */
export async function uploadModelImage(formData: FormData) {
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
  const buffer = Buffer.from(await file.arrayBuffer());
  const cleanFileName = file.name.replace(/[^a-zA-Z0-9.\\-_]/g, '').toLowerCase();

  let fileName = `${Date.now()}-${cleanFileName}`;
    if (category === 'Portada') {
        fileName = 'cover.webp';
    } else if (category === 'Portfolio') {
        fileName = 'portfolio.webp';
    } else if (category === 'Contraportada' && slotIndex !== undefined) {
        fileName = `comp_${slotIndex}.webp`;
    }
  
  const fullPath = `${modelId}/${category}/${fileName}`;

  try {
    // 1. Subir a R2
    await r2.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: fullPath,
      Body: buffer,
      ContentType: file.type,
      ACL: 'public-read',
    }));

    const publicUrl = `${process.env.R2_PUBLIC_URL}/${fullPath}`;

    // 2. Actualizar Supabase con supabaseAdmin
    let dbError;
    if (category === 'Portada') {
      const { error } = await supabaseAdmin.from('models').update({ cover_path: fullPath }).eq('id', modelId);
      dbError = error;
    } else if (category === 'Portfolio') {
        const { error } = await supabaseAdmin.from('models').update({ portfolio_path: fullPath }).eq('id', modelId);
        dbError = error;
    } else if (category === 'Contraportada' && slotIndex !== undefined) {
        const { data: currentModel, error: fetchError } = await supabaseAdmin.from('models').select('comp_card_paths').eq('id', modelId).single();
        if (fetchError) throw new Error('No se pudo obtener la galería actual del modelo para actualizar');
        
        const currentPaths = currentModel?.comp_card_paths || [];
        // Aseguramos que el array tenga la longitud necesaria
        while (currentPaths.length <= slotIndex) {
            currentPaths.push(null);
        }
        currentPaths[slotIndex] = fullPath;

        const { error } = await supabaseAdmin.from('models').update({ comp_card_paths: currentPaths }).eq('id', modelId);
        dbError = error;
    }

    if (dbError) {
      throw dbError;
    }
    
    // 3. Revalidar y devolver éxito
    revalidatePath(`/dashboard/models/${modelId}`);
    return { success: true, path: fullPath, publicUrl };

  } catch (err: any) {
    logError(err, { action: 'uploadModelImage.process', modelId, category });
    return { success: false, error: err.message || 'Error en el proceso de subida.' };
  }
}

/**
 * Server Action para eliminar una imagen de la DB.
 */
export async function deleteModelImage(modelId: string, filePath: string, type: 'Portada' | 'Portfolio' | 'Contraportada', slotIndex?: number) {
    
    try {
        let error;
        if (type === 'Portada') {
            const { error: updateError } = await supabaseAdmin.from('models').update({ cover_path: null }).eq('id', modelId);
            error = updateError;
        } else if (type === 'Portfolio') {
            const { error: updateError } = await supabaseAdmin.from('models').update({ portfolio_path: null }).eq('id', modelId);
            error = updateError;
        } else if (type === 'Contraportada' && slotIndex !== undefined) {
             const { data: currentModel, error: fetchError } = await supabaseAdmin.from('models').select('comp_card_paths').eq('id', modelId).single();
            if (fetchError) throw new Error('No se pudo obtener la galería actual del modelo para eliminar');
            
            const currentPaths = currentModel?.comp_card_paths || [];
            if(slotIndex >= 0 && slotIndex < currentPaths.length) {
                currentPaths[slotIndex] = null;
            }

            const { error: updateError } = await supabaseAdmin.from('models').update({ comp_card_paths: currentPaths }).eq('id', modelId);
            error = updateError;
        }

        if (error) {
            throw error;
        }

        revalidatePath(`/dashboard/models/${modelId}`);
        return { success: true };

    } catch (err: any) {
        logError(err, { action: 'deleteModelImage', modelId, filePath });
        return { success: false, error: err.message || 'Error al eliminar la referencia de la imagen.' };
    }
}
