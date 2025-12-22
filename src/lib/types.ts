// src/lib/types.ts
import type { Database, Json } from './db-types';

// ----------------------------------------------------------------
// 1. TIPOS EXTRAÍDOS DE LA BASE DE DATOS
// ----------------------------------------------------------------

// Extraemos el tipo "Row" (fila) de la tabla 'models'
type DbModel = Database['public']['Tables']['models']['Row'];

// Extraemos el tipo "Row" de la tabla 'projects'
type DbProject = Database['public']['Tables']['projects']['Row'];

// Definimos el tipo manualmente para el estado
export type ProjectStatus =
  | 'draft'
  | 'sent'
  | 'in-review'
  | 'completed'
  | 'archived';

// ----------------------------------------------------------------
// 2. TIPOS DE LA APLICACIÓN (EXTENDIDOS)
// ----------------------------------------------------------------

export interface Model extends DbModel {
  id: string; 
  coverUrl?: string | null;
  portfolioUrl?: string | null;
  compCardUrls?: (string | null)[];
  
  client_selection?: 'pending' | 'approved' | 'rejected' | null;
}

export interface Project extends DbProject {
  id: string; 
  status: ProjectStatus;
  schedule: { id: string, date: string, startTime: string, endTime: string }[] | null;
}
