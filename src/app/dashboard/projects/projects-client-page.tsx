'use client'

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Project } from '@/lib/types';

import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, ArrowDown, ArrowUp, List, CalendarDays } from 'lucide-react';
import { ProjectCalendarView } from '@/components/organisms/ProjectCalendarView';
import { ProjectsToolbar } from '@/components/organisms/ProjectsToolbar';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination";
import { ProjectStatusBadge } from '@/components/molecules/ProjectStatusBadge';
import { SegmentedControl } from '@/components/molecules/SegmentedControl';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 25;

type InitialData = {
    initialProjects: Project[];
    initialCount: number;
    availableYears: number[];
};

// Formatear fecha evitando problemas de zona horaria (Guatemala GMT-6)
// Al parsear YYYY-MM-DD como UTC y formatear en UTC, evitamos el desfase de un día
const formatDate = (dateString: string) => {
    // Si es formato YYYY-MM-DD, parseamos como UTC
    const [year, month, day] = dateString.split('-').map(Number);
    if (year && month && day) {
        const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
        return `${day} ${months[month - 1]}`;
    }
    // Fallback para otros formatos
    return new Date(dateString).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
};


export default function ProjectsClientPage({ initialProjects, initialCount, availableYears }: InitialData) {
    const [projects, setProjects] = useState(initialProjects);
    const [count, setCount] = useState(initialCount);
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

    // Sincronizar estado cuando los props cambian (navegación de página)
    useEffect(() => {
        setProjects(initialProjects);
        setCount(initialCount);
    }, [initialProjects, initialCount]);

    const searchParams = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();

    const currentPage = Number(searchParams.get('page')) || 1;
    const totalPages = Math.ceil(count / PAGE_SIZE);

    const sortConfig = useMemo(() => ({
        key: (searchParams.get('sort') as keyof Project) || 'created_at',
        direction: (searchParams.get('dir') as 'asc' | 'desc') || 'desc',
    }), [searchParams]);

    const handleSort = (key: keyof Project) => {
        const params = new URLSearchParams(searchParams);
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        params.set('sort', key);
        params.set('dir', direction);
        params.set('page', '1');
        router.replace(`${pathname}?${params.toString()}`);
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

    const SortableHeader = ({ tkey, label, className }: { tkey: keyof Project; label: string; className?: string }) => (
        <TableHead onClick={() => handleSort(tkey)} className={cn("cursor-pointer hover:text-foreground transition-colors", className)}>
            <div className="flex items-center gap-x-2 gap-y-2">
                {label}
                {sortConfig.key === tkey && (
                    sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                )}
            </div>
        </TableHead>
    );

    const renderContent = () => {
        if (projects.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center text-center h-full rounded-lg border border-dashed py-20">
                    <p className="text-title">No se encontraron proyectos</p>
                    <p className="text-muted-foreground">Intenta ajustar los filtros o la búsqueda.</p>
                </div>
            );
        }

        return (
            <>
                {/* Mobile: stacked cards */}
                <div className="space-y-3 md:hidden">
                    {projects.map((project, index) => {
                        const rowNumber = ((currentPage - 1) * PAGE_SIZE) + index + 1;
                        const scheduleLabel = project.schedule && project.schedule.length > 0
                            ? (project.schedule.length === 1
                                ? formatDate(project.schedule[0].date)
                                : `${formatDate(project.schedule[0].date)} - ${formatDate(project.schedule[project.schedule.length - 1].date)}`)
                            : '-'

                        return (
                            <div key={project.id} className="rounded-lg border p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-x-2 gap-y-2">
                                            <span className="text-label font-mono text-muted-foreground">{rowNumber.toString().padStart(2, '0')}</span>
                                            <Link
                                                href={`/dashboard/projects/${project.id}`}
                                                className="min-w-0 text-title font-semibold text-foreground no-underline hover:text-muted-foreground transition-colors truncate"
                                            >
                                                {project.project_name}
                                            </Link>
                                        </div>
                                        <p className="text-body text-muted-foreground truncate">{project.client_name || '—'}</p>
                                    </div>
                                </div>

                                <div className="mt-3 flex flex-col gap-2">
                                    <div className="flex items-center justify-between gap-x-3 gap-y-2">
                                        <ProjectStatusBadge status={project.status} />

                                        <div className="flex items-center gap-x-2 gap-y-2 text-label text-muted-foreground">
                                            <CalendarDays className="h-3.5 w-3.5" />
                                            <span>{scheduleLabel}</span>
                                        </div>
                                    </div>

                                    <div className="text-label text-muted-foreground">
                                        Talento aprobado: <span className="font-medium text-foreground">{project.approved_models?.length || 0}</span>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Desktop+: sortable table */}
                <div className="hidden md:block">
                    <div className="border rounded-lg overflow-x-auto">
                        <Table className="min-w-225">
                            <TableHeader>
                                <TableRow className="bg-quaternary hover:bg-quaternary">
                                    <TableHead className="w-12">#</TableHead>
                                    <SortableHeader tkey="project_name" label="Proyecto" />
                                    <SortableHeader tkey="client_name" label="Cliente" />
                                    <SortableHeader tkey="status" label="Estado" />
                                    <TableHead>Talento Aprobado</TableHead>
                                    <SortableHeader tkey="created_at" label="Fecha" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {projects.map((project, index) => {
                                    const rowNumber = ((currentPage - 1) * PAGE_SIZE) + index + 1;
                                    return (
                                        <TableRow key={project.id}>
                                            <TableCell className="text-muted-foreground font-mono text-label">
                                                {rowNumber.toString().padStart(2, '0')}
                                            </TableCell>
                                            <TableCell>
                                                <Link href={`/dashboard/projects/${project.id}`} className="font-medium text-foreground no-underline hover:text-muted-foreground transition-colors">
                                                    {project.project_name}
                                                </Link>
                                            </TableCell>
                                            <TableCell>{project.client_name || '-'}</TableCell>
                                            <TableCell><ProjectStatusBadge status={project.status} /></TableCell>
                                            <TableCell>
                                                <span className="font-medium">{project.approved_models?.length || 0}</span>
                                            </TableCell>
                                            <TableCell>
                                                {project.schedule && project.schedule.length > 0 ? (
                                                    project.schedule.length === 1
                                                        ? formatDate(project.schedule[0].date)
                                                        : `${formatDate(project.schedule[0].date)} - ${formatDate(project.schedule[project.schedule.length - 1].date)}`
                                                ) : '-'}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </>
        )
    };

    return (
        <div className="space-y-4">
            {/* DS §0: Simplified header - less cognitive load for María */}
            <header className="flex flex-col gap-x-4 gap-y-4 pb-4 border-b sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-x-4 gap-y-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-display font-semibold">Proyectos</h1>
                            <span aria-hidden className="h-5 w-px bg-border" />
                            <p className="text-label text-muted-foreground whitespace-nowrap">{count} proyectos</p>
                        </div>
                    </div>
                </div>
                <div className="w-full sm:w-auto">
                    {/* Mobile layout */}
                    <div className="space-y-3 sm:hidden">
                        {/* Row 1: search + new */}
                        <div className="flex items-center gap-3">
                            <div className="min-w-0 flex-1">
                                <ProjectsToolbar availableYears={availableYears} mode="search" />
                            </div>
                            <Button asChild className="shrink-0 whitespace-nowrap">
                                <Link href="/dashboard/projects/new"><PlusCircle className="mr-2 h-4 w-4" />Nuevo</Link>
                            </Button>
                        </div>

                        {/* Row 2: status full-width */}
                        <ProjectsToolbar availableYears={availableYears} mode="status" className="w-full" />

                        {/* Row 3: year+month + view toggle */}
                        <div className="flex items-center gap-3">
                            <ProjectsToolbar availableYears={availableYears} mode="date" className="flex-1" />
                            <SegmentedControl
                                value={viewMode}
                                onValueChange={setViewMode}
                                ariaLabel="Cambiar vista"
                                options={[
                                    {
                                        value: 'list',
                                        label: 'Lista',
                                        icon: <List className="h-4 w-4" />,
                                        iconOnly: true,
                                    },
                                    {
                                        value: 'calendar',
                                        label: 'Calendario',
                                        icon: <CalendarDays className="h-4 w-4" />,
                                        iconOnly: true,
                                    },
                                ]}
                                className="w-fit shrink-0"
                            />
                        </div>
                    </div>

                    {/* Desktop layout (single row) */}
                    <div className="hidden sm:flex sm:flex-row sm:items-center sm:gap-2 sm:flex-nowrap">
                        <div className="min-w-0 sm:w-64">
                            <ProjectsToolbar availableYears={availableYears} mode="search" />
                        </div>
                        <ProjectsToolbar availableYears={availableYears} mode="filters" className="sm:w-auto" />
                        <SegmentedControl
                            value={viewMode}
                            onValueChange={setViewMode}
                            ariaLabel="Cambiar vista"
                            options={[
                                {
                                    value: 'list',
                                    label: 'Lista',
                                    icon: <List className="h-4 w-4" />,
                                    iconOnly: true,
                                },
                                {
                                    value: 'calendar',
                                    label: 'Calendario',
                                    icon: <CalendarDays className="h-4 w-4" />,
                                    iconOnly: true,
                                },
                            ]}
                            className="shrink-0"
                        />
                        <Button asChild className="shrink-0 whitespace-nowrap">
                            <Link href="/dashboard/projects/new"><PlusCircle className="mr-2 h-4 w-4" />Nuevo</Link>
                        </Button>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="space-y-4">
                {viewMode === 'list' ? (
                    <>
                        {renderContent()}
                        {totalPages > 1 && (
                            <footer className="flex justify-between items-center pt-4 w-full">
                                <div className="flex-1">
                                    <Pagination>
                                        <PaginationContent className="justify-start">
                                            <PaginationItem><PaginationPrevious href={createPageURL(currentPage - 1)} className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""} /></PaginationItem>
                                            {paginationItems.map((page, index) => (
                                                <PaginationItem key={index}>
                                                    {page === "..." ? <PaginationEllipsis /> : <PaginationLink href={createPageURL(page as number)} isActive={currentPage === page}>{page}</PaginationLink>}
                                                </PaginationItem>
                                            ))}
                                            <PaginationItem><PaginationNext href={createPageURL(currentPage + 1)} className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""} /></PaginationItem>
                                        </PaginationContent>
                                    </Pagination>
                                </div>
                                <div className="text-label text-muted-foreground whitespace-nowrap ml-4">
                                    Página {currentPage} de {totalPages}
                                </div>
                            </footer>
                        )}
                    </>
                ) : (
                    <ProjectCalendarView projects={projects} />
                )}
            </main>
        </div >
    );
}
