"use client";
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const { user, signOut, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Si no está cargando y no hay usuario, redirige al login
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Muestra un mensaje de carga mientras se verifica la sesión
  if (loading) {
    return <div className="flex h-screen items-center justify-center">Cargando...</div>;
  }

  // Si hay un usuario, muestra el dashboard
  return user ? (
    <div className="flex h-screen flex-col items-center justify-center bg-background text-foreground">
      <div className="text-center">
        <h1 className="text-4xl font-bold">Bienvenido a NYXA</h1>
        <p className="mt-2 text-muted-foreground">Sesión iniciada como: {user.email}</p>
        <Button onClick={signOut} className="mt-6">
          Cerrar Sesión
        </Button>
      </div>
    </div>
  ) : null; // No renderiza nada si no hay usuario para evitar parpadeos
}
