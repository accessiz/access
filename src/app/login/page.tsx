import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { GalleryVerticalEnd } from "lucide-react";
import { LoginForm } from "@/components/organisms/LoginForm";
import Image from 'next/image';
import Link from 'next/link';

export default async function LoginPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect('/dashboard/models');
  }

  return (
    // Mantenemos el grid para escritorio
    <div className="w-full min-h-screen lg:grid lg:grid-cols-2">
      
      {/* Columna Izquierda (Formulario) */}
      {/* ✅ INICIO DE CAMBIOS PARA MÓVIL */}
      <div className="flex items-center justify-center h-screen px-6 py-12 lg:h-auto lg:py-12 lg:px-8"> 
      {/* ↑↑↑ Usamos h-screen en móvil para centrar verticalmente    ↑↑↑ Aumentamos padding horizontal */}
        {/* Usamos w-full y max-w-sm para que ocupe el ancho disponible pero no se estire demasiado */}
        <div className="mx-auto grid w-full max-w-sm gap-8"> 
        {/* ↑↑↑ Aumentamos el espacio entre elementos */}
          <div className="grid gap-4 text-center"> 
          {/* ↑↑↑ Aumentamos espacio interno */}
            <Link href="/" className="flex items-center justify-center gap-3 font-semibold text-label-20"> 
            {/* ↑↑↑ Gap aumentado ↑↑↑ Texto más grande */}
              {/* Icono más grande */}
              <div className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-lg"> 
              {/* ↑↑↑ Size 9      ↑↑↑ Más redondeado */}
                <GalleryVerticalEnd className="size-6" /> 
                {/* ↑↑↑ Icono interno más grande */}
              </div>
              IZ Access
            </Link>
            {/* Texto descriptivo un poco más grande */}
            <p className="text-balance text-muted-foreground mt-2 text-copy-14"> 
            {/* ↑↑↑ text-sm */}
              Bienvenido de nuevo. Accede a tu panel de gestión.
            </p>
          </div>
          {/* El componente LoginForm usará los tamaños estándar de shadcn, que son buenos para móvil */}
          <LoginForm /> 
        </div>
      </div>
      {/* ✅ FIN DE CAMBIOS PARA MÓVIL */}

      {/* Columna Derecha (Imagen - sin cambios) */}
      <div className="hidden lg:block relative">
        <Image
            src="/images/JMTS_13.jpg"
            alt="Imagen decorativa de la página de inicio de sesión"
            fill
            className="object-cover"
            priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 p-8 text-primary-foreground">
            <h2 className="text-heading-32">Tu Visión, Nuestro Talento</h2>
            <p className="opacity-80 mt-2">La plataforma exclusiva para la gestión de talentos de IZ Management.</p>
        </div>
      </div>
    </div>
  );
}