'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

/**
 * ModelListItem
 * 
 * Simplified list item for model listing optimized for María's workflow.
 * Shows only essential info: Avatar, Name, Country+Height, Availability status.
 * 
 * Based on Des Traynor's JTBD: María is SEARCHING, not browsing.
 * Based on Don Norman: Clear signifiers, minimal cognitive load.
 */

export interface ModelListItemProps {
    /** Model ID */
    id: string;
    /** Model name/alias */
    name: string;
    /** Avatar URL */
    avatarUrl?: string | null;
    /** Country */
    country?: string | null;
    /** Height in cm */
    height?: number | null;
    /** Whether model is busy TODAY (has assignment for today's date) */
    isBusyToday?: boolean;
    /** Whether this item is currently selected */
    isSelected?: boolean;
    /** Click handler */
    onClick?: () => void;
    /** Additional class names */
    className?: string;
}

export function ModelListItem({
    id,
    name,
    avatarUrl,
    country,
    height,
    isBusyToday = false,
    isSelected = false,
    onClick,
    className,
}: ModelListItemProps) {
    const initials = name
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

    // Build subtitle: "Guatemala · 175 cm" or just "Guatemala" or just "175 cm"
    const subtitleParts: string[] = [];
    if (country) subtitleParts.push(country);
    if (height) subtitleParts.push(`${height} cm`);
    const subtitle = subtitleParts.join(' · ');

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={onClick}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClick?.();
                }
            }}
            data-model-id={id}
            className={cn(
                // Base styles
                'flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors',
                // Border for separation
                'border-b border-border/50',
                // Hover state
                'hover:bg-accent/50',
                // Selected state (Don Norman: clear feedback)
                isSelected && 'bg-accent border-l-2 border-l-primary',
                // Custom classes
                className
            )}
        >
            {/* Avatar */}
            <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarImage src={avatarUrl || undefined} alt={name} />
                <AvatarFallback className="text-copy-12 bg-muted font-medium">
                    {initials}
                </AvatarFallback>
            </Avatar>

            {/* Content */}
            <div className="flex-1 min-w-0">
                {/* Name */}
                <p className="font-medium text-copy-14 truncate">{name}</p>

                {/* Subtitle: Country + Height */}
                {subtitle && (
                    <p className="text-copy-12 text-muted-foreground truncate">
                        {subtitle}
                    </p>
                )}
            </div>

            {/* Availability Status - Simple "busy today" indicator */}
            <div className="flex items-center gap-2 flex-shrink-0">
                {isBusyToday ? (
                    <>
                        {/* Pulsing red dot = Busy Today */}
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive/75" />
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-destructive" />
                        </span>
                        <span className="text-label-11 text-destructive hidden sm:inline">
                            Ocupado
                        </span>
                    </>
                ) : (
                    <>
                        {/* Green dot = Available */}
                        <span className="h-2 w-2 rounded-full bg-success" />
                        <span className="text-label-11 text-muted-foreground hidden sm:inline">
                            Libre
                        </span>
                    </>
                )}
            </div>
        </div>
    );
}

/**
 * ModelListItemSkeleton - Loading state
 */
export function ModelListItemSkeleton() {
    return (
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50 animate-pulse">
            <div className="h-10 w-10 rounded-full bg-muted flex-shrink-0" />
            <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
            </div>
            <div className="h-2 w-2 rounded-full bg-muted" />
        </div>
    );
}
