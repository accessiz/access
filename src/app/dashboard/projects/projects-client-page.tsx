'use client'

import { useState, useMemo } from 'react';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Project } from '@/lib/types';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Trash2, ArrowDown, ArrowUp } from 'lucide-react';
import { ProjectsToolbar } from '@/components/organisms/ProjectsToolbar';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination";
import { DeleteProjectDialog } from '@/components/organisms/DeleteProjectDialog';
import { cn } from '@/lib/utils';

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
    return <Badge variant="outline" className={`capitalize ${statusStyles[status] || ''}`}>{status.replace('-', ' ')}</Badge>;
};

export default function ProjectsClientPage({ initialProjects, initialCount }: InitialData) {
    const [projects, setProjects] = useState(initialProjects);
    const [count, setCount] = useState(initialCount);
    
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
          <div className="flex items-center gap-2">
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
                    <p className="text-heading-20">No se encontraron proyectos</p>
                    <p className="text-muted-foreground">Intenta ajustar los filtros o la búsqueda.</p>
                </div>
            );
        }
        return (
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <SortableHeader tkey="project_name" label="Nombre del Proyecto" />
                            <SortableHeader tkey="client_name" label="Cliente" />
                            <SortableHeader tkey="status" label="Estado" />
                            <SortableHeader tkey="created_at" label="Fecha de Creación" />
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
            </div>
        );
    };

    return (
        <div className="space-y-6">
             <header className="flex flex-col items-start gap-4 pb-6 border-b sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-heading-32">Proyectos</h1>
                    <p className="text-muted-foreground">Crea, busca y gestiona tus castings.</p>
                </div>
                <Button asChild className="w-full sm:w-auto">
                    <Link href="/dashboard/projects/new"><PlusCircle className="mr-2 h-4 w-4"/>Nuevo Proyecto</Link>
                </Button>
            </header>

            <main className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Tus Proyectos</CardTitle>
                        <CardDescription className="flex flex-col gap-4 pt-2 sm:flex-row sm:justify-between sm:items-center">
                            <span>Filtra y busca entre tus castings activos y pasados.</span>
                            <ProjectsToolbar />
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {renderContent()}
                    </CardContent>
                </Card>

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
                        <div className="text-label-13 text-muted-foreground whitespace-nowrap ml-4">
                            Página {currentPage} de {totalPages}
                        </div>
                    </footer>
                )}
            </main>
        </div>
    );
}
