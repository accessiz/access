
import { z } from 'zod';

// Expresión regular para validar un número de teléfono internacional simple (solo dígitos y +)
const phoneRegex = /^\+?\d{7,15}$/;

// --- Esquema de Validación del Formulario del Modelo ---
export const modelFormSchema = z.object({
  // --- Información Básica ---
  alias: z.string().min(2, "El alias debe tener al menos 2 caracteres."),
  full_name: z.string().min(3, "El nombre completo es obligatorio."),
  national_id: z.string().optional(),
  gender: z.enum(['Male', 'Female', 'Other']).nullable(),
  birth_date: z.string().optional(),
  country: z.string().nullable(),

  // --- Medidas (Tipos numéricos claros, la conversión se hace en el formulario) ---
  height_cm: z.number({ }).positive("Debe ser un número positivo").nullable(),
  shoulders_cm: z.number({ }).positive("Debe ser un número positivo").nullable(),
  chest_cm: z.number({ }).positive("Debe ser un número positivo").nullable(),
  bust_cm: z.number({ }).positive("Debe ser un número positivo").nullable(),
  waist_cm: z.number({ }).positive("Debe ser un número positivo").nullable(),
  hips_cm: z.number({ }).positive("Debe ser un número positivo").nullable(),
  shoe_size_eu: z.number({ }).positive("Debe ser un número positivo").nullable(),

  // --- Tallas ---
  top_size: z.string().nullable(),
  pants_size: z.string().optional(),

  // --- Apariencia ---
  eye_color: z.string().nullable(),
  hair_color: z.string().nullable(),

  // --- Contacto y Redes Sociales ---
  instagram: z.string().optional(),
  tiktok: z.string().optional(),
  email: z.string().email("El formato del email no es válido.").optional().or(z.literal('')),
  phone_number: z.string().regex(phoneRegex, "Número de teléfono inválido").optional().or(z.literal('')),
});

// --- Tipo Inferido para TypeScript ---
export type ModelFormData = z.infer<typeof modelFormSchema>;
