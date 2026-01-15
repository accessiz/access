import { z } from 'zod';

// Regex para nombres: permite letras (incluyendo acentos), espacios y apóstrofes.
const nameRegex = /^[\p{L}'\s]+$/u;
// Regex para teléfono: exige un '+' al inicio, seguido de 7 a 15 dígitos.
const phoneRegex = /^\+\d{7,15}$/;

/**
 * Preprocesador para transformar valores "vacíos" (undefined, null, o strings vacíos) a null.
 * Además, limpia espacios extra en strings.
 */
const emptyToNull = (val: unknown) => {
  if (val === undefined || val === null) return null;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    return trimmed === '' ? null : trimmed;
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
  z.coerce.number().positive("El valor debe ser un número positivo.").nullable()
);

// Lista de tallas US para el dropdown: desde 3.5 hasta 15 en incrementos de 0.5
const usShoeSizes: number[] = Array.from(
  { length: Math.round((15 - 3.5) / 0.5) + 1 },
  (_, i) => Number((3.5 + i * 0.5).toFixed(1))
);

// Esquema para talla US: normaliza y valida
const optionalUSSize = z.preprocess((val) => {
  // empty -> null
  if (val === undefined || val === null || (typeof val === 'string' && val.trim() === '')) {
    return null;
  }

  // Try to parse number-like values
  const num = Number(val);
  if (Number.isNaN(num)) return val; // deja que Zod lo invalide

  // Round to one decimal (e.g., 4 -> 4.0)
  return Number(num.toFixed(1));
}, z.union([
  z.number().refine((v) => {
    return usShoeSizes.includes(v);
  }, { message: 'Selecciona una talla válida (US).' }),
  z.null()
]));

// Esquema para un campo enum opcional
const optionalEnum = <T extends [string, ...string[]]>(values: T) =>
  z.preprocess(emptyToNull, z.enum(values).nullable());

// ------------------------------------------------------
// 📋 Esquema principal
// ------------------------------------------------------

export const modelFormSchema = z.object({
  // --- CAMPOS OBLIGATORIOS ---
  full_name: z.string().min(3, "El nombre completo es obligatorio. Ej: Juan Pérez"),

  // Teléfono: preprocess para limpiar formato visual (espacios, guiones, paréntesis)
  // y convertir a formato E.164 puro antes de validar. AHORA ES OPCIONAL.
  phone_e164: z.preprocess((val) => {
    if (val === undefined || val === null) return null;
    if (typeof val === 'string') {
      // Eliminar espacios, guiones, paréntesis y otros caracteres de formato
      const cleaned = val.replace(/[\s\-\(\)\.]/g, '');
      // Si queda vacío después de limpiar, devolver null
      if (cleaned === '' || cleaned === '+') return null;
      return cleaned;
    }
    return val;
  }, z.union([
    z.string().regex(phoneRegex, "Ingresa el teléfono en formato internacional, por ejemplo: +50212345678"),
    z.null()
  ])),

  // --- CAMPOS OPCIONALES ---

  // Email ahora es opcional (se movió aquí y usa preprocess)
  email: z.preprocess(
    emptyToNull,
    z.string().email("El formato del correo no es válido. Ej: usuario@dominio.com").nullable()
  ),

  alias: optionalStringWithRegex(nameRegex, "El alias solo puede contener letras, espacios y apóstrofes. Ej: Ana María"),
  national_id: optionalString,
  passport_number: optionalString,
  gender: optionalEnum(['Male', 'Female']),
  birth_date: optionalString,
  date_joined_agency: optionalString,
  country: optionalString,
  birth_country: optionalString,

  // Medidas y Tallas (todos opcionales)
  height_cm: optionalPositiveNumber,
  shoulders_cm: optionalPositiveNumber,
  chest_cm: optionalPositiveNumber,
  bust_cm: optionalPositiveNumber,
  waist_cm: optionalPositiveNumber,
  hips_cm: optionalPositiveNumber,
  shoe_size_us: optionalUSSize,
  pants_size: z.preprocess((val) => {
    // Convert string to number for database compatibility
    if (val === undefined || val === null || (typeof val === 'string' && val.trim() === '')) {
      return null;
    }
    if (typeof val === 'string') {
      const num = parseInt(val, 10);
      return isNaN(num) ? null : num;
    }
    return val;
  }, z.number().positive().nullable()),

  top_size: optionalString,
  eye_color: optionalString,
  hair_color: optionalString,

  // Redes y Estado (opcionales)
  instagram: optionalString,
  tiktok: optionalString,
  status: z.enum(['active', 'inactive', 'archived']).default('active'),
});

export type ModelFormData = z.infer<typeof modelFormSchema>;