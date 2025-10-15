export interface Model {
  id: string; 
  alias: string | null;
  full_name: string | null;
  national_id: string | null;
  status: 'active' | 'inactive' | 'archived';
  gender: 'Male' | 'Female' | 'Other' | null;
  birth_date: string | null;
  country: string | null;
  height_cm: number | null;
  shoulders_cm: number | null;
  chest_cm: number | null;
  bust_cm: number | null;
  waist_cm: number | null;
  hips_cm: number | null;
  top_size: string | null;
  pants_size: string | null;
  shoe_size_eu: number | null;
  eye_color: string | null;
  hair_color: string | null;
  instagram: string | null;
  tiktok: string | null;
  email: string | null;
  phone_number: string | null;
  created_at: string;
  user_id: string | null;
  date_joined_agency: string | null;
  
  // Campos opcionales que se añaden dinámicamente
  profile_completion?: number;
  
  // ✅ SOLUCIÓN: Añadimos la propiedad que faltaba.
  coverUrl?: string | null; 
}