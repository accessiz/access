import type { NextConfig } from "next";

const nextConfig: NextConfig = {

  // --- SALIDA STANDALONE ---
  output: 'standalone',

  // --- Server Actions body size limit (image uploads) ---
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },

  // --- Powered-by header off (security best practice) ---
  poweredByHeader: false,

  // --- Compression handled by Vercel/CDN ---
  compress: true,

  images: {
    remotePatterns: [
      // 1. Supabase signed URLs
      {
        protocol: 'https',
        hostname: 'wsxheefrjomkmhykyoxv.supabase.co',
        port: '',
        pathname: '/storage/v1/object/sign/**',
      },
      // 2. Cloudflare R2 public bucket
      {
        protocol: 'https',
        hostname: 'pub-1db14940441148b5a4909c6f036c1e69.r2.dev',
        pathname: '/**',
      },
    ],

    // ─── IMAGE OPTIMIZATION ───
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },

  // --- Security headers for all routes ---
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-DNS-Prefetch-Control', value: 'on' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      ],
    },
    {
      // Immutable caching for hashed static assets
      source: '/_next/static/(.*)',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
      ],
    },
  ],
};

export default nextConfig;
