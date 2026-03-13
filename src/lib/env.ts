/**
 * Runtime environment variable validation.
 *
 * Validated once at module-load. Fails fast with a clear error message
 * instead of crashing deep in business logic with a non-null assertion.
 *
 * Usage:
 *   import { env } from '@/lib/env'
 *   env.NEXT_PUBLIC_SUPABASE_URL  // ✓ typed, guaranteed non-empty
 */

const isTest = process.env.NODE_ENV === 'test' || !!process.env.JEST_WORKER_ID

function required(key: string): string {
  const value = process.env[key]
  if (!value) {
    if (isTest) return `__TEST_${key}__`
    throw new Error(
      `[env] Missing required environment variable: ${key}. ` +
      `Check your .env.local or deployment environment.`
    )
  }
  return value
}

function optional(key: string, fallback = ''): string {
  return process.env[key] ?? fallback
}

// ── Public (available in client bundles) ──
// IMPORTANT: NEXT_PUBLIC_* vars MUST be referenced statically as
// `process.env.NEXT_PUBLIC_XXX` (not via dynamic key lookup) so that
// Next.js can inline them into the client bundle at build time.
export const env = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? (() => {
    if (isTest) return '__TEST_NEXT_PUBLIC_SUPABASE_URL__'
    throw new Error('[env] Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL. Check your .env.local or deployment environment.')
  })(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? (() => {
    if (isTest) return '__TEST_NEXT_PUBLIC_SUPABASE_ANON_KEY__'
    throw new Error('[env] Missing required environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY. Check your .env.local or deployment environment.')
  })(),
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  NEXT_PUBLIC_R2_PUBLIC_URL: process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? '',
} as const

// ── Server-only (never exposed to client) ──
// Lazy getters: only validated when accessed, so client code doesn't blow up.
export const serverEnv = {
  get SUPABASE_SERVICE_KEY() { return required('SUPABASE_SERVICE_KEY') },
  get R2_ACCOUNT_ID() { return required('R2_ACCOUNT_ID') },
  get R2_ACCESS_KEY_ID() { return required('R2_ACCESS_KEY_ID') },
  get R2_SECRET_ACCESS_KEY() { return required('R2_SECRET_ACCESS_KEY') },
  get R2_BUCKET_NAME() { return required('R2_BUCKET_NAME') },
  get R2_PUBLIC_URL() { return optional('R2_PUBLIC_URL') },
  get CRON_SECRET() { return required('CRON_SECRET') },
} as const
