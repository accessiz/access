
import { z } from 'zod';

const phoneRegex = /^\+?\d{7,15}$/;

export const modelFormSchema = z.object({
  alias: z.string().min(2, "El alias debe tener al menos 2 caracteres."),
  full_name: z.string().min(3, "El nombre completo es obligatorio."),
  national_id: z.string().optional().nullable(),
  gender: z.enum(['Male', 'Female', 'Other']).nullable(),
  birth_date: z.string().optional().nullable(),
  country: z.string().nullable(),
  height_cm: z.number({ coerce: true }).positive("Debe ser un número positivo").nullable(),
  shoulders_cm: z.number({ coerce: true }).positive("Debe ser un número positivo").nullable(),
  chest_cm: z.number({ coerce: true }).positive("Debe ser un número positivo").nullable(),
  bust_cm: z.number({ coerce: true }).positive("Debe ser un número positivo").nullable(),
  waist_cm: z.number({ coerce: true }).positive("Debe ser un número positivo").nullable(),
  hips_cm: z.number({ coerce: true }).positive("Debe ser un número positivo").nullable(),
  shoe_size_eu: z.number({ coerce: true }).positive("Debe ser un número positivo").nullable(),
  top_size: z.string().nullable(),
  pants_size: z.string().optional().nullable(),
  eye_color: z.string().nullable(),
  hair_color: z.string().nullable(),
  instagram: z.string().optional().nullable(),
  tiktok: z.string().optional().nullable(),
  email: z.string().email("El formato del email no es válido.").optional().or(z.literal('')).nullable(),
  phone_number: z.string().regex(phoneRegex, "Número de teléfono inválido.").optional().or(z.literal('')).nullable(),
  status: z.enum(['active', 'inactive', 'archived']).default('active'),
  date_joined_agency: z.string().optional().nullable(),
});

export type ModelFormData = z.infer<typeof modelFormSchema>;
