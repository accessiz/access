import type { NextConfig } from "next";


const nextConfig: NextConfig = {
  images: {

    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'wawumdjwerletgkiewyk.supabase.co',
        port: '',
        pathname: '/storage/v1/object/sign/**',
      },
    ],
  },
  experimental: {

    optimizeCss: true,
  },
};

export default nextConfig;

