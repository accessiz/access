// Este tipo representa la estructura de un modelo en la base de datos
// y debe coincidir perfectamente con tu nueva tabla 'models' en Supabase.
export interface Model {
  id: string;
  created_at: string;
  
  // Información Personal
  alias?: string | null;
  full_name: string;
  birth_date?: string | null; // formato YYYY-MM-DD
  national_id?: string | null; // 13 dígitos
  phone_e164?: string | null; // +502...
  email?: string | null;
  
  // Atributos Físicos
  gender?: 'Male' | 'Female' | 'Non-binary' | null;
  country?: string | null;
  eye_color?: string | null;
  hair_color?: string | null;

  // Medidas (Nombres estandarizados)
  height_cm?: number | null;
  shoulders_cm?: number | null;
  chest_cm?: number | null;
  bust_cm?: number | null;
  waist_cm?: number | null;
  hips_cm?: number | null; // Nombre corregido a plural

  // Tallas (Nombres y tipos estandarizados)
  top_size?: string | null;
  pants_size?: number | null;
  shoe_size_eu?: number | null; // Nombre y tipo corregidos

  // Redes Sociales
  instagram?: string | null;
  tiktok?: string | null;

  // Datos de Agencia
  status: 'active' | 'inactive' | 'archived'; // Estatus en minúscula
  date_joined_agency?: string | null;
  
  // Relaciones
  user_id?: string | null;
  
  // Campos calculados y URLs (opcionales, añadidos por la lógica de la API)
  profile_completeness?: number | null;
  coverUrl?: string | null;
  portfolioUrl?: string | null;
  client_selection?: 'pending' | 'approved' | 'rejected' | null;
}

// Interfaz para proyectos, sin cambios necesarios pero bueno tenerla definida
export interface Project {
  id: string;
  public_id: string;
  created_at: string;
  user_id: string;
  project_name: string | null;
  client_name: string | null;
  description: string | null;
  password?: string | null;
  status: 'draft' | 'sent' | 'in-review' | 'completed' | 'archived';
}
