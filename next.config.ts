import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  
  // --- SALIDA STANDALONE ---
  // Esto es crucial para Docker. Crea una carpeta .next/standalone
  // con una copia mínima de los archivos necesarios para producción.
  output: 'standalone',

  images: {
    // --- DOMINIO REMOTO PARA SUPABASE (ESTO ESTABA CORRECTO) ---
    // Permite que Next.js <Image> optimice las URLs firmadas
    // de tu Supabase Storage.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'wawumdjwerletgkiewyk.supabase.co',
        port: '',
        pathname: '/storage/v1/object/sign/**',
      },
    ],

    // --- SOLUCIÓN PARA TUS TIMEOUTS LOCALES ---
    // Esto soluciona tus errores de TimeoutError en `npm run dev`
    // causados por una PC lenta.
    // Desactiva la optimización de imágenes SÓLO en desarrollo.
    // En producción (Vercel, Docker, etc.) SÍ optimizará.
    unoptimized: process.env.NODE_ENV === 'development',
  },

  // La bandera `experimental: { optimizeCss: true }` ya no es necesaria.
  // La optimización de CSS está activada por defecto en Next.js.
};

export default nextConfig;