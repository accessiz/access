'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, FormProvider } from 'react-hook-form';
import { Button } from '../../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Input } from '../../../../components/ui/input';
import { modelFormSchema, ModelFormData } from '../../../../lib/schemas';
import { Model } from '../../../../lib/types';
import { updateModel } from '../../../../lib/actions/models';
import { toast } from 'sonner';
import { Grid } from '../../../../components/ui/grid';
import { CompCardManager } from '../../../../components/organisms/CompCardManager';
import { DeleteModelDialog } from '../../../../components/organisms/DeleteModelDialog';
import { Badge } from '../../../../components/ui/badge';
import Link from 'next/link';
import { useState, useMemo } from 'react';
import { Pencil, Save, X, User, ImageIcon, Briefcase, Clock, CheckCircle2, AlertCircle, Wallet, TrendingUp, Building2, Search, Send, XCircle, HourglassIcon } from 'lucide-react';
import { ModelForm } from '../../../../components/organisms/ModelForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs';

// Define el tipo extendido que incluye las URLs/paths
type ModelWithImages = Model & {
  coverUrl?: string | null;
  portfolioUrl?: string | null;
  compCardUrls?: (string | null)[];
  cover_path?: string | null;
  portfolio_path?: string | null;
  comp_card_paths?: (string | null)[] | null;
};

// Interface for work history items
interface WorkHistoryItem {
  projectId: string;
  projectName: string;
  clientName: string | null;
  brandName: string | null;
  projectStatus: string;
  clientSelection: string;
  createdAt: string;
  agreedFee: number;
  feeType: string;
  currency: string;
  daysWorked: number;
  totalAmount: number;
  paymentStatus: 'pending' | 'paid' | 'partial';
  lastPaymentDate: string | null;
  firstWorkDate: string | null;
  lastWorkDate: string | null;
}

interface ModelProfileClientProps {
  initialModel: ModelWithImages;
  workHistory?: WorkHistoryItem[];
}

// Componente para mostrar la información en modo de solo lectura
const InfoDisplay = ({ label, value }: { label: string; value: string | number | null | undefined }) => (
  <div className="space-y-1">
    <p className="text-sm font-medium text-muted-foreground">{label}</p>
    <p className="text-base">{value || '-'}</p>
  </div>
);

// Define los estados válidos que espera el formulario
const VALID_STATUSES = ['active', 'inactive', 'archived'] as const;
type ModelStatus = typeof VALID_STATUSES[number];

function isValidStatus(status: unknown): status is ModelStatus {
  if (typeof status !== 'string') return false;
  return VALID_STATUSES.includes(status as ModelStatus);
}

export default function ModelProfilePageClient({ initialModel, workHistory = [] }: ModelProfileClientProps) {
  const [isEditing, setIsEditing] = useState(false);

  const safeParseInt = (value: string | number | null | undefined): number | null => {
    if (value === null || value === undefined || value === '') return null;
    const parsed = parseInt(String(value), 10);
    return isNaN(parsed) ? null : parsed;
  };

  const normalizeShoeSize = (value: number | string | null | undefined): number | null => {
    if (value === null || value === undefined || value === '') return null;
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return null;
    const rounded = Number(parsed.toFixed(1));
    return isNaN(rounded) ? null : rounded;
  };

  const form = useForm<ModelFormData>({
    resolver: zodResolver(modelFormSchema),
    defaultValues: {
      alias: initialModel.alias ?? '',
      full_name: initialModel.full_name ?? '',
      gender: initialModel.gender ?? null,
      birth_date: initialModel.birth_date ?? '',
      national_id: initialModel.national_id ?? '',
      phone_e164: initialModel.phone_e164 ?? '',
      email: initialModel.email ?? '',
      country: initialModel.country ?? null,
      height_cm: initialModel.height_cm ?? null,
      shoulders_cm: initialModel.shoulders_cm ?? null,
      chest_cm: initialModel.chest_cm ?? null,
      bust_cm: initialModel.bust_cm ?? null,
      waist_cm: initialModel.waist_cm ?? null,
      hips_cm: initialModel.hips_cm ?? null,
      top_size: initialModel.top_size ?? null,
      pants_size: safeParseInt(initialModel.pants_size),
      shoe_size_us: normalizeShoeSize(initialModel.shoe_size_us),
      instagram: initialModel.instagram ?? '',
      tiktok: initialModel.tiktok ?? '',
      status: isValidStatus(initialModel.status) ? initialModel.status : 'active',
      eye_color: initialModel.eye_color ?? '',
      hair_color: initialModel.hair_color ?? '',
      date_joined_agency: initialModel.date_joined_agency ? new Date(initialModel.date_joined_agency).toISOString().split('T')[0] : '',
    },
  });

  const { formState: { isSubmitting } } = form;

  async function onSubmit(data: ModelFormData) {
    const result = await updateModel(initialModel.id, data);
    if (result.success) {
      toast.success('Modelo actualizado correctamente.');
      setIsEditing(false);
    } else {
      toast.error(result.error || 'Error al actualizar el modelo');
    }
  }

  const handleCancel = () => {
    form.reset();
    setIsEditing(false);
  }

  // Estados para filtros de la pestaña de Trabajos
  const [workSearchQuery, setWorkSearchQuery] = useState('');
  const [workStatusFilter, setWorkStatusFilter] = useState<'all' | 'pending' | 'paid'>('all');

  // Estados para filtros de la pestaña de Postulaciones
  const [appSearchQuery, setAppSearchQuery] = useState('');
  const [appStatusFilter, setAppStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // Separar trabajos completados de postulaciones
  // Trabajos: Solo aprobados + fecha de producción pasada (al menos 1 día después)
  const completedWork = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return workHistory.filter(item => {
      // Requisito 1: Debe estar aprobado por el cliente
      if (item.clientSelection !== 'approved') return false;

      // Requisito 2: Debe haber pasado la fecha de producción
      if (!item.lastWorkDate) return false;

      const workDate = new Date(item.lastWorkDate + 'T00:00:00');
      const nextDay = new Date(workDate);
      nextDay.setDate(nextDay.getDate() + 1);

      return today >= nextDay;
    });
  }, [workHistory]);

  // Cálculos para la pestaña de Trabajos (solo trabajos completados)
  const workStats = useMemo(() => {
    const totalEarned = completedWork.reduce((acc, job) => acc + (job.totalAmount || job.agreedFee * (job.daysWorked || 1)), 0);
    const totalPending = completedWork
      .filter((job) => job.paymentStatus !== 'paid')
      .reduce((acc, job) => acc + (job.totalAmount || job.agreedFee * (job.daysWorked || 1)), 0);
    const paidCount = completedWork.filter((job) => job.paymentStatus === 'paid').length;
    const pendingCount = completedWork.filter((job) => job.paymentStatus !== 'paid').length;

    return { totalEarned, totalPending, paidCount, pendingCount };
  }, [completedWork]);

  // Filtrar historial de trabajos (solo completados)
  const filteredWorkHistory = useMemo(() => {
    let filtered = completedWork;

    // Filtro por estado de pago
    if (workStatusFilter === 'pending') {
      filtered = filtered.filter((job) => job.paymentStatus !== 'paid');
    } else if (workStatusFilter === 'paid') {
      filtered = filtered.filter((job) => job.paymentStatus === 'paid');
    }

    // Búsqueda
    if (workSearchQuery.trim()) {
      const query = workSearchQuery.toLowerCase();
      filtered = filtered.filter((job) =>
        job.projectName?.toLowerCase().includes(query) ||
        job.clientName?.toLowerCase().includes(query) ||
        job.brandName?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [completedWork, workStatusFilter, workSearchQuery]);

  // Estadísticas de postulaciones
  const appStats = useMemo(() => {
    const pending = workHistory.filter(a => a.clientSelection === 'pending').length;
    const approved = workHistory.filter(a => a.clientSelection === 'approved').length;
    const rejected = workHistory.filter(a => a.clientSelection === 'rejected').length;
    return { pending, approved, rejected, total: workHistory.length };
  }, [workHistory]);

  // Filtrar postulaciones
  const filteredApplications = useMemo(() => {
    let filtered = workHistory;

    if (appStatusFilter !== 'all') {
      filtered = filtered.filter(app => app.clientSelection === appStatusFilter);
    }

    if (appSearchQuery.trim()) {
      const query = appSearchQuery.toLowerCase();
      filtered = filtered.filter(app =>
        app.projectName?.toLowerCase().includes(query) ||
        app.clientName?.toLowerCase().includes(query) ||
        app.brandName?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [workHistory, appStatusFilter, appSearchQuery]);

  return (
    <div className="space-y-8">
      <header className="flex flex-col items-start gap-4 pb-6 border-b md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-heading-32">
            {initialModel.alias || initialModel.full_name}
          </h1>
          <p className="text-muted-foreground text-xs font-mono select-all">
            {initialModel.id}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)}>
              <Pencil className="mr-2 h-4 w-4" /> Editar Perfil
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleCancel}>
                <X className="mr-2 h-4 w-4" /> Cancelar
              </Button>
              <Button type="button" disabled={isSubmitting} onClick={() => {
                const formEl = document.getElementById('model-edit-form') as HTMLFormElement | null;
                if (formEl) formEl.requestSubmit();
              }}>
                <Save className="mr-2 h-4 w-4" />
                {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </>
          )}
        </div>
      </header>

      <Tabs defaultValue="info" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="info" className="gap-2">
            <User className="h-4 w-4" /> Información
          </TabsTrigger>
          <TabsTrigger value="media" className="gap-2">
            <ImageIcon className="h-4 w-4" /> Media
          </TabsTrigger>
          <TabsTrigger value="work" className="gap-2">
            <Briefcase className="h-4 w-4" /> Trabajos
            {completedWork.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">{completedWork.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="applications" className="gap-2">
            <Send className="h-4 w-4" /> Postulaciones
            {workHistory.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">{workHistory.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-6 outline-none focus-visible:ring-0">
          {isEditing ? (
            <FormProvider {...form}>
              <form id="model-edit-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <ModelForm isSubmitting={isSubmitting} />
              </form>
            </FormProvider>
          ) : (
            <div className="space-y-6">
              {/* Fila 1: Información Personal */}
              <Card>
                <CardHeader><CardTitle>Información Personal</CardTitle></CardHeader>
                <CardContent>
                  <Grid cols={3}>
                    <InfoDisplay label="Nombre Completo" value={initialModel.full_name} />
                    <InfoDisplay label="Alias" value={initialModel.alias} />
                    <InfoDisplay label="Género" value={initialModel.gender} />
                    <InfoDisplay label="Fecha de Nacimiento" value={initialModel.birth_date} />
                    <InfoDisplay label="Documento ID" value={initialModel.national_id} />
                    <InfoDisplay label="País" value={initialModel.country} />
                  </Grid>
                </CardContent>
              </Card>

              {/* Fila 2: Medidas y Tallas */}
              <Card>
                <CardHeader><CardTitle>Medidas y Tallas</CardTitle></CardHeader>
                <CardContent>
                  <Grid cols={5}>
                    <InfoDisplay label="Estatura (cm)" value={initialModel.height_cm} />
                    <InfoDisplay label="Hombros (cm)" value={initialModel.shoulders_cm} />
                    {initialModel.gender === 'Male' ? <InfoDisplay label="Pecho (cm)" value={initialModel.chest_cm} /> : <InfoDisplay label="Busto (cm)" value={initialModel.bust_cm} />}
                    <InfoDisplay label="Cintura (cm)" value={initialModel.waist_cm} />
                    <InfoDisplay label="Cadera (cm)" value={initialModel.hips_cm} />
                    <InfoDisplay label="Talla de Top" value={initialModel.top_size} />
                    <InfoDisplay label="Talla de Pantalón" value={initialModel.pants_size} />
                    <InfoDisplay label="Talla de Zapato (US)" value={initialModel.shoe_size_us} />
                    <InfoDisplay label="Color de Ojos" value={initialModel.eye_color} />
                    <InfoDisplay label="Color de Cabello" value={initialModel.hair_color} />
                  </Grid>
                </CardContent>
              </Card>

              {/* Fila 3: Contacto */}
              <Card>
                <CardHeader><CardTitle>Contacto</CardTitle></CardHeader>
                <CardContent>
                  <Grid cols={4}>
                    <InfoDisplay label="Teléfono" value={initialModel.phone_e164} />
                    <InfoDisplay label="Email" value={initialModel.email} />
                    <InfoDisplay label="Instagram" value={initialModel.instagram ? `@${initialModel.instagram.replace('@', '')}` : null} />
                    <InfoDisplay label="TikTok" value={initialModel.tiktok ? `@${initialModel.tiktok.replace('@', '')}` : null} />
                  </Grid>
                </CardContent>
              </Card>

              {/* Fila 4: Estado en la Agencia */}
              <Card>
                <CardHeader><CardTitle>Estado en la Agencia</CardTitle></CardHeader>
                <CardContent>
                  <Grid cols={2}>
                    <InfoDisplay label="Fecha de Ingreso" value={initialModel.date_joined_agency} />
                    <InfoDisplay label="Estado" value={initialModel.status} />
                  </Grid>
                </CardContent>
              </Card>

              <Card className="border-destructive/50">
                <CardHeader><CardTitle className="text-destructive">Zona de peligro</CardTitle></CardHeader>
                <CardContent className="flex items-center justify-between p-6 bg-destructive/5 rounded-lg border border-destructive/20 mx-6 mb-6">
                  <div>
                    <h3 className="font-semibold text-destructive">Eliminar Perfil</h3>
                    <p className="text-sm text-muted-foreground">Esta acción borrará permanentemente todos los datos y fotos.</p>
                  </div>
                  <DeleteModelDialog modelId={initialModel.id} modelAlias={initialModel.alias || 'talento'}>
                    <Button variant="destructive">Eliminar Modelo</Button>
                  </DeleteModelDialog>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="media" className="space-y-6 outline-none">
          <CompCardManager
            model={initialModel}
            modelId={initialModel.id}
            initialCoverUrl={initialModel.coverUrl}
            initialPortfolioUrl={initialModel.portfolioUrl}
            initialCompCardUrls={initialModel.compCardUrls}
            initialCoverPath={initialModel.cover_path}
            initialPortfolioPath={initialModel.portfolio_path}
            initialCompCardPaths={initialModel.comp_card_paths ?? undefined}
          />
        </TabsContent>

        <TabsContent value="work" className="space-y-6 outline-none">
          {/* KPI Cards - Secuencia lógica: Trabajos → Ganado → Pagado → Pendiente */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Proyectos</CardTitle>
                <Briefcase className="h-5 w-5 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{completedWork.length}</div>
                <p className="text-xs text-muted-foreground">Trabajos completados</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Generado</CardTitle>
                <TrendingUp className="h-5 w-5 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Q{workStats.totalEarned.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Ganancias históricas</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pagados</CardTitle>
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{workStats.paidCount}</div>
                <p className="text-xs text-muted-foreground">Trabajos completados</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Por Cobrar</CardTitle>
                <Wallet className="h-5 w-5 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">Q{workStats.totalPending.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">{workStats.pendingCount} pendientes</p>
              </CardContent>
            </Card>
          </div>

          {/* Filtros y búsqueda */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2">
              <Button
                variant={workStatusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setWorkStatusFilter('all')}
              >
                Todos ({workHistory.length})
              </Button>
              <Button
                variant={workStatusFilter === 'pending' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setWorkStatusFilter('pending')}
                className={workStatusFilter === 'pending' ? '' : 'border-yellow-500/50 text-yellow-600 hover:bg-yellow-50'}
              >
                <Clock className="h-4 w-4 mr-1" />
                Pendientes ({workStats.pendingCount})
              </Button>
              <Button
                variant={workStatusFilter === 'paid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setWorkStatusFilter('paid')}
                className={workStatusFilter === 'paid' ? '' : 'border-green-500/50 text-green-600 hover:bg-green-50'}
              >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Pagados ({workStats.paidCount})
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar proyecto..."
                value={workSearchQuery}
                onChange={(e) => setWorkSearchQuery(e.target.value)}
                className="pl-10 w-[200px] sm:w-[250px]"
              />
            </div>
          </div>

          {/* Lista de trabajos */}
          <div className="space-y-3">
            {filteredWorkHistory.length > 0 ? (
              filteredWorkHistory.map((job) => {
                const paymentStatusMap = {
                  paid: { label: 'Pagado', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' },
                  partial: { label: 'Parcial', icon: AlertCircle, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
                  pending: { label: 'Pendiente', icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900/30' },
                };
                const statusKey = (job.paymentStatus as 'paid' | 'partial' | 'pending') || 'pending';
                const paymentStatusConfig = paymentStatusMap[statusKey] || paymentStatusMap.pending;

                const StatusIcon = paymentStatusConfig.icon;
                const daysText = job.daysWorked === 1 ? '1 día' : `${job.daysWorked} días`;
                const totalAmount = job.totalAmount || (job.agreedFee * (job.daysWorked || 1));

                return (
                  <Card key={job.projectId} className="hover:bg-muted/30 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        {/* Left: Info */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/dashboard/projects/${job.projectId}`}
                              className="font-semibold text-base hover:text-primary hover:underline transition-colors"
                            >
                              {job.projectName}
                            </Link>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Building2 className="h-3 w-3" />
                            <span>{job.brandName || job.clientName || 'Sin cliente'}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>{daysText} × {job.currency} {job.agreedFee?.toLocaleString()}</span>
                          </div>
                        </div>

                        {/* Right: Amount and Status */}
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <div className="text-lg font-bold">
                            {job.currency} {totalAmount.toLocaleString()}
                          </div>
                          <Badge variant="outline" className={`gap-1 ${paymentStatusConfig.color} ${paymentStatusConfig.bg}`}>
                            <StatusIcon className="h-3 w-3" />
                            {paymentStatusConfig.label}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Briefcase className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    {workSearchQuery || workStatusFilter !== 'all'
                      ? 'No hay resultados'
                      : 'Sin trabajos completados'}
                  </h3>
                  <p className="text-sm text-muted-foreground text-center max-w-sm">
                    {workSearchQuery || workStatusFilter !== 'all'
                      ? 'Intenta con otros filtros de búsqueda.'
                      : 'Los trabajos aparecen aquí después de ser aprobados y haber pasado la fecha de producción.'}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Pestaña de Postulaciones */}
        <TabsContent value="applications" className="space-y-6 outline-none">
          {/* Filtros y búsqueda */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={appStatusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAppStatusFilter('all')}
              >
                Todas ({appStats.total})
              </Button>
              <Button
                variant={appStatusFilter === 'pending' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAppStatusFilter('pending')}
                className={appStatusFilter === 'pending' ? '' : 'border-yellow-500/50 text-yellow-600 hover:bg-yellow-50'}
              >
                <HourglassIcon className="h-4 w-4 mr-1" />
                En revisión ({appStats.pending})
              </Button>
              <Button
                variant={appStatusFilter === 'approved' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAppStatusFilter('approved')}
                className={appStatusFilter === 'approved' ? '' : 'border-green-500/50 text-green-600 hover:bg-green-50'}
              >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Aprobadas ({appStats.approved})
              </Button>
              <Button
                variant={appStatusFilter === 'rejected' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAppStatusFilter('rejected')}
                className={appStatusFilter === 'rejected' ? '' : 'border-red-500/50 text-red-600 hover:bg-red-50'}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Rechazadas ({appStats.rejected})
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar proyecto..."
                value={appSearchQuery}
                onChange={(e) => setAppSearchQuery(e.target.value)}
                className="pl-9 w-full sm:w-64"
              />
            </div>
          </div>

          {/* Lista de postulaciones */}
          <div className="space-y-3">
            {filteredApplications.length > 0 ? (
              filteredApplications.map((app) => {
                const statusConfig = {
                  pending: { label: 'En revisión', color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-950/30', Icon: HourglassIcon },
                  approved: { label: 'Aprobado', color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/30', Icon: CheckCircle2 },
                  rejected: { label: 'Rechazado', color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/30', Icon: XCircle },
                }[app.clientSelection as 'pending' | 'approved' | 'rejected'] || { label: 'Desconocido', color: 'text-muted-foreground', bg: '', Icon: AlertCircle };

                const StatusIcon = statusConfig.Icon;

                return (
                  <Card key={app.projectId} className="hover:bg-muted/30 transition-colors">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between gap-4">
                        {/* Left: Project info */}
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/dashboard/projects/${app.projectId}`}
                            className="text-base font-semibold hover:underline truncate block"
                          >
                            {app.projectName}
                          </Link>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <Building2 className="h-3 w-3 shrink-0" />
                            <span>{app.brandName || app.clientName || 'Sin cliente'}</span>
                            {app.firstWorkDate && (
                              <>
                                <span>•</span>
                                <span>{new Date(app.firstWorkDate + 'T00:00:00').toLocaleDateString('es-GT', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Right: Status badge */}
                        <Badge variant="outline" className={`gap-1 shrink-0 ${statusConfig.color} ${statusConfig.bg}`}>
                          <StatusIcon className="h-3 w-3" />
                          {statusConfig.label}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Send className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    {appSearchQuery || appStatusFilter !== 'all'
                      ? 'No hay resultados'
                      : 'Sin postulaciones'}
                  </h3>
                  <p className="text-sm text-muted-foreground text-center max-w-sm">
                    {appSearchQuery || appStatusFilter !== 'all'
                      ? 'Intenta con otros filtros de búsqueda.'
                      : 'Este talento aún no ha sido postulado a ningún proyecto.'}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
