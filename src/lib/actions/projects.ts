'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { projectFormSchema } from '../schemas/projects';

export async function createProject(formData: FormData) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'No se pudo autenticar al usuario.' };
  }

  const rawData = Object.fromEntries(formData.entries());
  const validation = projectFormSchema.safeParse(rawData);

  if (!validation.success) {
    console.error('Validation Error:', validation.error.flatten().fieldErrors);
    return { success: false, error: 'Los datos enviados no son válidos.' };
  }
  
  // NOTA DE SEGURIDAD: En un entorno de producción final, la contraseña
  // debería ser "hasheada" aquí antes de guardarla, usando una Edge Function de Supabase.
  // Por ahora, para el MVP, la guardamos directamente.
  const { password, ...projectData } = validation.data;

  const dataToInsert = {
    ...projectData,
    password: password || null, // Guarda null si la contraseña está vacía
    user_id: user.id,
  };

  const { data: newProject, error } = await supabase
    .from('projects')
    .insert(dataToInsert)
    .select('id')
    .single();

  if (error) {
    console.error('Supabase insert error:', error);
    return { success: false, error: 'Error de base de datos al crear el proyecto.' };
  }

  revalidatePath('/dashboard/projects');
  
  // Redirigimos al usuario a la página del nuevo proyecto (que construiremos después)
  redirect(`/dashboard/projects/${newProject.id}`);
}
