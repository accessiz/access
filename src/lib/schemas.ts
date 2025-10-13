
import { z } from 'zod';

// Regex para nombres: permite letras (incluyendo acentos), espacios y apóstrofes.
const nameRegex = /^[\p{L}'\s]+$/u;
// Regex para teléfono: exige un '+' al inicio, seguido de 7 a 15 dígitos.
const phoneRegex = /^\+\d{7,15}$/;

export const modelFormSchema = z.object({
  // Reglas para nombres y alias (sin cambios, ya eran correctas)
  alias: z.string()
    .min(2, "El alias debe tener al menos 2 caracteres.")
    .regex(nameRegex, "El alias solo puede contener letras y espacios."),
  full_name: z.string()
    .min(3, "El nombre completo es obligatorio.")
    .regex(nameRegex, "El nombre solo puede contener letras y espacios."),

  national_id: z.string().optional().nullable(),
  gender: z.enum(['Male', 'Female', 'Other']).nullable(),
  birth_date: z.string().optional().nullable(),
  country: z.string().nullable(),

  // Campos numéricos forzados a ser enteros
  height_cm: z.number({ coerce: true, invalid_type_error: "Debe ser un número." }).int("Debe ser un número entero.").positive("Debe ser un número positivo.").nullable(),
  shoulders_cm: z.number({ coerce: true, invalid_type_error: "Debe ser un número." }).int("Debe ser un número entero.").positive("Debe ser un número positivo.").nullable(),
  chest_cm: z.number({ coerce: true, invalid_type_error: "Debe ser un número." }).int("Debe ser un número entero.").positive("Debe ser un número positivo.").nullable(),
  bust_cm: z.number({ coerce: true, invalid_type_error: "Debe ser un número." }).int("Debe ser un número entero.").positive("Debe ser un número positivo.").nullable(),
  waist_cm: z.number({ coerce: true, invalid_type_error: "Debe ser un número." }).int("Debe ser un número entero.").positive("Debe ser un número positivo.").nullable(),
  hips_cm: z.number({ coerce: true, invalid_type_error: "Debe ser un número." }).int("Debe ser un número entero.").positive("Debe ser un número positivo.").nullable(),
  shoe_size_eu: z.number({ coerce: true, invalid_type_error: "Debe ser un número." }).int("Debe ser un número entero.").positive("Debe ser un número positivo.").nullable(),

  // --- INICIO DE LA MODIFICACIÓN ---
  // 'pants_size' ahora es también un campo numérico entero.
  pants_size: z.number({ coerce: true, invalid_type_error: "Debe ser un número." }).int("Debe ser un número entero.").positive("Debe ser un número positivo.").nullable(),
  // --- FIN DE LA MODIFICACIÓN ---

  top_size: z.string().nullable(),
  eye_color: z.string().nullable(),
  hair_color: z.string().nullable(),
  instagram: z.string().optional().nullable(),
  tiktok: z.string().optional().nullable(),

  email: z.string().email("El formato del email no es válido.").optional().or(z.literal('')).nullable(),
  phone_number: z.string()
    .regex(phoneRegex, "El teléfono debe empezar con + y solo contener números (ej: +50212345678).")
    .optional().or(z.literal('')).nullable(),

  status: z.enum(['active', 'inactive', 'archived']).default('active'),
  date_joined_agency: z.string().optional().nullable(),
});

export type ModelFormData = z.infer<typeof modelFormSchema>;
