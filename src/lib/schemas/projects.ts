import { z } from 'zod';

const timeRegex = /^(0[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/;

// Helper para convertir hora 12h a minutos totales para comparación
const timeToMinutes = (timeStr: string) => {
  const [time, period] = timeStr.split(' ');
  const [hoursStr, minutesStr] = time.split(':');
  let hours = Number(hoursStr);
  const minutes = Number(minutesStr);

  if (period === 'PM' && hours < 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  return hours * 60 + minutes;
};

const scheduleItemSchema = z.object({
  date: z.string().min(1, 'La fecha es obligatoria.'),
  startTime: z.string().regex(timeRegex, 'La hora de inicio no es válida (ej: 09:00 AM).'),
  endTime: z.string().regex(timeRegex, 'La hora de fin no es válida (ej: 05:00 PM).'),
}).refine(data => {
  const startMinutes = timeToMinutes(data.startTime);
  const endMinutes = timeToMinutes(data.endTime);

  // Si endTime < startTime, asumimos que cruza medianoche (ej: 08:00 PM a 02:00 AM)
  // Esto es válido para producciones nocturnas
  // Solo rechazamos si son exactamente iguales
  return startMinutes !== endMinutes;
}, {
  message: 'La hora de inicio y fin no pueden ser iguales.',
  path: ['endTime'],
});

export const projectFormSchema = z.object({
  // project_name ahora es OPCIONAL - se genera automáticamente si está vacío
  project_name: z.string().optional().nullable(),
  client_name: z.string().optional().nullable(),
  // Nuevos campos para clientes y marcas registrados
  client_id: z.string().uuid().optional().nullable(),
  brand_id: z.string().uuid().optional().nullable(),
  // Array de tipos de proyecto (máximo 2, al menos 1 obligatorio)
  project_types: z.array(z.enum([
    'photoshoot',
    'tv_commercial',
    'ecommerce',
    'runway',
    'social_media',
    'cinema',
    'editorial',
    'music_video',
    'activation',
  ])).min(1, 'Selecciona al menos un tipo de proyecto.').max(2, 'Máximo 2 tipos por proyecto.'),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres.").optional().or(z.literal('')),
  schedule: z.array(scheduleItemSchema).min(1, 'Debes añadir al menos un horario.'),
  // Campos de tarifa
  default_model_fee: z.coerce.number().min(0, "La tarifa debe ser mayor o igual a 0.").optional().nullable(),
  default_fee_type: z.enum(['per_day', 'per_hour', 'fixed']).optional().nullable(),
  currency: z.enum(['GTQ', 'USD', 'EUR', 'MXN', 'COP', 'PEN', 'ARS', 'CLP', 'BRL']).optional().nullable(),
});

export type ProjectFormData = z.infer<typeof projectFormSchema>;

