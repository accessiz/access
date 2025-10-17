'use server';

import { createClient } from "@/lib/supabase/server";
import { unstable_noStore as noStore } from 'next/cache';
import { Model, Project } from "@/lib/types";

const BUCKET_NAME = 'Book_Completo_iZ_Management'; // Variable para asegurar consistencia
const ITEMS_PER_PAGE = 10;

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

/**
 * Obtiene un proyecto específico por su ID.
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
 * Obtiene los modelos de un proyecto, incluyendo el estado de selección
 * y la URL segura para la foto de portada.
 */
export async function getModelsForProject(projectId: string): Promise<Model[]> {
    noStore();
    const supabase = await createClient();

    // 1. Obtenemos los modelos y su estado de selección
    const { data: projectModelsData, error } = await supabase
      .from('projects_models')
      .select(`
        client_selection,
        models ( * )
      `)
      .eq('project_id', projectId);

    if (error) {
        console.error('Error fetching models for project:', error);
        return [];
    }
    
    if (!projectModelsData) {
        return [];
    }

    const models = projectModelsData.map(item => ({
        ...(item.models as Model),
        client_selection: item.client_selection,
    }));

    // 2. Enriquecemos cada modelo con la URL de su foto de portada
    const enrichedModels = await Promise.all(
        models.map(async (model) => {
            const imagePath = `${model.id}/Portada/cover.jpg`;
            const { data: signedUrlData, error: signedUrlError } = await supabase
                .storage
                .from(BUCKET_NAME)
                .createSignedUrl(imagePath, 300); // URL válida por 5 minutos

            return {
                ...model,
                coverUrl: signedUrlError ? null : signedUrlData.signedUrl,
            };
        })
    );

    return enrichedModels;
}