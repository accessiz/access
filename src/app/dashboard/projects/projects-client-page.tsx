'use client'

import { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Project } from '@/lib/types';
import { toast } from "sonner";
import { fetchSafe } from '@/lib/utils/fetchSafe';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Trash2 } from 'lucide-react'; // Make sure PlusCircle is imported
import { ProjectsToolbar } from '@/components/organisms/ProjectsToolbar';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination";
import { DeleteProjectDialog } from '@/components/organisms/DeleteProjectDialog';
import { Skeleton } from '@/components/ui/skeleton';

const PAGE_SIZE = 10;

type InitialData = {
  initialProjects: Project[];
  initialCount: number;
};

const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
const StatusBadge = ({ status }: { status: string }) => {
    const statusStyles: { [key: string]: string } = {
        draft: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        sent: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        'in-review': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
        completed: 'bg-green-500/20 text-green-400 border-green-500/30',
        archived: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    };
    return <Badge variant="outline" className={`capitalize ${statusStyles[status] || ''}`}>{status}</Badge>;
};

export default function ProjectsClientPage({ initialProjects, initialCount }: InitialData) {
    const [projects, setProjects] = useState(initialProjects);
    const [count, setCount] = useState(initialCount);
    const [loading, setLoading] = useState(false);

    const isInitialLoad = useRef(true);
    const searchParams = useSearchParams();
    const pathname = usePathname();

    const currentPage = Number(searchParams.get('page')) || 1;
    const totalPages = Math.ceil(count / PAGE_SIZE);

    useEffect(() => {
        if (isInitialLoad.current) {
            isInitialLoad.current = false;
            return;
        }

        const fetchProjects = async () => {
            setLoading(true);
            const params = new URLSearchParams(searchParams);
            const apiUrl = `/api/projects?${params.toString()}`;

            try {
                // CORRECCIÓN 1: Usar el tipo 'Project' importado para la respuesta.
                type ProjectsResponse = { data?: Project[]; count?: number };
                const res = await fetchSafe<ProjectsResponse>(apiUrl);
                if (!res.ok) {
                    console.error('Failed to fetch projects:', res.error);
                    toast.error(res.error || 'Failed to fetch projects');
                    setProjects([]);
                    setCount(0);
                } else {
                    const { data, count: newCount } = res.json || {};
                    // CORRECCIÓN 2: Eliminar 'as any' porque 'data' ya tiene el tipo correcto.
                    setProjects(data || []);
                    setCount(newCount || 0);
                }
            } catch {
                toast.error("Error al cargar los proyectos.");
            } finally {
                setLoading(false);
            }
        };

        fetchProjects();

    }, [searchParams, currentPage]);

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

    const renderContent = () => {
        if (loading) {
            return (
                <div className="space-y-2">
                    {Array.from({ length: PAGE_SIZE }).map((_, i) => <Skeleton key={i} className="h-16 w-full"/>)}
                </div>
            );
        }
        if (projects.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center text-center h-full rounded-lg border border-dashed py-20">
                    <p className="text-lg font-semibold">No se encontraron proyectos</p>
                    <p className="text-muted-foreground">Intenta ajustar los filtros o la búsqueda.</p>
                </div>
            );
        }
        return (
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nombre del Proyecto</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Fecha de Creación</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {projects.map((project) => (
                        <TableRow key={project.id}>
                            <TableCell>
                                <Link href={`/dashboard/projects/${project.id}`} className="font-medium text-foreground no-underline hover:text-muted-foreground transition-colors">
                                    {project.project_name}
                                </Link>
                            </TableCell>
                            <TableCell>{project.client_name || 'N/A'}</TableCell>
                            <TableCell><StatusBadge status={project.status} /></TableCell>
                            <TableCell>{formatDate(project.created_at)}</TableCell>
                            <TableCell className="text-right">
                                <DeleteProjectDialog projectId={project.id} projectName={project.project_name || ''} onProjectDeleted={() => handleProjectDeleted(project.id)}>
                                    <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                </DeleteProjectDialog>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        );
    };

    return (
        <div className="p-8 md:p-12 h-full flex flex-col">
            {/* --- Updated Header for Responsiveness --- */}
            <header className="flex flex-col items-start gap-4 pb-6 border-b
                           sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Proyectos de Casting</h1>
                    <p className="text-muted-foreground">Crea y gestiona las selecciones para tus clientes.</p>
                </div>
                {/* Button takes full width on mobile */}
                <Button asChild className="w-full sm:w-auto">
                    <Link href="/dashboard/projects/new"><PlusCircle className="mr-2 h-4 w-4"/>Nuevo Proyecto</Link>
                </Button>
            </header>
            {/* --- END Updated Header --- */}

            <main className="flex-1 py-8 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Tus Proyectos</CardTitle>
                        {/* --- Updated CardDescription for Responsiveness --- */}
                        <CardDescription className="flex flex-col gap-4 pt-2 sm:flex-row sm:justify-between sm:items-center">
                            <span>Filtra y busca entre tus castings activos y pasados.</span>
                            <ProjectsToolbar />
                        </CardDescription>
                         {/* --- END Updated CardDescription --- */}
                    </CardHeader>
                    <CardContent>
                        {renderContent()}
                    </CardContent>
                </Card>

                {/* --- Footer with pagination (Unchanged from previous state) --- */}
                {totalPages > 1 && !loading && (
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
                        <div className="text-sm text-muted-foreground whitespace-nowrap ml-4">
                            Página {currentPage} de {totalPages}
                        </div>
                    </footer>
                )}
            </main>
        </div>
    );
}