/**
 * Error Tracking — lightweight abstraction layer.
 *
 * By default, errors are logged as structured JSON (Vercel Log Drain compatible).
 * To integrate a third-party service (Sentry, Datadog, etc.):
 *
 *   1. Set `NEXT_PUBLIC_SENTRY_DSN` environment variable.
 *   2. Install `@sentry/nextjs` (npm i @sentry/nextjs).
 *   3. Uncomment the Sentry block below and remove the no-op fallback.
 *
 * All call-sites use `captureException` / `captureMessage` — swapping the
 * backend is a single-file change.
 */

import { logger } from '@/lib/logger';

// ── Types ──

interface ErrorContext {
  /** Free-form key/value tags attached to the error event. */
  tags?: Record<string, string>;
  /** Additional structured data. */
  extra?: Record<string, unknown>;
  /** Severity level. */
  level?: 'fatal' | 'error' | 'warning' | 'info';
  /** Identify the user affected. */
  user?: { id?: string; email?: string };
}

// ── Public API ──

/**
 * Report an exception to the error tracking service.
 */
export function captureException(error: unknown, context: ErrorContext = {}): void {
  // ── Sentry integration (uncomment when @sentry/nextjs is installed) ──
  // import * as Sentry from '@sentry/nextjs';
  // Sentry.captureException(error, {
  //   tags: context.tags,
  //   extra: context.extra,
  //   level: context.level ?? 'error',
  //   user: context.user,
  // });

  // ── Structured-log fallback ──
  logger.fromError(error, {
    ...(context.tags && { tags: context.tags }),
    ...(context.extra && { extra: context.extra }),
    ...(context.level && { level: context.level }),
    ...(context.user && { user: context.user }),
  });
}

/**
 * Report a plain-text message (breadcrumb, warning, etc.).
 */
export function captureMessage(message: string, context: ErrorContext = {}): void {
  // ── Sentry integration ──
  // import * as Sentry from '@sentry/nextjs';
  // Sentry.captureMessage(message, { tags: context.tags, extra: context.extra, level: context.level ?? 'info' });

  const level = context.level ?? 'info';
  const fn = level === 'error' || level === 'fatal' ? logger.error : level === 'warning' ? logger.warn : logger.info;
  fn(message, {
    ...(context.tags && { tags: context.tags }),
    ...(context.extra && { extra: context.extra }),
  });
}

/**
 * Set the current user context for error tracking.
 * Call on login/session refresh. Call with `null` on logout.
 */
export function setUser(user: { id: string; email?: string } | null): void {
  // ── Sentry integration ──
  // import * as Sentry from '@sentry/nextjs';
  // Sentry.setUser(user);

  if (user) {
    logger.info('Error tracking: user context set', { userId: user.id });
  }
}
