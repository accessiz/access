import { logError } from '@/lib/utils/errors'

// ── Shared types ──

export type ActionState = {
  success: boolean;
  error?: string;
  errors?: Record<string, string>;
  projectId?: string;
};

// Interface para entradas de schedule del FormData
export interface FormDataScheduleEntry {
  date?: FormDataEntryValue | null;
  startTime?: FormDataEntryValue | null;
  endTime?: FormDataEntryValue | null;
}

// Tipos para detección de cambios en schedule
export type ScheduleChangeType = 'added' | 'removed' | 'modified';

export interface ScheduleChange {
  type: ScheduleChangeType;
  oldScheduleId?: string;
  oldDate?: string;
  oldStartTime?: string;
  oldEndTime?: string;
  newDate?: string;
  newStartTime?: string;
  newEndTime?: string;
  assignmentCount?: number;
}

export interface ScheduleAnalysis {
  hasChanges: boolean;
  hasAffectedAssignments: boolean;
  changes: ScheduleChange[];
  totalAffectedAssignments: number;
  newSchedules: { date: string; startTime: string; endTime: string }[];
}

export type MigrationMapping = Record<string, string | 'none' | 'delete'>;
export type MigrationOption = 'migrate' | 'keep' | 'delete';

// ── Helpers ──

export const convertToTimestamp = (date: string, time12h: string) => {
  const [time, period] = time12h.split(' ');
  const [hoursStr, minutesStr] = time.split(':');
  let hours = Number(hoursStr);
  const minutes = Number(minutesStr);

  if (period === 'PM' && hours < 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  return `${date}T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
};

/** Convert a UTC timestamp to 12h format (e.g. "02:30 PM") */
export const timestampTo12h = (timestamp: string) => {
  const date = new Date(timestamp);
  let hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const period = hours >= 12 ? 'PM' : 'AM';

  if (hours > 12) hours -= 12;
  if (hours === 0) hours = 12;

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
};

/** Extract YYYY-MM-DD from a UTC timestamp */
export const extractDateFromTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  const year = date.getUTCFullYear();
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  const day = date.getUTCDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// ── FormData extraction helpers ──

/** Extract schedule entries from FormData keys like schedule.0.date, schedule.0.startTime, etc. */
export function extractScheduleFromFormData(formData: FormData): FormDataScheduleEntry[] {
  return Array.from(formData.keys())
    .filter(key => key.startsWith('schedule.'))
    .reduce((acc, key) => {
      const match = key.match(/schedule\.(\d+)\.(date|startTime|endTime)/);
      if (match) {
        const index = parseInt(match[1], 10);
        const field = match[2];
        if (!acc[index]) acc[index] = {} as FormDataScheduleEntry;
        (acc[index] as Record<string, FormDataEntryValue | null>)[field] = formData.get(key);
      }
      return acc;
    }, [] as FormDataScheduleEntry[]);
}

/** Extract project_types array from FormData keys like project_types[0], project_types[1], etc. */
export function extractProjectTypesFromFormData(formData: FormData): string[] {
  const types: string[] = [];
  Array.from(formData.keys())
    .filter(key => key.startsWith('project_types['))
    .forEach(key => {
      const val = formData.get(key);
      if (val && typeof val === 'string') types.push(val);
    });
  return types;
}

/** Build the raw data object from FormData for Zod validation */
export function buildRawProjectData(
  formData: FormData,
  schedule: FormDataScheduleEntry[],
  projectTypes: string[],
) {
  return {
    project_name: formData.get('project_name'),
    client_name: formData.get('client_name'),
    client_id: formData.get('client_id') || null,
    brand_id: formData.get('brand_id') || null,
    project_types: projectTypes.length > 0 ? projectTypes : null,
    password: formData.get('password'),
    schedule: schedule.filter(entry => entry.date || entry.startTime || entry.endTime),
    default_model_fee: formData.get('default_model_fee') || null,
    default_fee_type: formData.get('default_fee_type') || 'per_day',
    default_model_payment_type: formData.get('default_model_payment_type') || 'cash',
    default_model_trade_category: formData.get('default_model_trade_category') || null,
    default_model_trade_fee: formData.get('default_model_trade_fee') || null,
    default_model_trade_details: formData.get('default_model_trade_details') || null,
    currency: formData.get('currency') || 'GTQ',
    revenue: formData.get('revenue') || null,
    tax_percentage: formData.get('tax_percentage') || 12,
    client_payment_status: formData.get('client_payment_status') || 'pending',
    client_payment_type: formData.get('client_payment_type') || 'cash',
    client_trade_category: formData.get('client_trade_category') || null,
    client_trade_revenue: formData.get('client_trade_revenue') || null,
    client_trade_details: formData.get('client_trade_details') || null,
    invoice_number: formData.get('invoice_number') || null,
    invoice_date: formData.get('invoice_date') || null,
  };
}

/** Format Zod validation errors with schedule-aware context */
export function formatZodErrors(
  zodErrors: { path: PropertyKey[]; message: string }[],
  schedule: FormDataScheduleEntry[],
): Record<string, string> {
  const errorMessages: Record<string, string> = {};

  for (const err of zodErrors) {
    const path = err.path.join('.');

    if (path.startsWith('schedule.') && schedule.length) {
      const match = path.match(/schedule\.(\d+)/);
      if (match) {
        const index = parseInt(match[1]);
        const scheduleItem = schedule[index];
        if (scheduleItem?.date) {
          const fecha = new Date(`${scheduleItem.date}T00:00:00`).toLocaleDateString('es-ES', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
          });
          errorMessages['schedule'] = `Error en la fecha ${fecha}: ${err.message}`;
          continue;
        }
      }
    }

    if (!errorMessages[path]) {
      errorMessages[path] = err.message;
    }
  }

  return errorMessages;
}

/** Re-export logError for convenience inside project actions */
export { logError };
