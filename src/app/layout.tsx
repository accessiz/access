import type { Metadata } from "next";
import { GeistSans } from 'geist/font/sans';
import { Antonio } from 'next/font/google';
import "./globals.css";

// Configuración de la fuente Antonio
const antonio = Antonio({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-antonio', // La pasamos como variable CSS
});

// Geist es el default, lo aplicamos en el body
const geist = GeistSans;

// #5. Metadatos mejorados para SEO y redes sociales
export const metadata: Metadata = {
  title: "IZ ACCESS",
  description: "Portal de Gestión para IZ Management.",
  openGraph: {
    title: "IZ ACCESS",
    description: "Portal de Gestión para IZ Management.",
    images: ['/images/hero-albino-woman.jpeg'], // Asegúrate que esta ruta es accesible públicamente
    url: 'https://nyxa.app', // Cambia esto a tu URL de producción
    siteName: 'IZ ACCESS',
    locale: 'es_ES',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'IZ ACCESS',
    description: 'Portal de Gestión para IZ Management.',
    images: ['/images/hero-albino-woman.jpeg'], // Asegúrate que esta ruta es accesible públicamente
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      {/* Combinamos las clases de las fuentes */}
      <body className={`${geist.className} ${antonio.variable}`}>
        {children}
      </body>
    </html>
  );
}