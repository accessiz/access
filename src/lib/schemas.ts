import { z } from 'zod';

// Regex para nombres: permite letras (incluyendo acentos), espacios y apóstrofes.
const nameRegex = /^[\p{L}'\s]+$/u;
// Regex para teléfono: exige un '+' al inicio, seguido de 7 a 15 dígitos.
const phoneRegex = /^\+\d{7,15}$/;

/**
 * Preprocesador para transformar valores "vacíos" (undefined, null, o strings vacíos) a null.
 * Esto es ideal para campos de formulario opcionales. Si el valor no está vacío, lo pasa
 * sin cambios para la siguiente validación.
 */
const emptyToNull = (val: unknown) => {
  if (val === undefined || val === null || (typeof val === 'string' && val.trim() === '')) {
    return null;
  }
  return val;
};

// Esquema para un campo de texto opcional
const optionalString = z.preprocess(emptyToNull, z.string().nullable());
// Esquema para un campo de texto opcional con una regex específica
const optionalStringWithRegex = (regex: RegExp, message: string) => 
  z.preprocess(emptyToNull, z.string().regex(regex, message).nullable());
// Esquema para un campo numérico opcional y positivo
const optionalPositiveNumber = z.preprocess(
  emptyToNull, 
  z.coerce.number().positive("Debe ser un número positivo.").nullable()
);
// Esquema para un campo enum opcional
const optionalEnum = <T extends [string, ...string[]]>(values: T) => 
  z.preprocess(emptyToNull, z.enum(values).nullable());


export const modelFormSchema = z.object({
  // --- CAMPOS OBLIGATORIOS ---
  full_name: z.string().min(3, "El nombre completo es obligatorio."),
  phone_e164: z.string().min(1, "El teléfono es obligatorio.").regex(phoneRegex, "El teléfono debe empezar con + (ej: +502...)."),
  email: z.string().min(1, "El email es obligatorio.").email("El formato del email no es válido."),

  // --- CAMPOS OPCIONALES ---
  alias: optionalStringWithRegex(nameRegex, "El alias solo puede contener letras y espacios."),
  national_id: optionalString,
  gender: optionalEnum(['Male', 'Female', 'Non-binary']),
  birth_date: optionalString,
  date_joined_agency: optionalString,
  country: optionalString,

  // Medidas y Tallas (todos opcionales)
  height_cm: optionalPositiveNumber,
  shoulders_cm: optionalPositiveNumber,
  chest_cm: optionalPositiveNumber,
  bust_cm: optionalPositiveNumber,
  waist_cm: optionalPositiveNumber,
  hips_cm: optionalPositiveNumber,
  shoe_size_eu: optionalPositiveNumber,
  pants_size: optionalPositiveNumber,
  
  top_size: optionalString,
  eye_color: optionalString,
  hair_color: optionalString,

  // Redes y Estado (opcionales)
  instagram: optionalString,
  tiktok: optionalString,
  status: z.enum(['active', 'inactive', 'archived']).default('active'),
});

export type ModelFormData = z.infer<typeof modelFormSchema>;
