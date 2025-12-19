import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  
  // --- SALIDA STANDALONE ---
  output: 'standalone',

  // --- AQUI ESTA LA SOLUCION AL ERROR DE 1MB ---
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // Ahora permite subir fotos grandes sin error
    },
  },

  images: {
    remotePatterns: [
      // 1. Tu config original de Supabase (La mantenemos)
      {
        protocol: 'https',
        hostname: 'wawumdjwerletgkiewyk.supabase.co',
        port: '',
        pathname: '/storage/v1/object/sign/**',
      },
      // 2. NUEVO: Permiso para ver las fotos de Cloudflare R2
      // (Usamos '**' para que acepte tu nuevo dominio R2 sin problemas)
      {
        protocol: 'https',
        hostname: '**',
      },
    ],

    // --- SOLUCIÓN PARA TUS TIMEOUTS LOCALES ---
    unoptimized: process.env.NODE_ENV === 'development',
  },
};

export default nextConfig;