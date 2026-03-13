'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Model, Project } from '@/lib/types';
import { updateModelPaymentDetail } from '@/lib/actions/projects_models';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ExpandButton } from '@/components/molecules/ExpandButton';
import { ADJUSTMENT_REASONS } from '@/components/molecules/AdjustmentInfo';
import { Pencil, Loader2, Save, Info } from 'lucide-react';

import type { PaymentEditorPopoverProps } from './PaymentEditor.types';

export function PaymentEditorPopover({
    model,
    project,
    onRefresh,
    onPaymentChange,
}: PaymentEditorPopoverProps) {
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
            adjustment_reason_trade: adjustmentTradeReason || null,
        });
        if (result.success) {
            toast.success('Pago actualizado correctamente.');
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
}
