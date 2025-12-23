// src/lib/types.ts
import type { Database, Json } from './db-types';

// ----------------------------------------------------------------
// 1. TIPOS EXTRAÍDOS DE LA BASE DE DATOS
// ----------------------------------------------------------------

// Extraemos el tipo "Row" (fila) de la tabla 'models'
type DbModel = Database['public']['Tables']['models']['Row'];

// Extraemos el tipo "Row" de la tabla 'projects'
type DbProject = Database['public']['Tables']['projects']['Row'];

// Extraemos el tipo "Row" de la tabla 'project_schedule'
type DbProjectSchedule = Database['public']['Tables']['project_schedule']['Row'];

// Extraemos el tipo "Row" de la tabla 'model_assignments'
type DbModelAssignment = Database['public']['Tables']['model_assignments']['Row'];

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

  // Campos de la relación projects_models
  client_selection?: 'pending' | 'approved' | 'rejected' | null;
  internal_status?: string | null;
  agreed_fee?: number | null;
  fee_type?: string | null;
  currency?: string | null;
  notes?: string | null;

  // Asignaciones de tiempo/días
  assignments?: DbModelAssignment[];
}

export interface Project extends DbProject {
  id: string;
  status: ProjectStatus;
  // Mantenemos compatibilidad con el formato UI, pero ahora viene de la tabla project_schedule
  schedule: { id?: string, date: string, startTime: string, endTime: string }[] | null;
  // Opcionalmente podemos tener la relación directa si la necesitamos
  project_schedule?: DbProjectSchedule[];
}

export type ModelAssignment = DbModelAssignment;



