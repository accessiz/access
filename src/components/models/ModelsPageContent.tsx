'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Model } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Plus, X, MapPin, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    busyModelIds?: Set<string>;
    children?: React.ReactNode; // Profile content passed from server (desktop only)
}

export function ModelsPageContent({
    initialModels,
    busyModelIds = new Set(),
    children,
}: ModelsPageContentProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [searchQuery, setSearchQuery] = React.useState('');

    // Get selected model from URL (desktop mode)
    const selectedModelId = searchParams.get('selected');

    // Filter models based on search query
    const filteredModels = React.useMemo(() => {
        if (!searchQuery.trim()) return initialModels;

        const query = searchQuery.toLowerCase();
        return initialModels.filter(model =>
            model.alias?.toLowerCase().includes(query) ||
            model.country?.toLowerCase().includes(query) ||
            model.instagram?.toLowerCase().includes(query)
        );
    }, [initialModels, searchQuery]);

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
            router.push(`/dashboard/models?${params.toString()}`);
        }
    }, [router, searchParams]);

    // Clear search
    const clearSearch = React.useCallback(() => {
        setSearchQuery('');
    }, []);

    // Count busy models
    const busyCount = React.useMemo(() => {
        return filteredModels.filter(m => busyModelIds.has(m.id)).length;
    }, [filteredModels, busyModelIds]);

    return (
        <div className="h-[calc(100vh-60px)] flex">
            {/* LEFT COLUMN - Full on mobile, 30% on desktop */}
            <div className={cn(
                'flex flex-col bg-background border-r border-border',
                // Mobile: full width
                'w-full',
                // Desktop (md+): fixed width side panel
                'md:w-[30%] md:min-w-[280px] md:max-w-[400px]'
            )}>
                {/* Search Header - DS: p-4 for containers */}
                <div className="sticky top-0 z-10 bg-background border-b border-border p-4 space-y-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Buscar modelo..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-10 h-10"
                        />
                        {searchQuery && (
                            <button
                                onClick={clearSearch}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-copy-12 text-muted-foreground">
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

                        <Button size="sm" variant="default" onClick={() => router.push('/dashboard/models/new')}>
                            <Plus className="h-4 w-4 mr-1.5" />
                            Añadir
                        </Button>
                    </div>
                </div>

                {/* Model List - Scrollable */}
                <div className="flex-1 overflow-y-auto">
                    {filteredModels.length === 0 ? (
                        <div className="p-6 text-center text-muted-foreground text-copy-14">
                            No se encontraron modelos
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {filteredModels.map((model) => {
                                const isBusy = busyModelIds.has(model.id);
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
                                            'hover:bg-accent/50 focus:outline-none',
                                            isSelected && 'md:bg-accent md:border-l-2 md:border-l-primary'
                                        )}
                                    >
                                        <Avatar className="h-10 w-10 flex-shrink-0">
                                            <AvatarImage src={model.coverUrl || undefined} alt={model.alias || ''} />
                                            <AvatarFallback className="text-copy-12 bg-muted">{initials}</AvatarFallback>
                                        </Avatar>

                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-copy-14 truncate">{model.alias || 'Sin nombre'}</p>
                                            {model.country && (
                                                <p className="text-copy-12 text-muted-foreground flex items-center gap-1">
                                                    <MapPin className="h-3 w-3" />
                                                    {model.country}
                                                </p>
                                            )}
                                        </div>

                                        {/* Status indicator */}
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            {isBusy ? (
                                                <span className="relative flex h-2.5 w-2.5">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive/75" />
                                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-destructive" />
                                                </span>
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
            <div className="hidden md:flex flex-1 overflow-y-auto bg-background">
                {children ? (
                    <div className="flex-1 p-6">
                        {children}
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground">
                        <p className="text-copy-14">Selecciona un modelo de la lista</p>
                    </div>
                )}
            </div>
        </div>
    );
}
