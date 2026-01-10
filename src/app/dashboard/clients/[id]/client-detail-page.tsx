'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Mail,
    Phone,
    Pencil,
    Wallet,
    Users,
    Mars,
    Venus,
    VenusAndMars,
    FolderOpen,
    TrendingUp,
    Calendar,
    ExternalLink,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { KPICard } from '@/components/molecules/KPICard';
import { BackButton } from '@/components/molecules/BackButton';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SegmentedControl } from '@/components/molecules/SegmentedControl';
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
import { ProjectStatusBadge } from '@/components/molecules/ProjectStatusBadge';

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
    const [frequentModelsGenderFilter, setFrequentModelsGenderFilter] = React.useState<'all' | 'male' | 'female'>('all');

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

    const normalizeGender = (gender: string | null | undefined): 'male' | 'female' | null => {
        if (!gender) return null;
        const value = gender.trim().toLowerCase();
        if (['male', 'm', 'man', 'hombre', 'masculino'].includes(value)) return 'male';
        if (['female', 'f', 'woman', 'mujer', 'femenino'].includes(value)) return 'female';
        return null;
    };

    const frequentModelsFiltered = React.useMemo(() => {
        if (frequentModelsGenderFilter === 'all') return client.frequent_models;
        return client.frequent_models.filter((model) => {
            const gender = normalizeGender(model.gender);
            return frequentModelsGenderFilter === gender;
        });
    }, [client.frequent_models, frequentModelsGenderFilter]);

    return (
        <div className="flex flex-col gap-6">
            <header className="flex flex-col gap-x-4 gap-y-4 pb-4 border-b sm:flex-row sm:items-center">
                <div className="flex items-center gap-x-4 gap-y-4 sm:flex-1">
                    <BackButton href="/dashboard/clients" label="Volver a Clientes" />

                    <div className="flex items-center gap-x-4 gap-y-4 min-w-0">
                        <Avatar>
                            <AvatarImage src={client.avatar_url || undefined} alt={client.name} />
                            <AvatarFallback className="bg-primary/10 text-primary text-body font-semibold">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                            <h1 className="text-display font-semibold">{client.name}</h1>
                            {client.company && (
                                <p className="text-body text-muted-foreground">{client.company}</p>
                            )}
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-3 mt-2 text-body text-muted-foreground">
                                {client.email && (
                                    <a
                                        href={`mailto:${client.email}`}
                                        className="flex items-center gap-x-1.5 gap-y-1.5 hover:text-foreground transition-colors"
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
                                            className="flex items-center gap-x-1.5 gap-y-1.5 hover:text-foreground transition-colors"
                                        >
                                            <Phone className="h-4 w-4" />
                                            {client.phone}
                                        </a>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <Button
                        variant="outline"
                        className="gap-x-2 gap-y-2"
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
            </header>

            {/* KPI Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <KPICard
                    title="Proyectos"
                    value={client.kpis.total_projects.toString()}
                    description="Total de proyectos"
                    icon={FolderOpen}
                    iconClassName="text-info"
                />
                <KPICard
                    title="Ingresos Generados"
                    value={formatCurrency(client.kpis.total_revenue)}
                    description="Total estimado"
                    icon={Wallet}
                    iconClassName="text-success"
                />
                <KPICard
                    title="Modelos"
                    value={client.kpis.unique_models.toString()}
                    description="Modelos únicos usados"
                    icon={Users}
                    iconClassName="text-accent"
                />
                <KPICard
                    title="Campañas Activas"
                    value={client.kpis.active_campaigns.toString()}
                    description="En progreso actualmente"
                    icon={TrendingUp}
                    iconClassName="text-warning"
                />
            </div>

            {/* Bento Grid */}
            <div className="grid gap-6 lg:grid-cols-4 auto-rows-min">
                {/* Proyectos */}
                <div className="lg:col-span-4">
                    <Card>
                        <CardHeader className="p-4 pb-3 flex flex-row items-center justify-between gap-x-4 gap-y-4 space-y-0">
                            <CardTitle className="font-semibold">Proyectos</CardTitle>
                            <Link
                                href={`/dashboard/projects?client=${client.id}`}
                                className="text-body text-primary hover:underline"
                            >
                                Ver todos
                            </Link>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            {client.projects.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-6">
                                    <FolderOpen className="h-10 w-10 text-muted-foreground/50 mb-3" />
                                    <p className="text-body text-muted-foreground">
                                        No hay proyectos con este cliente aún.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {client.projects.map((project) => (
                                        <ProjectCard key={project.id} project={project} />
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Modelos frecuentes */}
                <div className="lg:col-span-2">
                    <Card className="h-full flex flex-col">
                        <CardHeader className="p-4 pb-3 flex flex-row items-center justify-between gap-x-4 gap-y-4 space-y-0">
                            <CardTitle className="font-semibold">Modelos Frecuentes</CardTitle>
                            <SegmentedControl
                                value={frequentModelsGenderFilter}
                                onValueChange={setFrequentModelsGenderFilter}
                                ariaLabel="Filtrar modelos frecuentes por género"
                                options={[
                                    {
                                        value: 'all',
                                        label: 'Todos',
                                        iconOnly: true,
                                        icon: <VenusAndMars className="h-4 w-4" aria-hidden="true" />,
                                    },
                                    {
                                        value: 'female',
                                        label: 'Mujeres',
                                        iconOnly: true,
                                        icon: <Venus className="h-4 w-4" aria-hidden="true" />,
                                    },
                                    {
                                        value: 'male',
                                        label: 'Hombres',
                                        iconOnly: true,
                                        icon: <Mars className="h-4 w-4" aria-hidden="true" />,
                                    },
                                ]}
                            />
                        </CardHeader>
                        <CardContent className="p-4 pt-0 space-y-3 flex-1">
                            {frequentModelsFiltered.length === 0 ? (
                                <p className="text-body text-muted-foreground">
                                    No hay modelos para este filtro.
                                </p>
                            ) : (
                                frequentModelsFiltered.slice(0, 10).map((model) => {
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
                                            className="flex flex-col items-start gap-x-3 gap-y-2 p-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors sm:flex-row sm:items-center sm:gap-y-3"
                                        >
                                            <Avatar className="h-8 w-8">
                                                {model.cover_path && (
                                                    <AvatarImage
                                                        src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/model-media/${model.cover_path}`}
                                                        alt={displayName}
                                                    />
                                                )}
                                                <AvatarFallback className="bg-primary/10 text-primary text-label">
                                                    {modelInitials}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-body font-medium wrap-break-word sm:truncate">{displayName}</p>
                                            </div>
                                            <Badge variant="secondary" className="text-label shrink-0 self-end sm:self-auto">
                                                {model.usage_count}x
                                            </Badge>
                                        </Link>
                                    );
                                })
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Marcas */}
                <div className="lg:col-span-2">
                    <Card className="h-full flex flex-col">
                        <CardHeader className="p-4 pb-3">
                            <CardTitle className="font-semibold">Marcas</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 flex-1">
                            {client.brands.length === 0 ? (
                                <p className="text-body text-muted-foreground">
                                    No hay marcas asociadas.
                                </p>
                            ) : (
                                <div className="flex flex-wrap gap-x-2 gap-y-2">
                                    {client.brands.map((brand) => (
                                        <Badge
                                            key={brand.id}
                                            variant="secondary"
                                            className="text-body max-w-full whitespace-normal wrap-break-word"
                                        >
                                            {brand.name}
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Notas */}
                {client.notes && (
                    <Card className="lg:col-span-4">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-body font-medium">
                                Notas
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-body text-muted-foreground whitespace-pre-wrap">
                                {client.notes}
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* Cliente desde */}
                {client.created_at && (
                    <Card className="lg:col-span-4">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-x-2 gap-y-2 text-body text-muted-foreground">
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
    );
}

// Project Card Component
function ProjectCard({
    project,
}: {
    project: ClientDetailData['projects'][0];
}) {
    const status = project.status || 'planning';

    const dateDisplay = project.start_date
        ? format(parseISO(project.start_date), "MMM yyyy", { locale: es })
        : '-';

    return (
        <Link href={`/dashboard/projects/${project.id}`} className="block">
            <Card className="hover:shadow-md hover:border-primary/20 transition-all cursor-pointer">
                <CardContent className="p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-x-4 sm:gap-y-4">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-x-2 gap-y-2">
                                <h3 className="font-medium wrap-break-word sm:truncate">{project.project_name}</h3>
                            </div>
                            <div className="flex items-center gap-x-3 gap-y-3 mt-1 text-label text-muted-foreground">
                                <span>{dateDisplay}</span>
                                <span>•</span>
                                <span>{project.models_count} modelo{project.models_count !== 1 ? 's' : ''}</span>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 justify-between w-full sm:w-auto sm:flex-nowrap sm:justify-end sm:shrink-0">
                            {project.default_model_fee && (
                                <span className="font-semibold">
                                    {formatCurrency(project.default_model_fee * project.models_count, project.currency)}
                                </span>
                            )}
                            <ProjectStatusBadge status={status} />
                            <ExternalLink className="h-4 w-4 text-muted-foreground" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}
