import os
import textwrap

# --- CONFIGURACIÓN ---
# Asumimos que este script se ejecuta desde la raíz del proyecto (la carpeta 'nyxa')
PROJECT_ROOT = os.getcwd()
SRC_DIR = os.path.join(PROJECT_ROOT, 'src')

# --- DEFINICIÓN DE CONTENIDO DE ARCHIVOS ---

# Contenido para src/lib/types.ts
TYPES_TS_CONTENT = textwrap.dedent("""\
    // Basado en tu script de Python y la tabla de la base de datos
    export interface Model {
      id: string; // O number, dependiendo de tu base de datos
      alias: string | null;
      full_name: string | null;
      national_id: string | null;
      status: 'active' | 'inactive' | 'archived';
      gender: 'Male' | 'Female' | 'Other' | null;
      birth_date: string | null; // Formato YYYY-MM-DD
      country: string | null;
      height_cm: number | null;
      shoulders_cm: number | null;
      chest_cm: number | null;
      bust_cm: number | null;
      waist_cm: number | null;
      hips_cm: number | null;
      top_size: string | null;
      pants_size: string | null;
      shoe_size_eu: number | null;
      eye_color: string | null;
      hair_color: string | null;
      instagram: string | null;
      tiktok: string | null;
      email: string | null;
      phone_number: string | null;
      created_at: string;
    }
""")

# Contenido para src/lib/api/models.ts
API_MODELS_TS_CONTENT = textwrap.dedent("""\
    import { createClient } from '@/lib/supabase/server';
    import { unstable_noStore as noStore } from 'next/cache';

    interface GetModelsParams {
      query?: string;
      country?: string;
      minHeight?: string;
      maxHeight?: string;
    }

    /**
     * Fetches a paginated and filtered list of models from the database.
     * @param params - The filter parameters.
     * @returns An object containing the models data and the total count.
     */
    export async function getModels({ query, country, minHeight, maxHeight }: GetModelsParams) {
      // Evita que los datos se queden en caché estáticamente,
      // asegurando que los filtros siempre se apliquen en cada request.
      noStore();
      
      const supabase = createClient();
      let supabaseQuery = supabase
        .from('models')
        .select('*', { count: 'exact' });

      if (query) {
        supabaseQuery = supabaseQuery.ilike('alias', `%${query}%`);
      }
      if (country) {
        supabaseQuery = supabaseQuery.eq('country', country);
      }
      if (minHeight) {
        supabaseQuery = supabaseQuery.gte('height_cm', Number(minHeight));
      }
      if (maxHeight) {
        supabaseQuery = supabaseQuery.lte('height_cm', Number(maxHeight));
      }

      const { data, error, count } = await supabaseQuery.order('alias', { ascending: true });

      if (error) {
        console.error('Error fetching models:', error);
        // En un caso real, podrías querer manejar este error de forma más elegante.
        // Por ahora, lanzamos un error para que el `error.tsx` de Next.js lo capture.
        throw new Error('No se pudieron cargar los modelos.');
      }

      return { data, count };
    }

    /**
     * Fetches a sorted list of unique countries from the models table.
     * @returns A sorted array of country names.
     */
    export async function getUniqueCountries() {
        noStore();
        const supabase = createClient();
        const { data, error } = await supabase
            .from('models')
            .select('country')
            .neq('country', null)
            .order('country', { ascending: true });
            
        if (error) {
            console.error('Error fetching countries:', error);
            return [];
        }
        
        // El Set se asegura de que solo tengamos valores únicos.
        return [...new Set(data?.map(item => item.country) || [])];
    }
""")

# Contenido para src/components/organisms/ModelsToolbar.tsx
MODELS_TOOLBAR_TSX_CONTENT = textwrap.dedent("""\
    "use client";

    import { usePathname, useRouter, useSearchParams } from 'next/navigation';
    import { Input } from '@/components/ui/input';
    import { Button } from '@/components/ui/button';
    import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
    import { Search, ListFilter, Ruler } from 'lucide-react';
    import { useDebouncedCallback } from 'use-debounce';

    // Definimos los rangos de estatura para el filtro
    const heightRanges = [
      { label: "Todos", min: null, max: null },
      { label: "Menos de 170 cm", min: null, max: 169 },
      { label: "170 - 175 cm", min: 170, max: 175 },
      { label: "176 - 180 cm", min: 176, max: 180 },
      { label: "181 - 185 cm", min: 181, max: 185 },
      { label: "Más de 185 cm", min: 186, max: null },
    ];

    // El componente ahora recibe la lista de países como una propiedad
    export function ModelsToolbar({ countries }: { countries: string[] }) {
      const searchParams = useSearchParams();
      const pathname = usePathname();
      const { replace } = useRouter();

      const handleSearch = useDebouncedCallback((term: string) => {
        const params = new URLSearchParams(searchParams);
        if (term) {
          params.set('q', term);
        } else {
          params.delete('q');
        }
        replace(`${pathname}?${params.toString()}`);
      }, 300);

      const handleFilter = (key: string, value: string | null) => {
        const params = new URLSearchParams(searchParams);
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
        replace(`${pathname}?${params.toString()}`);
      };

      const handleFilterByHeight = (min: number | null, max: number | null) => {
        const params = new URLSearchParams(searchParams);
        if (min !== null) {
          params.set('minHeight', String(min));
        } else {
          params.delete('minHeight');
        }
        if (max !== null) {
          params.set('maxHeight', String(max));
        } else {
          params.delete('maxHeight');
        }
        replace(`${pathname}?${params.toString()}`);
      };
      
      const currentCountry = searchParams.get('country');
      const currentMinHeight = searchParams.get('minHeight');
      const currentMaxHeight = searchParams.get('maxHeight');

      const currentHeightLabel = 
        heightRanges.find(range => 
          String(range.min) === (currentMinHeight || 'null') && 
          String(range.max) === (currentMaxHeight || 'null')
        )?.label || 'Filtrar Estatura';

      return (
        <div className="flex items-center gap-2 md:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por alias..."
              className="pl-9 w-full md:w-auto"
              onChange={(e) => handleSearch(e.target.value)}
              defaultValue={searchParams.get('q')?.toString()}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-10 gap-1">
                <ListFilter className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  {currentCountry || 'Filtrar País'}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filtrar por país</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => handleFilter('country', null)}>
                Todos los países
              </DropdownMenuItem>
              {countries.map((country) => (
                 <DropdownMenuItem key={country} onSelect={() => handleFilter('country', country)}>
                  {country}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Nuevo Dropdown para el filtro de estatura */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-10 gap-1">
                <Ruler className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  {currentHeightLabel}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filtrar por estatura</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {heightRanges.map((range) => (
                <DropdownMenuItem
                  key={range.label}
                  onSelect={() => handleFilterByHeight(range.min, range.max)}
                >
                  {range.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    }
""")

# Contenido para src/app/dashboard/models/page.tsx
MODELS_PAGE_TSX_CONTENT = textwrap.dedent("""\
    import { createClient } from '@/lib/supabase/server';
    import { redirect } from 'next/navigation';
    // Importamos la lógica de fetching y los tipos
    import { getModels, getUniqueCountries } from '@/lib/api/models';
    import { Model } from '@/lib/types';
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
    import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
    import { PlusCircle } from 'lucide-react';
    import { ModelsToolbar } from '@/components/organisms/ModelsToolbar';

    export default async function ModelsPage({
      searchParams,
    }: {
      searchParams?: { 
        q?: string; 
        country?: string;
        minHeight?: string;
        maxHeight?: string;
      };
    }) {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        redirect('/login');
      }

      const searchQuery = searchParams?.q || '';
      const countryQuery = searchParams?.country || '';
      const minHeightQuery = searchParams?.minHeight || '';
      const maxHeightQuery = searchParams?.maxHeight || '';

      // Usamos las nuevas funciones para obtener los datos en paralelo
      const [uniqueCountries, { data: modelsData, count }] = await Promise.all([
        getUniqueCountries(),
        getModels({
          query: searchQuery,
          country: countryQuery,
          minHeight: minHeightQuery,
          maxHeight: maxHeightQuery,
        }),
      ]);

      // Hacemos un type assertion para asegurar a TypeScript que los datos son del tipo Model[]
      const models = modelsData as Model[] | null;

      const { data: publicUrlData } = supabase.storage.from('models').getPublicUrl('');

      return (
        <Card className="h-full flex flex-col">
          <CardHeader className="flex flex-col gap-4">
            <div className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Talento</CardTitle>
                  <CardDescription>
                    Mostrando {models?.length ?? 0} de {count ?? 0} modelos.
                  </CardDescription>
                </div>
                <Button size="sm" className="gap-1">
                    <PlusCircle className="h-4 w-4" />
                    Añadir Talento
                </Button>
            </div>
            <ModelsToolbar countries={uniqueCountries} />
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-card">
                <TableRow>
                  <TableHead className="w-[64px]"></TableHead>
                  <TableHead>Alias</TableHead>
                  <TableHead>País</TableHead>
                  <TableHead>Altura</TableHead>
                  <TableHead className="hidden md:table-cell">Instagram</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {models && models.length > 0 ? (
                  models.map((model) => {
                    const imageUrl = `${publicUrlData.publicUrl}/${model.id}/cover.jpg`;
                    const fallbackText = model.alias?.substring(0, 2) || 'IZ';

                    return (
                      <TableRow key={model.id}>
                        <TableCell>
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={imageUrl} alt={model.alias || 'Avatar'} />
                            <AvatarFallback>{fallbackText}</AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell className="font-medium">{model.alias}</TableCell>
                        <TableCell>{model.country}</TableCell>
                        <TableCell>{model.height_cm ? `${model.height_cm} cm` : '-'}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          {model.instagram}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No se encontraron modelos para los filtros aplicados.
                    </TableCell>
                  </TableRow>
                )}
                {/* El manejo de errores ahora está dentro de getModels, 
                    así que un `error.tsx` en esta ruta lo capturaría.
                    Ya no necesitamos renderizar el error aquí. */}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      );
    }
""")


# --- LÓGICA DEL SCRIPT ---

def write_file(path, content):
    """Escribe contenido en un archivo, creando directorios si es necesario."""
    try:
        # Asegurarse de que el directorio del archivo existe
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✅ Archivo {'creado' if not os.path.exists(path) else 'actualizado'}: {os.path.relpath(path)}")
    except Exception as e:
        print(f"❌ Error al escribir el archivo {os.path.relpath(path)}: {e}")

def main():
    """Función principal que ejecuta todas las operaciones de refactorización."""
    print("🚀 Iniciando script de refactorización para el módulo de Modelos...")
    
    # Verificar que estamos en el directorio correcto
    if not os.path.isdir(SRC_DIR):
        print(f"❌ Error: El directorio 'src' no se encontró en '{PROJECT_ROOT}'.")
        print("Asegúrate de ejecutar este script desde la carpeta raíz de tu proyecto ('nyxa').")
        return

    # Definir las rutas de los archivos
    paths = {
        "types": os.path.join(SRC_DIR, 'lib', 'types.ts'),
        "api_models": os.path.join(SRC_DIR, 'lib', 'api', 'models.ts'),
        "toolbar": os.path.join(SRC_DIR, 'components', 'organisms', 'ModelsToolbar.tsx'),
        "page": os.path.join(SRC_DIR, 'app', 'dashboard', 'models', 'page.tsx')
    }

    # Ejecutar las operaciones de escritura
    write_file(paths["types"], TYPES_TS_CONTENT)
    write_file(paths["api_models"], API_MODELS_TS_CONTENT)
    write_file(paths["toolbar"], MODELS_TOOLBAR_TSX_CONTENT)
    write_file(paths["page"], MODELS_PAGE_TSX_CONTENT)
    
    print("\n🎉 ¡Refactorización completada con éxito!")
    print("Tus archivos han sido creados y actualizados.")
    print("Ahora puedes reiniciar tu servidor de desarrollo para ver los cambios.")

if __name__ == "__main__":
    main()
