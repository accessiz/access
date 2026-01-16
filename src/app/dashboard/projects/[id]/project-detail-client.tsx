'use client'

import { useState, useTransition, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Model, Project } from '@/lib/types';
import { addModelToProject, updateModelPaymentDetail } from '@/lib/actions/projects_models';
import { SUPABASE_PUBLIC_URL } from '@/lib/constants';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/molecules/BackButton';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ProjectStatusBadge } from '@/components/molecules/ProjectStatusBadge';
import { ScheduleChips } from '@/components/molecules/ScheduleChips';
import { SearchBar } from '@/components/molecules/SearchBar';

import { ShareProjectDialog } from '@/components/organisms/ShareProjectDialog';
import { DeleteProjectDialog } from '@/components/organisms/DeleteProjectDialog';
import { ProjectStatusUpdater } from '@/components/organisms/ProjectStatusUpdater';
import {
    PlusCircle, XCircle, Loader2, Share2, Eye,
    Pencil, ArrowRightLeft,
    CalendarCheck2, Banknote, Save, Info, Copy, ChevronDown
} from 'lucide-react';
import { ExpandButton } from '@/components/molecules/ExpandButton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ProjectForm } from '@/components/organisms/ProjectForm';
import { TalentAssignmentPanel } from '@/components/organisms/TalentAssignmentPanel';
import { assignModelToSchedule, unassignModelFromSchedule } from '@/lib/actions/projects_models';
import { syncProjectSchedule, autoCloseExpiredProject } from '@/lib/actions/projects';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AdjustmentInfo, ADJUSTMENT_REASONS } from '@/components/molecules/AdjustmentInfo';


const ClientStatusBadge = ({ status }: { status: Model['client_selection'] }) => {
    return <ProjectStatusBadge status={status || 'pending'} size="small" />;
};



// Componente de Resumen de Presupuesto - Rediseñado según mockup
const BudgetSummaryCard = ({ project, selectedModels, onRefresh }: { project: Project, selectedModels: Model[], onRefresh?: () => void }) => {
    const [breakdownOpen, setBreakdownOpen] = useState(false);

    // Calcular estadísticas
    const approvedModels = selectedModels.filter(m => m.client_selection === 'approved');
    const pendingModels = selectedModels.filter(m => m.client_selection === 'pending');

    // Tipo de pago del proyecto (usar el configurado, no inferir de montos)
    const projectPaymentType = project.default_model_payment_type || 'cash';

    // Helper para obtener tarifas efectivas respetando el tipo de pago
    const getFees = (model: Model) => {
        const rawCash = model.agreed_fee !== null ? model.agreed_fee : project.default_model_fee;
        const rawTrade = model.trade_fee !== null ? model.trade_fee : project.default_model_trade_fee;

        // Respetar el tipo de pago del proyecto
        if (projectPaymentType === 'cash') {
            return { cash: rawCash || 0, trade: 0 };
        } else if (projectPaymentType === 'trade') {
            return { cash: 0, trade: rawTrade || 0 };
        } else {
            // mixed
            return { cash: rawCash || 0, trade: rawTrade || 0 };
        }
    };

    // Calcular totales
    let totalCash = 0;
    let totalTrade = 0;

    approvedModels.forEach(model => {
        const fees = getFees(model);
        const daysWorked = model.assignments?.length || 1;
        // Incluir ajustes en el total (separados para cash y trade)
        const adjustmentPerDayCash = model.assignments?.[0]?.adjustment_amount || 0;
        const adjustmentPerDayTrade = model.assignments?.[0]?.adjustment_amount_trade || 0;
        totalCash += (fees.cash * daysWorked) + (adjustmentPerDayCash * daysWorked);
        totalTrade += (fees.trade * daysWorked) + (adjustmentPerDayTrade * daysWorked);
    });

    const currency = project.currency || 'GTQ';


    // Default fees for display (respetando tipo de pago)
    const defaultCash = projectPaymentType === 'trade' ? 0 : (project.default_model_fee || 0);
    const defaultTrade = projectPaymentType === 'cash' ? 0 : (project.default_model_trade_fee || 0);

    return (
        <Card className="bg-sys-bg-secondary border">
            <CardContent className="p-4 space-y-4">
                {/* Header con título y tarifas */}
                <div className="space-y-3">
                    <h3 className="text-title font-semibold text-foreground">Presupuesto</h3>

                    {/* Tarifas por modelo */}
                    <div className="space-y-2">
                        {(projectPaymentType === 'cash' || projectPaymentType === 'mixed') && (
                            <div className="flex items-center gap-3">
                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-success/20 border border-success/30">
                                    <Banknote className="w-4 h-4 text-success" />
                                </span>
                                <div>
                                    <p className="text-body font-bold text-foreground">{currency} {defaultCash.toLocaleString()}</p>
                                    <p className="text-label text-muted-foreground">Día Por Modelo</p>
                                </div>
                            </div>
                        )}
                        {(projectPaymentType === 'trade' || projectPaymentType === 'mixed') && (
                            <div className="flex items-center gap-3">
                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-info/20 border border-info/30">
                                    <ArrowRightLeft className="w-4 h-4 text-info" />
                                </span>
                                <div>
                                    <p className="text-body font-bold text-foreground">{currency} {defaultTrade.toLocaleString()}</p>
                                    <p className="text-label text-muted-foreground">Día Por Modelo</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Estadísticas - Vertical en mobile, horizontal en desktop */}
                <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                    {/* Total - Fondo azul, texto info */}
                    <div className="flex-1 text-center p-4 rounded-lg bg-info/20 border border-info/50">
                        <p className="text-display font-black text-info">{selectedModels.length}</p>
                        <p className="text-body text-info font-semibold">Total</p>
                    </div>

                    {/* Pendientes - Fondo amarillo, texto warning */}
                    <div className="flex-1 text-center p-4 rounded-lg bg-warning/20 border border-warning/50">
                        <p className="text-display font-black text-warning">{pendingModels.length}</p>
                        <p className="text-body text-warning font-semibold">Pendientes</p>
                    </div>

                    {/* Aprobados - Fondo púrpura, texto púrpura */}
                    <div className="flex-1 text-center p-4 rounded-lg bg-purple/20 border border-purple/50">
                        <p className="text-display font-black text-purple">{approvedModels.length}</p>
                        <p className="text-body text-purple font-semibold">Aprobados</p>
                    </div>
                </div>

                {/* Totales en tarjetas separadas */}
                <div className="space-y-3">
                    {(projectPaymentType === 'cash' || projectPaymentType === 'mixed') && (
                        <div className="flex items-center justify-between p-4 rounded-lg bg-sys-bg-tertiary">
                            <span className="text-body text-muted-foreground">Total:</span>
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-success/20">
                                    <Banknote className="w-3.5 h-3.5 text-success" />
                                </span>
                                <span className="text-title font-black text-foreground">
                                    {currency} {totalCash.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    )}

                    {(projectPaymentType === 'trade' || projectPaymentType === 'mixed') && (
                        <div className="flex items-center justify-between p-4 rounded-lg bg-sys-bg-tertiary">
                            <span className="text-body text-muted-foreground">Total:</span>
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-info/20">
                                    <ArrowRightLeft className="w-3.5 h-3.5 text-info" />
                                </span>
                                <span className="text-title font-black text-foreground">
                                    {currency} {totalTrade.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Botón Ver Desglose */}
                <Collapsible open={breakdownOpen} onOpenChange={setBreakdownOpen}>
                    {approvedModels.length > 0 && (
                        <CollapsibleTrigger asChild>
                            <button
                                type="button"
                                className="flex items-center gap-3 text-body text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-transparent border border-separator hover:bg-hover-overlay transition-colors">
                                    <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${breakdownOpen ? 'rotate-180' : ''}`} />
                                </span>
                                <span>Ver Desglose</span>
                            </button>
                        </CollapsibleTrigger>
                    )}

                    {approvedModels.length > 0 && (
                        <CollapsibleContent>
                            <div className="mt-4 space-y-2 p-4 rounded-lg bg-sys-bg-tertiary">
                                {approvedModels.map(model => {
                                    const fees = getFees(model);
                                    const days = model.assignments?.length || 1;
                                    // Obtener el ajuste del primer assignment (se aplica a todos)
                                    const adjustmentPerDay = model.assignments?.[0]?.adjustment_amount || 0;
                                    const adjustmentPerDayTrade = model.assignments?.[0]?.adjustment_amount_trade || 0;

                                    const totalAdjustment = adjustmentPerDay * days;
                                    const totalAdjustmentTrade = adjustmentPerDayTrade * days;

                                    const amountCash = (fees.cash * days) + totalAdjustment;
                                    const amountTrade = (fees.trade * days) + totalAdjustmentTrade;

                                    return (
                                        <div key={model.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-3 border-b border-border/50 last:border-0 last:pb-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-body font-medium text-foreground">{model.alias} ({days} día{days > 1 ? 's' : ''})</span>
                                                <PaymentEditorPopover
                                                    model={model}
                                                    project={project}
                                                    onRefresh={onRefresh}
                                                />
                                            </div>
                                            <div className="flex items-center gap-3 pl-0 sm:pl-0">
                                                {amountCash > 0 && (
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-success/15">
                                                            <Banknote className="w-3 h-3 text-success" />
                                                        </span>
                                                        <span className="text-body text-success font-semibold">{currency} {amountCash.toLocaleString()}</span>
                                                        <AdjustmentInfo
                                                            amount={totalAdjustment}
                                                            reason={model.assignments?.[0]?.adjustment_reason || null}
                                                            currency={currency}
                                                        />
                                                    </div>
                                                )}
                                                {amountTrade > 0 && (
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-info/15">
                                                            <ArrowRightLeft className="w-3 h-3 text-info" />
                                                        </span>
                                                        <span className="text-body text-info font-semibold">{currency} {amountTrade.toLocaleString()}</span>
                                                        <AdjustmentInfo
                                                            amount={totalAdjustmentTrade}
                                                            reason={model.assignments?.[0]?.adjustment_reason_trade || null}
                                                            currency={currency}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CollapsibleContent>
                    )}
                </Collapsible>
            </CardContent>
        </Card>
    );
};

// Razones de ajuste predefinidas para la industria de modelaje/publicidad


const PaymentEditorPopover = ({
    model,
    project,
    onRefresh,
    onPaymentChange
}: {
    model: Model,
    project: Project,
    onRefresh?: () => void,
    onPaymentChange?: (modelId: string, fee: number, feeType: string, currency: string) => void
}) => {
    const [fee, setFee] = useState(model.agreed_fee?.toString() || '0');
    const [feeType, setFeeType] = useState(model.fee_type || 'per_day');
    const [currency, setCurrency] = useState(model.currency || 'GTQ');
    const [adjustmentCash, setAdjustmentCash] = useState('0');
    const [adjustmentCashReason, setAdjustmentCashReason] = useState('');
    const [adjustmentTrade, setAdjustmentTrade] = useState('0');
    const [adjustmentTradeReason, setAdjustmentTradeReason] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);
    const [open, setOpen] = useState(false);
    const [baseDetailsOpen, setBaseDetailsOpen] = useState(false);

    // Determinar tipo de pago del proyecto
    const paymentType = project.default_model_payment_type || 'cash';
    const showCash = paymentType === 'cash' || paymentType === 'mixed';
    const showTrade = paymentType === 'trade' || paymentType === 'mixed';

    // Cargar valores existentes cuando el dialog se abre
    useEffect(() => {
        if (open) {
            const assignment = model.assignments?.[0];
            if (assignment) {
                setAdjustmentCash(assignment.adjustment_amount?.toString() || '0');
                setAdjustmentCashReason(assignment.adjustment_reason || '');
                setAdjustmentTrade(assignment.adjustment_amount_trade?.toString() || '0');
                setAdjustmentTradeReason(assignment.adjustment_reason_trade || '');
            }
        }
    }, [open, model.assignments]);

    const parsedAdjustmentCash = parseFloat(adjustmentCash) || 0;
    const parsedAdjustmentTrade = parseFloat(adjustmentTrade) || 0;
    const parsedFee = parseFloat(fee) || 0;
    const parsedTradeFee = parseFloat(model.trade_fee?.toString() || '0') || 0;
    const calculatedTotalCash = parsedFee + parsedAdjustmentCash;
    const calculatedTotalTrade = parsedTradeFee + parsedAdjustmentTrade;

    const handleSave = async () => {
        setIsUpdating(true);
        const result = await updateModelPaymentDetail(project.id, model.id, {
            agreed_fee: parsedFee,
            trade_fee: parsedTradeFee,
            fee_type: feeType,
            currency: currency,
            adjustment_amount: parsedAdjustmentCash,
            adjustment_reason: adjustmentCashReason || null,
            adjustment_amount_trade: parsedAdjustmentTrade,
            adjustment_reason_trade: adjustmentTradeReason || null
        });
        if (result.success) {
            toast.success('Pago actualizado correctamente.');
            // Actualización optimista del estado local
            onPaymentChange?.(model.id, parsedFee, feeType, currency);
            setOpen(false);
            onRefresh?.();
        } else {
            toast.error(result.error || 'Error al actualizar pago.');
        }
        setIsUpdating(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 border border-success/50 bg-success/10 text-success hover:bg-success/20 hover:border-success"
                    title="Editar Pago"
                >
                    <Pencil className="h-3.5 w-3.5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Detalles de Pago</DialogTitle>
                    <DialogDescription>Ajusta la tarifa individual para {model.alias}.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="grid gap-y-3">


                        {/* Configuración Base Colapsable */}
                        <Collapsible open={baseDetailsOpen} onOpenChange={setBaseDetailsOpen} className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-body font-medium text-foreground">Configuración Base</span>
                                <CollapsibleTrigger asChild>
                                    <ExpandButton isOpen={baseDetailsOpen} size="sm" />
                                </CollapsibleTrigger>
                            </div>

                            <CollapsibleContent className="space-y-3 pt-1">
                                {/* Tarifa base */}
                                <div className="grid gap-y-2">
                                    <Label htmlFor="fee">Tarifa Base</Label>
                                    <Input
                                        id="fee"
                                        type="number"
                                        value={fee}
                                        onChange={(e) => setFee(e.target.value)}
                                        className="h-9"
                                    />
                                </div>

                                {/* Tipo de Tarifa */}
                                <div className="grid gap-y-2">
                                    <div className="flex items-center gap-2">
                                        <Label>Tipo de Tarifa</Label>
                                        <TooltipProvider>
                                            <Tooltip delayDuration={100}>
                                                <TooltipTrigger asChild>
                                                    <button type="button" className="text-muted-foreground hover:text-foreground transition-colors">
                                                        <Info className="h-3 w-3" />
                                                    </button>
                                                </TooltipTrigger>
                                                <TooltipContent side="top" className="max-w-xs p-3 text-body">
                                                    <p className="font-semibold mb-2">¿Cuál elegir?</p>
                                                    <ul className="space-y-1 text-label">
                                                        <li><strong>Por día:</strong> Según días trabajados.</li>
                                                        <li><strong>Por hora:</strong> Según horas trabajadas.</li>
                                                        <li><strong>Tarifa fija:</strong> Pago único por el proyecto.</li>
                                                    </ul>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                    <Select value={feeType} onValueChange={setFeeType}>
                                        <SelectTrigger className="h-9">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="per_day">Por día</SelectItem>
                                            <SelectItem value="per_hour">Por hora</SelectItem>
                                            <SelectItem value="fixed">Tarifa fija</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Moneda */}
                                <div className="grid gap-y-2">
                                    <Label>Moneda</Label>
                                    <Select value={currency} onValueChange={setCurrency}>
                                        <SelectTrigger className="h-9">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="GTQ">GTQ</SelectItem>
                                            <SelectItem value="USD">USD</SelectItem>
                                            <SelectItem value="EUR">EUR</SelectItem>
                                            <SelectItem value="MXN">MXN</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CollapsibleContent>
                        </Collapsible>

                        {/* Separador */}
                        <Separator className="my-1" />

                        {/* Ajuste Cash */}
                        {showCash && (
                            <>
                                <div className="grid gap-y-2">
                                    <div className="flex items-center gap-2">
                                        <Label htmlFor="adjustmentCash" className="text-success">Ajuste Cash</Label>
                                        <span className="text-label text-muted-foreground">(+bonus / -deducción)</span>
                                    </div>
                                    <Input
                                        id="adjustmentCash"
                                        type="number"
                                        value={adjustmentCash}
                                        onChange={(e) => setAdjustmentCash(e.target.value)}
                                        className={`h-9 ${parsedAdjustmentCash > 0 ? 'text-success border-success' : parsedAdjustmentCash < 0 ? 'text-destructive border-destructive' : ''}`}
                                        placeholder="0"
                                    />
                                </div>

                                {parsedAdjustmentCash !== 0 && (
                                    <div className="grid gap-y-2">
                                        <Label>Razón (Cash)</Label>
                                        <Select value={adjustmentCashReason} onValueChange={setAdjustmentCashReason}>
                                            <SelectTrigger className="h-9">
                                                <SelectValue placeholder="Seleccionar razón..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {parsedAdjustmentCash > 0 && ADJUSTMENT_REASONS.filter(r => r.type === 'positive').map(r => (
                                                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                                                ))}
                                                {parsedAdjustmentCash < 0 && ADJUSTMENT_REASONS.filter(r => r.type === 'negative').map(r => (
                                                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                                                ))}
                                                {ADJUSTMENT_REASONS.filter(r => r.type === 'neutral').map(r => (
                                                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </>
                        )}

                        {/* Ajuste Trade */}
                        {showTrade && (
                            <>
                                <div className="grid gap-y-2">
                                    <div className="flex items-center gap-2">
                                        <Label htmlFor="adjustmentTrade" className="text-info">Ajuste Canje</Label>
                                        <span className="text-label text-muted-foreground">(+bonus / -deducción)</span>
                                    </div>
                                    <Input
                                        id="adjustmentTrade"
                                        type="number"
                                        value={adjustmentTrade}
                                        onChange={(e) => setAdjustmentTrade(e.target.value)}
                                        className={`h-9 ${parsedAdjustmentTrade > 0 ? 'text-info border-info' : parsedAdjustmentTrade < 0 ? 'text-destructive border-destructive' : ''}`}
                                        placeholder="0"
                                    />
                                </div>

                                {parsedAdjustmentTrade !== 0 && (
                                    <div className="grid gap-y-2">
                                        <Label>Razón (Canje)</Label>
                                        <Select value={adjustmentTradeReason} onValueChange={setAdjustmentTradeReason}>
                                            <SelectTrigger className="h-9">
                                                <SelectValue placeholder="Seleccionar razón..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {parsedAdjustmentTrade > 0 && ADJUSTMENT_REASONS.filter(r => r.type === 'positive').map(r => (
                                                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                                                ))}
                                                {parsedAdjustmentTrade < 0 && ADJUSTMENT_REASONS.filter(r => r.type === 'negative').map(r => (
                                                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                                                ))}
                                                {ADJUSTMENT_REASONS.filter(r => r.type === 'neutral').map(r => (
                                                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </>
                        )}

                        {/* Totales calculados */}
                        {(parsedAdjustmentCash !== 0 || parsedAdjustmentTrade !== 0) && (
                            <div className="p-3 rounded-lg bg-sys-bg-tertiary space-y-2">
                                <span className="text-label text-muted-foreground">Total por día:</span>
                                <div className="flex items-center gap-4">
                                    {showCash && parsedAdjustmentCash !== 0 && (
                                        <span className={`text-body font-semibold ${parsedAdjustmentCash > 0 ? 'text-success' : 'text-destructive'}`}>
                                            Cash: {currency} {calculatedTotalCash.toLocaleString()}
                                        </span>
                                    )}
                                    {showTrade && parsedAdjustmentTrade !== 0 && (
                                        <span className={`text-body font-semibold ${parsedAdjustmentTrade > 0 ? 'text-info' : 'text-destructive'}`}>
                                            Canje: {currency} {calculatedTotalTrade.toLocaleString()}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <Button className="w-full" size="sm" onClick={handleSave} disabled={isUpdating}>
                        {isUpdating ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Save className="mr-2 h-3 w-3" />}
                        Guardar Cambios
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

const TalentRow = ({ model, project, onAction, isPending, actionType, onRefresh, onAssignmentChange, onPaymentChange }: {
    model: Model;
    project: Project;
    onAction: () => void;
    isPending: boolean;
    actionType: 'add' | 'remove';
    onRefresh?: () => void;
    onAssignmentChange?: (modelId: string, scheduleId: string, assigned: boolean) => void;
    onPaymentChange?: (modelId: string, fee: number, feeType: string, currency: string) => void;
}) => {
    const [isAssigning, setIsAssigning] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    const handleToggleAssignment = async (scheduleId: string, currentAssigned: boolean) => {
        setIsAssigning(true);

        // Optimistic update ANTES de la llamada al servidor
        onAssignmentChange?.(model.id, scheduleId, !currentAssigned);

        let success = false;
        if (currentAssigned) {
            const result = await unassignModelFromSchedule(scheduleId, model.id, project.id);
            success = result.success;
        } else {
            const result = await assignModelToSchedule(scheduleId, model.id, project.id);
            success = result.success;
        }

        if (!success) {
            // Revertir si falla
            onAssignmentChange?.(model.id, scheduleId, currentAssigned);
            toast.error('Error al actualizar asignación');
        }

        setIsAssigning(false);
    };

    const handleSync = async () => {
        setIsSyncing(true);
        const result = await syncProjectSchedule(project.id);
        if (result.success) {
            toast.success('Horarios sincronizados correctamente.');
            onRefresh?.();
        } else {
            toast.error(result.error || 'Error al sincronizar.');
        }
        setIsSyncing(false);
    };

    return (
        <div className="flex flex-col gap-y-2 p-2 hover:bg-hover-overlay rounded-md transition-colors">
            <div className="flex items-center gap-x-3 gap-y-3">
                <Avatar className="h-10 w-10 border border-border">
                    <AvatarImage src={model.coverUrl || `${SUPABASE_PUBLIC_URL}${model.id}/Portada/cover.jpg`} />
                    <AvatarFallback>{model.alias?.substring(0, 2) || 'IZ'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-x-2 gap-y-2">
                        <p className="text-body font-medium truncate">{model.alias}</p>
                        {actionType === 'remove' && (
                            <>
                                {(model.agreed_fee || 0) > 0 && (
                                    <Badge variant="outline" size="small" className="font-mono">
                                        {model.currency} {model.agreed_fee} {model.fee_type === 'per_day' ? '/d' : model.fee_type === 'per_hour' ? '/h' : ''}
                                    </Badge>
                                )}
                                {(model.trade_fee || 0) > 0 && (
                                    <Badge variant="secondary" size="small" className="font-mono bg-purple/10 text-purple border-purple/20">
                                        {model.currency} {model.trade_fee} {model.fee_type === 'per_day' ? '/d' : model.fee_type === 'per_hour' ? '/h' : ''} (Canje)
                                    </Badge>
                                )}
                                {!(model.agreed_fee || 0) && !(model.trade_fee || 0) && (
                                    <Badge variant="outline" size="small" className="font-mono text-muted-foreground border-dashed">
                                        Sin tarifa
                                    </Badge>
                                )}
                            </>
                        )}
                    </div>
                    <p className="text-label text-muted-foreground truncate">{model.country}</p>
                </div>

                <div className="flex items-center gap-x-2 gap-y-2">
                    {actionType === 'remove' && (
                        <>
                            <ClientStatusBadge status={model.client_selection} />
                            <PaymentEditorPopover model={model} project={project} onRefresh={onRefresh} onPaymentChange={onPaymentChange} />
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button size="icon" variant="outline" className="h-8 w-8" disabled={isPending || isAssigning || isSyncing}>
                                        <CalendarCheck2 className="h-4 w-4" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-64 p-4" align="end">
                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <h4 className="font-medium text-body">Asignar Horarios</h4>
                                            <p className="text-label text-muted-foreground">Define cuándo estará presente el talento.</p>
                                        </div>
                                        <div className="space-y-3">
                                            {(() => {
                                                const scheduleItems = project.schedule || [];
                                                const hasValidIds = scheduleItems.some(item => !!item.id);

                                                if (scheduleItems.length > 0 && !hasValidIds) {
                                                    return (
                                                        <div className="space-y-3">
                                                            <p className="text-label text-info bg-info/10 p-2 rounded-md border border-info/20 italic">
                                                                Los horarios de este proyecto necesitan activarse para poder asignar modelos.
                                                            </p>
                                                            <Button
                                                                size="sm"
                                                                className="w-full h-8 text-label"
                                                                onClick={handleSync}
                                                                disabled={isSyncing}
                                                            >
                                                                {isSyncing ? <Loader2 className="animate-spin h-3 w-3 mr-2" /> : <CalendarCheck2 className="h-3 w-3 mr-2" />}
                                                                Activar Horarios
                                                            </Button>
                                                        </div>
                                                    );
                                                }

                                                if (scheduleItems.length === 0) {
                                                    return (
                                                        <p className="text-label text-muted-foreground italic">No hay horarios definidos en el proyecto.</p>
                                                    );
                                                }

                                                return scheduleItems.map((item) => {
                                                    if (!item.id) return null;
                                                    const isAssigned = !!model.assignments?.some(a => a.schedule_id === item.id);
                                                    const dateObj = new Date(`${item.date}T00:00:00`);
                                                    const label = `${dateObj.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' })} (${item.startTime})`;

                                                    return (
                                                        <div key={item.id} className="flex items-center space-x-2">
                                                            <Checkbox
                                                                id={`assign-${model.id}-${item.id}`}
                                                                checked={isAssigned}
                                                                disabled={isAssigning}
                                                                onCheckedChange={() => handleToggleAssignment(item.id!, isAssigned)}
                                                            />
                                                            <Label
                                                                htmlFor={`assign-${model.id}-${item.id}`}
                                                                className="text-label cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                            >
                                                                {label}
                                                            </Label>
                                                        </div>
                                                    );
                                                });
                                            })()}
                                        </div>

                                    </div>
                                </PopoverContent>
                            </Popover>
                        </>
                    )}

                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onAction} disabled={isPending || isAssigning || isSyncing}>
                        {isPending ? <Loader2 className="animate-spin h-4 w-4" /> : (
                            actionType === 'add' ? <PlusCircle className="h-4 w-4 text-success" /> : <XCircle className="h-4 w-4 text-destructive" />
                        )}
                    </Button>
                </div>
            </div>

            {actionType === 'remove' && model.assignments && model.assignments.length > 0 && (
                <div className="flex flex-wrap gap-x-2 gap-y-2 ml-13">
                    {model.assignments.map(a => {
                        const scheduleItem = project.schedule?.find(s => s.id === a.schedule_id);
                        if (!scheduleItem) return null;
                        const dateObj = new Date(`${scheduleItem.date}T00:00:00`);
                        return (
                            <Badge key={a.id} variant="secondary" size="small" className="font-normal bg-info/10 text-info border-info/20">
                                {dateObj.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' })}
                            </Badge>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

const DangerZone = ({ project }: { project: Project }) => {
    const [open, setOpen] = useState(false);

    const handleCopyId = () => {
        navigator.clipboard.writeText(project.id);
        toast.success('UUID copiado al portapapeles');
    };

    return (
        <div className="space-y-4">
            <Collapsible open={open} onOpenChange={setOpen}>
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
                                aria-label={open ? 'Cerrar zona de peligro' : 'Abrir zona de peligro'}
                                title={open ? 'Cerrar' : 'Abrir'}
                            >
                                <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
                            </Button>
                        </CollapsibleTrigger>
                    </CardHeader>
                    <CollapsibleContent>
                        <CardContent>
                            <div className="flex items-center justify-between rounded-lg border border-destructive bg-destructive/5 p-4">
                                <div>
                                    <p className="text-body text-foreground">Eliminar este proyecto</p>
                                    <p className="text-label text-muted-foreground">Toda la información y selección de talentos se perderá.</p>
                                </div>
                                <DeleteProjectDialog projectId={project.id} projectName={project.project_name || 'este proyecto'}>
                                    <Button variant="destructive">Eliminar</Button>
                                </DeleteProjectDialog>
                            </div>
                        </CardContent>
                    </CollapsibleContent>
                </Card>
            </Collapsible>

            {/* UUID del proyecto */}
            <div className="flex items-center justify-center gap-2 pt-2">
                <span className="text-label text-muted-foreground font-mono">{project.id}</span>
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
    );
};

interface ProjectDetailClientProps {
    project: Project;
    initialSelectedModels: Model[];
    allModels: Model[];
}


export default function ProjectDetailClient({ project: initialProject, initialSelectedModels, allModels }: ProjectDetailClientProps) {
    const router = useRouter();
    const [project, setProject] = useState(initialProject);
    const [selectedModels, setSelectedModels] = useState(initialSelectedModels);
    const [searchQuery, setSearchQuery] = useState('');
    const [isPending, startTransition] = useTransition();
    const [isEditing, setIsEditing] = useState(false);
    const [scheduleOpen, setScheduleOpen] = useState(false);

    // Sincronizar estado cuando los props cambian (después de router.refresh())
    useEffect(() => {
        setProject(initialProject);
        setSelectedModels(initialSelectedModels);
    }, [initialProject, initialSelectedModels]);

    const handleRefresh = () => {
        router.refresh();
    };

    const handleStatusChange = (newStatus: Project['status']) => {
        setProject(currentProject => ({ ...currentProject, status: newStatus }));
    };

    // Verificar auto-cierre de proyecto al cargar
    useEffect(() => {
        const checkAutoClose = async () => {
            if (project.status === 'completed' || project.status === 'archived') return;

            const result = await autoCloseExpiredProject(project.id);
            if (result.closed) {
                toast.info('Este proyecto ha sido cerrado automáticamente porque pasó su fecha final.', {
                    description: 'Los modelos pendientes fueron marcados como rechazados.',
                    duration: 6000,
                });
                setProject(prev => ({ ...prev, status: 'completed' }));
                // Actualizar modelos pendientes a rechazados en el estado local
                setSelectedModels(prev => prev.map(m =>
                    m.client_selection === 'pending'
                        ? { ...m, client_selection: 'rejected' }
                        : m
                ));
            }
        };
        checkAutoClose();
    }, [project.id, project.status]);

    const hasSchedule = Array.isArray(project.schedule) && project.schedule.length > 0;


    const availableModels = useMemo(() => {
        const selectedIds = new Set(selectedModels.map(m => m.id));
        return allModels
            .filter(model => !selectedIds.has(model.id))
            .filter(model =>
                model.alias?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                model.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
            );
    }, [allModels, selectedModels, searchQuery]);

    const handleAddModel = (modelId: string) => {
        startTransition(async () => {
            // Optimistic update ANTES de la llamada al servidor
            const modelToAdd = allModels.find(m => m.id === modelId);
            if (modelToAdd) {
                setSelectedModels(prev => [...prev, {
                    ...modelToAdd,
                    client_selection: 'pending',
                    agreed_fee: project.default_model_fee || 0,
                    trade_fee: project.default_model_trade_fee || 0, // Init trade fee
                    fee_type: project.default_fee_type || 'per_day',
                    currency: project.currency || 'GTQ',
                    assignments: []
                }]);
            }

            const result = await addModelToProject(project.id, modelId);
            if (result.success) {
                toast.success(`Talento añadido a ${project.project_name}`);
            } else {
                // Revertir si falla
                if (modelToAdd) {
                    setSelectedModels(prev => prev.filter(m => m.id !== modelId));
                }
                toast.error(result.error || "Error desconocido al añadir");
            }
        });
    };

    // Función para manejar cambios en asignaciones de horario
    const handleAssignmentChange = (modelId: string, scheduleId: string, assigned: boolean) => {
        setSelectedModels(prev => prev.map(model => {
            if (model.id !== modelId) return model;

            const currentAssignments = model.assignments || [];

            if (assigned) {
                // Agregar la asignación
                const newAssignment = {
                    id: `temp-${Date.now()}`, // ID temporal hasta que se refresque
                    schedule_id: scheduleId,
                    model_id: modelId,
                    project_id: project.id, // Nuevo campo requerido
                    is_confirmed: null,
                    created_at: new Date().toISOString(),
                    // Nuevos campos de pago (defaults)
                    daily_fee: null,
                    hours_worked: null,
                    adjustment_amount: 0,
                    adjustment_amount_trade: 0,
                    adjustment_reason: null,
                    adjustment_reason_trade: null,
                    payment_status: 'pending' as const,
                    payment_date: null,
                    payment_type: null,
                    trade_description: null,
                    trade_category: null,
                    trade_details: null,
                    trade_fee: null,
                    notes: null,
                    // Currency conversion fields
                    amount_gtq: null,
                    exchange_rate_used: null,
                };
                return {
                    ...model,
                    assignments: [...currentAssignments, newAssignment]
                };
            } else {
                // Eliminar la asignación
                return {
                    ...model,
                    assignments: currentAssignments.filter(a => a.schedule_id !== scheduleId)
                };
            }
        }));
    };

    // Función para manejar la cancelación o finalización de la edición
    const handleEditFinish = () => {
        setIsEditing(false);
        // Podríamos querer recargar los datos del proyecto aquí
    }

    if (isEditing) {
        return (
            <div className="space-y-6">
                <ProjectForm initialData={project} onCancel={handleEditFinish} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <header className="flex flex-col gap-x-4 gap-y-4 pb-4 border-b sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <BackButton href="/dashboard/projects" label="Volver a Proyectos" />
                    <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
                        <h1 className="text-display font-semibold">{project.project_name}</h1>
                        {project.client_name && (
                            <>
                                <span className="hidden sm:inline text-muted-foreground">|</span>
                                <span className="text-body text-muted-foreground">{project.client_name}</span>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-2 gap-y-2 shrink-0 w-full sm:w-auto">
                    <Button variant="outline" asChild className="grow sm:grow-0">
                        <Link href={`/c/${project.id}`} target="_blank"><Eye className="mr-2 h-4 w-4" /> Previsualizar</Link>
                    </Button>
                    <Button onClick={() => setIsEditing(true)} variant="outline" className="grow sm:grow-0">
                        <Pencil className="mr-2 h-4 w-4" /> Editar Proyecto
                    </Button>
                    <ShareProjectDialog project={project} onStatusChange={handleStatusChange} selectedModels={selectedModels}>
                        <Button className="grow sm:grow-0"><Share2 className="mr-2 h-4 w-4" /> Compartir</Button>
                    </ShareProjectDialog>
                </div>
            </header>

            <Card>
                <Collapsible open={scheduleOpen} onOpenChange={setScheduleOpen}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-title font-semibold">Horarios</CardTitle>

                        <CollapsibleTrigger asChild>
                            <button
                                type="button"
                                className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-transparent border border-separator hover:bg-hover-overlay transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                aria-label={scheduleOpen ? 'Contraer horarios' : 'Expandir horarios'}
                            >
                                <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${scheduleOpen ? 'rotate-180' : ''}`} />
                            </button>
                        </CollapsibleTrigger>
                    </CardHeader>

                    {hasSchedule && (
                        <CollapsibleContent asChild>
                            <CardContent>
                                <ScheduleChips schedule={project.schedule} fullWidth />
                            </CardContent>
                        </CollapsibleContent>
                    )}
                </Collapsible>
            </Card>


            <ProjectStatusUpdater project={project} selectedModels={selectedModels} />

            {/* Resumen de Presupuesto */}
            <BudgetSummaryCard project={project} selectedModels={selectedModels} onRefresh={handleRefresh} />

            <div className="grid md:grid-cols-[30%_1fr] gap-6 items-start">
                <Card className="flex flex-col h-full">
                    <CardHeader>
                        <CardTitle>Selección de Talentos</CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-4 flex-1 flex flex-col min-h-0">
                        <SearchBar
                            value={searchQuery}
                            onValueChange={setSearchQuery}
                            onClear={() => setSearchQuery('')}
                            placeholder="Buscar talento por nombre o alias..."
                            ariaLabel="Buscar talento"
                            inputClassName="h-9"
                        />
                        <Separator />
                        <ScrollArea className="h-[500px]">
                            <div className="space-y-2 pr-4">
                                {availableModels.length > 0 ? availableModels.map(model => (
                                    <TalentRow
                                        key={model.id}
                                        model={model}
                                        project={project}
                                        onAction={() => handleAddModel(model.id)}
                                        isPending={isPending}
                                        actionType="add"
                                        onRefresh={handleRefresh}
                                    />
                                )) : (
                                    <p className="text-center text-body text-muted-foreground py-4">No hay más talentos disponibles o que coincidan.</p>
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* Panel unificado de Talentos con Grid de Asignaciones */}
                <TalentAssignmentPanel
                    project={project}
                    models={selectedModels}
                    onAssignmentChange={handleAssignmentChange}
                    onModelRemoved={() => { }}
                    onSelectionChange={(modelId, status) => {
                        // Actualizar estado local para feedback inmediato
                        setSelectedModels(prev => prev.map(m =>
                            m.id === modelId ? { ...m, client_selection: status } : m
                        ));
                    }}
                    onRefresh={handleRefresh}
                />
            </div>

            <DangerZone project={project} />
        </div>
    );
}