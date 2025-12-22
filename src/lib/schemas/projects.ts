import { z } from 'zod';

const timeRegex = /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;

const scheduleItemSchema = z.object({
  date: z.string().min(1, 'La fecha es obligatoria.'),
  startTime: z.string().regex(timeRegex, 'La hora de inicio no es válida.'),
  endTime: z.string().regex(timeRegex, 'La hora de fin no es válida.'),
}).refine(data => data.startTime < data.endTime, {
  message: 'La hora de fin debe ser posterior a la de inicio.',
  path: ['endTime'],
});

export const projectFormSchema = z.object({
  project_name: z.string().min(3, "El nombre del proyecto es obligatorio."),
  client_name: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres.").optional().or(z.literal('')),
  schedule: z.array(scheduleItemSchema).min(1, 'Debes añadir al menos un horario.'),
});

export type ProjectFormData = z.infer<typeof projectFormSchema>;
