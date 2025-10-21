'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { projectFormSchema } from '../schemas/projects';
import { zodErrorToFieldErrors } from '@/lib/utils/zod';
import { z } from 'zod';
import { Project } from '@/lib/types';
import { cookies } from 'next/headers';
import { logError } from '@/lib/utils/errors';
import { PostgrestError } from '@supabase/supabase-js';

type FormState = {
  error: string | null;
  success: boolean;
  data?: Record<string, FormDataEntryValue | undefined>;
  errors?: Record<string, string>;
};

// --- Funciones Helper para Errores ---

const isPostgrestError = (error: unknown): error is PostgrestError => {
  return typeof error === 'object' && error !== null && 'code' in error;
};

const mapProjectDbError = (error: PostgrestError): { message: string; fieldErrors?: Record<string, string> } => {
  if (error.code === '23505') {
    return { message: 'Ya existe un proyecto con identificadores similares.' };
  }
  if (error.code === '23503') {
     return { message: 'Error de referencia: el usuario asociado no es válido.' };
  }
  return { message: 'Ocurrió un error inesperado en la base de datos al gestionar el proyecto.' };
};

// --- Acción: createProject ---
export async function createProject(prevState: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { return { success: false, error: 'No se pudo autenticar al usuario.' }; }

  const rawData = Object.fromEntries(formData.entries());
  const validation = projectFormSchema.safeParse(rawData);
  if (!validation.success) {
    const fieldErrors = zodErrorToFieldErrors(validation.error);
    const errorMessage = Object.values(fieldErrors).flat().join('. ');
    return { success: false, error: errorMessage || 'Los datos enviados no son válidos.', data: rawData, errors: fieldErrors };
  }

  const { password, ...projectData } = validation.data;
  const dataToInsert = { ...projectData, password: password || null, user_id: user.id };

  try {
    // CORRECCIÓN: No necesitamos guardar 'data: newProject' aquí
    const { error } = await supabase.from('projects').insert(dataToInsert).select('id').single();

    if (error) {
      logError(error, { action: 'createProject.insert' });
      const { message, fieldErrors } = mapProjectDbError(error);
      return { success: false, error: message, data: rawData, errors: fieldErrors };
    }

    revalidatePath('/dashboard/projects');

  } catch (err) {
    logError(err, { action: 'createProject.catch_all' });
    if (isPostgrestError(err)) {
        const { message, fieldErrors } = mapProjectDbError(err);
        return { success: false, error: message, data: rawData, errors: fieldErrors };
    }
    return { success: false, error: 'Ocurrió un error inesperado al intentar crear el proyecto.', data: rawData };
  }

  const { data: finalProject, error: fetchError } = await supabase
      .from('projects')
      .select('id')
      .match(dataToInsert)
      .limit(1)
      .single();

  if (fetchError || !finalProject) {
      logError(fetchError ?? new Error('Project not found after insert'), { action: 'createProject.fetch_after_insert' });
      revalidatePath('/dashboard/projects');
      return { success: true, error: 'Proyecto creado, pero hubo un problema al redirigir.' };
  }

  redirect(`/dashboard/projects/${finalProject.id}`);
}

// --- Acción: deleteProject ---
export async function deleteProject(projectId: string) {
  const supabase = await createClient();

  if (!z.string().uuid().safeParse(projectId).success) { return { success: false, error: 'ID de proyecto inválido.' }; }

  try {
    const { error } = await supabase.from('projects').delete().eq('id', projectId);

    if (error) {
      logError(error, { action: 'deleteProject.delete', projectId });
      const { message } = mapProjectDbError(error);
      return { success: false, error: message };
    }

    revalidatePath('/dashboard/projects');
    return { success: true };

  } catch (err) {
    logError(err, { action: 'deleteProject.catch_all', projectId });
    if (isPostgrestError(err)) {
        const { message } = mapProjectDbError(err);
        return { success: false, error: message };
    }
    return { success: false, error: 'Ocurrió un error inesperado al intentar eliminar el proyecto.' };
  }
}

// --- Acción: updateProjectStatus ---
export async function updateProjectStatus(projectId: string, newStatus: Project['status']) {
  const supabase = await createClient();

  if (!z.string().uuid().safeParse(projectId).success) { return { success: false, error: 'ID de proyecto inválido.' }; }
  const validStatuses = ['draft', 'sent', 'in-review', 'completed', 'archived'];
  if (!validStatuses.includes(newStatus)) {
      return { success: false, error: 'Estado de proyecto inválido.' };
  }

  try {
    const { error } = await supabase.from('projects').update({ status: newStatus }).eq('id', projectId);

    if (error) {
      logError(error, { action: 'updateProjectStatus.update', projectId, newStatus });
      const { message } = mapProjectDbError(error);
      return { success: false, error: message };
    }

    revalidatePath(`/dashboard/projects/${projectId}`);
    revalidatePath('/dashboard/projects');
    return { success: true };

  } catch (err) {
    logError(err, { action: 'updateProjectStatus.catch_all', projectId, newStatus });
     if (isPostgrestError(err)) {
        const { message } = mapProjectDbError(err);
        return { success: false, error: message };
    }
    return { success: false, error: 'Ocurrió un error inesperado al intentar actualizar el estado del proyecto.' };
  }
}

// --- Acción: verifyProjectPassword ---
export async function verifyProjectPassword(projectId: string, password_input: string) {
  const supabase = await createClient();
  let projectData: { password: string | null } | null = null;
  let fetchError: PostgrestError | null = null;

  try {
      const { data, error } = await supabase.from('projects').select('password').eq('id', projectId).single();
      projectData = data;
      fetchError = error;
  } catch (err) {
      logError(err, { action: 'verifyProjectPassword.fetch_catch', projectId });
      return { success: false, error: 'Ocurrió un error al verificar el proyecto.' };
  }

  if (fetchError || !projectData) {
    if (fetchError && fetchError.code !== 'PGRST116') {
        logError(fetchError, { action: 'verifyProjectPassword.fetch_error', projectId });
        return { success: false, error: 'Ocurrió un error al buscar el proyecto.' };
    }
    return { success: false, error: 'Proyecto no encontrado.' };
  }

  if (projectData.password === password_input) {
    try {
        const cookieName = `project_access_${projectId}`;
        const cookieStore = await cookies();
        cookieStore.set(cookieName, 'true', { maxAge: 60 * 60 * 24, httpOnly: true, path: '/' });
        return { success: true };
    } catch (cookieError) {
        logError(cookieError, { action: 'verifyProjectPassword.set_cookie_error', projectId });
        return { success: false, error: 'No se pudo guardar el acceso. Intenta de nuevo.' };
    }
  } else {
    return { success: false, error: 'Contraseña incorrecta.' };
  }
}