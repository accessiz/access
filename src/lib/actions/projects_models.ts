'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

/**
 * Añade un modelo a un proyecto en la tabla de unión `projects_models`.
 * @param projectId - El ID del proyecto.
 * @param modelId - El ID del modelo a añadir.
 * @returns Un objeto indicando el éxito o el error de la operación.
 */
export async function addModelToProject(projectId: string, modelId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('projects_models')
    .insert({
      project_id: projectId,
      model_id: modelId,
    });

  if (error) {
    console.error("Error adding model to project:", error);
    // Manejar errores de duplicados de forma silenciosa
    if (error.code === '23505') { // Código para violación de unicidad
        return { success: true }; 
    }
    return { success: false, error: "No se pudo añadir el talento al proyecto." };
  }

  // Revalidamos la ruta de detalle del proyecto para que se actualice la lista.
  revalidatePath(`/dashboard/projects/${projectId}`);
  return { success: true };
}

/**
 * Elimina un modelo de un proyecto desde la tabla de unión `projects_models`.
 * @param projectId - El ID del proyecto.
 * @param modelId - El ID del modelo a eliminar.
 * @returns Un objeto indicando el éxito o el error de la operación.
 */
export async function removeModelFromProject(projectId: string, modelId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('projects_models')
    .delete()
    .eq('project_id', projectId)
    .eq('model_id', modelId);

  if (error) {
    console.error("Error removing model from project:", error);
    return { success: false, error: "No se pudo quitar el talento del proyecto." };
  }

  revalidatePath(`/dashboard/projects/${projectId}`);
  return { success: true };
}
