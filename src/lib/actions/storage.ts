
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const modelInfoSchema = z.object({
  modelId: z.string().uuid(),
  gender: z.enum(['Male', 'Female', 'Other']),
  photoType: z.enum(['Portada', 'Contraportada', 'Portafolio']),
  slotIndex: z.number().optional(),
});

export async function uploadModelImage(formData: FormData) {
  const supabase = createClient();

  const file = formData.get('file') as File;
  const modelInfoPayload = formData.get('modelInfo') as string;

  if (!file || !modelInfoPayload) {
    return { success: false, error: 'Faltan datos para la subida.' };
  }

  const modelInfoParsed = modelInfoSchema.safeParse(JSON.parse(modelInfoPayload));
  if (!modelInfoParsed.success) {
      return { success: false, error: 'La información del modelo no es válida.' };
  }
  const modelInfo = modelInfoParsed.data;

  const genderFolder = modelInfo.gender === 'Male' ? 'Hombres' : 'Mujeres';
  const filePath = `${genderFolder}/${modelInfo.modelId}/${modelInfo.photoType}/`;

  const fileExtension = file.name.split('.').pop();
  let fileName;
  if (modelInfo.photoType === 'Portada') {
    // Usamos un nombre fijo para la portada para poder sobreescribirla
    fileName = `cover.${fileExtension}`;
  } else {
    // Para contraportada y portafolio, usamos un nombre único
    fileName = `photo_${modelInfo.slotIndex ?? ''}_${Date.now()}.${fileExtension}`;
  }

  const fullPath = filePath + fileName;

  const { error } = await supabase.storage
    .from('Book_Completo_iZ_Management')
    .upload(fullPath, file, {
        // La opción 'upsert' permite sobreescribir el archivo si ya existe.
        // Es ideal para la portada.
        upsert: modelInfo.photoType === 'Portada',
    });

  if (error) {
    console.error('Supabase upload error:', error);
    return { success: false, error: 'No se pudo subir el archivo a Supabase.' };
  }

  const { data: { publicUrl } } = supabase.storage
    .from('Book_Completo_iZ_Management')
    .getPublicUrl(fullPath);

  // Revalidamos la caché de las páginas relevantes para que se reflejen los cambios
  revalidatePath('/dashboard/models');
  revalidatePath(`/dashboard/models/${modelInfo.modelId}`);

  return { success: true, url: publicUrl };
}
