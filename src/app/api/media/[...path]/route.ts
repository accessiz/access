import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

/**
 * Proxy para servir imágenes de R2 a través del propio dominio.
 * Correcciones aplicadas:
 * - Soporte para Next.js 15+ / 16+ donde params es una Promise.
 * - Validación de path para evitar errores de 'join' on undefined.
 */
export async function GET(
    req: NextRequest,
    props: { params: Promise<{ path: string[] }> }
) {
    try {
        // En las versiones recientes (Next.js 15+), params es una Promise que debe ser aguardada.
        const params = await props.params;

        if (!params?.path || !Array.isArray(params.path)) {
            return new NextResponse('Bad Request: Invalid path parameters', { status: 400 });
        }

        // 1. Reconstruir el path del recurso en R2
        const path = params.path.join('/');

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

        // Configurar CORS explícitamente para permitir el uso en canvas/html-to-image
        newHeaders.set('Access-Control-Allow-Origin', '*');
        newHeaders.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
        newHeaders.set('Access-Control-Allow-Headers', 'Content-Type');

        // Configurar Cache oportuno para Vercel Free y rendimiento
        // Stale-while-revalidate con un tiempo largo dado que las imágenes son inmutables (tienen timestamp)
        newHeaders.set('Cache-Control', 'public, max-age=31536000, immutable');

        // 4. Retornar el stream del cuerpo original con los nuevos headers
        return new NextResponse(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: newHeaders,
        });

    } catch (error: any) {
        console.error('Proxy Error:', error);
        return new NextResponse(`Internal Server Error: ${error.message}`, { status: 500 });
    }
}

export async function OPTIONS(request: NextRequest) {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}
