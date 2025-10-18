'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from 'zod';

// --- addModelToProject y removeModelFromProject no cambian ---
export async function addModelToProject(projectId: string, modelId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('projects_models').insert({ project_id: projectId, model_id: modelId });
  if (error) {
    console.error("Error adding model to project:", error);
    if (error.code === '23505') { return { success: true }; }
    return { success: false, error: "No se pudo añadir el talento al proyecto." };
  }
  revalidatePath(`/dashboard/projects/${projectId}`);
  return { success: true };
}

export async function removeModelFromProject(projectId: string, modelId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('projects_models').delete().eq('project_id', projectId).eq('model_id', modelId);
  if (error) {
    console.error("Error removing model from project:", error);
    return { success: false, error: "No se pudo quitar el talento del proyecto." };
  }
  revalidatePath(`/dashboard/projects/${projectId}`);
  return { success: true };
}

/**
 * ✅ FUNCIÓN REVERTIDA A SU PROPÓSITO ORIGINAL
 * Actualiza la selección de un cliente para un modelo específico.
 * Ya no se encarga de cambiar el estado del proyecto.
 */
export async function updateModelSelection(
  projectId: string, 
  modelId: string, 
  selection: 'approved' | 'rejected'
) {
  const supabase = await createClient();

  if (!z.string().uuid().safeParse(projectId).success || !z.string().uuid().safeParse(modelId).success) {
     return { success: false, error: 'IDs de proyecto o modelo inválidos.' };
  }

  const { error } = await supabase
    .from('projects_models')
    .update({ client_selection: selection })
    .eq('project_id', projectId)
    .eq('model_id', modelId);

  if (error) {
    console.error("Error updating model selection:", error);
    return { success: false, error: "No se pudo guardar la selección." };
  }
  
  revalidatePath(`/dashboard/projects/${projectId}`);
  return { success: true };
}