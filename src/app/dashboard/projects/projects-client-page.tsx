'use client'

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Project } from '@/lib/types';

import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Trash2, ArrowDown, ArrowUp, List, CalendarDays } from 'lucide-react';
import { ProjectCalendarView } from '@/components/organisms/ProjectCalendarView';
import { ProjectsToolbar } from '@/components/organisms/ProjectsToolbar';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination";
import { DeleteProjectDialog } from '@/components/organisms/DeleteProjectDialog';
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

    const handleProjectDeleted = (deletedProjectId: string) => {
        setProjects(current => current.filter(p => p.id !== deletedProjectId));
        setCount(current => current - 1);
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

                                    <DeleteProjectDialog
                                        projectId={project.id}
                                        projectName={project.project_name || ''}
                                        onProjectDeleted={() => handleProjectDeleted(project.id)}
                                    >
                                        <Button variant="ghost" size="icon" className="shrink-0">
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </DeleteProjectDialog>
                                </div>

                                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
                                    <ProjectStatusBadge status={project.status} />

                                    <div className="flex items-center gap-x-2 gap-y-2 text-label text-muted-foreground">
                                        <CalendarDays className="h-3.5 w-3.5" />
                                        <span>{scheduleLabel}</span>
                                    </div>

                                    <div className="text-label text-muted-foreground">
                                        Talento: <span className="font-medium text-foreground">{project.approved_models?.length || 0}</span>
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
                                <TableRow>
                                    <TableHead className="w-12">#</TableHead>
                                    <SortableHeader tkey="project_name" label="Proyecto" />
                                    <SortableHeader tkey="client_name" label="Cliente" />
                                    <SortableHeader tkey="status" label="Estado" />
                                    <TableHead>Talento Aprobado</TableHead>
                                    <SortableHeader tkey="created_at" label="Fecha" />
                                    <TableHead className="text-right">Acciones</TableHead>
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
                                                {project.approved_models && project.approved_models.length > 0 ? (
                                                    <div className="flex items-center gap-x-1 gap-y-1">
                                                        <div className="flex -space-x-2">
                                                            {project.approved_models.slice(0, 4).map((model) => (
                                                                <div
                                                                    key={model.id}
                                                                    className="h-6 w-6 rounded-full border-2 border-background overflow-hidden bg-muted"
                                                                    title={model.alias}
                                                                >
                                                                    {model.coverUrl ? (
                                                                        <img src={model.coverUrl} alt={model.alias} className="h-full w-full object-cover" />
                                                                    ) : (
                                                                        <div className="h-full w-full flex items-center justify-center text-label text-muted-foreground">
                                                                            {model.alias.charAt(0).toUpperCase()}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                        {project.approved_models.length > 4 && (
                                                            <span className="text-label text-muted-foreground">+{project.approved_models.length - 4}</span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground text-label">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {project.schedule && project.schedule.length > 0 ? (
                                                    project.schedule.length === 1
                                                        ? formatDate(project.schedule[0].date)
                                                        : `${formatDate(project.schedule[0].date)} - ${formatDate(project.schedule[project.schedule.length - 1].date)}`
                                                ) : '-'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DeleteProjectDialog projectId={project.id} projectName={project.project_name || ''} onProjectDeleted={() => handleProjectDeleted(project.id)}>
                                                    <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                                </DeleteProjectDialog>
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
                        <h1 className="text-display font-semibold">Proyectos</h1>
                        <p className="text-label text-muted-foreground">{count} proyectos</p>
                    </div>
                </div>
                <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
                    <div className="order-1 w-full sm:order-2 sm:w-auto">
                        <ProjectsToolbar availableYears={availableYears} />
                    </div>

                    <div className="order-2 flex items-center justify-between gap-3 w-full sm:order-1 sm:w-auto sm:justify-start">
                        {/* View Toggle */}
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
                            className="w-fit"
                        />

                        <Button asChild className="shrink-0">
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
