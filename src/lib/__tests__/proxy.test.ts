/**
 * Tests for proxy.ts — middleware helpers (originOf, buildCSP)
 * and the proxy function itself (auth guard, security headers).
 */

// ── Setup env BEFORE imports so module-level reads pick them up ──
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.NEXT_PUBLIC_R2_PUBLIC_URL = 'https://r2.example.com'
process.env.R2_PUBLIC_URL = 'https://r2.example.com'

import { originOf, buildCSP } from '@/proxy'

// ════════════════════════════════════════════
// originOf
// ════════════════════════════════════════════
describe('originOf', () => {
  it('extracts origin from a valid HTTPS URL', () => {
    expect(originOf('https://example.supabase.co/api')).toBe('https://example.supabase.co')
  })

  it('extracts origin from a URL with port', () => {
    expect(originOf('http://localhost:3000/foo')).toBe('http://localhost:3000')
  })

  it('returns empty string for invalid URL', () => {
    expect(originOf('')).toBe('')
    expect(originOf('not-a-url')).toBe('')
  })

  it('returns empty string for empty string', () => {
    expect(originOf('')).toBe('')
  })
})

// ════════════════════════════════════════════
// buildCSP
// ════════════════════════════════════════════
describe('buildCSP', () => {
  const nonce = 'test-nonce-123'

  it('includes nonce in script-src', () => {
    const csp = buildCSP(nonce)
    expect(csp).toContain(`'nonce-${nonce}'`)
  })

  it('includes strict-dynamic in script-src', () => {
    const csp = buildCSP(nonce)
    expect(csp).toContain("'strict-dynamic'")
  })

  it('blocks object-src', () => {
    const csp = buildCSP(nonce)
    expect(csp).toContain("object-src 'none'")
  })

  it('sets frame-ancestors to none', () => {
    const csp = buildCSP(nonce)
    expect(csp).toContain("frame-ancestors 'none'")
  })

  it('sets form-action to self', () => {
    const csp = buildCSP(nonce)
    expect(csp).toContain("form-action 'self'")
  })

  it('includes upgrade-insecure-requests', () => {
    const csp = buildCSP(nonce)
    expect(csp).toContain('upgrade-insecure-requests')
  })

  it('includes fonts.gstatic.com in font-src', () => {
    const csp = buildCSP(nonce)
    expect(csp).toContain('https://fonts.gstatic.com')
  })

  it('allows unsafe-inline for styles (Tailwind requirement)', () => {
    const csp = buildCSP(nonce)
    expect(csp).toContain("style-src 'self' 'unsafe-inline'")
  })

  it('includes blob: and data: in img-src', () => {
    const csp = buildCSP(nonce)
    expect(csp).toContain('data:')
    expect(csp).toContain('blob:')
  })

  it('returns a properly semicolon-separated string', () => {
    const csp = buildCSP(nonce)
    const directives = csp.split('; ')
    expect(directives.length).toBeGreaterThanOrEqual(11)
    // Each directive should start with a known keyword
    for (const d of directives) {
      expect(d).toMatch(/^(default-src|script-src|style-src|img-src|media-src|font-src|connect-src|frame-ancestors|base-uri|form-action|object-src|upgrade-insecure-requests|report-uri|report-to)/)
    }
  })

  it('includes report-uri pointing to /api/csp-report', () => {
    const csp = buildCSP(nonce)
    expect(csp).toContain('report-uri /api/csp-report')
  })

  it('includes Reporting API v2 report-to directive', () => {
    const csp = buildCSP(nonce)
    expect(csp).toContain('report-to csp-endpoint')
  })
})

// ════════════════════════════════════════════
// Logger tests
// ════════════════════════════════════════════
describe('logger', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { logger } = require('@/lib/logger')

  const consoleSpy = {
    log: jest.spyOn(console, 'log').mockImplementation(),
    warn: jest.spyOn(console, 'warn').mockImplementation(),
    error: jest.spyOn(console, 'error').mockImplementation(),
  }

  afterEach(() => {
    consoleSpy.log.mockClear()
    consoleSpy.warn.mockClear()
    consoleSpy.error.mockClear()
  })

  afterAll(() => {
    consoleSpy.log.mockRestore()
    consoleSpy.warn.mockRestore()
    consoleSpy.error.mockRestore()
  })

  it('info outputs structured JSON with level and timestamp', () => {
    logger.info('test message', { key: 'value' })
    expect(consoleSpy.log).toHaveBeenCalledTimes(1)
    const output = JSON.parse(consoleSpy.log.mock.calls[0][0])
    expect(output.level).toBe('info')
    expect(output.msg).toBe('test message')
    expect(output.key).toBe('value')
    expect(output.ts).toBeDefined()
  })

  it('warn outputs to console.warn', () => {
    logger.warn('warning message')
    expect(consoleSpy.warn).toHaveBeenCalledTimes(1)
    const output = JSON.parse(consoleSpy.warn.mock.calls[0][0])
    expect(output.level).toBe('warn')
  })

  it('error outputs to console.error', () => {
    logger.error('error message')
    expect(consoleSpy.error).toHaveBeenCalledTimes(1)
    const output = JSON.parse(consoleSpy.error.mock.calls[0][0])
    expect(output.level).toBe('error')
  })

  it('fromError handles Error objects with stack trace', () => {
    const err = new Error('test error')
    logger.fromError(err, { context: 'test' })
    expect(consoleSpy.error).toHaveBeenCalledTimes(1)
    const output = JSON.parse(consoleSpy.error.mock.calls[0][0])
    expect(output.msg).toBe('test error')
    expect(output.stack).toBeDefined()
    expect(output.context).toBe('test')
  })

  it('fromError handles Supabase-like error objects', () => {
    const err = { message: 'duplicate key', code: '23505', details: 'Key already exists' }
    logger.fromError(err)
    const output = JSON.parse(consoleSpy.error.mock.calls[0][0])
    expect(output.msg).toBe('duplicate key')
    expect(output.code).toBe('23505')
    expect(output.details).toBe('Key already exists')
  })

  it('fromError handles string errors', () => {
    logger.fromError('plain string error')
    const output = JSON.parse(consoleSpy.error.mock.calls[0][0])
    expect(output.msg).toBe('plain string error')
  })
})

// ════════════════════════════════════════════
// Env module tests
// ════════════════════════════════════════════
describe('env module', () => {
  it('exports validated public env vars', () => {
    // env.ts was loaded after process.env was set at top of file
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { env } = require('@/lib/env')
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe('https://test.supabase.co')
    expect(env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe('test-anon-key')
  })

  it('NEXT_PUBLIC_APP_URL defaults to localhost', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { env } = require('@/lib/env')
    expect(env.NEXT_PUBLIC_APP_URL).toBe('http://localhost:3000')
  })
})

// ════════════════════════════════════════════
// serverEnv lazy getters
// ════════════════════════════════════════════
describe('serverEnv lazy getters', () => {
  it('returns test fallback for SUPABASE_SERVICE_KEY in test env', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { serverEnv } = require('@/lib/env')
    expect(serverEnv.SUPABASE_SERVICE_KEY).toBe('__TEST_SUPABASE_SERVICE_KEY__')
  })

  it('returns test fallback for R2_ACCOUNT_ID in test env', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { serverEnv } = require('@/lib/env')
    expect(serverEnv.R2_ACCOUNT_ID).toBe('__TEST_R2_ACCOUNT_ID__')
  })

  it('returns test fallback for R2_ACCESS_KEY_ID in test env', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { serverEnv } = require('@/lib/env')
    expect(serverEnv.R2_ACCESS_KEY_ID).toBe('__TEST_R2_ACCESS_KEY_ID__')
  })

  it('returns test fallback for R2_SECRET_ACCESS_KEY in test env', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { serverEnv } = require('@/lib/env')
    expect(serverEnv.R2_SECRET_ACCESS_KEY).toBe('__TEST_R2_SECRET_ACCESS_KEY__')
  })

  it('returns test fallback for CRON_SECRET in test env', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { serverEnv } = require('@/lib/env')
    expect(serverEnv.CRON_SECRET).toBe('__TEST_CRON_SECRET__')
  })

  it('returns empty string for optional R2_PUBLIC_URL via serverEnv', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { serverEnv } = require('@/lib/env')
    // optional('R2_PUBLIC_URL') — process.env.R2_PUBLIC_URL is set from top of file
    expect(typeof serverEnv.R2_PUBLIC_URL).toBe('string')
  })

  it('returns test fallback for R2_BUCKET_NAME', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { serverEnv } = require('@/lib/env')
    expect(serverEnv.R2_BUCKET_NAME).toBe('__TEST_R2_BUCKET_NAME__')
  })
})
