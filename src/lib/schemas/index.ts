import { z } from 'zod';

// Expresión regular para validar tallas como "S" o "S - M"
const alphaSizeRegex = /^(XXS|XS|S|M|L|XL|XXL)( - (XXS|XS|S|M|L|XL|XXL))?$/i;

// Nuevo esquema para el formulario, "a prueba de monos"
export const modelFormSchema = z.object({
  alias: z.string().optional(),
  full_name: z.string().min(3, { message: "El nombre completo es requerido." }),
  
  // Usamos un tipo 'enum' para el género para forzar las opciones correctas
  gender: z.enum(['Male', 'Female', 'Non-binary'], {
    required_error: "Debes seleccionar un género.",
  }),

  birth_date: z.string().optional().or(z.literal('')),
  national_id: z.string()
    .length(13, { message: "El DPI debe tener exactamente 13 dígitos." })
    .regex(/^\d+$/, { message: "El DPI solo puede contener números." })
    .optional().or(z.literal('')),
  
  phone_e164: z.string()
    .startsWith('+', { message: "Debe empezar con + (ej: +502...)." })
    .optional().or(z.literal('')),
    
  email: z.string().email({ message: "El formato del email es inválido." }).optional().or(z.literal('')),

  // Medidas
  height_m: z.coerce.number({ invalid_type_error: "Debe ser un número." }).positive().optional().or(z.literal('')),
  shoulders_cm: z.coerce.number({ invalid_type_error: "Debe ser un número." }).positive().optional().or(z.literal('')),
  // Busto y Pecho son opcionales porque se mostrarán condicionalmente
  chest_cm: z.coerce.number({ invalid_type_error: "Debe ser un número." }).positive().optional().or(z.literal('')),
  bust_cm: z.coerce.number({ invalid_type_error: "Debe ser un número." }).positive().optional().or(z.literal('')),
  waist_cm: z.coerce.number({ invalid_type_error: "Debe ser un número." }).positive().optional().or(z.literal('')),
  hip_cm: z.coerce.number({ invalid_type_error: "Debe ser un número." }).positive().optional().or(z.literal('')),
  
  // Tallas
  top_size: z.string().toUpperCase().regex(alphaSizeRegex, { message: "Formato inválido. Ej: S o S - M" }).optional().or(z.literal('')),
  pants_size: z.string().optional(),
  shoe_size: z.string().optional(),

  // Redes Sociales
  instagram: z.string().optional(),
  tiktok: z.string().optional(),
  
  // Campos de Agencia
  status: z.enum(['Active', 'Inactive', 'In review']),
  eye_color: z.string().optional(),
  hair_color: z.string().optional(),
});

export type ModelFormData = z.infer<typeof modelFormSchema>;

