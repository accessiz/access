'use client';

import * as React from 'react';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Plus,
    Search,
    Building2,
    Tag,
    MoreHorizontal,
    Pencil,
    Trash2,
    Archive,
    ExternalLink,
    Mail,
    Phone,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

import { ClientWithBrands } from './page';
import { createClient } from '@/lib/supabase/client';
import ClientForm from '@/components/organisms/ClientForm';

type ClientsClientPageProps = {
    initialData: {
        clients: ClientWithBrands[];
        count: number;
    };
};

export default function ClientsClientPage({ initialData }: ClientsClientPageProps) {
    const router = useRouter();
    const [clients, setClients] = useState<ClientWithBrands[]>(initialData.clients);
    const [searchQuery, setSearchQuery] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<ClientWithBrands | null>(null);

    // Filtrar clientes por búsqueda
    const filteredClients = useMemo(() => {
        if (!searchQuery.trim()) return clients;

        const query = searchQuery.toLowerCase();
        return clients.filter(client =>
            client.name.toLowerCase().includes(query) ||
            client.company?.toLowerCase().includes(query) ||
            client.email?.toLowerCase().includes(query) ||
            client.brands?.some(brand => brand.name.toLowerCase().includes(query))
        );
    }, [clients, searchQuery]);

    // Manejar eliminación de cliente
    const handleDeleteClient = async (clientId: string) => {
        const supabase = createClient();

        const { error } = await supabase
            .from('clients')
            .delete()
            .eq('id', clientId);

        if (error) {
            toast.error('Error al eliminar cliente', {
                description: error.message,
            });
            return;
        }

        setClients(prev => prev.filter(c => c.id !== clientId));
        toast.success('Cliente eliminado correctamente');
    };

    // Manejar archivado de cliente
    const handleArchiveClient = async (clientId: string) => {
        const supabase = createClient();

        const { error } = await supabase
            .from('clients')
            .update({ status: 'archived' })
            .eq('id', clientId);

        if (error) {
            toast.error('Error al archivar cliente', {
                description: error.message,
            });
            return;
        }

        setClients(prev => prev.map(c =>
            c.id === clientId ? { ...c, status: 'archived' } : c
        ));
        toast.success('Cliente archivado correctamente');
    };

    // Callback cuando se guarda un cliente (crear o editar)
    const handleClientSaved = (savedClient: ClientWithBrands) => {
        if (editingClient) {
            // Actualizar cliente existente
            setClients(prev => prev.map(c =>
                c.id === savedClient.id ? savedClient : c
            ));
        } else {
            // Agregar nuevo cliente al inicio
            setClients(prev => [savedClient, ...prev]);
        }
        setIsFormOpen(false);
        setEditingClient(null);
        router.refresh();
    };

    // Abrir formulario para editar
    const openEditForm = (client: ClientWithBrands) => {
        setEditingClient(client);
        setIsFormOpen(true);
    };

    // Cerrar formulario
    const closeForm = () => {
        setIsFormOpen(false);
        setEditingClient(null);
    };

    return (
        <div className="flex flex-col gap-6 p-6 md:p-8">
            {/* DS §0: Simplified header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-heading-24 font-semibold">Clientes</h1>
                    <p className="text-copy-12 text-muted-foreground">{clients.length} clientes</p>
                </div>

                <Dialog open={isFormOpen} onOpenChange={(open) => {
                    if (!open) closeForm();
                    else setIsFormOpen(true);
                }}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            Nuevo Cliente
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>
                                {editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}
                            </DialogTitle>
                            <DialogDescription>
                                {editingClient
                                    ? 'Modifica la información del cliente y sus marcas.'
                                    : 'Agrega un nuevo cliente y las marcas que representa.'}
                            </DialogDescription>
                        </DialogHeader>
                        <ClientForm
                            client={editingClient}
                            onSave={handleClientSaved}
                            onCancel={closeForm}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    placeholder="Buscar clientes o marcas..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Stats */}
            <div className="flex gap-4 text-copy-14 text-muted-foreground">
                <span>{filteredClients.length} clientes</span>
                <Separator orientation="vertical" className="h-5" />
                <span>
                    {filteredClients.reduce((acc, c) => acc + (c.brands?.length || 0), 0)} marcas
                </span>
            </div>

            {/* Clients Grid */}
            {filteredClients.length === 0 ? (
                <Card className="flex flex-col items-center justify-center py-16">
                    <Building2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <h3 className="text-heading-20 font-medium mb-2">No hay clientes</h3>
                    <p className="text-copy-14 text-muted-foreground text-center max-w-sm">
                        {searchQuery
                            ? 'No se encontraron clientes con ese criterio de búsqueda.'
                            : 'Comienza agregando tu primer cliente para gestionar sus marcas y proyectos.'}
                    </p>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredClients.map((client) => (
                        <ClientCard
                            key={client.id}
                            client={client}
                            onEdit={() => openEditForm(client)}
                            onDelete={() => handleDeleteClient(client.id)}
                            onArchive={() => handleArchiveClient(client.id)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// Componente de tarjeta de cliente
function ClientCard({
    client,
    onEdit,
    onDelete,
    onArchive,
}: {
    client: ClientWithBrands;
    onEdit: () => void;
    onDelete: () => void;
    onArchive: () => void;
}) {
    const initials = client.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    // DS: Use semantic badge variants (§2.B.4a)
    const statusBadge = {
        active: null,
        inactive: <Badge variant="warning" size="small">Inactivo</Badge>,
        archived: <Badge variant="neutral" size="small">Archivado</Badge>,
    };

    return (
        <Link href={`/dashboard/clients/${client.id}`} className="block">
            <Card className="group relative transition-all hover:shadow-md hover:border-primary/20 cursor-pointer">
                <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={client.avatar_url || undefined} alt={client.name} />
                                <AvatarFallback className="bg-primary/10 text-primary">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <CardTitle className="text-copy-14 font-medium truncate flex items-center gap-2">
                                    {client.name}
                                    {client.status && statusBadge[client.status as keyof typeof statusBadge]}
                                </CardTitle>
                                {client.company && (
                                    <CardDescription className="text-copy-12 truncate">
                                        {client.company}
                                    </CardDescription>
                                )}
                            </div>
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => e.preventDefault()}
                                >
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Acciones</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={onEdit}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={onArchive}>
                                    <Archive className="mr-2 h-4 w-4" />
                                    Archivar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={onDelete}
                                    className="text-destructive focus:text-destructive"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Eliminar
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    {/* Contact Info */}
                    <div className="flex flex-wrap gap-3 text-copy-12 text-muted-foreground">
                        {client.email && (
                            <a
                                href={`mailto:${client.email}`}
                                className="flex items-center gap-1 hover:text-foreground transition-colors"
                            >
                                <Mail className="h-3 w-3" />
                                <span className="truncate max-w-[150px]">{client.email}</span>
                            </a>
                        )}
                        {client.phone && (
                            <a
                                href={`tel:${client.phone}`}
                                className="flex items-center gap-1 hover:text-foreground transition-colors"
                            >
                                <Phone className="h-3 w-3" />
                                <span>{client.phone}</span>
                            </a>
                        )}
                    </div>

                    {/* Brands */}
                    {client.brands && client.brands.length > 0 && (
                        <div className="space-y-2">
                            <div className="flex items-center gap-1 text-copy-12 text-muted-foreground">
                                <Tag className="h-3 w-3" />
                                <span>Marcas ({client.brands.length})</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {client.brands.slice(0, 4).map((brand) => (
                                    <Badge
                                        key={brand.id}
                                        variant="secondary"
                                        className="text-copy-12 font-normal"
                                    >
                                        {brand.name}
                                    </Badge>
                                ))}
                                {client.brands.length > 4 && (
                                    <Badge variant="outline" className="text-copy-12 font-normal">
                                        +{client.brands.length - 4}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Project Count */}
                    {client.projectCount > 0 && (
                        <div className="flex items-center gap-1 text-copy-12 text-muted-foreground pt-2 border-t border-border">
                            <ExternalLink className="h-3 w-3" />
                            <span>{client.projectCount} proyecto{client.projectCount !== 1 ? 's' : ''}</span>
                        </div>
                    )}
                </CardContent>
            </Card>
        </Link>
    );
}
