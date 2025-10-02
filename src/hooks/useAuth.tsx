"use client";
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

// 1. Definimos la forma que tendrá nuestro contexto
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

// 2. Creamos el Contexto de Autenticación
// Le damos un valor inicial `undefined` porque lo proveeremos en el layout
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 3. Creamos el Componente "Proveedor" que contendrá toda la lógica
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Verificamos si hay una sesión activa al cargar la app
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getSession();

    // Escuchamos cambios en el estado de autenticación (login, logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (_event === 'SIGNED_OUT') {
        router.push('/login');
      }
    });

    // Limpiamos la suscripción al desmontar el componente
    return () => subscription.unsubscribe();
  }, [router]);

  // Función para iniciar sesión
  const signIn = async (email: string, password: string) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      throw error;
    }
    // La redirección al dashboard se maneja aquí o en la página de login
    router.push('/dashboard');
  };

  // Función para cerrar sesión
  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setLoading(false);
  };

  // El valor que compartiremos a través del contexto
  const value = { user, loading, signIn, signOut };

  // Envolvemos a los componentes hijos con el proveedor
  // Solo renderizamos los hijos cuando la carga inicial ha terminado para evitar parpadeos
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

// 4. Creamos el Hook personalizado para consumir el contexto fácilmente
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}

