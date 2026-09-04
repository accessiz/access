import { redirect } from 'next/navigation';
import { getLoggedInModel, getActivePhonePrefixes } from '@/lib/actions/models_portal';
import { LoginForm } from './_login-form/login-form';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import Image from 'next/image';
import Logo from '@/components/LogoDark';

export const metadata: Metadata = {
  title: 'Iniciar Sesión — Portal de Modelos',
  description: 'Inicia sesión para confirmar tu disponibilidad en proyectos y ver tu historial.',
};

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default function ModelLoginPage({ searchParams }: PageProps) {
  return (
    <div className="ds-grid-auth bg-background text-foreground">
      
      {/* SECCIÓN DE MARCA INMERSIVA (Columna Izquierda - Oculta en Móvil, Visible en Escritorio: 3 Columnas) */}
      <aside className="ds-grid-auth-aside bg-black p-12 flex-col justify-between text-white relative overflow-hidden">
        {/* Imagen de fondo inmersiva */}
        <Image
          src="/images/sebas-villaverde-dsc-8648.jpg"
          alt="IZ Management Model"
          fill
          sizes="(min-width: 768px) 37.5vw, 100vw"
          priority
          className="object-cover object-top pointer-events-none"
        />

        {/* Overlay oscuro sutil para legibilidad del logo */}
        <div className="absolute inset-0 bg-black/30 pointer-events-none"></div>

        {/* Header Superior de la Marca - Logotipo de Access */}
        <div className="flex items-center gap-3 z-10">
          <Logo className="h-8 w-auto text-white" />
        </div>

        {/* Espacio central vacío para diseño premium minimalista */}
        <div className="my-auto z-10"></div>

        {/* Footer vacío */}
        <div className="z-10"></div>
      </aside>

      {/* FORMULARIO DE ACCESO (Columna Derecha - 100% Mobile First: 1 Columna en móvil, 5 en escritorio) */}
      <Suspense fallback={<div className="ds-grid-auth-main flex items-center justify-center ds-text-sm text-muted-foreground bg-card md:bg-background/20 min-h-screen">Cargando formulario...</div>}>
        <LoginFormContent searchParams={searchParams} />
      </Suspense>
      
    </div>
  );
}

async function LoginFormContent({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const redirectTo = typeof resolvedSearchParams.redirectTo === 'string' ? resolvedSearchParams.redirectTo : undefined;

  // Si ya tiene sesión activa, redirigir
  const model = await getLoggedInModel();
  if (model) {
    redirect(redirectTo || '/model/profile');
  }

  // Cargar prefijos activos de la base de datos
  const prefixes = await getActivePhonePrefixes();

  return <LoginForm redirectTo={redirectTo} prefixes={prefixes} />;
}
