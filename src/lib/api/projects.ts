'use server';

import { createClient } from "@/lib/supabase/server";
import { unstable_noStore as noStore } from 'next/cache';

/**
 * Obtiene todos los proyectos asociados al usuario actualmente logueado.
 * @returns Una promesa que se resuelve en un array de proyectos.
 */
export async function getProjectsForUser() {
  // Evita que Next.js cachee los resultados de esta función
  noStore();
  
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.error('No user logged in');
    return [];
  }

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching projects:', error);
    throw new Error('Could not fetch projects data.');
  }

  return data;
}
