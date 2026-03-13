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
  isSigningIn: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Creamos la instancia del cliente del navegador una sola vez
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);

      if (event === 'SIGNED_IN') {
        router.refresh();
      } else if (event === 'SIGNED_OUT') {
        router.push('/login');
      } else if (event === 'TOKEN_REFRESHED') {
        router.refresh();
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, router]);

  const signIn = async (email: string, password: string) => {
    setIsSigningIn(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setIsSigningIn(false);
      throw error;
    }
    // onAuthStateChange con SIGNED_IN hará router.refresh()
    // El server component de /login detectará la sesión y redirigirá al dashboard
  };

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setLoading(false);
    router.push('/login');
  };

  const value = { user, loading, isSigningIn, supabase, signIn, signOut };

  return (
    <AuthContext.Provider value={value}>
      {children}
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