'use client'

import { useActionState, useEffect, useState, useMemo, useRef, startTransition } from 'react';
import { useForm, useFieldArray, FormProvider, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { createProject, updateProject, analyzeScheduleChanges } from '@/lib/actions/projects';
import type { ScheduleChange, MigrationMapping } from '@/lib/actions/projects';
import { ScheduleMigrationModal, type NewScheduleOption } from '@/components/organisms/ScheduleMigrationModal';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { projectFormSchema, ProjectFormData } from '@/lib/schemas/projects';
import {
  Trash2,
  Plus,
  Save,
  X,
} from 'lucide-react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Combobox } from '@/components/ui/combobox';
import { useRouter } from 'next/navigation';
import { Project, Client, Brand, PROJECT_TYPES, ProjectType } from '@/lib/types';
import { format } from 'date-fns';
import { DatePicker } from '@/components/ui/date-picker';
import { TimePicker } from '@/components/ui/time-picker';
import { TRADE_CATEGORIES, TRADE_CATEGORY_LABELS } from '@/lib/constants/finance';
import { createClient } from '@/lib/supabase/client';
import { cn, toTitleCase } from '@/lib/utils';

type ProjectWithBilling = Project & {
  revenue?: number | null;
  tax_percentage?: number | null;
  client_payment_status?: string | null;
  invoice_number?: string | null;
  invoice_date?: string | null;
  client_trade_revenue?: number | null;
};

interface ProjectFormProps {
  initialData?: ProjectWithBilling;
  onCancel?: () => void;
}

type ClientWithBrands = Client & { brands: Brand[] };

const EMPTY_PROJECT_TYPES: ProjectType[] = [];

function generateProjectName(
  types: ProjectType[],
  clientName: string | null | undefined,
  brandName: string | null | undefined,
  customName: string | null | undefined
): string {
  const parts: string[] = [];

  // 1. Tipos de proyecto (solo el primero para nombres cortos)
  if (types && types.length > 0) {
    const firstType = PROJECT_TYPES.find(pt => pt.value === types[0])?.label || types[0];
    parts.push(firstType);
  }

  // 2. Marca o Cliente (aplicar Title Case para normalizar)
  if (brandName) {
    parts.push(toTitleCase(brandName));
  } else if (clientName) {
    parts.push(toTitleCase(clientName));
  }

  // 3. Nombre personalizado (opcional, también con Title Case)
  if (customName && customName.trim()) {
    parts.push(toTitleCase(customName.trim()));
  }

  return parts.join(' - ') || 'Nuevo Proyecto';
}

export function ProjectForm({ initialData, onCancel }: ProjectFormProps) {
  const router = useRouter();
  const isEditing = !!initialData;
  const supabase = createClient();

  // Función para extraer la palabra adicional del nombre completo
  const extractCustomName = (
    fullName: string | null | undefined,
    types: ProjectType[] | null | undefined,
    brandName: string | null | undefined,
    clientName: string | null | undefined
  ): string => {
    if (!fullName) return '';

    // Obtener las partes que NO son la palabra adicional
    // IMPORTANTE: Debe coincidir EXACTAMENTE con la lógica de generateProjectName
    const prefixParts: string[] = [];

    // 1. Tipos de proyecto (solo el PRIMERO, igual que generateProjectName)
    if (types && types.length > 0) {
      const firstType = PROJECT_TYPES.find(pt => pt.value === types[0])?.label || types[0];
      prefixParts.push(firstType);
    }

    // 2. Marca o Cliente (aplicar Title Case igual que generateProjectName)
    if (brandName) {
      prefixParts.push(toTitleCase(brandName));
    } else if (clientName) {
      prefixParts.push(toTitleCase(clientName));
    }

    // Construir el prefijo esperado
    const expectedPrefix = prefixParts.join(' - ');

    // Si el nombre empieza con el prefijo, quitarlo
    if (expectedPrefix && fullName.startsWith(expectedPrefix)) {
      const remainder = fullName.slice(expectedPrefix.length);
      // Quitar el separador " - " si existe
      if (remainder.startsWith(' - ')) {
        return remainder.slice(3).trim();
      }
      return remainder.trim();
    }

    // Si no coincide el patrón, devolver vacío para modo edición
    // (el usuario puede escribir uno nuevo)
    return '';
  };

  // Estado para clientes y marcas
  const [clients, setClients] = useState<ClientWithBrands[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(true);

  // Extraer la palabra adicional del nombre existente
  const [customProjectName, setCustomProjectName] = useState<string>('');

  // Estado para el modal de migración de schedule
  const [showMigrationModal, setShowMigrationModal] = useState(false);
  const [scheduleChanges, setScheduleChanges] = useState<ScheduleChange[]>([]);
  const [newSchedulesForMigration, setNewSchedulesForMigration] = useState<NewScheduleOption[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isProcessingMigration, setIsProcessingMigration] = useState(false);
  const pendingFormDataRef = useRef<FormData | null>(null);
  const pendingNewScheduleRef = useRef<{ date: string; startTime: string; endTime: string }[]>([]);

  // Estado separado para moneda del cliente (puede ser diferente a la de modelos)
  const [clientCurrency, setClientCurrency] = useState<'GTQ' | 'USD'>((initialData?.currency as 'GTQ' | 'USD') || 'GTQ');
  const [hasManuallySetClientCurrency, setHasManuallySetClientCurrency] = useState(false);

  // Cargar clientes al montar
  useEffect(() => {
    const loadClients = async () => {
      setIsLoadingClients(true);
      const { data, error } = await supabase
        .from('clients')
        .select(`*, brands (*)`)
        .eq('status', 'active')
        .order('name');

      if (!error && data) {
        setClients(data as ClientWithBrands[]);

        // Extraer la palabra adicional del nombre existente (solo en modo edición)
        if (initialData?.project_name) {
          const client = data.find(c => c.id === initialData.client_id);
          const brand = client?.brands?.find(b => b.id === initialData.brand_id);

          const extracted = extractCustomName(
            initialData.project_name,
            initialData.project_types as ProjectType[] | null,
            brand?.name,
            client?.name || initialData.client_name
          );

          if (extracted) {
            setCustomProjectName(extracted);
          }
        }
      }
      setIsLoadingClients(false);
    };
    loadClients();
  }, [supabase, initialData]);

  const normalizedClientPaymentStatus: ProjectFormData['client_payment_status'] =
    initialData?.client_payment_status === 'pending' ||
      initialData?.client_payment_status === 'invoiced' ||
      initialData?.client_payment_status === 'paid'
      ? initialData.client_payment_status
      : 'pending';

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      project_name: initialData?.project_name || '',
      client_name: initialData?.client_name || '',
      client_id: initialData?.client_id || null,
      brand_id: initialData?.brand_id || null,
      project_types: (initialData?.project_types as ProjectType[]) || [],
      password: initialData?.password || '',
      schedule: initialData?.schedule && initialData.schedule.length > 0
        ? initialData.schedule.map(item => ({
          date: item.date ? item.date.split('T')[0] : '',
          startTime: item.startTime || '09:00 AM',
          endTime: item.endTime || '05:00 PM',
        }))
        : [{ date: format(new Date(), 'yyyy-MM-dd'), startTime: '09:00 AM', endTime: '05:00 PM' }],
      default_model_fee: initialData?.default_model_fee || null,
      default_fee_type: (initialData?.default_fee_type as 'per_day' | 'per_hour' | 'fixed') || 'per_day',
      default_model_payment_type: initialData?.default_model_payment_type || 'cash',
      default_model_trade_category: initialData?.default_model_trade_category || null,
      default_model_trade_fee: initialData?.default_model_trade_fee || null,
      default_model_trade_details: initialData?.default_model_trade_details || null,
      currency: (initialData?.currency as 'GTQ' | 'USD' | 'EUR') || 'GTQ',
      // Campos de facturación al cliente
      revenue: initialData?.revenue ?? null,
      tax_percentage: initialData?.tax_percentage ?? 12,
      client_payment_status: normalizedClientPaymentStatus,
      client_payment_type: (initialData?.client_payment_type as 'cash' | 'trade' | 'mixed') ?? 'cash',
      client_trade_category: initialData?.client_trade_category || null,
      client_trade_revenue: initialData?.client_trade_revenue || null,
      client_trade_details: initialData?.client_trade_details || null,
      invoice_number: initialData?.invoice_number ?? '',
      invoice_date: initialData?.invoice_date ?? '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'schedule',
  });

  // Observar campos para generar nombre automático
  const selectedClientId = form.watch('client_id');
  const selectedBrandId = form.watch('brand_id');
  const selectedProjectTypes = form.watch('project_types') ?? EMPTY_PROJECT_TYPES;
  const watchedClientName = form.watch('client_name'); // <-- Watch client_name directly

  const selectedClient = useMemo(() =>
    clients.find(c => c.id === selectedClientId),
    [clients, selectedClientId]
  );

  const selectedBrand = useMemo(() =>
    selectedClient?.brands?.find(b => b.id === selectedBrandId),
    [selectedClient, selectedBrandId]
  );

  const availableBrands = useMemo(() => {
    if (!selectedClientId) return [];
    return selectedClient?.brands || [];
  }, [selectedClientId, selectedClient]);

  // Generar nombre del proyecto en tiempo real
  const generatedProjectName = useMemo(() => {
    return generateProjectName(
      selectedProjectTypes,
      selectedClient?.name || watchedClientName,
      selectedBrand?.name,
      customProjectName
    );
  }, [selectedProjectTypes, selectedClient, selectedBrand, customProjectName, watchedClientName]);

  // Sincronizar el nombre generado con el formulario
  useEffect(() => {
    form.setValue('project_name', generatedProjectName);
  }, [generatedProjectName, form]);

  // Limpiar marca si cambia el cliente
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'client_id') {
        const currentBrandId = form.getValues('brand_id');
        const isValidBrand = availableBrands.some(b => b.id === currentBrandId);
        if (!isValidBrand) {
          form.setValue('brand_id', null);
        }
        if (value.client_id) {
          const client = clients.find(c => c.id === value.client_id);
          if (client) {
            form.setValue('client_name', client.name);
          }
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form, availableBrands, clients]);

  // Sincronizar moneda del cliente cuando cambia la moneda de modelos (solo si no ha sido modificada manualmente)
  const watchedCurrency = form.watch('currency');
  useEffect(() => {
    if (!hasManuallySetClientCurrency && watchedCurrency) {
      setClientCurrency(watchedCurrency as 'GTQ' | 'USD');
    }
  }, [watchedCurrency, hasManuallySetClientCurrency]);

  const clientOptions = useMemo(() => [
    ...clients.map(c => ({
      label: c.company ? `${c.name} (${c.company})` : c.name,
      value: c.id,
    }))
  ], [clients]);

  const brandOptions = useMemo(() =>
    availableBrands.map(b => ({
      label: b.name,
      value: b.id,
    })),
    [availableBrands]
  );

  // Toggle de tipos (máximo 2)
  const toggleProjectType = (type: ProjectType) => {
    const current = form.getValues('project_types') || [];
    if (current.includes(type)) {
      form.setValue('project_types', current.filter(t => t !== type));
    } else if (current.length < 2) {
      // Mantener orden de selección del usuario (el primero seleccionado define el nombre)
      form.setValue('project_types', [...current, type]);
    } else {
      toast.info('Máximo 2 tipos por proyecto', {
        description: 'Deselecciona uno para agregar otro.',
      });
    }
  };

  const action = isEditing ? updateProject.bind(null, initialData.id) : createProject;
  type ActionState = { success: boolean; error?: string; errors?: Record<string, string>, projectId?: string };
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(action, { success: false });

  // Función para manejar la confirmación del modal de migración
  const handleMigrationConfirm = async (mapping: MigrationMapping) => {
    if (!initialData?.id || !pendingFormDataRef.current) return;

    setIsProcessingMigration(true);
    try {
      // Agregar el migrationMapping al FormData para que updateProject lo maneje
      pendingFormDataRef.current.set('migrationMapping', JSON.stringify(mapping));

      // Cerrar modal y ejecutar la actualización
      setShowMigrationModal(false);

      // Ejecutar la acción del formulario con el FormData que incluye el mapping
      startTransition(() => {
        formAction(pendingFormDataRef.current!);
      });
      pendingFormDataRef.current = null;
      pendingNewScheduleRef.current = [];
    } catch {
      toast.error('Error inesperado');
      setIsProcessingMigration(false);
    }
  };
  // Función para construir FormData desde los valores del formulario
  const buildFormData = () => {
    const values = form.getValues();
    const fd = new FormData();

    fd.set('project_name', values.project_name || generatedProjectName);
    fd.set('client_name', values.client_name || '');
    fd.set('client_id', values.client_id || '');
    fd.set('brand_id', values.brand_id || '');
    fd.set('password', values.password || '');
    fd.set('default_model_fee', values.default_model_fee?.toString() || '');
    fd.set('default_fee_type', values.default_fee_type || 'per_day');
    fd.set('default_model_payment_type', values.default_model_payment_type || 'cash');
    fd.set('default_model_trade_category', values.default_model_trade_category || '');
    fd.set('default_model_trade_fee', values.default_model_trade_fee?.toString() || '');
    fd.set('default_model_trade_details', values.default_model_trade_details || '');
    fd.set('currency', values.currency || 'GTQ');
    // Campos de facturación al cliente
    fd.set('revenue', values.revenue?.toString() || '');
    fd.set('tax_percentage', values.tax_percentage?.toString() || '12');
    fd.set('client_payment_status', values.client_payment_status || 'pending');
    fd.set('client_payment_type', values.client_payment_type || 'cash');
    fd.set('client_trade_category', values.client_trade_category || '');
    fd.set('client_trade_revenue', values.client_trade_revenue?.toString() || '');
    fd.set('client_trade_details', values.client_trade_details || '');
    fd.set('invoice_number', values.invoice_number || '');
    fd.set('invoice_date', values.invoice_date || '');

    // Project types
    if (values.project_types && values.project_types.length > 0) {
      values.project_types.forEach((type, index) => {
        fd.set(`project_types[${index}]`, type);
      });
    }

    // Schedule - usar los valores actuales del formulario
    if (values.schedule && values.schedule.length > 0) {
      values.schedule.forEach((item, index) => {
        fd.set(`schedule.${index}.date`, item.date || '');
        fd.set(`schedule.${index}.startTime`, item.startTime || '09:00 AM');
        fd.set(`schedule.${index}.endTime`, item.endTime || '05:00 PM');
      });
    }

    return fd;
  };

  // Función para interceptar el submit (tanto creación como edición)
  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Construir FormData manualmente desde los valores actuales del formulario
    const formData = buildFormData();

    if (!isEditing) {
      // Modo creación: enviar directamente
      startTransition(() => {
        formAction(formData);
      });
      return;
    }

    // Modo edición: analizar cambios primero
    setIsAnalyzing(true);

    // Extraer el schedule para análisis
    const scheduleEntries = form.getValues('schedule') || [];

    // Analizar cambios
    const result = await analyzeScheduleChanges(initialData!.id, scheduleEntries);
    setIsAnalyzing(false);

    if (!result.success) {
      toast.error('Error al analizar cambios', { description: result.error });
      return;
    }

    const analysis = result.analysis!;

    // Si hay asignaciones afectadas, mostrar modal
    if (analysis.hasAffectedAssignments && analysis.totalAffectedAssignments > 0) {
      setScheduleChanges(analysis.changes);
      setNewSchedulesForMigration(analysis.newSchedules);
      pendingFormDataRef.current = formData;
      pendingNewScheduleRef.current = scheduleEntries;
      setShowMigrationModal(true);
    } else {
      // No hay asignaciones afectadas, proceder normalmente
      startTransition(() => {
        formAction(formData);
      });
    }
  };

  useEffect(() => {
    if (state?.success) {
      toast.success(isEditing ? '¡Proyecto actualizado!' : '¡Proyecto creado con éxito!');
      if (isEditing) {
        window.location.reload();
      } else {
        router.push(`/dashboard/projects/${state.projectId}`);
      }
    } else if (state?.error) {
      toast.error(isEditing ? 'Error al actualizar' : 'Error al crear', {
        description: state.error,
      });
      if (state.errors) {
        for (const [fieldName, errorMessages] of Object.entries(state.errors)) {
          form.setError(fieldName as keyof ProjectFormData, {
            type: 'server',
            message: Array.isArray(errorMessages) ? errorMessages[0] : errorMessages,
          });
        }
      }
    }
    setIsProcessingMigration(false);
  }, [state, router, form, isEditing, onCancel]);

  return (
    <FormProvider {...form}>
      <form
        id="project-form"
        onSubmit={handleFormSubmit}
        className="space-y-8"
      >
        <header className="sticky top-0 z-20 flex flex-col items-start gap-4 pb-4 pt-2 border-b bg-background sm:flex-row sm:items-center sm:justify-between -mx-6 px-6">
          <div className="space-y-0.5">
            {/* El nombre del proyecto es el protagonista */}
            <h1 className="text-display leading-tight transition-all duration-200">
              {generatedProjectName}
            </h1>
            {/* Subtexto de contexto */}
            <p className="text-body text-muted-foreground flex items-center gap-1.5">
              {isEditing ? (
                <>Editando proyecto</>
              ) : (
                <>Nuevo proyecto</>
              )}
            </p>
          </div>
          <div className="flex flex-col-reverse items-stretch gap-2 w-full sm:flex-row sm:w-auto">
            <Button variant="outline" type="button" onClick={onCancel ? onCancel : () => router.push('/dashboard/projects')} className="w-full sm:w-auto">
              <X className="mr-2 h-4 w-4" /> Cancelar
            </Button>
            <Button type="submit" disabled={isPending || isAnalyzing || isProcessingMigration} className="w-full sm:w-auto">
              {isAnalyzing ? 'Analizando...' : isPending || isProcessingMigration ? (isEditing ? 'Guardando...' : 'Creando...') : (isEditing ? <><Save className="mr-2 h-4 w-4" /> Guardar Cambios</> : 'Crear Proyecto')}
            </Button>
          </div>
        </header>

        {/* Hidden input para el nombre generado */}
        <input type="hidden" name="project_name" value={generatedProjectName} />

        {/* ========== PASO 1: TIPO DE PROYECTO ========== */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-title">Tipo de Proyecto</h2>
            <span className="text-label text-muted-foreground">(máx. 2)</span>
          </div>
          <div className="border bg-card rounded-lg p-6">
            <div className="flex flex-wrap gap-2">
              {PROJECT_TYPES.map((type) => {
                const isSelected = selectedProjectTypes.includes(type.value);
                const selectionIndex = selectedProjectTypes.indexOf(type.value);
                // El primero es el que aparece en el nombre
                return (
                  <Button
                    key={type.value}
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "h-9 px-4 transition-all relative",
                      isSelected && "bg-purple text-white hover:bg-purple"
                    )}
                    onClick={() => toggleProjectType(type.value)}
                  >
                    {type.label}
                    {isSelected && (
                      <span className={cn(
                        "ml-2 flex items-center justify-center size-5 rounded-full text-label font-bold transition-all",
                        selectionIndex === 0
                          ? "bg-white text-purple"
                          : "border border-white bg-transparent text-white"
                      )}>
                        {selectionIndex + 1}
                      </span>
                    )}
                  </Button>
                );
              })}
            </div>
            {form.formState.errors.project_types && (
              <p className="text-label text-destructive mt-3">{form.formState.errors.project_types.message}</p>
            )}
            {/* Hidden inputs para tipos */}
            {selectedProjectTypes.map((type, index) => (
              <input key={`pt_${index}`} type="hidden" name={`project_types[${index}]`} value={type} />
            ))}
          </div>
        </div>

        {/* ========== PASO 2: CLIENTE ========== */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-title">Cliente</h2>
            <span className="text-label text-muted-foreground">(recomendado)</span>
          </div>
          <div className="border bg-card rounded-lg p-6 space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Seleccionar cliente registrado</Label>
                <Controller
                  control={form.control}
                  name="client_id"
                  render={({ field }) => (
                    <>
                      <input type="hidden" name="client_id" value={field.value || ''} />
                      <Combobox
                        options={clientOptions}
                        value={field.value || ''}
                        onChange={(value) => field.onChange(value || null)}
                        placeholder={isLoadingClients ? "Cargando..." : "Buscar cliente..."}
                        searchPlaceholder="Buscar por nombre o empresa..."
                        emptyMessage="No se encontraron clientes"
                      />
                    </>
                  )}
                />
                {selectedClientId && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-label text-muted-foreground"
                    onClick={() => {
                      form.setValue('client_id', null);
                      form.setValue('brand_id', null);
                      form.setValue('client_name', '');
                    }}
                  >
                    <X className="mr-1 h-3 w-3" /> Quitar cliente
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <Label>O escribir nombre manualmente</Label>
                <Input
                  placeholder="Nombre del cliente"
                  value={form.watch('client_name') || ''}
                  onChange={(e) => {
                    form.setValue('client_name', e.target.value);
                    form.setValue('client_id', null);
                    form.setValue('brand_id', null);
                  }}
                  disabled={!!selectedClientId}
                />
                <input type="hidden" name="client_name" value={form.watch('client_name') || ''} />
              </div>
            </div>

            {/* Selector de Marca */}
            {selectedClientId && availableBrands.length > 0 && (
              <div className="pt-4 border-t space-y-2">
                <div className="flex items-center gap-2">
                  <Label>Marca del proyecto</Label>
                </div>
                <Controller
                  control={form.control}
                  name="brand_id"
                  render={({ field }) => (
                    <>
                      <input type="hidden" name="brand_id" value={field.value || ''} />
                      <Combobox
                        options={brandOptions}
                        value={field.value || ''}
                        onChange={(value) => field.onChange(value || null)}
                        placeholder="Seleccionar marca..."
                        searchPlaceholder="Buscar marca..."
                        emptyMessage="No hay marcas"
                      />
                    </>
                  )}
                />
                <p className="text-label text-muted-foreground">
                  {selectedClient?.name} tiene {availableBrands.length} marca{availableBrands.length !== 1 ? 's' : ''}.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ========== PASO 3: NOMBRE ADICIONAL ========== */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-title">Palabra adicional</h2>
            <span className="text-label text-muted-foreground">(opcional)</span>
          </div>
          <div className="border bg-card rounded-lg p-6">
            <Input
              placeholder="Ej: Navidad, Fashion Week, Catálogo Verano..."
              value={customProjectName}
              onChange={(e) => setCustomProjectName(e.target.value)}
            />
          </div>
        </div>

        {/* ========== PASO 4: FECHAS Y HORARIOS ========== */}
        <div className="space-y-4">
          <h2 className="text-title">Fechas y Horarios</h2>
          <div className="border bg-card rounded-lg p-6 space-y-4">
            {fields.map((item, index) => (
              <div
                key={item.id}
                className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] items-end gap-4 p-4 rounded-md border bg-quaternary"
              >
                <div className="flex flex-col gap-2">
                  <Label>Fecha</Label>
                  <Controller
                    control={form.control}
                    name={`schedule.${index}.date`}
                    render={({ field }) => (
                      <>
                        <input type="hidden" name={`schedule.${index}.date`} value={field.value} />
                        <DatePicker value={field.value} onChange={field.onChange} className="w-full" />
                      </>
                    )}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Hora Inicio</Label>
                  <Controller
                    control={form.control}
                    name={`schedule.${index}.startTime`}
                    render={({ field }) => (
                      <>
                        <input
                          type="hidden"
                          name={`schedule.${index}.startTime`}
                          value={form.watch(`schedule.${index}.startTime`) || field.value || '09:00 AM'}
                        />
                        <TimePicker
                          value={field.value}
                          onChange={(val) => {
                            field.onChange(val);
                            form.setValue(`schedule.${index}.endTime`, val);
                          }}
                        />
                      </>
                    )}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Hora Fin</Label>
                  <Controller
                    control={form.control}
                    name={`schedule.${index}.endTime`}
                    render={({ field }) => (
                      <>
                        <input
                          type="hidden"
                          name={`schedule.${index}.endTime`}
                          value={form.watch(`schedule.${index}.endTime`) || field.value || '05:00 PM'}
                        />
                        <TimePicker value={field.value} onChange={field.onChange} />
                      </>
                    )}
                  />
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            {form.formState.errors.schedule?.root && <p className="text-label text-destructive">{form.formState.errors.schedule.root.message}</p>}
            <Button type="button" variant="outline" onClick={() => append({ date: format(new Date(), 'yyyy-MM-dd'), startTime: '09:00 AM', endTime: '05:00 PM' })}>
              <Plus className="mr-2 h-4 w-4" /> Añadir fecha
            </Button>
          </div>
        </div>

        {/* ========== PASO 5: PRESUPUESTO ========== */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-title">Presupuesto y Tarifas</h2>
          </div>
          <div className="border bg-card rounded-lg p-6 space-y-6">
            {/* 1. Tipo de Pago y Moneda */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Tipo de Pago</Label>
                <Controller
                  control={form.control}
                  name="default_model_payment_type"
                  render={({ field }) => (
                    <>
                      <input type="hidden" name="default_model_payment_type" value={field.value || 'cash'} />
                      <Select value={field.value || 'cash'} onValueChange={field.onChange}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Efectivo / Transferencia</SelectItem>
                          <SelectItem value="trade">Canje / Intercambio</SelectItem>
                          <SelectItem value="mixed">Mixto (Efectivo + Canje)</SelectItem>
                        </SelectContent>
                      </Select>
                    </>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label>Moneda</Label>
                <Controller
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <>
                      <input type="hidden" name="currency" value={field.value || 'GTQ'} />
                      <Select value={field.value || 'GTQ'} onValueChange={field.onChange}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GTQ">GTQ - Quetzal</SelectItem>
                          <SelectItem value="USD">USD - Dólar</SelectItem>
                        </SelectContent>
                      </Select>
                    </>
                  )}
                />
              </div>
            </div>

            {/* 2. Campos Según Tipo */}
            {form.watch('default_model_payment_type') === 'cash' && (
              <div className="grid md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2">
                <div className="space-y-2">
                  <Label>Tarifa por Modelo</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-body">
                      {watchedCurrency || 'GTQ'}
                    </span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      className="pl-14"
                      {...form.register('default_model_fee')}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Tarifa</Label>
                  <Controller
                    control={form.control}
                    name="default_fee_type"
                    render={({ field }) => (
                      <Select value={field.value || 'per_day'} onValueChange={field.onChange}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="per_day">Por día</SelectItem>
                          <SelectItem value="per_hour">Por hora</SelectItem>
                          <SelectItem value="fixed">Fija</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>
            )}

            {form.watch('default_model_payment_type') === 'trade' && (
              <div className="grid md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2">
                <div className="space-y-2">
                  <Label>Valor Canje</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-body">{watchedCurrency || 'GTQ'}</span>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className="pl-14"
                      {...form.register('default_model_trade_fee')}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Categoría de Canje</Label>
                  <Controller
                    control={form.control}
                    name="default_model_trade_category"
                    render={({ field }) => (
                      <Select value={field.value || ''} onValueChange={field.onChange}>
                        <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                        <SelectContent>
                          {TRADE_CATEGORIES.map(cat => (
                            <SelectItem key={cat} value={cat}>{TRADE_CATEGORY_LABELS[cat]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <input type="hidden" name="default_model_trade_category" value={form.watch('default_model_trade_category') || ''} />
                </div>
              </div>
            )}

            {form.watch('default_model_payment_type') === 'mixed' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-top-2">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Tarifa en Efectivo</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-body">{watchedCurrency || 'GTQ'}</span>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="pl-14"
                        {...form.register('default_model_fee')}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo de Tarifa</Label>
                    <Controller
                      control={form.control}
                      name="default_fee_type"
                      render={({ field }) => (
                        <Select value={field.value || ''} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="per_day">Por día</SelectItem>
                            <SelectItem value="per_hour">Por hora</SelectItem>
                            <SelectItem value="fixed">Fija / Flat Fee</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Valor Canje</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-body">{watchedCurrency || 'GTQ'}</span>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="pl-14"
                        {...form.register('default_model_trade_fee')}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Categoría de Canje</Label>
                    <Controller
                      control={form.control}
                      name="default_model_trade_category"
                      render={({ field }) => (
                        <Select value={field.value || ''} onValueChange={field.onChange}>
                          <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                          <SelectContent>
                            {TRADE_CATEGORIES.map(cat => (
                              <SelectItem key={cat} value={cat}>{TRADE_CATEGORY_LABELS[cat]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    <input type="hidden" name="default_model_trade_category" value={form.watch('default_model_trade_category') || ''} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ========== PASO 6: FACTURACIÓN AL CLIENTE ========== */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-title">Facturación al Cliente</h2>
            <span className="text-label text-muted-foreground">(opcional)</span>
          </div>
          <div className="border bg-card rounded-lg p-6 space-y-6">
            {/* 1. Tipo de Pago y Moneda Cliente */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Tipo de Pago</Label>
                <Controller
                  control={form.control}
                  name="client_payment_type"
                  render={({ field }) => (
                    <>
                      <input type="hidden" name="client_payment_type" value={field.value || 'cash'} />
                      <Select value={field.value || 'cash'} onValueChange={field.onChange}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Efectivo / Transferencia</SelectItem>
                          <SelectItem value="trade">Canje</SelectItem>
                          <SelectItem value="mixed">Mixto</SelectItem>
                        </SelectContent>
                      </Select>
                    </>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label>Moneda</Label>
                <Select
                  value={clientCurrency}
                  onValueChange={(val) => {
                    setClientCurrency(val as 'GTQ' | 'USD');
                    setHasManuallySetClientCurrency(true);
                  }}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GTQ">GTQ - Quetzal</SelectItem>
                    <SelectItem value="USD">USD - Dólar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 2. Campos Según Tipo */}
            {form.watch('client_payment_type') === 'cash' && (
              <div className="grid md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-2">
                <div className="space-y-2">
                  <Label>Subtotal</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-body">{clientCurrency}</span>
                    <Input type="number" step="0.01" className="pl-14" {...form.register('revenue')} />
                  </div>
                  <input type="hidden" name="revenue" value={form.watch('revenue')?.toString() || ''} />
                </div>
                <div className="space-y-2">
                  <Label>Impuesto (%)</Label>
                  <Controller
                    control={form.control}
                    name="tax_percentage"
                    render={({ field }) => (
                      <Select value={field.value?.toString() || '12'} onValueChange={(v) => field.onChange(Number(v))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">0%</SelectItem>
                          <SelectItem value="5">5%</SelectItem>
                          <SelectItem value="7">7%</SelectItem>
                          <SelectItem value="10">10%</SelectItem>
                          <SelectItem value="12">12%</SelectItem>
                          <SelectItem value="13">13%</SelectItem>
                          <SelectItem value="15">15%</SelectItem>
                          <SelectItem value="16">16%</SelectItem>
                          <SelectItem value="18">18%</SelectItem>
                          <SelectItem value="19">19%</SelectItem>
                          <SelectItem value="21">21%</SelectItem>
                          <SelectItem value="23">23%</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <input type="hidden" name="tax_percentage" value={form.watch('tax_percentage')?.toString() || '12'} />
                </div>
                <div className="space-y-2">
                  <Label>Total</Label>
                  <Input
                    readOnly
                    disabled
                    value={`${clientCurrency} ${(((Number(form.watch('revenue')) || 0) * (1 + (Number(form.watch('tax_percentage')) || 12) / 100)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}`}
                    className="font-medium text-foreground bg-tertiary"
                  />
                </div>
              </div>
            )}

            {form.watch('client_payment_type') === 'trade' && (
              <div className="grid md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2">
                <div className="space-y-2">
                  <Label>Valor Canje</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-body">{clientCurrency}</span>
                    <Input type="number" step="0.01" className="pl-14" {...form.register('client_trade_revenue')} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Categoría</Label>
                  <Controller
                    control={form.control}
                    name="client_trade_category"
                    render={({ field }) => (
                      <Select value={field.value || ''} onValueChange={field.onChange}>
                        <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                        <SelectContent>
                          {TRADE_CATEGORIES.map(cat => (
                            <SelectItem key={cat} value={cat}>{TRADE_CATEGORY_LABELS[cat]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <input type="hidden" name="client_trade_category" value={form.watch('client_trade_category') || ''} />
                </div>
              </div>
            )}

            {form.watch('client_payment_type') === 'mixed' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-top-2">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label>Subtotal (Efectivo)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-body">{clientCurrency}</span>
                      <Input type="number" step="0.01" className="pl-14" {...form.register('revenue')} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>IVA (%)</Label>
                    <Input type="number" placeholder="5" {...form.register('tax_percentage')} />
                  </div>
                  <div className="space-y-2">
                    <Label>Total Factura</Label>
                    <Input
                      readOnly
                      disabled
                      value={new Intl.NumberFormat('es-GT', { style: 'currency', currency: clientCurrency }).format(
                        (parseFloat(form.watch('revenue') as unknown as string) || 0) * (1 + (parseFloat(form.watch('tax_percentage') as unknown as string) || 0) / 100)
                      )}
                      className="font-medium text-foreground bg-tertiary"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Valor Canje</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-body">{clientCurrency}</span>
                      <Input type="number" step="0.01" className="pl-14" {...form.register('client_trade_revenue')} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Categoría</Label>
                    <Controller
                      control={form.control}
                      name="client_trade_category"
                      render={({ field }) => (
                        <Select value={field.value || ''} onValueChange={field.onChange}>
                          <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                          <SelectContent>
                            {TRADE_CATEGORIES.map(cat => (
                              <SelectItem key={cat} value={cat}>{TRADE_CATEGORY_LABELS[cat]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    <input type="hidden" name="client_trade_category" value={form.watch('client_trade_category') || ''} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ========== PASO 7: SEGURIDAD ========== */}
        <div className="space-y-4">
          <h2 className="text-title">Seguridad</h2>
          <div className="border bg-card rounded-lg p-6">
            <div className="space-y-2 max-w-sm">
              <Label>Contraseña de acceso</Label>
              <Input type="password" {...form.register('password')} placeholder="Mínimo 6 caracteres" />
            </div>
          </div>
        </div>

      </form>

      {/* Modal de migración de schedule */}
      {isEditing && (
        <ScheduleMigrationModal
          open={showMigrationModal}
          onOpenChange={(open) => {
            setShowMigrationModal(open);
            if (!open) {
              pendingFormDataRef.current = null;
              pendingNewScheduleRef.current = [];
              setIsProcessingMigration(false);
            }
          }}
          changes={scheduleChanges}
          newSchedules={newSchedulesForMigration}
          projectName={generatedProjectName}
          onConfirm={handleMigrationConfirm}
          isProcessing={isProcessingMigration}
        />
      )
      }
    </FormProvider >
  );
}
