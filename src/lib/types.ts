// src/lib/types.ts
import type { Database } from './db-types'; // ¡Importamos el manual automático!

// ----------------------------------------------------------------
// 1. TIPOS EXTRAÍDOS DE LA BASE DE DATOS
// ----------------------------------------------------------------

// Extraemos el tipo "Row" (fila) de la tabla 'models'
type DbModel = Database['public']['Tables']['models']['Row'];

// Extraemos el tipo "Row" de la tabla 'projects'
type DbProject = Database['public']['Tables']['projects']['Row'];

// --- ¡INICIO DE LA CORRECCIÓN! ---
// El error (ts(2339)) indica que tu 'db-types.ts' no exporta un Enum
// para 'project_status', probablemente porque tu columna es de tipo 'text'.
// Definimos el tipo manualmente basándonos en tu código original.
export type ProjectStatus =
  | 'draft'
  | 'sent'
  | 'in-review'
  | 'completed'
  | 'archived';
// --- ¡FIN DE LA CORRECCIÓN! ---


// ----------------------------------------------------------------
// 2. TIPOS DE LA APLICACIÓN (EXTENDIDOS)
// ----------------------------------------------------------------

// Creamos la interfaz 'Model' que usará tu app.
// Es el tipo de la DB + los campos extra que añadimos en la API
export interface Model extends DbModel {
  coverUrl?: string | null;
  portfolioUrl?: string | null;
  compCardUrls?: (string | null)[];
  
  // Este campo viene de la tabla 'projects_models' cuando se usa en un proyecto
  client_selection?: 'pending' | 'approved' | 'rejected' | null;
}

// Hacemos lo mismo para 'Project'
// Sobrescribimos 'status' para que use nuestro tipo 'ProjectStatus'
// en lugar del genérico 'string | null' que viene de la DB.
export interface Project extends DbProject {
  status: ProjectStatus;
}