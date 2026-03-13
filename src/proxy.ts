import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// ── Trusted origins for CSP ──
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? process.env.R2_PUBLIC_URL ?? ''
const IS_DEV = process.env.NODE_ENV === 'development'

/** Extract origin (scheme + host) from a URL string, empty string on failure. */
export function originOf(url: string): string {
  try { return new URL(url).origin } catch { return '' }
}

/** Build a strict Content-Security-Policy header value. */
export function buildCSP(nonce: string): string {
  const supabaseOrigin = originOf(SUPABASE_URL)
  const r2Origin = originOf(R2_PUBLIC_URL)

  // Trusted sources for connect (API calls, realtime, auth)
  const connectSrc = [
    "'self'",
    "data:",
    supabaseOrigin,
    r2Origin,
    // Supabase Realtime uses wss://
    supabaseOrigin.replace('https://', 'wss://'),
    // Turbopack HMR WebSocket in development
    ...(IS_DEV ? ['ws://localhost:3000', 'ws://0.0.0.0:3000'] : []),
  ].filter(Boolean).join(' ')

  // Trusted sources for images
  const imgSrc = [
    "'self'",
    'data:',
    'blob:',
    supabaseOrigin,
    r2Origin,
  ].filter(Boolean).join(' ')

  // Trusted sources for media (video)
  const mediaSrc = [
    "'self'",
    r2Origin,
  ].filter(Boolean).join(' ')

  // In development, Turbopack needs eval() and inline scripts for HMR.
  // In production, we use nonce + strict-dynamic for maximum security.
  const scriptSrc = IS_DEV
    ? `script-src 'self' 'unsafe-eval' 'unsafe-inline'`
    : `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`

  return [
    `default-src 'self'`,
    scriptSrc,
    `style-src 'self' 'unsafe-inline'`, // Tailwind + next-themes inject inline styles
    `img-src ${imgSrc}`,
    `media-src ${mediaSrc}`,
    `font-src 'self' https://fonts.gstatic.com`,
    `connect-src ${connectSrc}`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `object-src 'none'`,
    ...(IS_DEV ? [] : ['upgrade-insecure-requests']),
    `report-uri /api/csp-report`,
    `report-to csp-endpoint`,
  ].join('; ')
}

export async function proxy(request: NextRequest) {
  // ── Generate CSP nonce ──
  const nonce = crypto.randomUUID()
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)

  // Respuesta inicial modificable
  let response = NextResponse.next({
    request: { headers: requestHeaders },
  })

  // ── Supabase session management ──
  const supabase = createServerClient(
    SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: { headers: requestHeaders },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: { headers: requestHeaders },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // Refresca la sesión del usuario si es necesario
  const { data: { user } } = await supabase.auth.getUser()

  // ── Auth guard ──
  // Rutas públicas que no requieren autenticación
  const { pathname } = request.nextUrl
  const isPublicRoute =
    pathname === '/login' ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/c/') ||
    pathname.startsWith('/api/cron') ||
    pathname.startsWith('/api/health') ||
    pathname === '/api/csp-report'

  if (!user && !isPublicRoute) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Si el usuario está autenticado y accede a la raíz (/), redirigir al dashboard
  if (user && pathname === '/') {
    const dashboardUrl = request.nextUrl.clone()
    dashboardUrl.pathname = '/dashboard'
    return NextResponse.redirect(dashboardUrl)
  }

  // ── Security headers (OWASP best practices) ──
  const csp = buildCSP(nonce)
  response.headers.set('Content-Security-Policy', csp)
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-DNS-Prefetch-Control', 'on')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()')

  // Reporting API v2 — browsers that support it will use this over report-uri
  const reportTo = JSON.stringify({
    group: 'csp-endpoint',
    max_age: 86400,
    endpoints: [{ url: '/api/csp-report' }],
  })
  response.headers.set('Report-To', reportTo)
  response.headers.set('Reporting-Endpoints', 'csp-endpoint="/api/csp-report"')

  return response
}

// Matcher: ejecuta en todas las rutas excepto assets estáticos
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images/).*)',
  ],
}