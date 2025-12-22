import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import "./globals.css";
import { AuthProvider } from "@/hooks/useAuth";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
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
    <html lang="es" className="dark" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}

