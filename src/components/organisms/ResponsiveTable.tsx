'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';

/**
 * ResponsiveTable
 * 
 * A table component that transforms into cards on mobile devices.
 * - Desktop (≥768px): Traditional table layout
 * - Mobile (<768px): Stacked cards with key-value pairs
 * 
 * Usage:
 * ```tsx
 * <ResponsiveTable
 *   columns={[
 *     { key: 'name', label: 'Nombre', priority: 'high' },
 *     { key: 'email', label: 'Email', priority: 'medium' },
 *     { key: 'status', label: 'Estado', priority: 'high', render: (value) => <Badge>{value}</Badge> },
 *   ]}
 *   data={users}
 *   onRowClick={(row) => router.push(`/users/${row.id}`)}
 * />
 * ```
 */

export interface Column<T> {
    /** Key in the data object */
    key: keyof T;
    /** Display label */
    label: string;
    /** Priority for mobile display: 'high' always shows, 'medium' shows in expanded, 'low' hides */
    priority?: 'high' | 'medium' | 'low';
    /** Custom render function */
    render?: (value: T[keyof T], row: T) => React.ReactNode;
    /** Column alignment */
    align?: 'left' | 'center' | 'right';
    /** Hide on desktop (show only in mobile cards) */
    mobileOnly?: boolean;
    /** Hide on mobile (show only in desktop table) */
    desktopOnly?: boolean;
    /** Make column sortable */
    sortable?: boolean;
    /** Column width (CSS value) */
    width?: string;
}

export interface ResponsiveTableProps<T> {
    /** Column definitions */
    columns: Column<T>[];
    /** Data array */
    data: T[];
    /** Unique key field in data */
    keyField?: keyof T;
    /** Row click handler */
    onRowClick?: (row: T) => void;
    /** Empty state content */
    emptyState?: React.ReactNode;
    /** Loading state */
    isLoading?: boolean;
    /** Number of skeleton rows to show when loading */
    skeletonRows?: number;
    /** Custom className for container */
    className?: string;
    /** Show row hover effect */
    hoverable?: boolean;
    /** Striped rows */
    striped?: boolean;
    /** Compact mode (smaller padding) */
    compact?: boolean;
}

export function ResponsiveTable<T extends Record<string, unknown>>({
    columns,
    data,
    keyField = 'id' as keyof T,
    onRowClick,
    emptyState,
    isLoading = false,
    skeletonRows = 5,
    className,
    hoverable = true,
    striped = false,
    compact = false,
}: ResponsiveTableProps<T>) {
    // Filter columns for desktop and mobile
    const desktopColumns = columns.filter(col => !col.mobileOnly);
    const mobileColumns = columns.filter(col => !col.desktopOnly);
    const highPriorityColumns = mobileColumns.filter(col => col.priority === 'high' || !col.priority);

    // Default empty state
    const defaultEmptyState = (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-title font-medium text-foreground mb-2">No hay datos</p>
            <p className="text-body text-muted-foreground">
                No se encontraron registros para mostrar.
            </p>
        </div>
    );

    // Loading skeleton
    if (isLoading) {
        return (
            <div className={cn('space-y-2', className)}>
                {/* Desktop skeleton */}
                <div className="hidden md:block border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {desktopColumns.map((col, i) => (
                                    <TableHead key={i} style={{ width: col.width }}>
                                        <div className="h-4 bg-muted rounded animate-pulse w-20" />
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {Array.from({ length: skeletonRows }).map((_, rowIdx) => (
                                <TableRow key={rowIdx}>
                                    {desktopColumns.map((col, colIdx) => (
                                        <TableCell key={colIdx}>
                                            <div className="h-4 bg-muted rounded animate-pulse" style={{ width: `${60 + Math.random() * 40}%` }} />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* Mobile skeleton */}
                <div className="md:hidden space-y-3">
                    {Array.from({ length: skeletonRows }).map((_, idx) => (
                        <Card key={idx} className="animate-pulse">
                            <CardContent className="p-4 space-y-2">
                                <div className="h-5 bg-muted rounded w-3/4" />
                                <div className="h-4 bg-muted rounded w-1/2" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    // Empty state
    if (!data || data.length === 0) {
        return (
            <div className={cn('border rounded-lg', className)}>
                {emptyState || defaultEmptyState}
            </div>
        );
    }

    // Render cell value
    const renderCell = (column: Column<T>, row: T) => {
        const value = row[column.key];
        if (column.render) {
            return column.render(value, row);
        }
        if (value === null || value === undefined) {
            return <span className="text-muted-foreground">—</span>;
        }
        return String(value);
    };

    return (
        <div className={cn('w-full', className)}>
            {/* Desktop Table */}
            <div className="hidden md:block border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {desktopColumns.map((col, i) => (
                                <TableHead
                                    key={i}
                                    className={cn(
                                        col.align === 'center' && 'text-center',
                                        col.align === 'right' && 'text-right'
                                    )}
                                    style={{ width: col.width }}
                                >
                                    {col.label}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((row, rowIdx) => (
                            <TableRow
                                key={String(row[keyField]) || rowIdx}
                                onClick={onRowClick ? () => onRowClick(row) : undefined}
                                className={cn(
                                    onRowClick && 'cursor-pointer',
                                    hoverable && 'hover:bg-muted/50',
                                    striped && rowIdx % 2 === 1 && 'bg-muted/30'
                                )}
                            >
                                {desktopColumns.map((col, colIdx) => (
                                    <TableCell
                                        key={colIdx}
                                        className={cn(
                                            compact && 'py-2',
                                            col.align === 'center' && 'text-center',
                                            col.align === 'right' && 'text-right'
                                        )}
                                    >
                                        {renderCell(col, row)}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
                {data.map((row, rowIdx) => (
                    <Card
                        key={String(row[keyField]) || rowIdx}
                        onClick={onRowClick ? () => onRowClick(row) : undefined}
                        className={cn(
                            'transition-colors',
                            onRowClick && 'cursor-pointer hover:bg-muted/50',
                            striped && rowIdx % 2 === 1 && 'bg-muted/30'
                        )}
                    >
                        <CardContent className={cn('p-4', compact && 'p-3')}>
                            {/* High priority items at top */}
                            <div className="space-y-1 mb-3">
                                {highPriorityColumns.slice(0, 2).map((col, i) => (
                                    <div key={i} className={i === 0 ? 'font-medium text-body' : 'text-label text-muted-foreground'}>
                                        {renderCell(col, row)}
                                    </div>
                                ))}
                            </div>

                            {/* Other columns as key-value pairs */}
                            <div className="grid grid-cols-2 gap-2 text-label">
                                {mobileColumns
                                    .filter(col => col.priority !== 'low' && !highPriorityColumns.slice(0, 2).includes(col))
                                    .map((col, i) => (
                                        <div key={i} className="flex flex-col">
                                            <span className="text-muted-foreground text-label">{col.label}</span>
                                            <span>{renderCell(col, row)}</span>
                                        </div>
                                    ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
