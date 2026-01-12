'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

/**
 * ListItem
 * 
 * A reusable list item component for master-detail layouts.
 * Supports avatar, title, description, meta info, and badges.
 * 
 * Usage:
 * ```tsx
 * <ListItem
 *   title="John Doe"
 *   description="john@example.com"
 *   avatarSrc="/avatars/john.jpg"
 *   avatarFallback="JD"
 *   meta="5 projects"
 *   badge={{ variant: 'success', label: 'Active' }}
 *   isActive={selectedId === 'john'}
 *   onClick={() => setSelected('john')}
 * />
 * ```
 */

export interface ListItemProps {
    /** Main title text */
    title: string;
    /** Secondary description text */
    description?: string;
    /** Avatar image source */
    avatarSrc?: string | null;
    /** Avatar fallback text (initials) */
    avatarFallback?: string;
    /** Meta information (right side) */
    meta?: string | React.ReactNode;
    /** Badge configuration */
    badge?: {
        variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' | 'danger' | 'neutral' | 'purple' | 'cyan' | 'indigo' | 'orange';
        label: string;
    };
    /** Whether the item is currently active/selected */
    isActive?: boolean;
    /** Click handler */
    onClick?: () => void;
    /** Custom class names */
    className?: string;
    /** Whether the item is loading */
    isLoading?: boolean;
    /** Disabled state */
    disabled?: boolean;
}

export function ListItem({
    title,
    description,
    avatarSrc,
    avatarFallback,
    meta,
    badge,
    isActive = false,
    onClick,
    className,
    isLoading = false,
    disabled = false,
}: ListItemProps) {
    const initials = avatarFallback || title.slice(0, 2).toUpperCase();

    return (
        <div
            role="button"
            tabIndex={disabled ? -1 : 0}
            onClick={disabled ? undefined : onClick}
            onKeyDown={(e) => {
                if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    onClick?.();
                }
            }}
            className={cn(
                // Base styles
                'flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors',
                // Default state
                'bg-transparent hover:bg-accent/50',
                // Active state
                isActive && 'bg-accent hover:bg-accent',
                // Disabled state
                disabled && 'opacity-50 cursor-not-allowed',
                // Loading state
                isLoading && 'animate-pulse',
                // Custom classes
                className
            )}
        >
            {/* Avatar */}
            {(avatarSrc !== undefined || avatarFallback) && (
                <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarImage src={avatarSrc || undefined} alt={title} />
                    <AvatarFallback className="text-label bg-muted">
                        {initials}
                    </AvatarFallback>
                </Avatar>
            )}

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-0.5">
                <div className="flex items-center gap-2">
                    <span className="font-medium text-body truncate">
                        {title}
                    </span>
                    {badge && (
                        <Badge variant={badge.variant} size="small">
                            {badge.label}
                        </Badge>
                    )}
                </div>
                {description && (
                    <p className="text-label text-muted-foreground truncate">
                        {description}
                    </p>
                )}
            </div>

            {/* Meta */}
            {meta && (
                <div className="flex-shrink-0 text-label text-muted-foreground">
                    {meta}
                </div>
            )}
        </div>
    );
}

/**
 * ListItemSkeleton
 * Loading skeleton for list items
 */
export function ListItemSkeleton({ className }: { className?: string }) {
    return (
        <div
            className={cn(
                'flex items-center gap-3 p-3 rounded-lg animate-pulse',
                className
            )}
        >
            <div className="h-10 w-10 rounded-full bg-muted flex-shrink-0" />
            <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
            </div>
        </div>
    );
}
