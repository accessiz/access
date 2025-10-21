import { ZodError } from 'zod';

// Convierte un ZodError en un objeto { fieldName: message }
export function zodErrorToFieldErrors(err: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  // err.flatten().fieldErrors tiene tipo Record<string, string[] | undefined>
  const flattened = err.flatten().fieldErrors as Record<string, string[] | undefined>;
  for (const key of Object.keys(flattened)) {
    const arr = flattened[key];
    if (Array.isArray(arr) && arr.length > 0) {
      out[key] = arr[0] || 'Valor inválido';
    }
  }
  return out;
}

export default zodErrorToFieldErrors;
