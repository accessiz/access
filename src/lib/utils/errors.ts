import { logger } from '@/lib/logger'

type LogContext = Record<string, unknown>;

export function makeError(message: string, code?: string) {
  return { message, code };
}

/** Log an error with structured JSON output. Delegates to the centralized logger. */
export function logError(err: unknown, context: LogContext = {}) {
  logger.fromError(err, context);
}

/** Log an informational message with structured JSON output. */
export function logInfo(message: string, context: LogContext = {}) {
  logger.info(message, context);
}

const errorUtils = { makeError, logError, logInfo };
export default errorUtils;