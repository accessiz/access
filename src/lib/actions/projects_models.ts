'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from 'zod';
import { logError } from '@/lib/utils/errors';
// Importa PostgrestError para un tipado más seguro
import { PostgrestError } from '@supabase/supabase-js';

// --- Funciones Helper para Errores (Similares a models.ts) ---

// Verifica si un error es de tipo PostgrestError
const isPostgrestError = (error: unknown): error is PostgrestError => {
  return typeof error === 'object' && error !== null && 'code' in error;
};

// Mapea errores comunes de la tabla 'projects_models'
const mapProjectModelDbError = (error: PostgrestError): { message: string } => {
  // Violación de restricción única (intentando añadir el mismo modelo dos veces)
  if (error.code === '23505') {
    return { message: 'Este talento ya ha sido añadido a este proyecto.' };
  }
  // Violación de clave foránea (project_id o model_id no existen)
  if (error.code === '23503') {
     return { message: 'El proyecto o el talento especificado no existe.' };
  }
  // Fallback genérico
  return { message: 'Ocurrió un error inesperado en la base de datos al gestionar la relación.' };
};

// --- Acción: addModelToProject ---
export async function addModelToProject(projectId: string, modelId: string) {
  const supabase = await createClient(); //

  // Validación básica de IDs
  if (!z.string().uuid().safeParse(projectId).success || !z.string().uuid().safeParse(modelId).success) {
     return { success: false, error: 'IDs de proyecto o modelo inválidos.' };
  }

  try {
    const { error } = await supabase.from('projects_models').insert({ project_id: projectId, model_id: modelId }); //

    if (error) {
      logError(error, { action: 'addModelToProject', projectId, modelId }); //
      // Si el error es '23505' (duplicado), lo tratamos como éxito silencioso.
      if (error.code === '23505') { return { success: true }; } //
      // Mapea otros errores de DB
      const { message } = mapProjectModelDbError(error);
      return { success: false, error: message };
    }

    revalidatePath(`/dashboard/projects/${projectId}`); //
    return { success: true }; //

  } catch (err) {
    logError(err, { action: 'addModelToProject.catch_all', projectId, modelId });
    // Intenta mapear si es un error conocido de DB
    if (isPostgrestError(err)) {
        const { message } = mapProjectModelDbError(err);
        return { success: false, error: message };
    }
    return { success: false, error: "No se pudo añadir el talento al proyecto debido a un error inesperado." };
  }
}

// --- Acción: removeModelFromProject ---
export async function removeModelFromProject(projectId: string, modelId: string) {
  const supabase = await createClient(); //

  // Validación básica de IDs
  if (!z.string().uuid().safeParse(projectId).success || !z.string().uuid().safeParse(modelId).success) {
     return { success: false, error: 'IDs de proyecto o modelo inválidos.' };
  }

  try {
    const { error } = await supabase.from('projects_models').delete().eq('project_id', projectId).eq('model_id', modelId); //

    if (error) {
      logError(error, { action: 'removeModelFromProject', projectId, modelId }); //
      // Mapea errores de DB
      const { message } = mapProjectModelDbError(error);
      return { success: false, error: message };
    }

    revalidatePath(`/dashboard/projects/${projectId}`); //
    return { success: true }; //

  } catch (err) {
     logError(err, { action: 'removeModelFromProject.catch_all', projectId, modelId });
    // Intenta mapear si es un error conocido de DB
    if (isPostgrestError(err)) {
        const { message } = mapProjectModelDbError(err);
        return { success: false, error: message };
    }
     return { success: false, error: "No se pudo quitar el talento del proyecto debido a un error inesperado." };
  }
}

// --- Acción: updateModelSelection ---
export async function updateModelSelection(
  projectId: string,
  modelId: string,
  selection: 'approved' | 'rejected'
) {
  const supabase = await createClient(); //

  // Validación de IDs y selección
  if (!z.string().uuid().safeParse(projectId).success || !z.string().uuid().safeParse(modelId).success) {
     return { success: false, error: 'IDs de proyecto o modelo inválidos.' }; //
  }
  if (!['approved', 'rejected'].includes(selection)) {
      return { success: false, error: 'Selección inválida.' };
  }

  try {
    const { error } = await supabase
      .from('projects_models')
      .update({ client_selection: selection }) //
      .eq('project_id', projectId) //
      .eq('model_id', modelId); //

    if (error) {
      logError(error, { action: 'updateModelSelection', projectId, modelId, selection }); //
      // Mapea errores de DB
      const { message } = mapProjectModelDbError(error);
      return { success: false, error: message };
    }

    revalidatePath(`/dashboard/projects/${projectId}`); //
    return { success: true }; //

  } catch (err) {
    logError(err, { action: 'updateModelSelection.catch_all', projectId, modelId, selection });
    // Intenta mapear si es un error conocido de DB
    if (isPostgrestError(err)) {
        const { message } = mapProjectModelDbError(err);
        return { success: false, error: message };
    }
    return { success: false, error: "No se pudo guardar la selección debido a un error inesperado." };
  }
}