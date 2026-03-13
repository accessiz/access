/**
 * Tests for the proxy() function itself (auth guard, security headers, cookies).
 * Separate file so we can mock @supabase/ssr before importing proxy.
 */

process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.NEXT_PUBLIC_R2_PUBLIC_URL = 'https://r2.example.com'
process.env.R2_PUBLIC_URL = 'https://r2.example.com'

// ── Mocks (before imports) ──

const mockGetUser = jest.fn()

jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn((_url: string, _key: string, opts: { cookies: Record<string, unknown> }) => {
    // Keep reference to cookie handlers so proxy's set/remove can run
    cookieHandlers = opts.cookies as {
      get: (name: string) => string | undefined
      set: (name: string, value: string, options: Record<string, unknown>) => void
      remove: (name: string, options: Record<string, unknown>) => void
    }
    return { auth: { getUser: mockGetUser } }
  }),
}))

let cookieHandlers: {
  get: (name: string) => string | undefined
  set: (name: string, value: string, options: Record<string, unknown>) => void
  remove: (name: string, options: Record<string, unknown>) => void
}

// Minimal NextRequest / NextResponse mock
const mockNextFn = jest.fn()
const mockRedirect = jest.fn()
const responseHeaders = new Map<string, string>()
const responseCookies = { set: jest.fn() }

jest.mock('next/server', () => {
  const RealHeaders = global.Headers
  return {
    NextResponse: {
      next: jest.fn((_opts?: unknown) => {
        const res = {
          headers: {
            set: (k: string, v: string) => responseHeaders.set(k, v),
            get: (k: string) => responseHeaders.get(k),
          },
          cookies: responseCookies,
        }
        mockNextFn()
        return res
      }),
      redirect: jest.fn((url: URL) => {
        mockRedirect(url)
        return {
          headers: {
            set: (k: string, v: string) => responseHeaders.set(k, v),
            get: (k: string) => responseHeaders.get(k),
          },
          cookies: responseCookies,
        }
      }),
    },
    // Re-export real Headers so requestHeaders work
    Headers: RealHeaders,
  }
})

// Now import the module under test
import { proxy, config } from '@/proxy'

// ── Helpers ──

function createMockRequest(pathname: string) {
  const url = `https://myapp.com${pathname}`
  const cookieStore = new Map<string, { name: string; value: string }>()

  return {
    headers: new Headers(),
    cookies: {
      get(name: string) { return cookieStore.get(name) },
      set(obj: { name: string; value: string }) { cookieStore.set(obj.name, obj) },
    },
    url,
    nextUrl: {
      pathname,
      clone: () => {
        const cloned = new URL(url)
        // Use defineProperty to create a proper getter/setter for pathname
        const obj = { searchParams: cloned.searchParams }
        Object.defineProperty(obj, 'pathname', {
          get() { return cloned.pathname },
          set(v: string) { cloned.pathname = v },
          enumerable: true,
          configurable: true,
        })
        return obj
      },
    },
  } as unknown as Parameters<typeof proxy>[0]
}

// ── Tests ──

describe('proxy() function', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    responseHeaders.clear()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
  })

  it('sets x-nonce header on requests', async () => {
    const req = createMockRequest('/dashboard')
    await proxy(req)
    expect(mockNextFn).toHaveBeenCalled()
  })

  it('sets all OWASP security headers', async () => {
    const req = createMockRequest('/dashboard')
    await proxy(req)
    expect(responseHeaders.get('Content-Security-Policy')).toBeTruthy()
    expect(responseHeaders.get('Strict-Transport-Security')).toBe(
      'max-age=63072000; includeSubDomains; preload'
    )
    expect(responseHeaders.get('X-Content-Type-Options')).toBe('nosniff')
    expect(responseHeaders.get('X-Frame-Options')).toBe('DENY')
    expect(responseHeaders.get('X-DNS-Prefetch-Control')).toBe('on')
    expect(responseHeaders.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin')
    expect(responseHeaders.get('Permissions-Policy')).toContain('camera=()')
  })

  it('sets Report-To and Reporting-Endpoints headers', async () => {
    const req = createMockRequest('/dashboard')
    await proxy(req)
    const reportTo = responseHeaders.get('Report-To')
    expect(reportTo).toBeTruthy()
    expect(JSON.parse(reportTo!).group).toBe('csp-endpoint')
    expect(responseHeaders.get('Reporting-Endpoints')).toContain('csp-endpoint')
  })

  // ── Auth guard: public routes ──

  it.each([
    '/login',
    '/',
    '/auth/callback',
    '/c/some-model',
    '/api/cron/close-projects',
    '/api/health',
    '/api/csp-report',
  ])('allows unauthenticated access to public route %s', async (path) => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    await proxy(createMockRequest(path))
    expect(mockRedirect).not.toHaveBeenCalled()
    expect(mockNextFn).toHaveBeenCalled()
  })

  // ── Auth guard: protected routes ──

  it.each([
    '/dashboard',
    '/dashboard/models',
    '/dashboard/projects/some-id',
    '/api/alerts/dismiss',
  ])('redirects unauthenticated user from protected route %s to /login', async (path) => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    await proxy(createMockRequest(path))
    expect(mockRedirect).toHaveBeenCalled()
    const redirectArg = mockRedirect.mock.calls[0][0]
    expect(redirectArg.pathname).toBe('/login')
    expect(redirectArg.searchParams.get('next')).toBe(path)
  })

  it('allows authenticated user on protected routes', async () => {
    await proxy(createMockRequest('/dashboard'))
    expect(mockRedirect).not.toHaveBeenCalled()
  })

  // ── Cookie handlers ──

  it('cookie set handler creates a new response with updated cookies', async () => {
    const req = createMockRequest('/dashboard')
    await proxy(req)
    // Trigger the set handler (simulates Supabase refreshing session)
    cookieHandlers.set('sb-token', 'refreshed-value', { path: '/' })
    expect(responseCookies.set).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'sb-token', value: 'refreshed-value' })
    )
  })

  it('cookie remove handler clears the cookie', async () => {
    const req = createMockRequest('/dashboard')
    await proxy(req)
    cookieHandlers.remove('sb-token', { path: '/' })
    expect(responseCookies.set).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'sb-token', value: '' })
    )
  })
})

describe('proxy config', () => {
  it('exports a matcher that excludes static assets', () => {
    expect(config.matcher).toBeDefined()
    expect(config.matcher[0]).toContain('_next/static')
    expect(config.matcher[0]).toContain('favicon.ico')
  })
})
