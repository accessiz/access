import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '404 — Página no encontrada',
}

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[rgb(var(--sys-bg))]">
      <div className="mx-auto max-w-md space-y-6 px-6 text-center">
        <p className="text-display text-[rgb(var(--access-purple))]" aria-hidden="true">404</p>
        <h1 className="text-title text-[rgb(var(--primary))]">
          Página no encontrada
        </h1>
        <p className="text-body text-[rgb(var(--secondary))]">
          La página que buscas no existe o fue movida.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            href="/dashboard"
            className="inline-flex h-10 items-center justify-center rounded-md bg-[rgb(var(--access-purple))] px-6 text-label text-white transition-colors hover:opacity-90"
          >
            Ir al Dashboard
          </Link>
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-md border border-[rgb(var(--separator))] px-6 text-label text-[rgb(var(--primary))] transition-colors hover:bg-[rgb(var(--hover-overlay))]"
          >
            Inicio
          </Link>
        </div>
      </div>
    </main>
  )
}
