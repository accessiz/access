import os
import subprocess
import sys

# --- CONFIGURACIÓN ---
# El script asume que se ejecuta desde la raíz del proyecto 'nyxa'.
# Si lo ejecutas desde otro lugar, cambia esta variable.
PROJECT_ROOT = os.getcwd()

# --- DEFINICIÓN DE CONTENIDO DE ARCHIVOS ---

# Contenido para los nuevos archivos de Supabase
supabase_client_ts = """
import { createBrowserClient } from '@supabase/ssr'

// Define una función para crear el cliente del lado del cliente (navegador)
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
"""

supabase_server_ts = """
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Define una función para crear el cliente del lado del servidor
export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
"""

# Contenido para los archivos actualizados
use_auth_tsx = """
"use client";
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
// ¡Importante! Usamos el nuevo cliente unificado para el navegador
import { createClient } from '@/lib/supabase/client'; 
import { useRouter } from 'next/navigation';
import type { User, SupabaseClient } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  supabase: SupabaseClient; // Mantenemos la instancia de supabase en el contexto
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Creamos la instancia del cliente del navegador una sola vez
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
      // Cuando la sesión cambia (ej. SIGNED_IN), refrescamos la página.
      // Esto fuerza a los Componentes de Servidor a re-evaluarse con la cookie actualizada.
      router.refresh(); 
    });

    return () => subscription.unsubscribe();
  }, [supabase, router]);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      throw error;
    }
    // El router.refresh() en onAuthStateChange se encargará de la redirección
  };

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setLoading(false);
    router.push('/login');
  };

  const value = { user, loading, supabase, signIn, signOut };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}
"""

login_page_tsx = """
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
"""

dashboard_page_tsx = """
import { createClient } from '@/lib/supabase/server'; // Importamos el nuevo cliente de servidor
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { GalleryVerticalEnd, Users, FolderKanban, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient(); // Usamos el nuevo cliente
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-muted/40 md:block">
        {/* ... Contenido de la barra lateral ... */}
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
           <div className="w-full flex-1"></div>
           <p className="text-sm text-muted-foreground">{session.user.email}</p>
           <form action="/auth/signout" method="post">
              <Button variant="ghost" size="icon">
                <LogOut className="h-5 w-5" />
              </Button>
            </form>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
"""

dashboard_models_page_tsx = """
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

// Esta es una página de servidor (Server Component) y es asíncrona
export default async function ModelsPage() {
  // 1. Usamos el nuevo cliente de servidor para verificar la sesión
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // 2. Si no hay sesión, redirigimos al login
  if (!session) {
    redirect('/login');
  }

  // 3. (Opcional) Hacemos una consulta para obtener los modelos desde Supabase
  // Asegúrate de que tu tabla se llame 'models' y el RLS esté configurado
  const { data: models, error } = await supabase.from('models').select('*');

  // 4. Devolvemos el JSX que renderizará la página
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Modelos</CardTitle>
          <CardDescription>
            Gestiona los perfiles de los modelos de la agencia.
          </CardDescription>
        </div>
        <Button size="sm" className="gap-1">
            <PlusCircle className="h-4 w-4" />
            Añadir Modelo
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Alias</TableHead>
              <TableHead>Altura</TableHead>
              <TableHead className="hidden md:table-cell">Instagram</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {models && models.length > 0 ? (
              models.map((model: any) => ( // Tipar 'model' adecuadamente si es posible
                <TableRow key={model.id}>
                  <TableCell className="font-medium">{model.name}</TableCell>
                  <TableCell>{model.alias}</TableCell>
                  <TableCell>{model.height_cm} cm</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {model.instagram_handle}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No hay modelos para mostrar.
                </TableCell>
              </TableRow>
            )}
             {error && (
               <TableRow>
                <TableCell colSpan={4} className="text-center text-destructive">
                  Error al cargar los modelos: {error.message}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
"""


# --- LÓGICA DEL SCRIPT ---

# Diccionario de archivos a crear/actualizar
files_to_update = {
    "src/lib/supabase/client.ts": supabase_client_ts,
    "src/lib/supabase/server.ts": supabase_server_ts,
    "src/hooks/useAuth.tsx": use_auth_tsx,
    "src/app/login/page.tsx": login_page_tsx,
    "src/app/dashboard/page.tsx": dashboard_page_tsx,
    "src/app/dashboard/models/page.tsx": dashboard_models_page_tsx,
}

def write_file(relative_path, content):
    """Escribe contenido en un archivo, creando directorios si es necesario."""
    full_path = os.path.join(PROJECT_ROOT, relative_path)
    try:
        # Asegurarse de que el directorio existe
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, 'w', encoding='utf-8') as f:
            f.write(content.strip())
        print(f"✅ Archivo actualizado/creado: {relative_path}")
    except Exception as e:
        print(f"❌ Error al escribir en el archivo {relative_path}: {e}")

def main():
    """Función principal del script."""
    print("--- INICIANDO SCRIPT DE ACTUALIZACIÓN DE SUPABASE ---")
    
    # Verificar que estamos en un proyecto de Next.js
    if not os.path.exists(os.path.join(PROJECT_ROOT, 'package.json')):
        print("❌ Error: No se encontró 'package.json'.")
        print("Asegúrate de ejecutar este script desde la carpeta raíz de tu proyecto 'nyxa'.")
        return

    # Los pasos 1 y 2 fueron realizados manualmente por el usuario.
    # print("\n--- PASO 1: Desinstalando @supabase/auth-helpers-nextjs ---")
    # if not run_command(["npm", "uninstall", "@supabase/auth-helpers-nextjs"]):
    #     print("Continuando de todas formas...")

    # print("\n--- PASO 2: Instalando @supabase/ssr ---")
    # if not run_command(["npm", "install", "@supabase/ssr"]):
    #     print("❌ La instalación falló. Por favor, instálala manually y vuelve a ejecutar el script.")
    #     return

    # Paso 3: Actualizar archivos
    print("\n--- PASO 3: Actualizando archivos del proyecto ---")
    for path, content in files_to_update.items():
        write_file(path, content)

    print("\n--- ✨ ¡PROCESO COMPLETADO! ✨ ---")
    print("Los archivos del proyecto han sido actualizados.")
    print("Ahora puedes iniciar tu servidor de desarrollo con 'npm run dev'.")

if __name__ == "__main__":
    main()

