'use server';

import { createClient } from "@/lib/supabase/server";
import { unstable_noStore as noStore } from 'next/cache';
import { Model } from "@/lib/types"; // Asegúrate de que Model esté importado

/**
 * Obtiene todos los proyectos asociados al usuario actualmente logueado.
 * @returns Una promesa que se resuelve en un array de proyectos.
 */
export async function getProjectsForUser() {
  // ... existing code ...
  noStore();
  
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.error('No user logged in');
    return [];
  }

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching projects:', error);
    throw new Error('Could not fetch projects data.');
  }

  return data;
}

/**
 * Obtiene un proyecto específico por su ID.
 * @param id - El UUID del proyecto.
 * @returns Una promesa que se resuelve con los datos del proyecto o null si no se encuentra.
 */
export async function getProjectById(id: string) {
    noStore();
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error(`Error fetching project ${id}:`, error);
        return null;
    }
    return data;
}

/**
 * Obtiene los modelos/talentos asociados a un proyecto específico.
 * @param projectId - El UUID del proyecto.
 * @returns Una promesa que se resuelve en un array de objetos de modelos.
 */
export async function getModelsForProject(projectId: string): Promise<Model[]> {
    noStore();
    const supabase = await createClient();

    // Primero, obtenemos los IDs de los modelos desde la tabla de unión
    const { data: projectModels, error: projectModelsError } = await supabase
        .from('projects_models')
        .select('model_id')
        .eq('project_id', projectId);

    if (projectModelsError) {
        console.error('Error fetching project models links:', projectModelsError);
        return [];
    }

    if (!projectModels || projectModels.length === 0) {
        return [];
    }

    const modelIds = projectModels.map(pm => pm.model_id);

    // Luego, obtenemos los detalles completos de esos modelos
    const { data: models, error: modelsError } = await supabase
        .from('models')
        .select('*')
        .in('id', modelIds);

    if (modelsError) {
        console.error('Error fetching models for project:', modelsError);
        return [];
    }

    return models;
}
