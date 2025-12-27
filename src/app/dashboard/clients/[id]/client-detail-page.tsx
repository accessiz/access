'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft,
    Mail,
    Phone,
    Pencil,
    Building2,
    Wallet,
    Users,
    FolderOpen,
    TrendingUp,
    Calendar,
    ExternalLink,
    CheckCircle2,
    Clock,
    AlertCircle,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

import { ClientDetailData } from './page';
import ClientForm from '@/components/organisms/ClientForm';
import { Brand } from '@/lib/types';

// Configuración de estados de proyecto
const PROJECT_STATUS_CONFIG: Record<string, {
    label: string;
    icon: React.ElementType;
    className: string;
    badgeVariant: 'default' | 'secondary' | 'outline' | 'destructive';
}> = {
    planning: {
        label: 'Planificando',
        icon: Clock,
        className: 'text-yellow-600',
        badgeVariant: 'outline',
    },
    active: {
        label: 'Activo',
        icon: TrendingUp,
        className: 'text-blue-600',
        badgeVariant: 'secondary',
    },
    in_progress: {
        label: 'En progreso',
        icon: TrendingUp,
        className: 'text-blue-600',
        badgeVariant: 'secondary',
    },
    completed: {
        label: 'Completado',
        icon: CheckCircle2,
        className: 'text-green-600',
        badgeVariant: 'default',
    },
    cancelled: {
        label: 'Cancelado',
        icon: AlertCircle,
        className: 'text-muted-foreground',
        badgeVariant: 'outline',
    },
};

// Formatear moneda
function formatCurrency(amount: number | null, currency: string = 'GTQ'): string {
    if (amount === null || amount === undefined) return '-';
    return new Intl.NumberFormat('es-GT', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

type ClientDetailPageProps = {
    client: ClientDetailData;
};

export default function ClientDetailPage({ client }: ClientDetailPageProps) {
    const router = useRouter();
    const [isEditOpen, setIsEditOpen] = React.useState(false);

    const initials = client.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    const handleClientSaved = () => {
        setIsEditOpen(false);
        router.refresh();
    };

    return (
        <div className="flex flex-col gap-6 p-6 md:p-8">
            {/* Header */}
            <div className="flex flex-col gap-4">
                {/* Back button */}
                <Link
                    href="/dashboard/clients"
                    className="flex items-center gap-1 text-copy-14 text-muted-foreground hover:text-foreground transition-colors w-fit"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Clientes
                </Link>

                {/* Client Info */}
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                            <AvatarImage src={client.avatar_url || undefined} alt={client.name} />
                            <AvatarFallback className="bg-primary/10 text-primary text-xl">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h1 className="text-heading-28 font-semibold">{client.name}</h1>
                            {client.company && (
                                <p className="text-copy-14 text-muted-foreground">{client.company}</p>
                            )}
                            <div className="flex flex-wrap items-center gap-3 mt-2 text-copy-14 text-muted-foreground">
                                {client.email && (
                                    <a
                                        href={`mailto:${client.email}`}
                                        className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                                    >
                                        <Mail className="h-4 w-4" />
                                        {client.email}
                                    </a>
                                )}
                                {client.phone && (
                                    <>
                                        {client.email && <span>•</span>}
                                        <a
                                            href={`tel:${client.phone}`}
                                            className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                                        >
                                            <Phone className="h-4 w-4" />
                                            {client.phone}
                                        </a>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                        <Button
                            variant="outline"
                            className="gap-2"
                            onClick={() => setIsEditOpen(true)}
                        >
                            <Pencil className="h-4 w-4" />
                            Editar
                        </Button>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Editar Cliente</DialogTitle>
                                <DialogDescription>
                                    Modifica la información del cliente y sus marcas.
                                </DialogDescription>
                            </DialogHeader>
                            <ClientForm
                                client={{
                                    id: client.id,
                                    name: client.name,
                                    email: client.email,
                                    phone: client.phone,
                                    company: client.company,
                                    notes: client.notes,
                                    avatar_url: client.avatar_url,
                                    status: client.status,
                                    created_at: client.created_at,
                                    updated_at: null,
                                    user_id: '',
                                    brands: client.brands as Brand[],
                                    projectCount: client.kpis.total_projects,
                                }}
                                onSave={handleClientSaved}
                                onCancel={() => setIsEditOpen(false)}
                            />
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <KPICard
                    title="Proyectos"
                    value={client.kpis.total_projects.toString()}
                    description="Total de proyectos"
                    icon={FolderOpen}
                    iconClassName="text-blue-600"
                />
                <KPICard
                    title="Ingresos Generados"
                    value={formatCurrency(client.kpis.total_revenue)}
                    description="Total estimado"
                    icon={Wallet}
                    iconClassName="text-green-600"
                />
                <KPICard
                    title="Modelos"
                    value={client.kpis.unique_models.toString()}
                    description="Modelos únicos usados"
                    icon={Users}
                    iconClassName="text-purple-600"
                />
                <KPICard
                    title="Campañas Activas"
                    value={client.kpis.active_campaigns.toString()}
                    description="En progreso actualmente"
                    icon={TrendingUp}
                    iconClassName="text-yellow-600"
                />
            </div>

            {/* Content Grid */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Projects List */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-heading-20 font-semibold">Proyectos</h2>
                        <Link
                            href={`/dashboard/projects?client=${client.id}`}
                            className="text-copy-14 text-primary hover:underline"
                        >
                            Ver todos
                        </Link>
                    </div>

                    {client.projects.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <FolderOpen className="h-10 w-10 text-muted-foreground/50 mb-3" />
                                <p className="text-copy-14 text-muted-foreground">
                                    No hay proyectos con este cliente aún.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {client.projects.map((project) => (
                                <ProjectCard key={project.id} project={project} />
                            ))}
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Brands */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-copy-14 font-medium flex items-center gap-2">
                                <Building2 className="h-4 w-4" />
                                Marcas
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {client.brands.length === 0 ? (
                                <p className="text-copy-14 text-muted-foreground">
                                    No hay marcas asociadas.
                                </p>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {client.brands.map((brand) => (
                                        <Badge
                                            key={brand.id}
                                            variant="secondary"
                                            className="text-copy-14"
                                        >
                                            {brand.name}
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Frequent Models */}
                    {client.frequent_models.length > 0 && (
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-copy-14 font-medium flex items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    Modelos Frecuentes
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {client.frequent_models.map((model) => {
                                    const modelInitials = model.full_name
                                        .split(' ')
                                        .map(n => n[0])
                                        .join('')
                                        .toUpperCase()
                                        .slice(0, 2);
                                    const displayName = model.alias || model.full_name;

                                    return (
                                        <Link
                                            key={model.id}
                                            href={`/dashboard/models/${model.id}`}
                                            className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors"
                                        >
                                            <Avatar className="h-8 w-8">
                                                {model.cover_path && (
                                                    <AvatarImage
                                                        src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/model-media/${model.cover_path}`}
                                                        alt={displayName}
                                                    />
                                                )}
                                                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                                    {modelInitials}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-copy-14 font-medium truncate">{displayName}</p>
                                            </div>
                                            <Badge variant="secondary" className="text-xs">
                                                {model.usage_count}x
                                            </Badge>
                                        </Link>
                                    );
                                })}
                            </CardContent>
                        </Card>
                    )}

                    {/* Notes */}
                    {client.notes && (
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-copy-14 font-medium">
                                    Notas
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-copy-14 text-muted-foreground whitespace-pre-wrap">
                                    {client.notes}
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Client Since */}
                    {client.created_at && (
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-2 text-copy-14 text-muted-foreground">
                                    <Calendar className="h-4 w-4" />
                                    <span>
                                        Cliente desde {format(parseISO(client.created_at), "MMMM yyyy", { locale: es })}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}

// KPI Card Component
function KPICard({
    title,
    value,
    description,
    icon: Icon,
    iconClassName,
}: {
    title: string;
    value: string;
    description: string;
    icon: React.ElementType;
    iconClassName?: string;
}) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-copy-14 font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                <Icon className={`h-5 w-5 ${iconClassName}`} />
            </CardHeader>
            <CardContent>
                <div className="text-heading-25 font-semibold">{value}</div>
                <p className="text-copy-12 text-muted-foreground">{description}</p>
            </CardContent>
        </Card>
    );
}

// Project Card Component
function ProjectCard({
    project,
}: {
    project: ClientDetailData['projects'][0];
}) {
    const status = project.status || 'planning';
    const statusConfig = PROJECT_STATUS_CONFIG[status] || PROJECT_STATUS_CONFIG.planning;
    const StatusIcon = statusConfig.icon;

    const dateDisplay = project.start_date
        ? format(parseISO(project.start_date), "MMM yyyy", { locale: es })
        : '-';

    return (
        <Link href={`/dashboard/projects/${project.id}`}>
            <Card className="hover:shadow-md hover:border-primary/20 transition-all cursor-pointer">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <h3 className="font-medium truncate">{project.project_name}</h3>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-copy-12 text-muted-foreground">
                                <span>{dateDisplay}</span>
                                <span>•</span>
                                <span>{project.models_count} modelo{project.models_count !== 1 ? 's' : ''}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 flex-shrink-0">
                            {project.default_model_fee && (
                                <span className="font-semibold">
                                    {formatCurrency(project.default_model_fee * project.models_count, project.currency)}
                                </span>
                            )}
                            <Badge variant={statusConfig.badgeVariant} className="gap-1">
                                <StatusIcon className={`h-3 w-3 ${statusConfig.className}`} />
                                {statusConfig.label}
                            </Badge>
                            <ExternalLink className="h-4 w-4 text-muted-foreground" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}
