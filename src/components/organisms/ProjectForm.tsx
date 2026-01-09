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
  DollarSign,
  Info,
  Building2,
  Tag,
  Layers,
  Check,
  FileText,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

interface ProjectFormProps {
  initialData?: Project;
  onCancel?: () => void;
}

type ClientWithBrands = Client & { brands: Brand[] };
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

  // 2. Marca o Cliente
  if (brandName) {
    parts.push(brandName);
  } else if (clientName) {
    parts.push(clientName);
  }

  // 3. Nombre personalizado (opcional)
  if (customName && customName.trim()) {
    parts.push(customName.trim());
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
    const prefixParts: string[] = [];

    // 1. Tipos de proyecto
    if (types && types.length > 0) {
      const typeLabels = types
        .map(t => PROJECT_TYPES.find(pt => pt.value === t)?.label || t);
      prefixParts.push(...typeLabels);
    }

    // 2. Marca o Cliente
    if (brandName) {
      prefixParts.push(brandName);
    } else if (clientName) {
      prefixParts.push(clientName);
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
      default_model_fee: initialData?.default_model_fee ?? null,
      default_fee_type: (initialData?.default_fee_type as 'per_day' | 'per_hour' | 'fixed') ?? 'per_day',
      currency: (initialData?.currency as 'GTQ' | 'USD' | 'EUR' | 'MXN' | 'COP' | 'PEN' | 'ARS' | 'CLP' | 'BRL') ?? 'GTQ',
      // Campos de facturación al cliente
      revenue: (initialData as any)?.revenue ?? null,
      tax_percentage: (initialData as any)?.tax_percentage ?? 12,
      client_payment_status: ((initialData as any)?.client_payment_status as 'pending' | 'invoiced' | 'paid') ?? 'pending',
      invoice_number: (initialData as any)?.invoice_number ?? '',
      invoice_date: (initialData as any)?.invoice_date ?? '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'schedule',
  });

  // Observar campos para generar nombre automático
  const selectedClientId = form.watch('client_id');
  const selectedBrandId = form.watch('brand_id');
  const selectedProjectTypes = form.watch('project_types') || [];
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
      // Ordenar por jerarquía al agregar
      const newTypes = [...current, type].sort((a, b) => {
        const orderA = PROJECT_TYPES.findIndex(pt => pt.value === a);
        const orderB = PROJECT_TYPES.findIndex(pt => pt.value === b);
        return orderA - orderB;
      });
      form.setValue('project_types', newTypes);
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
    } catch (_err) {
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
    fd.set('currency', values.currency || 'GTQ');
    // Campos de facturación al cliente
    fd.set('revenue', values.revenue?.toString() || '');
    fd.set('tax_percentage', values.tax_percentage?.toString() || '12');
    fd.set('client_payment_status', values.client_payment_status || 'pending');
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
            <h1 className="text-heading-32 leading-tight transition-all duration-200">
              {generatedProjectName}
            </h1>
            {/* Subtexto de contexto */}
            <p className="text-copy-14 text-muted-foreground flex items-center gap-1.5">
              {isEditing ? (
                <><FileText className="h-3.5 w-3.5" /> Editando proyecto</>
              ) : (
                <><Plus className="h-3.5 w-3.5" /> Nuevo proyecto</>
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
            <Layers className="h-5 w-5 text-primary" />
            <h2 className="text-heading-20">Tipo de Proyecto</h2>
            <span className="text-copy-12 text-muted-foreground">(máx. 2)</span>
          </div>
          <div className="border bg-card rounded-lg p-6">
            <div className="flex flex-wrap gap-2">
              {PROJECT_TYPES.map((type) => {
                const isSelected = selectedProjectTypes.includes(type.value);
                const selectionIndex = selectedProjectTypes.indexOf(type.value);
                const isPrimary = selectionIndex === 0; // El primero es el que aparece en el nombre
                return (
                  <Button
                    key={type.value}
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "h-9 px-4 transition-all relative",
                      isSelected && "bg-primary text-primary-foreground shadow-md"
                    )}
                    onClick={() => toggleProjectType(type.value)}
                  >
                    {type.label}
                    {isSelected && (
                      <span className={cn(
                        "ml-2 flex items-center justify-center size-5 rounded-full text-[10px] font-bold",
                        isPrimary
                          ? "bg-white text-primary"
                          : "bg-primary-foreground/20 text-primary-foreground"
                      )}>
                        {selectionIndex + 1}
                      </span>
                    )}
                  </Button>
                );
              })}
            </div>
            {form.formState.errors.project_types && (
              <p className="text-label-12 text-destructive mt-3">{form.formState.errors.project_types.message}</p>
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
            <Building2 className="h-5 w-5 text-primary" />
            <h2 className="text-heading-20">Cliente</h2>
            <span className="text-copy-12 text-muted-foreground">(recomendado)</span>
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
                    className="h-6 px-2 text-copy-12 text-muted-foreground"
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
                  <Tag className="h-4 w-4 text-muted-foreground" />
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
                <p className="text-copy-12 text-muted-foreground">
                  {selectedClient?.name} tiene {availableBrands.length} marca{availableBrands.length !== 1 ? 's' : ''}.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ========== PASO 3: NOMBRE ADICIONAL ========== */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="text-heading-20">Palabra adicional</h2>
            <span className="text-copy-12 text-muted-foreground">(opcional)</span>
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
          <h2 className="text-heading-20">Fechas y Horarios</h2>
          <div className="border bg-card rounded-lg p-6 space-y-4">
            {fields.map((item, index) => (
              <div key={item.id} className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto] items-end gap-4 p-4 rounded-md border bg-muted/30">
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
            {form.formState.errors.schedule?.root && <p className="text-label-12 text-destructive">{form.formState.errors.schedule.root.message}</p>}
            <Button type="button" variant="outline" onClick={() => append({ date: format(new Date(), 'yyyy-MM-dd'), startTime: '09:00 AM', endTime: '05:00 PM' })}>
              <Plus className="mr-2 h-4 w-4" /> Añadir fecha
            </Button>
          </div>
        </div>

        {/* ========== PASO 5: PRESUPUESTO ========== */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            <h2 className="text-heading-20">Presupuesto y Tarifas</h2>
          </div>
          <div className="border bg-card rounded-lg p-6 grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label>Tarifa por Modelo</Label>
              <Input type="number" step="0.01" min="0" placeholder="0.00" {...form.register('default_model_fee')} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Label>Tipo de Tarifa</Label>
                <TooltipProvider>
                  <Tooltip delayDuration={100}>
                    <TooltipTrigger asChild>
                      <button type="button" className="text-muted-foreground hover:text-foreground">
                        <Info className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-xs p-3">
                      <ul className="space-y-1 text-xs">
                        <li><strong>Por día:</strong> Tarifa diaria.</li>
                        <li><strong>Por hora:</strong> Tarifa por hora trabajada.</li>
                        <li><strong>Tarifa fija:</strong> Monto único por proyecto.</li>
                      </ul>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Controller
                control={form.control}
                name="default_fee_type"
                render={({ field }) => (
                  <>
                    <input type="hidden" name="default_fee_type" value={field.value || ''} />
                    <Select value={field.value || 'per_day'} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="per_day">Por día</SelectItem>
                        <SelectItem value="per_hour">Por hora</SelectItem>
                        <SelectItem value="fixed">Tarifa fija</SelectItem>
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
                    <input type="hidden" name="currency" value={field.value || ''} />
                    <Select value={field.value || 'GTQ'} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GTQ">GTQ</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="MXN">MXN</SelectItem>
                        <SelectItem value="COP">COP</SelectItem>
                        <SelectItem value="PEN">PEN</SelectItem>
                        <SelectItem value="ARS">ARS</SelectItem>
                        <SelectItem value="CLP">CLP</SelectItem>
                        <SelectItem value="BRL">BRL</SelectItem>
                      </SelectContent>
                    </Select>
                  </>
                )}
              />
            </div>
          </div>
        </div>

        {/* ========== PASO 6: FACTURACIÓN AL CLIENTE ========== */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            <h2 className="text-heading-20">Facturación al Cliente</h2>
            <span className="text-copy-12 text-muted-foreground">(opcional)</span>
          </div>
          <div className="border bg-card rounded-lg p-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label>Subtotal a cobrar</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    {form.watch('currency') || 'GTQ'}
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="pl-14"
                    {...form.register('revenue')}
                  />
                </div>
                <input type="hidden" name="revenue" value={form.watch('revenue')?.toString() || ''} />
              </div>

              <div className="space-y-2">
                <Label>Impuesto (%)</Label>
                <Controller
                  control={form.control}
                  name="tax_percentage"
                  render={({ field }) => (
                    <>
                      <input type="hidden" name="tax_percentage" value={field.value?.toString() || '12'} />
                      <Select
                        value={field.value?.toString() || '12'}
                        onValueChange={(v) => field.onChange(Number(v))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">0% (Sin impuesto)</SelectItem>
                          <SelectItem value="5">5%</SelectItem>
                          <SelectItem value="8">8%</SelectItem>
                          <SelectItem value="10">10%</SelectItem>
                          <SelectItem value="12">12% (IVA Guatemala)</SelectItem>
                          <SelectItem value="15">15%</SelectItem>
                          <SelectItem value="16">16%</SelectItem>
                          <SelectItem value="18">18%</SelectItem>
                          <SelectItem value="19">19%</SelectItem>
                          <SelectItem value="21">21%</SelectItem>
                        </SelectContent>
                      </Select>
                    </>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label>Total con impuesto</Label>
                <div className="h-10 px-3 py-2 bg-muted rounded-md flex items-center font-medium text-lg">
                  {form.watch('currency') || 'GTQ'}{' '}
                  {((
                    (Number(form.watch('revenue')) || 0) *
                    (1 + (Number(form.watch('tax_percentage')) || 12) / 100)
                  ).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}
                </div>
                <p className="text-copy-12 text-muted-foreground">Calculado automáticamente</p>
              </div>
            </div>
          </div>
        </div>

        {/* ========== PASO 7: SEGURIDAD ========== */}
        <div className="space-y-4">
          <h2 className="text-heading-20">Seguridad</h2>
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
