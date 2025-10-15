import { z } from 'zod';

// Esquema de validación para el formulario de creación de proyectos.
export const projectFormSchema = z.object({
  project_name: z.string().min(3, "El nombre del proyecto es obligatorio."),
  client_name: z.string().optional(),
  description: z.string().optional(),
  
  // La contraseña es opcional, pero si se escribe, debe tener al menos 6 caracteres.
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres.").optional().or(z.literal('')),
});

export type ProjectFormData = z.infer<typeof projectFormSchema>;
