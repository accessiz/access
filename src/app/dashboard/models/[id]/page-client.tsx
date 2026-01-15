'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, FormProvider } from 'react-hook-form';
import { Button } from '../../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card';
import { modelFormSchema, ModelFormData } from '../../../../lib/schemas';
import { Model } from '../../../../lib/types';
import { updateModel } from '../../../../lib/actions/models';
import { toast } from 'sonner';
import { Grid } from '../../../../components/ui/grid';
import { CompCardManager } from '../../../../components/organisms/CompCardManager';
import { DeleteModelDialog } from '../../../../components/organisms/DeleteModelDialog';
import { Badge } from '../../../../components/ui/badge';
import { SearchBar } from '../../../../components/molecules/SearchBar';
import { ProjectStatusBadge } from '../../../../components/molecules/ProjectStatusBadge';
import { SegmentedControl } from '../../../../components/molecules/SegmentedControl';
import Link from 'next/link';
import { useState, useMemo } from 'react';
import { Pencil, Save, X, User, ImageIcon, Briefcase, Clock, CheckCircle2, AlertCircle, Wallet, TrendingUp, Building2, Send, ChevronDown, Copy, Banknote, RefreshCw } from 'lucide-react';
import { ModelForm } from '../../../../components/organisms/ModelForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../../../components/ui/collapsible';

import { formatCurrency } from '../../../../lib/utils/format';

// Define el tipo extendido que incluye las URLs/paths
type ModelWithImages = Model & {
  coverUrl?: string | null;
  portfolioUrl?: string | null;
  compCardUrls?: (string | null)[];
  cover_path?: string | null;
  portfolio_path?: string | null;
  comp_card_paths?: (string | null)[] | null;
  galleryUrls?: (string | null)[];
  galleryPaths?: string[] | null;
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
  tradeFee?: number | null; // Trade/barter fee
  feeType: string;
  currency: string;
  daysWorked: number;
  totalAmount: number;
  totalTradeAmount?: number | null; // Total trade value
  paymentStatus: 'pending' | 'paid' | 'partial';
  paymentType?: 'cash' | 'trade' | 'mixed' | null; // Payment type if paid
  lastPaymentDate: string | null;
  firstWorkDate: string | null;
  lastWorkDate: string | null;
  totalPaidGTQ: number | null;
}

interface ModelProfileClientProps {
  initialModel: ModelWithImages;
  workHistory?: WorkHistoryItem[];
  currentRate: number;
}

// Componente para mostrar la información en modo de solo lectura
const InfoDisplay = ({ label, value }: { label: string; value: string | number | null | undefined }) => (
  <div className="space-y-1">
    <p className="text-body font-medium text-muted-foreground">{label}</p>
    <p className="text-body">{value || '-'}</p>
  </div>
);

// Define los estados válidos que espera el formulario
const VALID_STATUSES = ['active', 'inactive', 'archived'] as const;
type ModelStatus = typeof VALID_STATUSES[number];

function isValidStatus(status: unknown): status is ModelStatus {
  if (typeof status !== 'string') return false;
  return VALID_STATUSES.includes(status as ModelStatus);
}

export default function ModelProfilePageClient({ initialModel, workHistory = [], currentRate }: ModelProfileClientProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const [dangerOpen, setDangerOpen] = useState(false);

  const handleEditClick = () => {
    setActiveTab('info');
    setIsEditing(true);
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(initialModel.id);
    toast.success('UUID copiado al portapapeles');
  };

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
      birth_country: initialModel.birth_country ?? null,
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

  // Helper para obtener la fecha de hoy en Guatemala (GMT-6)
  const getGuatemalaToday = (): Date => {
    const now = new Date();
    const guatemalaTime = new Date(now.toLocaleString('en-US', {
      timeZone: 'America/Guatemala'
    }));
    guatemalaTime.setHours(0, 0, 0, 0);
    return guatemalaTime;
  };

  // Separar trabajos completados de postulaciones
  // Trabajos: Solo aprobados + fecha de producción pasada (al menos 1 día después)
  const completedWork = useMemo(() => {
    const today = getGuatemalaToday();

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
    // Total Generado: solo incluye trabajos ya pagados (cumple 3 condiciones: aprobado + fecha pasada + pago confirmado)
    const totalEarned = completedWork
      .filter((job) => job.paymentStatus === 'paid')
      .reduce((acc, job) => {
        // Use stored GTQ amount if available, otherwise convert using current rate if USD (fallback)
        const amountGTQ = job.totalPaidGTQ || (job.currency === 'USD' ? (job.totalAmount || job.agreedFee * (job.daysWorked || 1)) * currentRate : (job.totalAmount || job.agreedFee * (job.daysWorked || 1)));
        return acc + amountGTQ;
      }, 0);

    const totalPending = completedWork
      .filter((job) => job.paymentStatus !== 'paid')
      .reduce((acc, job) => {
        // Always usage current rate for pending
        const rawAmount = job.totalAmount || job.agreedFee * (job.daysWorked || 1);
        const amountGTQ = job.currency === 'USD' ? rawAmount * currentRate : rawAmount;
        return acc + amountGTQ;
      }, 0);

    const paidCount = completedWork.filter((job) => job.paymentStatus === 'paid').length;
    const pendingCount = completedWork.filter((job) => job.paymentStatus !== 'paid').length;

    return { totalEarned, totalPending, paidCount, pendingCount };
  }, [completedWork, currentRate]);

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
      <header className="flex flex-col items-start gap-x-4 gap-y-4 pb-6 border-b md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-display">
            {initialModel.alias || initialModel.full_name}
          </h1>
          <p className="text-muted-foreground text-label font-mono select-all">
            {initialModel.id}
          </p>
        </div>
        <div className="flex items-center gap-x-2 gap-y-2">
          {!isEditing ? (
            <Button variant="outline" size="icon" onClick={handleEditClick} title="Editar Perfil" className="border-separator bg-transparent hover:bg-hover-overlay">
              <Pencil className="h-4 w-4" />
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6 h-auto grid grid-cols-2 gap-2 sm:h-12 sm:flex sm:flex-nowrap sm:gap-0">
          <TabsTrigger value="info" className="gap-x-2 gap-y-2 h-10 justify-start px-3 whitespace-normal leading-tight sm:h-full sm:justify-center sm:px-4 sm:whitespace-nowrap">
            <User className="h-4 w-4" /> Información
          </TabsTrigger>
          <TabsTrigger value="media" className="gap-x-2 gap-y-2 h-10 justify-start px-3 whitespace-normal leading-tight sm:h-full sm:justify-center sm:px-4 sm:whitespace-nowrap">
            <ImageIcon className="h-4 w-4" /> Media
          </TabsTrigger>
          <TabsTrigger value="work" className="gap-x-2 gap-y-2 h-10 justify-start px-3 whitespace-normal leading-tight sm:h-full sm:justify-center sm:px-4 sm:whitespace-nowrap">
            <Briefcase className="h-4 w-4" /> Trabajos
          </TabsTrigger>
          <TabsTrigger value="applications" className="gap-x-2 gap-y-2 h-10 justify-start px-3 whitespace-normal leading-tight sm:h-full sm:justify-center sm:px-4 sm:whitespace-nowrap">
            <Send className="h-4 w-4" /> Postulaciones
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
                    <InfoDisplay label="País de Residencia" value={initialModel.country} />
                    <InfoDisplay label="País de Nacimiento" value={initialModel.birth_country} />
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

              <div className="space-y-4">
                <Collapsible open={dangerOpen} onOpenChange={setDangerOpen}>
                  <Card className="border-destructive">
                    <CardHeader className="flex flex-row items-start justify-between gap-3">
                      <div className="min-w-0">
                        <CardTitle className="text-destructive">Zona de Peligro</CardTitle>
                        <CardDescription className="text-destructive/80">Estas acciones son permanentes y no se pueden deshacer.</CardDescription>
                      </div>
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="shrink-0"
                          aria-label={dangerOpen ? 'Cerrar zona de peligro' : 'Abrir zona de peligro'}
                          title={dangerOpen ? 'Cerrar' : 'Abrir'}
                        >
                          <ChevronDown className={`h-4 w-4 transition-transform ${dangerOpen ? 'rotate-180' : ''}`} />
                        </Button>
                      </CollapsibleTrigger>
                    </CardHeader>
                    <CollapsibleContent>
                      <CardContent>
                        <div className="flex items-center justify-between rounded-lg border border-destructive bg-destructive/5 p-4">
                          <div>
                            <p className="text-body text-foreground">Eliminar este modelo</p>
                            <p className="text-label text-muted-foreground">Toda la información y fotos se perderá.</p>
                          </div>
                          <DeleteModelDialog modelId={initialModel.id} modelAlias={initialModel.alias || 'talento'}>
                            <Button variant="destructive">Eliminar</Button>
                          </DeleteModelDialog>
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>

                {/* UUID del modelo */}
                <div className="flex items-center justify-center gap-2 pt-2">
                  <span className="text-label text-muted-foreground font-mono">{initialModel.id}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                    onClick={handleCopyId}
                    title="Copiar UUID"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
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
            initialGalleryUrls={initialModel.galleryUrls ?? []}
            initialGalleryPaths={initialModel.galleryPaths ?? []}
          />
        </TabsContent>

        <TabsContent value="work" className="space-y-6 outline-none">
          {/* KPI Cards - Secuencia lógica: Trabajos → Ganado → Pagado → Pendiente */}
          <div className="grid gap-x-4 gap-y-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-body font-medium text-muted-foreground">Proyectos</CardTitle>
                <Briefcase className="h-5 w-5 text-info" />
              </CardHeader>
              <CardContent>
                <div className="text-display font-bold">{completedWork.length}</div>
                <p className="text-label text-muted-foreground">Trabajos completados</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-body font-medium text-muted-foreground">Total Generado</CardTitle>
                <TrendingUp className="h-5 w-5 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-display font-bold">Q{workStats.totalEarned.toLocaleString()}</div>
                <p className="text-label text-muted-foreground">Ganancias históricas</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-body font-medium text-muted-foreground">Pagados</CardTitle>
                <CheckCircle2 className="h-5 w-5 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-display font-bold text-success">{workStats.paidCount}</div>
                <p className="text-label text-muted-foreground">Trabajos completados</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-body font-medium text-muted-foreground">Por Cobrar</CardTitle>
                <Wallet className="h-5 w-5 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-display font-bold text-warning">Q{workStats.totalPending.toLocaleString()}</div>
                <p className="text-label text-muted-foreground">{workStats.pendingCount} pendientes</p>
              </CardContent>
            </Card>
          </div>

          {/* Filtros y búsqueda */}
          <div className="flex flex-col gap-x-4 gap-y-4 sm:flex-row sm:items-center sm:justify-between">
            <SegmentedControl
              value={workStatusFilter}
              onValueChange={setWorkStatusFilter}
              ariaLabel="Filtrar trabajos por estado de pago"
              options={[
                { value: 'all', label: `Todos (${completedWork.length})` },
                { value: 'pending', label: `Pendientes (${workStats.pendingCount})` },
                { value: 'paid', label: `Pagados (${workStats.paidCount})` },
              ]}
              className="w-full sm:w-fit"
            />
            <SearchBar
              value={workSearchQuery}
              onValueChange={setWorkSearchQuery}
              onClear={() => setWorkSearchQuery('')}
              placeholder="Buscar proyecto..."
              ariaLabel="Buscar proyecto"
              className="w-full sm:w-62.5"
              expand={false}
            />
          </div>

          {/* Lista de trabajos */}
          <div className="space-y-3">
            {filteredWorkHistory.length > 0 ? (
              filteredWorkHistory.map((job) => {
                const paymentStatusMap = {
                  paid: { label: 'Pagado', icon: CheckCircle2, color: 'text-success', variant: 'success' as const },
                  partial: { label: 'Parcial', icon: AlertCircle, color: 'text-info', variant: 'info' as const },
                  pending: { label: 'Pendiente', icon: Clock, color: 'text-warning', variant: 'warning' as const },
                };
                const statusKey = (job.paymentStatus as 'paid' | 'partial' | 'pending') || 'pending';
                const paymentStatusConfig = paymentStatusMap[statusKey] || paymentStatusMap.pending;

                const StatusIcon = paymentStatusConfig.icon;
                const daysText = job.daysWorked === 1 ? '1 día' : `${job.daysWorked} días`;
                const totalAmount = job.totalAmount || (job.agreedFee * (job.daysWorked || 1));
                const hasCash = job.agreedFee > 0;
                const hasTrade = (job.tradeFee ?? 0) > 0;

                return (
                  <Card key={job.projectId} className="hover:bg-hover-overlay transition-colors">
                    <CardContent className="p-4">
                      {/* Main container: vertical on mobile, horizontal on desktop */}
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                        {/* Left section: Badge + Info */}
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 flex-1 min-w-0">

                          {/* Top Row Mobile / First item Desktop: Status Badge */}
                          <div className="flex items-center justify-between sm:contents">
                            {/* Status Badge */}
                            <Badge variant={paymentStatusConfig.variant} className="gap-1 shrink-0">
                              <StatusIcon className={`h-3 w-3`} />
                              {paymentStatusConfig.label}
                            </Badge>
                          </div>

                          {/* Info Section */}
                          <div className="flex-1 min-w-0 space-y-1">
                            {/* Project Name */}
                            <Link
                              href={`/dashboard/projects/${job.projectId}`}
                              className="font-semibold text-title sm:text-body text-foreground hover:text-primary hover:underline transition-colors block"
                            >
                              {job.projectName}
                            </Link>

                            {/* Client */}
                            <div className="flex items-center gap-2 text-body text-muted-foreground">
                              <Building2 className="h-4 w-4 sm:h-3 sm:w-3 shrink-0" />
                              <span className="truncate">{job.brandName || job.clientName || 'Sin cliente'}</span>
                            </div>

                            {/* Days worked */}
                            <div className="text-label text-muted-foreground">
                              {daysText}
                            </div>
                          </div>
                        </div>

                        {/* Right section: Amounts + Status */}
                        <div className="flex items-end justify-between sm:items-center sm:gap-4 sm:shrink-0">

                          {/* Amounts with circular icons */}
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                            {hasCash && (
                              <div className="flex flex-col items-end">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-full border-2 border-success bg-success/20 flex items-center justify-center">
                                    <Banknote className="w-4 h-4 text-success" />
                                  </div>
                                  <span className="text-body font-medium text-foreground">
                                    {formatCurrency(job.totalPaidGTQ || (job.currency === 'USD' ? totalAmount * currentRate : totalAmount), 'GTQ')}
                                  </span>
                                </div>
                                {job.currency === 'USD' && (
                                  <span className="text-xs text-muted-foreground mr-1">
                                    ({formatCurrency(totalAmount, 'USD')})
                                  </span>
                                )}
                              </div>
                            )}
                            {hasTrade && (
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full border-2 border-blue bg-blue/20 flex items-center justify-center">
                                  <RefreshCw className="w-4 h-4 text-blue" />
                                </div>
                                <span className="text-body font-medium text-foreground">
                                  {formatCurrency(job.totalTradeAmount || (job.tradeFee || 0) * job.daysWorked, job.currency)}
                                </span>
                              </div>
                            )}
                            {!hasCash && !hasTrade && (
                              <span className="text-body text-muted-foreground">
                                Sin tarifa definida
                              </span>
                            )}
                          </div>
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
                  <h3 className="text-title font-medium mb-2">
                    {workSearchQuery || workStatusFilter !== 'all'
                      ? 'No hay resultados'
                      : 'Sin trabajos completados'}
                  </h3>
                  <p className="text-body text-muted-foreground text-center max-w-sm">
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
          <div className="flex flex-col gap-x-4 gap-y-4 sm:flex-row sm:items-center sm:justify-between">
            <SegmentedControl
              value={appStatusFilter}
              onValueChange={setAppStatusFilter}
              ariaLabel="Filtrar postulaciones por estado"
              options={[
                { value: 'all', label: `Todas (${appStats.total})` },
                { value: 'pending', label: `En revisión (${appStats.pending})` },
                { value: 'approved', label: `Aprobadas (${appStats.approved})` },
                { value: 'rejected', label: `Rechazadas (${appStats.rejected})` },
              ]}
              className="w-full sm:w-fit"
            />
            <SearchBar
              value={appSearchQuery}
              onValueChange={setAppSearchQuery}
              onClear={() => setAppSearchQuery('')}
              placeholder="Buscar proyecto..."
              ariaLabel="Buscar proyecto"
              className="w-full sm:w-64"
              expand={false}
            />
          </div>

          {/* Lista de postulaciones */}
          <div className="space-y-3">
            {filteredApplications.length > 0 ? (
              filteredApplications.map((app) => {
                return (
                  <Card key={app.projectId} className="hover:bg-hover-overlay transition-colors">
                    <CardContent className="p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        {/* Left: Project info */}
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/dashboard/projects/${app.projectId}`}
                            className="text-body font-semibold hover:underline block wrap-break-word sm:truncate"
                          >
                            {app.projectName}
                          </Link>
                          <div className="flex items-center gap-x-2 gap-y-2 text-label text-muted-foreground mt-1">
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
                        <ProjectStatusBadge status={app.clientSelection} className="self-start sm:self-auto" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Send className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <h3 className="text-title font-medium mb-2">
                    {appSearchQuery || appStatusFilter !== 'all'
                      ? 'No hay resultados'
                      : 'Sin postulaciones'}
                  </h3>
                  <p className="text-body text-muted-foreground text-center max-w-sm">
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
