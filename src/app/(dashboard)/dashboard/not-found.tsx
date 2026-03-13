import Link from 'next/link'

export default function DashboardNotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="mx-auto max-w-md space-y-6 px-6 text-center">
        <p className="text-display text-[rgb(var(--access-purple))]">404</p>
        <h1 className="text-title text-[rgb(var(--primary))]">
          Recurso no encontrado
        </h1>
        <p className="text-body text-[rgb(var(--secondary))]">
          El modelo, proyecto o sección que buscas no existe o fue eliminado.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex h-10 items-center justify-center rounded-md bg-[rgb(var(--access-purple))] px-6 text-label text-white transition-colors hover:opacity-90"
        >
          Volver al Dashboard
        </Link>
      </div>
    </div>
  )
}
