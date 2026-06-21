import { redirect } from 'next/navigation';
import { getLoggedInModel, getActivePhonePrefixes } from '@/lib/actions/models_portal';
import { LoginForm } from './_login-form/login-form';
import type { Metadata } from 'next';
import { Suspense } from 'react';
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
    <div className="w-full max-w-md space-y-6 text-center py-6 flex flex-col items-center justify-center">
      {/* Logo Access completo con letras originales, centrado */}
      <div className="mb-16">
        <Logo className="h-8 w-auto text-foreground" />
      </div>
      
      <Suspense fallback={<div className="text-center text-body text-muted-foreground">Cargando formulario...</div>}>
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
