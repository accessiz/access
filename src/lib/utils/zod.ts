import { ZodError } from 'zod';

// Convierte un ZodError en un objeto { fieldName: message }
export function zodErrorToFieldErrors(err: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  const flattened: Record<string, string[] | undefined> = err.flatten().fieldErrors as any;
  for (const key of Object.keys(flattened)) {
    const arr = flattened[key];
    if (Array.isArray(arr) && arr.length > 0) {
      out[key] = arr[0] || 'Valor inválido';
    }
  }
  return out;
}

export default zodErrorToFieldErrors;
