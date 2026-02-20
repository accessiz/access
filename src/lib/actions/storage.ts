
'use server';

import { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server'; // Para verificar al usuario
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

const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME!;

const uploadSchema = z.object({
  file: z.instanceof(File),
  modelId: z.string().uuid(),
  category: z.enum(['Portada', 'Portfolio', 'Contraportada', 'PortfolioGallery']),
  slotIndex: z.coerce.number().optional(),
});


/**
 * Helper para eliminar el archivo antiguo de una categoría antes de subir uno nuevo.
 */
async function deleteOldFileFromCategory(modelId: string, category: 'Portada' | 'Portfolio' | 'Contraportada', slotIndex?: number) {
  const prefix = `${modelId}/${category}/`;

  // Para 'Contraportada', el prefijo es más específico si hay slotIndex
  const searchPrefix = (category === 'Contraportada' && slotIndex !== undefined)
    ? `${prefix}comp_${slotIndex}_`
    : prefix;

  try {
    const listCommand = new ListObjectsV2Command({
      Bucket: R2_BUCKET_NAME,
      Prefix: searchPrefix,
    });

    const listedObjects = await r2.send(listCommand);

    if (listedObjects.Contents && listedObjects.Contents.length > 0) {
      for (const obj of listedObjects.Contents) {
        if (obj.Key) {
          const deleteCommand = new DeleteObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: obj.Key,
          });
          await r2.send(deleteCommand);
        }
      }
    }
  } catch (err) {
    logError(err, {
      action: 'deleteOldFileFromCategory',
      modelId,
      category,
      searchPrefix
    });
    // Relanzamos el error para que la subida falle limpiamente y no queden
    // archivos duplicados en R2 (la causa raíz de que se "reviertan" photos).
    throw new Error(`No se pudo eliminar el archivo anterior en ${category}. Intenta de nuevo.`);
  }
}


export async function uploadModelImage(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Usuario no autenticado." };
  }

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
    const { error: ownerError } = await supabase.from('models').select('id').eq('id', modelId).single();
    if (ownerError) {
      logError(ownerError, { action: 'uploadModelImage.ownershipCheck', modelId, userId: user.id });
      return { success: false, error: "No tienes permiso para modificar este modelo." };
    }

    // --- LÓGICA DE CACHE BUSTING ---
    const timestamp = Date.now();
    const baseFileName = file.name.replace(/[^a-zA-Z0-9.\\-_]/g, '').toLowerCase();

    // 1. Limpiar archivo/s antiguo/s en R2 para esta categoría (EXCEPTO PortfolioGallery que es múltiple).
    if (category !== 'PortfolioGallery') {
      await deleteOldFileFromCategory(modelId, category, slotIndex);
    }

    // 2. Crear nombre de archivo único con timestamp.
    let fileName = `${timestamp}-${baseFileName}`;
    if (category === 'Portada') fileName = `${timestamp}-cover.webp`;
    else if (category === 'Portfolio') fileName = `${timestamp}-portfolio.webp`;
    else if (category === 'Contraportada' && slotIndex !== undefined) fileName = `${timestamp}-comp_${slotIndex}.webp`;
    else if (category === 'PortfolioGallery') fileName = `${timestamp}-gallery.webp`;

    const fullPath = `${modelId}/${category}/${fileName}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    // 3. Subir el nuevo archivo a R2
    await r2.send(new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: fullPath,
      Body: buffer,
      ContentType: file.type,
      ACL: 'public-read',
    }));

    const publicUrl = `${process.env.R2_PUBLIC_URL}/${fullPath}`;

    // 4. Actualizar Supabase con el nuevo path
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
    } else if (category === 'PortfolioGallery') {
      const { data: currentModel, error: fetchError } = await supabaseAdmin.from('models').select('gallery_paths').eq('id', modelId).single();
      if (fetchError) throw new Error('No se pudo obtener la galería actual.');

      const currentPaths = currentModel?.gallery_paths || [];
      currentPaths.push(fullPath);

      const { error } = await supabaseAdmin.from('models').update({ gallery_paths: currentPaths }).eq('id', modelId);
      dbError = error;
    }

    if (dbError) throw dbError;

    // 5. Revalidar y devolver éxito
    revalidatePath(`/dashboard/models/${modelId}`);
    // No necesitamos devolver el timestamp porque la URL en sí ya es única.
    return { success: true, path: fullPath, publicUrl };

  } catch (err: unknown) {
    logError(err, { action: 'uploadModelImage.process', modelId, category });
    const errorMessage = err instanceof Error ? err.message : 'Error en el proceso de subida.';
    return { success: false, error: errorMessage };
  }
}


/**
 * Lista los archivos de una carpeta en R2 y devuelve el path del primer archivo encontrado.
 * Útil para encontrar imágenes cuando el nombre exacto no se conoce.
 */
export async function getFirstFileInFolder(modelId: string, category: 'Portada' | 'Portfolio' | 'Contraportada'): Promise<string | null> {
  const prefix = `${modelId}/${category}/`;

  console.log('[getFirstFileInFolder] Buscando en:', prefix);

  try {
    const listCommand = new ListObjectsV2Command({
      Bucket: R2_BUCKET_NAME,
      Prefix: prefix,
      MaxKeys: 10, // Solo necesitamos los primeros archivos
    });

    const listedObjects = await r2.send(listCommand);

    console.log('[getFirstFileInFolder] Objetos encontrados:', listedObjects.Contents?.length || 0);

    if (listedObjects.Contents && listedObjects.Contents.length > 0) {
      // Ordenar por LastModified descendente para obtener el más reciente
      const sortedObjects = listedObjects.Contents
        .filter(obj => obj.Key && !obj.Key.endsWith('/')) // Excluir "directorios"
        .sort((a, b) => {
          const dateA = a.LastModified ? new Date(a.LastModified).getTime() : 0;
          const dateB = b.LastModified ? new Date(b.LastModified).getTime() : 0;
          return dateB - dateA; // Más reciente primero
        });

      if (sortedObjects.length > 0 && sortedObjects[0].Key) {
        console.log('[getFirstFileInFolder] Archivo encontrado:', sortedObjects[0].Key);
        return sortedObjects[0].Key;
      }
    }

    console.log('[getFirstFileInFolder] No se encontraron archivos para prefix:', prefix);
    return null;
  } catch (err) {
    console.error('[getFirstFileInFolder] Error crítico en listOperation:', err);
    logError(err, {
      action: 'getFirstFileInFolder',
      modelId,
      category,
      prefix
    });
    return null;
  }
}


export async function deleteModelImage(modelId: string, filePath: string, category: 'Portada' | 'Portfolio' | 'Contraportada' | 'PortfolioGallery', slotIndex?: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Usuario no autenticado." };
  }

  try {
    const { error: ownerError } = await supabase.from('models').select('id').eq('id', modelId).single();
    if (ownerError) {
      logError(ownerError, { action: 'deleteModelImage.ownershipCheck', modelId, userId: user.id });
      return { success: false, error: "No tienes permiso para modificar este modelo." };
    }

    // --- Lógica de borrado ---

    // 1. Eliminar de R2
    await r2.send(new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: filePath,
    }));

    // 2. Eliminar referencia de Supabase
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
      if (slotIndex >= 0 && slotIndex < currentPaths.length) {
        currentPaths[slotIndex] = null;
      }

      const { error: updateError } = await supabaseAdmin.from('models').update({ comp_card_paths: currentPaths }).eq('id', modelId);
      error = updateError;
    } else if (category === 'PortfolioGallery') {
      const { data: currentModel, error: fetchError } = await supabaseAdmin.from('models').select('gallery_paths').eq('id', modelId).single();
      if (fetchError) throw new Error('No se pudo obtener la galería actual.');

      let currentPaths: string[] = currentModel?.gallery_paths || [];
      currentPaths = currentPaths.filter(p => p !== filePath);

      const { error: updateError } = await supabaseAdmin.from('models').update({ gallery_paths: currentPaths }).eq('id', modelId);
      error = updateError;
    }

    if (error) throw error;

    revalidatePath(`/dashboard/models/${modelId}`);
    return { success: true };

  } catch (err: unknown) {
    logError(err, { action: 'deleteModelImage', modelId, filePath, category });
    const errorMessage = err instanceof Error ? err.message : 'Error al eliminar la referencia de la imagen.';
    return { success: false, error: errorMessage };
  }
}


/**
 * Limpia paths de galería huérfanos que ya no existen en R2.
 * Útil para sincronizar la DB cuando hay imágenes rotas.
 */
export async function cleanupOrphanedGalleryPaths(modelId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Usuario no autenticado." };
  }

  try {
    // Verificar que el usuario tiene acceso al modelo
    const { error: ownerError } = await supabase.from('models').select('id').eq('id', modelId).single();
    if (ownerError) {
      return { success: false, error: "No tienes permiso para modificar este modelo." };
    }

    // Obtener paths actuales
    const { data: currentModel, error: fetchError } = await supabaseAdmin
      .from('models')
      .select('gallery_paths')
      .eq('id', modelId)
      .single();

    if (fetchError) throw new Error('No se pudo obtener la galería actual.');

    const currentPaths: string[] = currentModel?.gallery_paths || [];
    if (currentPaths.length === 0) {
      return { success: true, removed: 0 };
    }

    // Verificar cuáles existen en R2 usando ListObjectsV2Command
    // En vez de HEAD cada uno (más lento), listamos la carpeta de galería
    const prefix = `${modelId}/PortfolioGallery/`;
    const listCommand = new ListObjectsV2Command({
      Bucket: R2_BUCKET_NAME,
      Prefix: prefix,
      MaxKeys: 1000,
    });
    const listedObjects = await r2.send(listCommand);

    // Crear un Set de paths que existen en R2
    const existingPaths = new Set(
      (listedObjects.Contents || [])
        .map(obj => obj.Key)
        .filter((key): key is string => key !== undefined)
    );

    // Filtrar solo los paths que realmente existen
    const validPaths = currentPaths.filter(p => existingPaths.has(p));
    const removedCount = currentPaths.length - validPaths.length;

    if (removedCount > 0) {
      // Actualizar la DB solo con paths válidos
      const { error: updateError } = await supabaseAdmin
        .from('models')
        .update({ gallery_paths: validPaths })
        .eq('id', modelId);

      if (updateError) throw updateError;

      revalidatePath(`/dashboard/models/${modelId}`);
    }

    return { success: true, removed: removedCount };

  } catch (err: unknown) {
    logError(err, { action: 'cleanupOrphanedGalleryPaths', modelId });
    const errorMessage = err instanceof Error ? err.message : 'Error al limpiar paths huérfanos.';
    return { success: false, error: errorMessage };
  }
}
