import type { Metadata, Viewport } from "next";
import { Inter } from 'next/font/google';
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import { env } from '@/lib/env';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
});

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0c0b0b' },
  ],
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
  title: {
    default: 'IZ ACCESS',
    template: '%s | IZ ACCESS',
  },
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
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* dns-prefetch for R2 CDN (images loaded after initial paint) */}
        {env.NEXT_PUBLIC_R2_PUBLIC_URL && (
          <link rel="dns-prefetch" href={env.NEXT_PUBLIC_R2_PUBLIC_URL} />
        )}
      </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
