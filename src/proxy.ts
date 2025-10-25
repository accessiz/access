import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  // Creamos una respuesta inicial que podemos modificar
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Creamos un cliente de Supabase específico para el proxy
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // Si se establece una cookie, la añadimos tanto a la petición
          // como a la respuesta final
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          // Si se elimina una cookie, hacemos lo mismo
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // Refresca la sesión del usuario si es necesario
  await supabase.auth.getUser()

  return response
}

// Configuración para que el proxy se ejecute en todas las rutas
// excepto en las de archivos estáticos.
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
