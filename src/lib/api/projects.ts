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

// Función para obtener la lista de proyectos (sin cambios aquí)
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

  if (searchParams.query) {
    const searchQuery = `%${searchParams.query}%`;
    queryBuilder = queryBuilder.or(
      `project_name.ilike.${searchQuery},client_name.ilike.${searchQuery}`
    );
  }

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

  const sortKey = searchParams.sortKey || 'created_at';
  const sortDir = searchParams.sortDir || 'desc';
  queryBuilder = queryBuilder.order(sortKey, { ascending: sortDir === 'asc' });

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

// Función para obtener un proyecto por ID (sin cambios aquí)
export async function getProjectById(projectId: string): Promise<Project | null> {
  noStore();
  const supabase = await createClient();
  // Busca por ID de base de datos o por public_id
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .or(`id.eq.${projectId},public_id.eq.${projectId}`)
    .single();

  if (error) {
    // Es normal no encontrar un proyecto si el ID es incorrecto, no loguear como error fatal
    if (error.code !== 'PGRST116') { // PGRST116 = Single row not found
        console.error('Error fetching project by ID:', projectId, error);
    }
    return null;
  }
  return data as Project;
}

// Función para obtener modelos de un proyecto (OPTIMIZADA)
export async function getModelsForProject(projectId: string): Promise<Model[]> {
  noStore();
  const supabase = await createClient();

  // Obtiene las relaciones y los datos completos de los modelos asociados
  const { data: projectModelsData, error } = await supabase
    .from('projects_models')
    .select(`
      client_selection,
      models (*)
    `)
    .eq('project_id', projectId);

  if (error || !projectModelsData) {
    // Registra el error real si existe, sino un mensaje genérico
    console.error('Error fetching models for project:', error || 'No data returned');
    return [];
  }

  // Mapea los datos correctamente, manejando posibles modelos nulos o inválidos
  const models = projectModelsData.flatMap(item => {
    const modelData = item.models;
    // Verifica si modelData es un objeto válido antes de convertirlo
    if (!modelData || Array.isArray(modelData) || typeof modelData !== 'object') {
      console.warn(`Invalid model data found for project ${projectId}:`, item);
      return []; // Omite este item si los datos del modelo faltan o son inválidos
    }
    const model = modelData as unknown as Model; // Convertimos a tipo Model
    return [{
      ...model,
      // Asegura que client_selection se asigne correctamente, usa null si falta
      client_selection: item.client_selection ?? null,
    }];
  });

  // --- SE ELIMINÓ EL BLOQUE Promise.all QUE CAUSABA EL N+1 ---
  // Ya no generamos URLs firmadas aquí. El frontend usará la publicUrl.

  // Devolvemos los modelos directamente
  return models;
}

// Función para obtener UN modelo específico para un proyecto (sin cambios, ya era eficiente)
export async function getModelForProject(projectId: string, modelId: string): Promise<Model | null> {
  noStore();
  const supabase = await createClient();

  // Obtiene la relación y los datos del modelo específico
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
     if (error && error.code !== 'PGRST116') { // No loguear si simplemente no se encontró
        console.error('Error fetching specific model for project:', projectId, modelId, error);
     }
    return null;
  }

  const modelData = projectModelData.models;
  // Verifica si modelData es válido
  if (!modelData || Array.isArray(modelData) || typeof modelData !== 'object') {
     console.warn(`Invalid specific model data for project ${projectId}, model ${modelId}:`, projectModelData);
    return null;
  }

  const model = modelData as unknown as Model;

  // Obtiene URLs firmadas para portada y portafolio (solo para este modelo específico)
  const [coverUrlResult, portfolioUrlResult] = await Promise.all([
    supabase.storage.from(BUCKET_NAME).createSignedUrl(`${model.id}/Portada/cover.jpg`, 300), // Asume cover.jpg
    supabase.storage.from(BUCKET_NAME).createSignedUrl(`${model.id}/Portfolio/portfolio.jpg`, 300) // Asume portfolio.jpg
  ]);

  return {
    ...model,
    client_selection: projectModelData.client_selection ?? null,
    coverUrl: coverUrlResult.error ? null : coverUrlResult.data?.signedUrl ?? null,
    portfolioUrl: portfolioUrlResult.error ? null : portfolioUrlResult.data?.signedUrl ?? null,
  };
}