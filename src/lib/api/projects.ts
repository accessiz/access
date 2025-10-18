'use server';

import { createClient } from "@/lib/supabase/server";
import { unstable_noStore as noStore } from 'next/cache';
import { Model, Project } from "@/lib/types";

const BUCKET_NAME = 'Book_Completo_iZ_Management';
const ITEMS_PER_PAGE = 10;

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
    .eq('user_id', user.id); // ✅ CRÍTICO: Se reintroduce el filtro por usuario.

  // Filtro por búsqueda de texto en nombre de proyecto O cliente.
  if (searchParams.query) {
    const searchQuery = `%${searchParams.query}%`;
    queryBuilder = queryBuilder.or(
      `project_name.ilike.${searchQuery},client_name.ilike.${searchQuery}`
    );
  }

  // Filtro por fecha usando rangos para mayor precisión.
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
 * Obtiene un proyecto por su ID o public_id
 */
export async function getProjectById(projectId: string): Promise<Project | null> {
  noStore();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .or(`id.eq.${projectId},public_id.eq.${projectId}`) // ✅ Se mantiene tu mejora.
    .single();

  if (error) {
    console.error('Error fetching project:', error);
    return null;
  }
  return data as Project;
}

/**
 * Obtiene todos los modelos asociados a un proyecto
 */
export async function getModelsForProject(projectId: string): Promise<Model[]> {
  noStore();
  const supabase = await createClient();

  const { data: projectModelsData, error } = await supabase
    .from('projects_models')
    .select(`
      client_selection,
      models (*)
    `)
    .eq('project_id', projectId);

  if (error || !projectModelsData) {
    console.error('Error fetching models for project:', error);
    return [];
  }

  const models = projectModelsData.flatMap(item => {
    const modelData = item.models;
    if (!modelData || Array.isArray(modelData) || typeof modelData !== 'object') {
      return [];
    }
    const model = modelData as unknown as Model;
    return [{
      ...model,
      client_selection: item.client_selection ?? model.client_selection ?? null,
    }];
  });

  const enrichedModels = await Promise.all(
    models.map(async (model) => {
      const imagePath = `${model.id}/Portada/cover.jpg`;
      const { data: signedUrlData, error: signedUrlError } = await supabase
        .storage
        .from(BUCKET_NAME)
        .createSignedUrl(imagePath, 300);

      return {
        ...model,
        coverUrl: signedUrlError ? null : signedUrlData.signedUrl,
      };
    })
  );
  return enrichedModels;
}

/**
 * Obtiene un modelo específico dentro de un proyecto
 */
export async function getModelForProject(projectId: string, modelId: string): Promise<Model | null> {
  noStore();
  const supabase = await createClient();

  const { data: projectModelData, error } = await supabase
    .from('projects_models')
    .select(`
      client_selection,
      models (*)
    `)
    .eq('project_id', projectId)
    .eq('model_id', modelId)
    .single();

  if (error || !projectModelData) {
    console.error('Error fetching model for project:', error);
    return null;
  }
  
  const modelData = projectModelData.models;
  if (!modelData || Array.isArray(modelData) || typeof modelData !== 'object') {
    return null;
  }

  let model = modelData as unknown as Model;

  // ✅ Se reintroduce la obtención de la URL del portafolio.
  const [coverUrlResult, portfolioUrlResult] = await Promise.all([
    supabase.storage.from(BUCKET_NAME).createSignedUrl(`${model.id}/Portada/cover.jpg`, 300),
    supabase.storage.from(BUCKET_NAME).createSignedUrl(`${model.id}/Portfolio/portfolio.jpg`, 300)
  ]);

  return {
    ...model,
    client_selection: projectModelData.client_selection ?? model.client_selection ?? null,
    coverUrl: coverUrlResult.error ? null : coverUrlResult.data.signedUrl,
    portfolioUrl: portfolioUrlResult.error ? null : portfolioUrlResult.data.signedUrl,
  };
}

