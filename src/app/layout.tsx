
import type { Metadata } from "next";
import { GeistSans } from 'geist/font/sans';
import "./globals.css";

const geist = GeistSans;

export const metadata: Metadata = {
  title: "IZ ACCESS",
  description: "Portal de Gestión para IZ Management.",
  openGraph: {
    title: "IZ ACCESS",
    description: "Portal de Gestión para IZ Management.",
    images: ['/images/hero-photo-cover.jpg'],
    url: 'https://nyxa.app',
    siteName: 'IZ ACCESS',
    locale: 'es_ES',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'IZ ACCESS',
    description: 'Portal de Gestión para IZ Management.',
    images: ['/images/hero-photo-cover.jpg'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Se añade data-theme="dark" para activar el modo oscuro por defecto
    <html lang="es" data-theme="dark">
      <body className={geist.className}>
        {children}
      </body>
    </html>
  );
}
