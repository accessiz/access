
import type { Metadata } from "next";
// Importamos la fuente Geist Sans
import { GeistSans } from 'geist/font/sans';
import "./globals.css";

export const metadata: Metadata = {
  title: "IZ Access",
  description: "Portal de Gestión para IZ Management.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      {/* Aplicamos la fuente Geist a toda la aplicación */}
      <body className={GeistSans.className}>{children}</body>
    </html>
  );
}
