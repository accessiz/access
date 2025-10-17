'use server';

import { createClient } from "@/lib/supabase/server";
import { unstable_noStore as noStore } from 'next/cache';
import { Model, Project } from "@/lib/types"; // Asegúrate de que Project esté importado

const ITEMS_PER_PAGE = 10; // Definimos cuántos proyectos por página

// Tipado para los parámetros de búsqueda
type SearchParams = {
  query?: string;
  year?: string;
  month?: string;
  sortKey?: keyof Project;
  sortDir?: 'asc' | 'desc';
  currentPage?: number;
  limit?: number;
};

/**
 * Obtiene los proyectos del usuario con filtros, búsqueda y paginación.
 */
export async function getProjectsForUser(searchParams: SearchParams = {}) {
  noStore();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.error('No user logged in');
    return { data: [], count: 0 };
  }

  const currentPage = searchParams.currentPage || 1;
  const limit = searchParams.limit || ITEMS_PER_PAGE;

  let queryBuilder = supabase
    .from('projects')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id);

  // Filtro por búsqueda de texto
  if (searchParams.query) {
    const searchQuery = `%${searchParams.query}%`;
    queryBuilder = queryBuilder.or(
      `project_name.ilike.${searchQuery},client_name.ilike.${searchQuery}`
    );
  }

  // Filtro por fecha (año y mes)
  if (searchParams.year && searchParams.month) {
    const year = parseInt(searchParams.year);
    const month = parseInt(searchParams.month);
    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();
    queryBuilder = queryBuilder.gte('created_at', startDate).lte('created_at', endDate);
  } else if (searchParams.year) {
    const year = parseInt(searchParams.year);
    const startDate = new Date(year, 0, 1).toISOString();
    const endDate = new Date(year, 11, 31, 23, 59, 59).toISOString();
     queryBuilder = queryBuilder.gte('created_at', startDate).lte('created_at', endDate);
  }

  // Ordenamiento
  const sortKey = searchParams.sortKey || 'created_at';
  const sortDir = searchParams.sortDir || 'desc';
  queryBuilder = queryBuilder.order(sortKey, { ascending: sortDir === 'asc' });

  // Paginación
  const from = (currentPage - 1) * limit;
  const to = from + limit - 1;
  queryBuilder = queryBuilder.range(from, to);

  const { data, error, count } = await queryBuilder;

  if (error) {
    console.error('Error fetching projects:', error);
    throw new Error('Could not fetch projects data.');
  }

  return { data: data || [], count: count || 0 };
}

// Las otras funciones (getProjectById, getModelsForProject) permanecen igual
// ... (código existente)
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

export async function getModelsForProject(projectId: string): Promise<Model[]> {
    noStore();
    const supabase = await createClient();
    const { data: projectModels, error: projectModelsError } = await supabase
        .from('projects_models')
        .select('model_id')
        .eq('project_id', projectId);
    if (projectModelsError) {
        console.error('Error fetching project models links:', projectModelsError);
        return [];
    }
    if (!projectModels || projectModels.length === 0) return [];
    const modelIds = projectModels.map(pm => pm.model_id);
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