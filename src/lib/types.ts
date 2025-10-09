// Basado en tu script de Python y la tabla de la base de datos
export interface Model {
  id: string; // O number, dependiendo de tu base de datos
  alias: string | null;
  full_name: string | null;
  national_id: string | null;
  status: 'active' | 'inactive' | 'archived';
  gender: 'Male' | 'Female' | 'Other' | null;
  birth_date: string | null; // Formato YYYY-MM-DD
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
}
