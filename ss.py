import os
import textwrap

# -----------------------------------------------------------------------------
# SCRIPT PARA REFINAR EL DISEÑO DEL DASHBOARD DE NYXA
# -----------------------------------------------------------------------------
# Instrucciones:
# 1. Guarda este archivo como `refine_design.py` en la carpeta raíz de tu proyecto NYXA.
# 2. Abre una terminal en esa misma carpeta.
# 3. Ejecuta el script con el comando: python refine_design.py
# 4. El script modificará los archivos necesarios. Revisa los cambios y luego
#    puedes eliminar este script si lo deseas.
# -----------------------------------------------------------------------------

# --- Definición de los archivos y sus nuevos contenidos ---

files_to_update = [
    {
        "path": "src/app/globals.css",
        "action": "modify",
        "content": textwrap.dedent("""
            @tailwind base;
            @tailwind components;
            @tailwind utilities;

            @layer base {
              :root {
                /* ====================================================== */
                /* ==   MODO CLARO (LIGHT THEME) - REFINADO            == */
                /* ====================================================== */
                --background: 249 249 249; /* Un blanco roto muy sutil */
                --foreground: 20 20 20;

                --nav-background: 255 255 255; /* Blanco puro para la barra lateral y header */
                --nav-foreground: 20 20 20;

                --card: 255 255 255;
                --card-foreground: 20 20 20;

                --popover: 255 255 255;
                --popover-foreground: 20 20 20;
                
                --primary: 135 24 157;
                --primary-foreground: 250 250 250;

                --secondary: 242 242 242; /* Un gris muy claro para elementos secundarios */
                --secondary-foreground: 28 26 29;
                
                --muted: 242 242 242;
                --muted-foreground: 120 120 120;
                
                --accent: 242 242 242;
                --accent-foreground: 28 26 29;
                
                --destructive: 220 38 38;
                --destructive-foreground: 250 250 250;

                --border: 230 230 230;
                --input: 230 230 230;
                --ring: 135 24 157;

                --radius: 0.5rem; /* Bordes ligeramente menos redondeados para un look más serio */
              }

              .dark {
                /* ==================================================== */
                /* ==   MODO OSCURO (DARK THEME) - REFINADO          == */
                /* ==================================================== */
                --background: 10 10 10; /* Fondo principal casi negro */
                --foreground: 235 235 235;

                --nav-background: 19 19 19; /* Sidebar y Header ligeramente más claros */
                --nav-foreground: 235 235 235;
                
                --card: 19 19 19;
                --card-foreground: 235 235 235;

                --popover: 19 19 19;
                --popover-foreground: 235 235 235;
                
                --primary: 135 24 157;
                --primary-foreground: 250 250 250;
                
                --secondary: 35 35 35; /* Gris oscuro para elementos activos/hover */
                --secondary-foreground: 250 250 250;
                
                --muted: 35 35 35;
                --muted-foreground: 160 160 160;
                
                --accent: 35 35 35;
                --accent-foreground: 250 250 250;
                
                --destructive: 153 27 27;
                --destructive-foreground: 235 235 235;
                
                --border: 35 35 35;
                --input: 35 35 35;
                --ring: 135 24 157;
              }
            }
            
            @layer base {
              html {
                /* Establece 12px como el tamaño de fuente base (12px / 16px = 75%) */
                font-size: 75%; 
              }
              * {
                @apply border-border;
              }
              body {
                @apply bg-background text-foreground;
                font-feature-settings: "rlig" 1, "calt" 1;
                /* Base font size in rem, which now equals 12px */
                font-size: 1rem;
              }
            }
        """)
    },
    {
        "path": "src/app/dashboard/layout.tsx",
        "action": "modify",
        "content": textwrap.dedent("""
            import { createClient } from '@/lib/supabase/server';
            import { redirect } from 'next/navigation';
            import { LogOut } from 'lucide-react';
            import { Button } from '@/components/ui/button';
            import { Sidebar } from '@/components/organisms/Sidebar';

            export default async function DashboardLayout({
              children,
            }: {
              children: React.ReactNode;
            }) {
              const supabase = createClient();
              const {
                data: { session },
              } = await supabase.auth.getSession();

              if (!session) {
                redirect('/login');
              }

              return (
                <div className="grid h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
                  <Sidebar />
                  <div className="flex flex-col overflow-hidden">
                    <header className="flex h-16 items-center gap-4 border-b bg-nav-background px-6">
                       <div className="w-full flex-1">
                         {/* Placeholder for future breadcrumbs or global search */}
                       </div>
                       <p className="text-sm text-muted-foreground hidden sm:block">{session.user.email}</p>
                       <form action="/auth/signout" method="post">
                          <Button variant="ghost" size="icon">
                            <LogOut className="h-5 w-5" />
                            <span className="sr-only">Cerrar sesión</span>
                          </Button>
                        </form>
                    </header>
                    <main className="flex-1 overflow-y-auto p-6 lg:p-8">
                      {children}
                    </main>
                  </div>
                </div>
              );
            }
        """)
    },
    {
        "path": "src/app/dashboard/models/page.tsx",
        "action": "modify",
        "content": textwrap.dedent("""
            "use client";

            import { useEffect, useState, useMemo, useCallback } from 'react';
            import { useRouter, useSearchParams, usePathname } from 'next/navigation';
            import { createClient } from '@/lib/supabase/client';
            import { Model } from '@/lib/types';
            import { Card } from "@/components/ui/card";
            import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
            import { Skeleton } from '@/components/ui/skeleton';
            import { ModelsToolbar } from '@/components/organisms/ModelsToolbar';
            import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
            import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination";
            import Link from 'next/link';
            import { ArrowUp, ArrowDown, Download, ExternalLink } from 'lucide-react';

            const ITEMS_PER_PAGE = 12;

            type SortConfig = {
              key: keyof Model;
              direction: 'asc' | 'desc';
            };

            export default function ModelsPage() {
              const [models, setModels] = useState<Model[]>([]);
              const [count, setCount] = useState(0);
              const [countries, setCountries] = useState<string[]>([]);
              const [loading, setLoading] = useState(true);
              const [publicUrl, setPublicUrl] = useState('');
              const router = useRouter();
              const searchParams = useSearchParams();
              const pathname = usePathname();
              
              const view = searchParams.get('view') || 'list';
              const currentPage = Number(searchParams.get('page')) || 1;
              const totalPages = Math.ceil(count / ITEMS_PER_PAGE);
              
              const [sortConfig, setSortConfig] = useState<SortConfig>({
                key: (searchParams.get('sort') as keyof Model) || 'alias',
                direction: (searchParams.get('dir') as 'asc' | 'desc') || 'asc',
              });

              const handleSort = useCallback((key: keyof Model) => {
                const params = new URLSearchParams(searchParams);
                let direction: 'asc' | 'desc' = 'asc';
                if (sortConfig.key === key && sortConfig.direction === 'asc') {
                  direction = 'desc';
                }
                params.set('sort', key);
                params.set('dir', direction);
                router.replace(`${pathname}?${params.toString()}`);
              }, [searchParams, sortConfig, pathname, router]);


              useEffect(() => {
                const supabase = createClient();
                const { data: urlData } = supabase.storage.from('models').getPublicUrl('');
                setPublicUrl(urlData.publicUrl);

                async function fetchData() {
                  setLoading(true);
                  const query = searchParams.get('q') || '';
                  const country = searchParams.get('country') || '';
                  const minHeight = searchParams.get('minHeight') || '';
                  const maxHeight = searchParams.get('maxHeight') || '';

                  // Update sortConfig from URL params on fetch
                  const sortKey = (searchParams.get('sort') as keyof Model) || 'alias';
                  const sortDir = (searchParams.get('dir') as 'asc' | 'desc') || 'asc';
                  setSortConfig({ key: sortKey, direction: sortDir });

                  const from = (currentPage - 1) * ITEMS_PER_PAGE;
                  const to = from + ITEMS_PER_PAGE - 1;

                  let supabaseQuery = supabase.from('models').select('*', { count: 'exact' });
                  if (query) supabaseQuery = supabaseQuery.or(`full_name.ilike.%${query}%,alias.ilike.%${query}%`);
                  if (country) supabaseQuery = supabaseQuery.eq('country', country);
                  if (minHeight) supabaseQuery = supabaseQuery.gte('height_cm', Number(minHeight));
                  if (maxHeight) supabaseQuery = supabaseQuery.lte('height_cm', Number(maxHeight));

                  const { data: fetchedModels, error, count } = await supabaseQuery
                    .order(sortKey, { ascending: sortDir === 'asc' })
                    .range(from, to);

                  if (error) {
                    console.error("Error fetching models:", error);
                  } else {
                    setModels((fetchedModels as Model[]) || []);
                    setCount(count || 0);
                  }

                  if (countries.length === 0) {
                    const { data: countryData } = await supabase.from('models').select('country').neq('country', null);
                    setCountries([...new Set(countryData?.map(item => item.country) || [])]);
                  }
                  setLoading(false);
                }
                fetchData();
              }, [searchParams, currentPage, countries.length]);
              
              const handleRowClick = (modelId: string) => {
                router.push(`/dashboard/models/${modelId}`);
              };

              const createPageURL = (pageNumber: number | string) => {
                const params = new URLSearchParams(searchParams);
                params.set('page', pageNumber.toString());
                return `${pathname}?${params.toString()}`;
              };

              const paginationItems = useMemo(() => {
                const items: (number | string)[] = [];
                if (totalPages <= 7) {
                  for (let i = 1; i <= totalPages; i++) items.push(i);
                } else {
                  items.push(1);
                  if (currentPage > 3) items.push('...');
                  const start = Math.max(2, currentPage - 1);
                  const end = Math.min(totalPages - 1, currentPage + 1);
                  for (let i = start; i <= end; i++) items.push(i);
                  if (currentPage < totalPages - 2) items.push('...');
                  items.push(totalPages);
                }
                return items;
              }, [currentPage, totalPages]);

              const SortableHeader = ({ tkey, label }: { tkey: keyof Model; label: string; }) => (
                <TableHead onClick={() => handleSort(tkey)} className="cursor-pointer hover:text-foreground transition-colors">
                  <div className="flex items-center gap-2">
                    {label}
                    {sortConfig.key === tkey && (
                      sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                    )}
                  </div>
                </TableHead>
              );

              return (
                <div className="h-full flex flex-col bg-background space-y-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Talento</h1>
                        <p className="text-muted-foreground">Gestiona, filtra y explora la base de datos de modelos.</p>
                    </div>

                    <ModelsToolbar countries={countries} modelCount={count} />

                    <div className="flex-1">
                      {loading ? (
                          view === 'grid' ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                              {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => <Skeleton key={i} className="aspect-[3/4] rounded-lg"/>)}
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => <Skeleton key={i} className="h-16 w-full"/>)}
                            </div>
                          )
                      ) : models.length > 0 ? (
                        view === 'grid' ? (
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {models.map((model) => {
                              const imageUrl = `${publicUrl}/${model.id}/cover.jpg`;
                              return (
                                <Card key={model.id} onClick={() => handleRowClick(model.id)} className="cursor-pointer hover:border-primary transition-colors group overflow-hidden">
                                  <div className="aspect-[3/4] relative bg-muted">
                                    <Avatar className="h-full w-full rounded-none">
                                      <AvatarImage src={imageUrl} className="object-cover group-hover:scale-105 transition-transform duration-300" />
                                      <AvatarFallback className="rounded-none text-2xl bg-transparent">{model.alias?.substring(0, 2) || 'IZ'}</AvatarFallback>
                                    </Avatar>
                                  </div>
                                  <div className="p-3">
                                    <p className="font-semibold truncate">{model.alias}</p>
                                    <p className="text-sm text-muted-foreground">{model.country}</p>
                                  </div>
                                </Card>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="border rounded-lg">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-[80px]"></TableHead>
                                  <SortableHeader tkey="alias" label="Alias" />
                                  <SortableHeader tkey="country" label="País" />
                                  <SortableHeader tkey="height_cm" label="Estatura" />
                                  <TableHead>Instagram</TableHead>
                                  <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {models.map((model) => (
                                  <TableRow key={model.id} onClick={() => handleRowClick(model.id)} className="cursor-pointer">
                                    <TableCell>
                                      <Avatar>
                                        <AvatarImage src={`${publicUrl}/${model.id}/cover.jpg`} />
                                        <AvatarFallback>{model.alias?.substring(0, 2) || 'IZ'}</AvatarFallback>
                                      </Avatar>
                                    </TableCell>
                                    <TableCell className="font-medium">{model.alias}</TableCell>
                                    <TableCell>{model.country}</TableCell>
                                    <TableCell>{model.height_cm} cm</TableCell>
                                    <TableCell>
                                      {model.instagram && (
                                        <Link href={`https://instagram.com/${model.instagram}`} target="_blank" onClick={(e) => e.stopPropagation()} className="flex items-center gap-1.5 hover:underline text-muted-foreground hover:text-foreground">
                                          @{model.instagram} <ExternalLink className="h-3.5 w-3.5" />
                                        </Link>
                                      )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                       <Download className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" onClick={(e) => { e.stopPropagation(); alert('Próximamente'); }} />
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center h-full py-20 rounded-lg border border-dashed">
                          <p className="text-lg font-semibold">No se encontraron modelos</p>
                          <p className="text-muted-foreground">Intenta ajustar los filtros o la búsqueda.</p>
                        </div>
                      )}
                    </div>
                  
                    {totalPages > 1 && (
                      <footer className="flex items-center justify-between pt-6">
                          <div className="text-xs text-muted-foreground">
                              Página {currentPage} de {totalPages}
                          </div>
                          <Pagination>
                              <PaginationContent>
                                  <PaginationItem><PaginationPrevious href={createPageURL(currentPage - 1)} className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}/></PaginationItem>
                                  {paginationItems.map((page, index) => (
                                      <PaginationItem key={index}>
                                      {page === '...' ? <PaginationEllipsis /> : <PaginationLink href={createPageURL(page as number)} isActive={currentPage === page}>{page}</PaginationLink>}
                                      </PaginationItem>
                                  ))}
                                  <PaginationItem><PaginationNext href={createPageURL(currentPage + 1)} className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}/></PaginationItem>
                              </PaginationContent>
                          </Pagination>
                      </footer>
                    )}
                </div>
              );
            }
        """)
    },
    {
        "path": "src/components/organisms/ModelsToolbar.tsx",
        "action": "create",
        "content": textwrap.dedent("""
            "use client";

            import { usePathname, useRouter, useSearchParams } from 'next/navigation';
            import { Input } from '@/components/ui/input';
            import { Button } from '@/components/ui/button';
            import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
            import { Search, ListFilter, Ruler, LayoutGrid, List, PlusCircle } from 'lucide-react';
            import { useDebouncedCallback } from 'use-debounce';
            import { useMemo } from 'react';

            const heightRanges = [
              { label: "Cualquier Estatura", min: null, max: null },
              { label: "Menos de 170 cm", min: null, max: 169 },
              { label: "170 - 175 cm", min: 170, max: 175 },
              { label: "176 - 180 cm", min: 176, max: 180 },
              { label: "181 - 185 cm", min: 181, max: 185 },
              { label: "Más de 185 cm", min: 186, max: null },
            ];

            export function ModelsToolbar({ countries, modelCount }: { countries: string[]; modelCount: number }) {
              const searchParams = useSearchParams();
              const pathname = usePathname();
              const router = useRouter();
              const view = searchParams.get('view') || 'list';
              const currentCountry = searchParams.get('country');
              const currentMinHeight = searchParams.get('minHeight');
              const currentMaxHeight = searchParams.get('maxHeight');

              const handleSearch = useDebouncedCallback((term: string) => {
                const params = new URLSearchParams(searchParams);
                params.set('page', '1');
                if (term) params.set('q', term); else params.delete('q');
                router.replace(`${pathname}?${params.toString()}`);
              }, 300);

              const handleFilter = (key: string, value: string | null) => {
                const params = new URLSearchParams(searchParams);
                params.set('page', '1');
                if (value) params.set(key, value); else params.delete(key);
                router.replace(`${pathname}?${params.toString()}`);
              };

              const handleFilterByHeight = (min: number | null, max: number | null) => {
                const params = new URLSearchParams(searchParams);
                params.set('page', '1');
                if (min !== null) params.set('minHeight', String(min)); else params.delete('minHeight');
                if (max !== null) params.set('maxHeight', String(max)); else params.delete('maxHeight');
                router.replace(`${pathname}?${params.toString()}`);
              };

              const setView = (newView: 'list' | 'grid') => {
                const params = new URLSearchParams(searchParams);
                params.set('view', newView);
                router.replace(`${pathname}?${params.toString()}`);
              };
              
              const currentHeightLabel = useMemo(() =>
                  heightRanges.find(range => 
                    String(range.min) === (currentMinHeight || 'null') && 
                    String(range.max) === (currentMaxHeight || 'null')
                  )?.label || 'Estatura',
              [currentMinHeight, currentMaxHeight]);

              return (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex w-full sm:w-auto items-center gap-2">
                    <div className="relative flex-1 sm:flex-initial sm:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="search"
                        placeholder="Buscar por nombre o alias..."
                        className="pl-9"
                        onChange={(e) => handleSearch(e.target.value)}
                        defaultValue={searchParams.get('q')?.toString()}
                      />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-10 gap-1.5">
                          <ListFilter className="h-4 w-4" />
                          <span className="hidden sm:inline">{currentCountry || 'País'}</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Filtrar por país</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={() => handleFilter('country', null)}>Todos</DropdownMenuItem>
                        {countries.map((c) => <DropdownMenuItem key={c} onSelect={() => handleFilter('country', c)}>{c}</DropdownMenuItem>)}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-10 gap-1.5">
                          <Ruler className="h-4 w-4" />
                          <span className="hidden sm:inline">{currentHeightLabel.split(' ')[0]}</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Filtrar por estatura</DropdownMenuLabel>
                         <DropdownMenuSeparator />
                        {heightRanges.map((r) => <DropdownMenuItem key={r.label} onSelect={() => handleFilterByHeight(r.min, r.max)}>{r.label}</DropdownMenuItem>)}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="flex w-full sm:w-auto items-center gap-2">
                    <div className="flex items-center rounded-md border bg-background p-0.5">
                      <Button variant={view === 'list' ? 'secondary' : 'ghost'} size="icon" onClick={() => setView('list')} className="h-8 w-8"><List className="h-4 w-4" /></Button>
                      <Button variant={view === 'grid' ? 'secondary' : 'ghost'} size="icon" onClick={() => setView('grid')} className="h-8 w-8"><LayoutGrid className="h-4 w-4" /></Button>
                    </div>
                     <Button size="sm" className="h-10 gap-2 w-full sm:w-auto">
                        <PlusCircle className="h-4 w-4" />
                        Añadir Talento
                    </Button>
                  </div>
                </div>
              );
            }

        """)
    },
    {
        "path": "src/components/organisms/Sidebar.tsx",
        "action": "modify",
        "content": textwrap.dedent("""
            "use client"
            import Link from "next/link"
            import { usePathname } from "next/navigation"
            import { GalleryVerticalEnd, Users, FolderKanban, Settings } from "lucide-react"
            import { cn } from "@/lib/utils"

            export function Sidebar() {
                const pathname = usePathname();

                const navLinks = [
                    { href: "/dashboard", label: "Dashboard", icon: GalleryVerticalEnd },
                    { href: "/dashboard/models", label: "Talento", icon: Users },
                    { href: "/dashboard/projects", label: "Proyectos", icon: FolderKanban },
                ];
                
                const settingsLink = { href: "/dashboard/settings", label: "Configuración", icon: Settings };

                return (
                    <div className="hidden border-r bg-nav-background md:block">
                        <div className="flex h-full max-h-screen flex-col">
                            <div className="flex h-16 items-center border-b px-6">
                                <Link href="/" className="flex items-center gap-2 font-semibold">
                                    <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-md">
                                       <GalleryVerticalEnd className="size-5" />
                                    </div>
                                    <span className="text-lg">IZ Access</span>
                                </Link>
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                <nav className="grid items-start p-4 text-sm font-medium">
                                    {navLinks.map((link) => (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            className={cn(
                                                "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                                                (pathname.startsWith(link.href) && link.href !== "/dashboard") || pathname === link.href
                                                    ? "bg-secondary text-primary-foreground"
                                                    : ""
                                            )}
                                        >
                                            <link.icon className="h-4 w-4" />
                                            {link.label}
                                        </Link>
                                    ))}
                                </nav>
                            </div>
                             <div className="mt-auto p-4">
                                <nav className="grid items-start text-sm font-medium">
                                     <Link
                                        href={settingsLink.href}
                                        className={cn(
                                            "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                                            pathname.startsWith(settingsLink.href) && "bg-secondary text-primary-foreground"
                                        )}
                                    >
                                        <settingsLink.icon className="h-4 w-4" />
                                        {settingsLink.label}
                                    </Link>
                                </nav>
                            </div>
                        </div>
                    </div>
                )
            }
        """)
    },
    {
        "path": "src/components/ui/table.tsx",
        "action": "modify",
        "content": textwrap.dedent("""
            import * as React from "react"

            import { cn } from "@/lib/utils"

            const Table = React.forwardRef<
              HTMLTableElement,
              React.HTMLAttributes<HTMLTableElement>
            >(({ className, ...props }, ref) => (
              <div className="relative w-full overflow-auto">
                <table
                  ref={ref}
                  className={cn("w-full caption-bottom text-sm", className)}
                  {...props}
                />
              </div>
            ))
            Table.displayName = "Table"

            const TableHeader = React.forwardRef<
              HTMLTableSectionElement,
              React.HTMLAttributes<HTMLTableSectionElement>
            >(({ className, ...props }, ref) => (
              <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
            ))
            TableHeader.displayName = "TableHeader"

            const TableBody = React.forwardRef<
              HTMLTableSectionElement,
              React.HTMLAttributes<HTMLTableSectionElement>
            >(({ className, ...props }, ref) => (
              <tbody
                ref={ref}
                className={cn("[&_tr:last-child]:border-0", className)}
                {...props}
              />
            ))
            TableBody.displayName = "TableBody"

            const TableFooter = React.forwardRef<
              HTMLTableSectionElement,
              React.HTMLAttributes<HTMLTableSectionElement>
            >(({ className, ...props }, ref) => (
              <tfoot
                ref={ref}
                className={cn(
                  "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
                  className
                )}
                {...props}
              />
            ))
            TableFooter.displayName = "TableFooter"

            const TableRow = React.forwardRef<
              HTMLTableRowElement,
              React.HTMLAttributes<HTMLTableRowElement>
            >(({ className, ...props }, ref) => (
              <tr
                ref={ref}
                className={cn(
                  "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
                  className
                )}
                {...props}
              />
            ))
            TableRow.displayName = "TableRow"

            const TableHead = React.forwardRef<
              HTMLTableCellElement,
              React.ThHTMLAttributes<HTMLTableCellElement>
            >(({ className, ...props }, ref) => (
              <th
                ref={ref}
                className={cn(
                  "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
                  className
                )}
                {...props}
              />
            ))
            TableHead.displayName = "TableHead"

            const TableCell = React.forwardRef<
              HTMLTableCellElement,
              React.TdHTMLAttributes<HTMLTableCellElement>
            >(({ className, ...props }, ref) => (
              <td
                ref={ref}
                className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
                {...props}
              />
            ))
            TableCell.displayName = "TableCell"

            const TableCaption = React.forwardRef<
              HTMLTableCaptionElement,
              React.HTMLAttributes<HTMLTableCaptionElement>
            >(({ className, ...props }, ref) => (
              <caption
                ref={ref}
                className={cn("mt-4 text-sm text-muted-foreground", className)}
                {...props}
              />
            ))
            TableCaption.displayName = "TableCaption"

            export {
              Table,
              TableHeader,
              TableBody,
              TableFooter,
              TableHead,
              TableRow,
              TableCell,
              TableCaption,
            }
        """)
    },
     {
        "path": "tailwind.config.ts",
        "action": "modify",
        "content": textwrap.dedent("""
            import type { Config } from 'tailwindcss'

            const config: Config = {
              darkMode: ["class"],
              content: [
                './pages/**/*.{ts,tsx}',
                './components/**/*.{ts,tsx}',
                './app/**/*.{ts,tsx}',
                './src/**/*.{ts,tsx,css}',
              ],
              prefix: "",
              theme: {
                container: {
                  center: true,
                  padding: "2rem",
                  screens: {
                    "2xl": "1400px",
                  },
                },
                extend: {
                  fontSize: {
                      'xs': '0.833rem', // 10px
                      'sm': '0.917rem', // 11px
                      'base': '1rem',    // 12px (base)
                      'lg': '1.167rem', // 14px
                      'xl': '1.333rem', // 16px
                      '2xl': '1.667rem', // 20px
                      '3xl': '2rem',     // 24px
                      '4xl': '2.5rem',   // 30px
                  },
                  colors: {
                    border: "rgb(var(--border) / <alpha-value>)",
                    input: "rgb(var(--input) / <alpha-value>)",
                    ring: "rgb(var(--ring) / <alpha-value>)",
                    background: "rgb(var(--background) / <alpha-value>)",
                    foreground: "rgb(var(--foreground) / <alpha-value>)",
                    "nav-background": "rgb(var(--nav-background) / <alpha-value>)",
                    "nav-foreground": "rgb(var(--nav-foreground) / <alpha-value>)",
                    primary: {
                      DEFAULT: "rgb(var(--primary) / <alpha-value>)",
                      foreground: "rgb(var(--primary-foreground) / <alpha-value>)",
                    },
                    secondary: {
                      DEFAULT: "rgb(var(--secondary) / <alpha-value>)",
                      foreground: "rgb(var(--secondary-foreground) / <alpha-value>)",
                    },
                    destructive: {
                      DEFAULT: "rgb(var(--destructive) / <alpha-value>)",
                      foreground: "rgb(var(--destructive-foreground) / <alpha-value>)",
                    },
                    muted: {
                      DEFAULT: "rgb(var(--muted) / <alpha-value>)",
                      foreground: "rgb(var(--muted-foreground) / <alpha-value>)",
                    },
                    accent: {
                      DEFAULT: "rgb(var(--accent) / <alpha-value>)",
                      foreground: "rgb(var(--accent-foreground) / <alpha-value>)",
                    },
                    popover: {
                      DEFAULT: "rgb(var(--popover) / <alpha-value>)",
                      foreground: "rgb(var(--popover-foreground) / <alpha-value>)",
                    },
                    card: {
                      DEFAULT: "rgb(var(--card) / <alpha-value>)",
                      foreground: "rgb(var(--card-foreground) / <alpha-value>)",
                    },
                  },
                  borderRadius: {
                    lg: "var(--radius)",
                    md: "calc(var(--radius) - 2px)",
                    sm: "calc(var(--radius) - 4px)",
                  },
                  keyframes: {
                    "accordion-down": {
                      from: { height: "0" },
                      to: { height: "var(--radix-accordion-content-height)" },
                    },
                    "accordion-up": {
                      from: { height: "var(--radix-accordion-content-height)" },
                      to: { height: "0" },
                    },
                  },
                  animation: {
                    "accordion-down": "accordion-down 0.2s ease-out",
                    "accordion-up": "accordion-up 0.2s ease-out",
                  },
                },
              },
              plugins: [require("tailwindcss-animate")],
            };

            export default config;
        """)
    }
]

def apply_changes():
    """
    Applies the file modifications defined in the files_to_update list.
    """
    print("🚀 Iniciando el proceso de refinamiento de diseño...")
    
    project_root = os.getcwd()
    
    for file_info in files_to_update:
        file_path = os.path.join(project_root, file_info["path"])
        action = file_info["action"]
        
        try:
            # Asegurarse de que el directorio exista
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(file_info["content"])
            
            if action == "create":
                print(f"✅ Creado: {file_info['path']}")
            elif action == "modify":
                print(f"✨ Modificado: {file_info['path']}")
        
        except Exception as e:
            print(f"❌ Error al procesar {file_info['path']}: {e}")
            
    print("\n🎉 ¡Proceso completado!")
    print("Se han aplicado todos los cambios de diseño. Por favor, reinicia tu servidor de desarrollo.")

if __name__ == "__main__":
    apply_changes()
