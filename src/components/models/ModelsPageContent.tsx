'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Model } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MapPin, ChevronRight, FolderKanban, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SearchBar } from '@/components/molecules/SearchBar';
import { SegmentedControl } from '@/components/molecules/SegmentedControl';
import { ModelProfileSkeleton } from './ModelProfileSkeleton';

/**
 * ModelsPageContent
 * 
 * RESPONSIVE Two-column layout:
 * - MOBILE: Full-width list. Click navigates to /dashboard/models/[id]
 * - DESKTOP: 30% list + 70% profile inline. Click updates ?selected param.
 * 
 * DS §0: María is mobile-first (she's probably on phone while caring for kids)
 */

interface ModelsPageContentProps {
    initialModels: Model[];
    busyModelMap?: Map<string, string>; // modelId -> projectId
    children?: React.ReactNode; // Profile content passed from server (desktop only)
}

export function ModelsPageContent({
    initialModels,
    busyModelMap = new Map(),
    children,
}: ModelsPageContentProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [searchQuery, setSearchQuery] = React.useState('');
    const [isPending, startTransition] = React.useTransition();

    type GenderFilter = 'all' | 'male' | 'female';
    type BusyFilter = 'all' | 'busy';

    const [genderFilter, setGenderFilter] = React.useState<GenderFilter>('all');
    const [busyFilter, setBusyFilter] = React.useState<BusyFilter>('all');

    // Get selected model from URL (desktop mode)
    const selectedModelId = searchParams.get('selected');

    // Filter models based on search query
    const filteredModels = React.useMemo(() => {
        const query = searchQuery.trim().toLowerCase();

        return initialModels.filter((model) => {
            if (query) {
                const matchesQuery =
                    model.alias?.toLowerCase().includes(query) ||
                    model.country?.toLowerCase().includes(query) ||
                    model.instagram?.toLowerCase().includes(query);

                if (!matchesQuery) return false;
            }

            if (genderFilter !== 'all') {
                const rawGender = (model.gender ?? '').trim().toLowerCase();
                const normalizedGender: GenderFilter | 'all' =
                    rawGender === 'male' || rawGender === 'm'
                        ? 'male'
                        : rawGender === 'female' || rawGender === 'f'
                            ? 'female'
                            : 'all';

                if (normalizedGender !== genderFilter) return false;
            }

            if (busyFilter === 'busy' && !busyModelMap.has(model.id)) return false;

            return true;
        });
    }, [initialModels, searchQuery, genderFilter, busyFilter, busyModelMap]);

    // Handle model click - different behavior for mobile vs desktop
    const handleModelClick = React.useCallback((modelId: string) => {
        // Check if we're on mobile (no right column visible)
        // Using 768px as breakpoint (md in Tailwind)
        const isMobile = window.innerWidth < 768;

        if (isMobile) {
            // Mobile: Navigate to full profile page
            router.push(`/dashboard/models/${modelId}`);
        } else {
            // Desktop: Update URL param to show in right column
            const params = new URLSearchParams(searchParams.toString());
            params.set('selected', modelId);
            startTransition(() => {
                router.push(`${window.location.pathname}?${params.toString()}`);
            });
        }
    }, [router, searchParams]);

    // Clear search
    const clearSearch = React.useCallback(() => {
        setSearchQuery('');
    }, []);

    // Count busy models
    const busyCount = React.useMemo(() => {
        return filteredModels.filter(m => busyModelMap.has(m.id)).length;
    }, [filteredModels, busyModelMap]);

    return (
        <div className="flex flex-1 md:h-full min-h-0">
            {/* LEFT COLUMN - Full on mobile, 30% on desktop */}
            <div className={cn(
                'flex flex-col bg-background border-r border-border',
                // Mobile: full width
                'w-full',
                // Desktop (md+): fixed width side panel (más angosto)
                'md:w-70 md:min-w-65 md:max-w-75 md:min-h-0'
            )}>
                {/* Search Header - DS: p-6 for containers */}
                <div className="sticky top-0 z-10 bg-background border-b border-border p-4 sm:p-6 space-y-4">
                    <SearchBar
                        value={searchQuery}
                        onValueChange={setSearchQuery}
                        onClear={clearSearch}
                        placeholder="Buscar modelo..."
                        ariaLabel="Buscar modelo"
                        inputClassName="h-10"
                        className="w-full"
                    />

                    <div className="space-y-2">
                        <SegmentedControl
                            ariaLabel="Género"
                            value={genderFilter}
                            onValueChange={setGenderFilter}
                            mobileColumns={3}
                            options={[
                                { value: 'all', label: 'Todos' },
                                { value: 'male', label: 'Hombres' },
                                { value: 'female', label: 'Mujeres' },
                            ]}
                        />

                        <SegmentedControl
                            ariaLabel="Ocupación"
                            value={busyFilter}
                            onValueChange={setBusyFilter}
                            mobileColumns={2}
                            options={[
                                { value: 'all', label: 'Todos' },
                                { value: 'busy', label: 'Ocupados' },
                            ]}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-label text-muted-foreground">
                            <span>{filteredModels.length} modelos</span>
                            {busyCount > 0 && (
                                <span className="flex items-center gap-1.5">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive/75" />
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
                                    </span>
                                    {busyCount} ocupados
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Model List - Scrollable */}
                <div className="flex-1 overflow-y-auto">
                    {filteredModels.length === 0 ? (
                        <div className="p-6 text-center text-muted-foreground text-body">
                            No se encontraron modelos
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {filteredModels.map((model) => {
                                const projectId = busyModelMap.get(model.id);
                                const isBusy = !!projectId;
                                const isSelected = selectedModelId === model.id;
                                const initials = (model.alias || 'N/A')
                                    .split(' ')
                                    .map(n => n[0])
                                    .slice(0, 2)
                                    .join('')
                                    .toUpperCase();

                                return (
                                    <button
                                        key={model.id}
                                        onClick={() => handleModelClick(model.id)}
                                        className={cn(
                                            'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                                            'hover:bg-hover-overlay focus:outline-none',
                                            isSelected && 'md:bg-quaternary md:border-l-2 md:border-l-purple'
                                        )}
                                    >
                                        <Avatar className="h-10 w-10 shrink-0">
                                            <AvatarImage
                                                src={model.coverUrl || undefined}
                                                alt={model.alias || ''}
                                                loading="lazy"
                                            />
                                            <AvatarFallback className="text-label bg-muted">{initials}</AvatarFallback>
                                        </Avatar>

                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-body text-primary truncate">{model.alias || 'Sin nombre'}</p>
                                            {model.country && (
                                                <p className="text-label text-secondary flex items-center gap-1">
                                                    <MapPin className="h-3 w-3" />
                                                    {model.country}
                                                </p>
                                            )}
                                        </div>

                                        {/* Status indicator */}
                                        <div className="flex items-center gap-2 shrink-0">
                                            {isBusy ? (
                                                <>
                                                    <span className="relative flex h-2.5 w-2.5">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive/75" />
                                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-destructive" />
                                                    </span>
                                                    {/* Project link icon */}
                                                    <Link
                                                        href={`/dashboard/projects?selected=${projectId}`}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="p-1 rounded-md hover:bg-accent transition-colors"
                                                        title="Ver proyecto activo"
                                                    >
                                                        <FolderKanban className="h-4 w-4 text-destructive" />
                                                    </Link>
                                                </>
                                            ) : (
                                                <span className="h-2.5 w-2.5 rounded-full bg-success" />
                                            )}
                                            {/* Chevron on mobile to indicate navigation */}
                                            <ChevronRight className="h-4 w-4 text-muted-foreground md:hidden" />
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT COLUMN - Hidden on mobile, visible on desktop */}
            <div className="hidden md:flex flex-col flex-1 min-h-0 overflow-y-auto bg-background border-l border-border relative">
                {isPending && (
                    <div className="absolute top-4 right-4 z-50 animate-in fade-in zoom-in duration-300">
                        <div className="bg-background/80 backdrop-blur-sm border border-border shadow-sm px-3 py-1.5 rounded-full flex items-center gap-2">
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                            <span className="text-label font-medium">Cargando...</span>
                        </div>
                    </div>
                )}

                {isPending ? (
                    <ModelProfileSkeleton />
                ) : children ? (
                    <div className="flex-1">
                        {children}
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground">
                        <p className="text-body">Selecciona un modelo de la lista</p>
                    </div>
                )}
            </div>
        </div>
    );
}
