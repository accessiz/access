type LogContext = Record<string, unknown>;

export function makeError(message: string, code?: string) {
  return { message, code };
}

export function logError(err: unknown, context: LogContext = {}) {
  // In production, you might wire this to an external service. For now, keep structured output.
  if (err instanceof Error) {
    console.error(JSON.stringify({ msg: err.message, stack: err.stack, ...context }));
  } else if (err && typeof err === 'object' && 'message' in err) {
    // Handle Supabase PostgrestError and other error-like objects with a message property
    const errorObj = err as { message: string; code?: string; details?: string; hint?: string };
    console.error(JSON.stringify({ 
      msg: errorObj.message, 
      code: errorObj.code,
      details: errorObj.details,
      hint: errorObj.hint,
      ...context 
    }));
  } else {
    console.error(JSON.stringify({ msg: String(err), ...context }));
  }
}

export function logInfo(message: string, context: LogContext = {}) {
  console.log(JSON.stringify({ msg: message, ...context }));
}

// CORRECCIÓN: Asignar a una variable antes de exportar por defecto
const errorUtils = { makeError, logError, logInfo };
export default errorUtils;