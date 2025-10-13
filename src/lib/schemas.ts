import { z } from 'zod';

// Regex para nombres: permite letras (incluyendo acentos), espacios y apóstrofes.
const nameRegex = /^[\p{L}'\s]+$/u;
// Regex para teléfono: exige un '+' al inicio, seguido de 7 a 15 dígitos.
const phoneRegex = /^\+\d{7,15}$/;

// Función para transformar valores vacíos a null, ideal para campos opcionales.
const emptyStringToNull = z.preprocess((val) => {
  if (typeof val === 'string' && val.trim() === '') {
    return null;
  }
  return val;
}, z.any());


export const modelFormSchema = z.object({
  // --- CAMPOS REQUERIDOS ---
  alias: z.string()
    .min(2, "El alias debe tener al menos 2 caracteres.")
    .regex(nameRegex, "El alias solo puede contener letras y espacios."),
  full_name: z.string()
    .min(3, "El nombre completo es obligatorio.")
    .regex(nameRegex, "El nombre solo puede contener letras y espacios."),

  // --- CAMPOS OPCIONALES ---
  national_id: emptyStringToNull.pipe(z.string().nullable()),
  gender: emptyStringToNull.pipe(z.enum(['Male', 'Female', 'Other']).nullable()),
  
  // SOLUCIÓN: Usamos el preprocesador para convertir "" a null ANTES de validar la fecha.
  birth_date: emptyStringToNull.pipe(z.string().nullable()),
  date_joined_agency: emptyStringToNull.pipe(z.string().nullable()),

  country: emptyStringToNull.pipe(z.string().nullable()),
  
  height_cm: emptyStringToNull.pipe(z.coerce.number().int().positive().nullable()),
  shoulders_cm: emptyStringToNull.pipe(z.coerce.number().int().positive().nullable()),
  chest_cm: emptyStringToNull.pipe(z.coerce.number().int().positive().nullable()),
  bust_cm: emptyStringToNull.pipe(z.coerce.number().int().positive().nullable()),
  waist_cm: emptyStringToNull.pipe(z.coerce.number().int().positive().nullable()),
  hips_cm: emptyStringToNull.pipe(z.coerce.number().int().positive().nullable()),
  shoe_size_eu: emptyStringToNull.pipe(z.coerce.number().int().positive().nullable()),
  pants_size: emptyStringToNull.pipe(z.coerce.number().int().positive().nullable()),
  
  top_size: emptyStringToNull.pipe(z.string().nullable()),
  eye_color: emptyStringToNull.pipe(z.string().nullable()),
  hair_color: emptyStringToNull.pipe(z.string().nullable()),
  
  instagram: emptyStringToNull.pipe(z.string().nullable()),
  tiktok: emptyStringToNull.pipe(z.string().nullable()),

  email: emptyStringToNull.pipe(z.string().email("El formato del email no es válido.").nullable()),
  phone_number: emptyStringToNull.pipe(z.string().regex(phoneRegex, "El teléfono debe empezar con + y solo contener números.").nullable()),

  status: z.enum(['active', 'inactive', 'archived']).default('active'),
});

export type ModelFormData = z.infer<typeof modelFormSchema>;