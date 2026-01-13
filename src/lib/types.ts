// src/lib/types.ts
import type { Database } from './db-types';

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

// Extraemos el tipo "Row" de la tabla 'clients'
type DbClient = Database['public']['Tables']['clients']['Row'];

// Extraemos el tipo "Row" de la tabla 'brands'
type DbBrand = Database['public']['Tables']['brands']['Row'];

// Definimos el tipo manualmente para el estado
export type ProjectStatus =
  | 'draft'
  | 'sent'
  | 'in-review'
  | 'completed'
  | 'archived';

// Tipos de proyecto disponibles (9 tipos, ordenados por jerarquía)
export type ProjectType =
  | 'runway'
  | 'editorial'
  | 'cinema'
  | 'music_video'
  | 'photoshoot'
  | 'tv_commercial'
  | 'ecommerce'
  | 'social_media'
  | 'activation';

// Constante con los tipos de proyecto para UI (ordenados por jerarquía Jobs-style)
export const PROJECT_TYPES: { value: ProjectType; label: string }[] = [
  { value: 'runway', label: 'Runway' },
  { value: 'editorial', label: 'Editorial' },
  { value: 'cinema', label: 'Cinema' },
  { value: 'music_video', label: 'Music Video' },
  { value: 'photoshoot', label: 'Photoshoot' },
  { value: 'tv_commercial', label: 'TV Commercial' },
  { value: 'ecommerce', label: 'E-commerce' },
  { value: 'social_media', label: 'Social Media' },
  { value: 'activation', label: 'Activación' },
];

// ----------------------------------------------------------------
// 2. TIPOS DE LA APLICACIÓN (EXTENDIDOS)
// ----------------------------------------------------------------

export interface Model extends DbModel {
  id: string;
  coverUrl?: string | null;
  portfolioUrl?: string | null;
  compCardUrls?: (string | null)[];
  galleryPaths?: string[] | null;
  galleryUrls?: string[];


  // Campos de la relación projects_models
  client_selection?: 'pending' | 'approved' | 'rejected' | null;
  internal_status?: string | null;
  agreed_fee?: number | null;
  trade_fee?: number | null; // Nuevo campo para canjes
  fee_type?: string | null;
  currency?: string | null;
  notes?: string | null;

  // Asignaciones de tiempo/días
  assignments?: DbModelAssignment[];
}

export interface Project extends DbProject {
  id: string;
  status: ProjectStatus;
  // project_types viene de DbProject como text[] pero lo tipamos más estricto
  project_types: ProjectType[] | null;
  // Relaciones opcionales (no vienen de la DB, se cargan con joins)
  client?: Client | null;
  brand?: Brand | null;
  // Mantenemos compatibilidad con el formato UI, pero ahora viene de la tabla project_schedule
  schedule: { id?: string, date: string, startTime: string, endTime: string }[] | null;
  // Opcionalmente podemos tener la relación directa si la necesitamos
  project_schedule?: DbProjectSchedule[];
  // Conteo de modelos asignados (calculado en queries)
  assigned_models_count?: number;
  // Modelos aprobados con sus detalles (para lista de proyectos)
  approved_models?: { id: string; alias: string; coverUrl: string | null }[];

  // Campos de configuración de pago (defaults)
  default_model_payment_type: 'cash' | 'trade' | 'mixed' | null;
  default_model_trade_category: 'products' | 'clothing' | 'voucher' | 'services' | 'hospitality' | 'other' | null;
  default_model_trade_fee: number | null;
  default_model_trade_details: string | null;
  client_payment_type: 'cash' | 'trade' | 'mixed' | null;
  client_trade_category: 'products' | 'clothing' | 'voucher' | 'services' | 'hospitality' | 'other' | null;
  client_trade_revenue: number | null;
  client_trade_details: string | null;
}

export interface Client extends DbClient {
  id: string;
  // Relación con marcas
  brands?: Brand[];
  // Conteo de proyectos (calculado)
  projectCount?: number;
}

export interface Brand extends DbBrand {
  id: string;
  // Relación con cliente
  client?: Client | null;
}

export type ModelAssignment = DbModelAssignment;
