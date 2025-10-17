'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { projectFormSchema } from '../schemas/projects';
import { z } from 'zod';
import { Project } from '@/lib/types';

type FormState = {
  error: string | null;
  success: boolean;
  data?: any;
};

export async function createProject(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'No se pudo autenticar al usuario.' };
  }

  const rawData = Object.fromEntries(formData.entries());
  const validation = projectFormSchema.safeParse(rawData);

  if (!validation.success) {
    const fieldErrors = validation.error.flatten().fieldErrors;
    const errorMessage = Object.values(fieldErrors).flat().join('. ');
    return { success: false, error: errorMessage || 'Los datos enviados no son válidos.', data: rawData };
  }
  
  const { password, ...projectData } = validation.data;

  const dataToInsert = {
    ...projectData,
    password: password || null,
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
  redirect(`/dashboard/projects/${newProject.id}`);
}

/**
 * ✅ CORRECCIÓN: Añadimos 'export' para que la función sea pública.
 * Elimina un proyecto de la base de datos.
 */
export async function deleteProject(projectId: string) {
  const supabase = await createClient();
  
  if (!z.string().uuid().safeParse(projectId).success) {
     return { success: false, error: 'ID de proyecto inválido.' };
  }

  const { error } = await supabase.from('projects').delete().eq('id', projectId);

  if (error) {
    console.error('Supabase delete error:', error);
    return { success: false, error: 'Error de base de datos al eliminar el proyecto.' };
  }

  revalidatePath('/dashboard/projects');
  return { success: true };
}

/**
 * ✅ CORRECCIÓN: Añadimos 'export' a esta también por si acaso.
 * Actualiza el estado de un proyecto.
 */
export async function updateProjectStatus(projectId: string, newStatus: Project['status']) {
  const supabase = await createClient();

  if (!z.string().uuid().safeParse(projectId).success) {
     return { success: false, error: 'ID de proyecto inválido.' };
  }

  const { error } = await supabase
    .from('projects')
    .update({ status: newStatus })
    .eq('id', projectId);

  if (error) {
    console.error('Supabase status update error:', error);
    return { success: false, error: 'No se pudo actualizar el estado del proyecto.' };
  }

  revalidatePath(`/dashboard/projects/${projectId}`);
  revalidatePath('/dashboard/projects');
  return { success: true };
}