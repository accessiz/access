
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

export const metadata: Metadata = {
  title: "IZ ACCESS",
  description: "Portal de Gestión para IZ Management.",
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
