import type { NextConfig } from "next";

// #1. Configuración para optimizar el proyecto
const nextConfig: NextConfig = {
  images: {
    // Aquí puedes añadir dominios para imágenes externas si los necesitas
    // domains: ['example.com'],
  },
  experimental: {
    // Activa la optimización de CSS en producción
    optimizeCss: true,
  },
};

export default nextConfig;