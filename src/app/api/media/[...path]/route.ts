import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export const runtime = 'edge';

/**
 * Proxy para servir imágenes de R2 a través del propio dominio.
 *
 * @deprecated Prefer direct R2 URLs (configured in utils.ts).
 * Kept alive only for html-to-image CORS workaround.
 *
 * Security: requires authenticated session (Supabase JWT via cookie).
 * Path traversal: blocks `..` segments and non-media extensions.
 */

const ALLOWED_EXTENSIONS = /\.(jpe?g|png|webp|avif|gif|svg|mp4|pdf)$/i;

export async function GET(
    req: NextRequest,
    props: { params: Promise<{ path: string[] }> }
) {
    try {
        // ─── Auth guard (Edge-compatible) ───
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return req.cookies.get(name)?.value;
                    },
                    set() { /* noop in edge GET */ },
                    remove() { /* noop in edge GET */ },
                },
            }
        );
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const params = await props.params;

        if (!params?.path || !Array.isArray(params.path)) {
            return new NextResponse('Bad Request: Invalid path parameters', { status: 400 });
        }

        // ─── Path traversal protection ───
        if (params.path.some(segment => segment === '..' || segment === '.')) {
            return new NextResponse('Bad Request: Path traversal detected', { status: 400 });
        }

        const path = params.path.join('/');

        // ─── Extension allowlist ───
        if (!ALLOWED_EXTENSIONS.test(path)) {
            return new NextResponse('Forbidden: File type not allowed', { status: 403 });
        }

        // Asegurarse de que R2_PUBLIC_URL esté definido
        const r2BaseUrl = process.env.R2_PUBLIC_URL;
        if (!r2BaseUrl) {
            return new NextResponse('Configuration Error: R2_PUBLIC_URL not defined', { status: 500 });
        }

        // Construir la URL completa al recurso en R2
        // Quitamos slash final de r2BaseUrl si existe para evitar doble slash
        const cleanBaseUrl = r2BaseUrl.replace(/\/$/, '');
        const r2Url = `${cleanBaseUrl}/${path}`;

        // 2. Hacer fetch al recurso original (R2)
        const response = await fetch(r2Url);

        if (!response.ok) {
            return new NextResponse(`Error fetching from R2: ${response.statusText}`, { status: response.status });
        }

        // 3. Preparar los headers para la respuesta proxy
        const newHeaders = new Headers(response.headers);

        const origin = req.headers.get('origin');
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        
        // Determinar si debemos permitir CORS (si coincide con nuestro app host o si es same-origin con origin: null)
        const isAllowedOrigin = origin && appUrl && origin.startsWith(appUrl);
        
        if (isAllowedOrigin) {
            newHeaders.set('Access-Control-Allow-Origin', origin);
            newHeaders.set('Access-Control-Allow-Credentials', 'true');
            newHeaders.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
            newHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            newHeaders.set('Vary', 'Origin');
        } else if (!origin) {
            // Caso same-origin simple (sin cabecera Origin), permitimos credenciales implícitamente
            // pero si la librería fuerza modo CORS, a veces requiere que seamos explícitos.
            // No podemos poner '*' si queremos permitir credenciales.
        }

        // Configurar Cache oportuno para Vercel Free y rendimiento
        // Stale-while-revalidate con un tiempo largo dado que las imágenes son inmutables (tienen timestamp)
        newHeaders.set('Cache-Control', 'public, max-age=31536000, immutable');

        // 4. Retornar el stream del cuerpo original con los nuevos headers
        return new NextResponse(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: newHeaders,
        });

    } catch (error: unknown) {
        // Edge runtime: can't import logger, use structured JSON directly
        console.error(JSON.stringify({
            level: 'error',
            msg: 'Media proxy error',
            error: error instanceof Error ? error.message : String(error),
            ts: new Date().toISOString(),
        }));
        const message = error instanceof Error ? error.message : 'Unknown error';
        return new NextResponse(`Internal Server Error: ${message}`, { status: 500 });
    }
}

export async function OPTIONS(req: NextRequest) {
    const origin = req.headers.get('origin');
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const isAllowedOrigin = origin && appUrl && origin.startsWith(appUrl);

    return new NextResponse(null, {
        status: 204,
        headers: {
            ...(isAllowedOrigin ? { 
                'Access-Control-Allow-Origin': origin!, 
                'Access-Control-Allow-Credentials': 'true',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            } : {}),
            'Vary': 'Origin',
        },
    });
}

