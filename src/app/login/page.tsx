// Este es un componente de servidor ahora para mejorar la carga inicial y la seguridad.
import { createClient } from '@/lib/supabase/server'; // Importamos el nuevo cliente de servidor
import { redirect } from 'next/navigation';
import { GalleryVerticalEnd } from "lucide-react";
import { LoginForm } from "@/components/organisms/LoginForm";
import Image from 'next/image';

export default async function LoginPage() {
  // Usamos el nuevo cliente que maneja cookies correctamente
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Si el usuario ya está logueado, lo redirigimos desde el servidor.
  // Esto previene el bucle y que un usuario logueado vea la página de login.
  if (session) {
    redirect('/dashboard/models');
  }

  return (
    <div className="w-full min-h-screen lg:grid lg:grid-cols-2">
      {/* Columna del Formulario (Izquierda) */}
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-[350px] gap-6">
          {/* Encabezado con Logo */}
          <div className="grid gap-2 text-center">
            <a href="/" className="flex items-center justify-center gap-2 font-semibold text-lg">
              <div className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-md">
                <GalleryVerticalEnd className="size-5" />
              </div>
              IZ Access
            </a>
            <p className="text-balance text-muted-foreground mt-2">
              Bienvenido de nuevo. Accede a tu panel de gestión.
            </p>
          </div>
          
          {/* El componente del formulario sigue siendo un Client Component, lo cual es correcto */}
          <LoginForm />
        </div>
      </div>

      {/* Columna de la Imagen (Derecha) */}
      <div className="hidden lg:block relative">
        <Image
            src="/images/JMTS_13.jpg"
            alt="Imagen decorativa de la página de inicio de sesión"
            fill
            className="object-cover"
            priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 p-8 text-white">
            <h2 className="text-3xl font-bold">Tu Visión, Nuestro Talento</h2>
            <p className="text-white/80 mt-2">La plataforma exclusiva para la gestión de talentos de IZ Management.</p>
        </div>
      </div>
    </div>
  );
}