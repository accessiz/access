/**
 * Structured logging for server-side code.
 *
 * Outputs JSON lines suitable for Vercel Log Drain, Datadog, etc.
 * Adds consistent metadata (timestamp, level, optional correlationId).
 *
 * Usage:
 *   import { logger } from '@/lib/logger'
 *   logger.error('Payment failed', { orderId, amount })
 *   logger.warn('Retry attempt', { attempt: 3 })
 *   logger.info('Model created', { modelId })
 */

type LogLevel = 'info' | 'warn' | 'error'

interface LogPayload {
  level: LogLevel
  msg: string
  ts: string
  [key: string]: unknown
}

type LogContext = Record<string, unknown>

function emit(level: LogLevel, msg: string, context: LogContext = {}) {
  const payload: LogPayload = {
    level,
    msg,
    ts: new Date().toISOString(),
    ...context,
  }

  // JSON structured output — one line per entry
  const line = JSON.stringify(payload)

  switch (level) {
    case 'error':
      console.error(line)
      break
    case 'warn':
      console.warn(line)
      break
    default:
      console.log(line)
  }
}

export const logger = {
  info(msg: string, context?: LogContext) {
    emit('info', msg, context)
  },

  warn(msg: string, context?: LogContext) {
    emit('warn', msg, context)
  },

  error(msg: string, context?: LogContext) {
    emit('error', msg, context)
  },

  /**
   * Log an Error object with stack trace preserved in structured output.
   * Handles Supabase PostgrestError, standard Error, and plain strings.
   */
  fromError(err: unknown, context?: LogContext) {
    if (err instanceof Error) {
      emit('error', err.message, { stack: err.stack, ...context })
    } else if (err && typeof err === 'object' && 'message' in err) {
      const e = err as { message: string; code?: string; details?: string; hint?: string }
      emit('error', e.message, {
        code: e.code,
        details: e.details,
        hint: e.hint,
        ...context,
      })
    } else {
      emit('error', String(err), context)
    }
  },
} as const
