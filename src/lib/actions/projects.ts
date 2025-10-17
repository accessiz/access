'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { projectFormSchema } from '../schemas/projects';
import { z } from 'zod';
import { Project } from '@/lib/types';
import { cookies } from 'next/headers';

type FormState = {
  error: string | null;
  success: boolean;
  data?: any;
};

// --- createProject (sin cambios) ---
export async function createProject(prevState: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { return { success: false, error: 'No se pudo autenticar al usuario.' }; }
  const rawData = Object.fromEntries(formData.entries());
  const validation = projectFormSchema.safeParse(rawData);
  if (!validation.success) {
    const fieldErrors = validation.error.flatten().fieldErrors;
    const errorMessage = Object.values(fieldErrors).flat().join('. ');
    return { success: false, error: errorMessage || 'Los datos enviados no son válidos.', data: rawData };
  }
  const { password, ...projectData } = validation.data;
  const dataToInsert = { ...projectData, password: password || null, user_id: user.id };
  const { data: newProject, error } = await supabase.from('projects').insert(dataToInsert).select('id').single();
  if (error) {
    console.error('Supabase insert error:', error);
    return { success: false, error: 'Error de base de datos al crear el proyecto.' };
  }
  revalidatePath('/dashboard/projects');
  redirect(`/dashboard/projects/${newProject.id}`);
}

// --- deleteProject (sin cambios) ---
export async function deleteProject(projectId: string) {
  const supabase = await createClient();
  if (!z.string().uuid().safeParse(projectId).success) { return { success: false, error: 'ID de proyecto inválido.' }; }
  const { error } = await supabase.from('projects').delete().eq('id', projectId);
  if (error) {
    console.error('Supabase delete error:', error);
    return { success: false, error: 'Error de base de datos al eliminar el proyecto.' };
  }
  revalidatePath('/dashboard/projects');
  return { success: true };
}

// --- updateProjectStatus (sin cambios) ---
export async function updateProjectStatus(projectId: string, newStatus: Project['status']) {
  const supabase = await createClient();
  if (!z.string().uuid().safeParse(projectId).success) { return { success: false, error: 'ID de proyecto inválido.' }; }
  const { error } = await supabase.from('projects').update({ status: newStatus }).eq('id', projectId);
  if (error) {
    console.error('Supabase status update error:', error);
    return { success: false, error: 'No se pudo actualizar el estado del proyecto.' };
  }
  revalidatePath(`/dashboard/projects/${projectId}`);
  revalidatePath('/dashboard/projects');
  return { success: true };
}

/**
 * Verifica la contraseña de un proyecto y guarda un token en una cookie si es correcta.
 */
export async function verifyProjectPassword(projectId: string, password_input: string) {
  const supabase = await createClient();
  const { data: project, error } = await supabase.from('projects').select('password').eq('id', projectId).single();

  if (error || !project) {
    return { success: false, error: 'Proyecto no encontrado.' };
  }

  if (project.password === password_input) {
    const cookieName = `project_access_${projectId}`;
    
    // ✅ INICIO DE LA CORRECCIÓN: Usamos 'await' para resolver la promesa de cookies
    const cookieStore = await cookies();
    cookieStore.set(cookieName, 'true', { maxAge: 60 * 60 * 24, httpOnly: true, path: '/' });
    // ✅ FIN DE LA CORRECCIÓN

    return { success: true };
  } else {
    return { success: false, error: 'Contraseña incorrecta.' };
  }
}