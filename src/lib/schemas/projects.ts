import { z } from 'zod';

const timeRegex = /^(0[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/;

// Helper para convertir hora 12h a minutos totales para comparación
const timeToMinutes = (timeStr: string) => {
  const [time, period] = timeStr.split(' ');
  let [hours, minutes] = time.split(':').map(Number);

  if (period === 'PM' && hours < 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  return hours * 60 + minutes;
};

const scheduleItemSchema = z.object({
  date: z.string().min(1, 'La fecha es obligatoria.'),
  startTime: z.string().regex(timeRegex, 'La hora de inicio no es válida (ej: 09:00 AM).'),
  endTime: z.string().regex(timeRegex, 'La hora de fin no es válida (ej: 05:00 PM).'),
}).refine(data => timeToMinutes(data.startTime) < timeToMinutes(data.endTime), {
  message: 'La hora de fin debe ser posterior a la de inicio.',
  path: ['endTime'],
});

export const projectFormSchema = z.object({
  project_name: z.string().min(3, "El nombre del proyecto es obligatorio."),
  client_name: z.string().optional().nullable(),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres.").optional().or(z.literal('')),
  schedule: z.array(scheduleItemSchema).min(1, 'Debes añadir al menos un horario.'),
});

export type ProjectFormData = z.infer<typeof projectFormSchema>;

