'use client';

import { useState } from 'react';
import { Model, Project } from '@/lib/types';

import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Banknote, ArrowRightLeft, ChevronDown } from 'lucide-react';
import { AdjustmentInfo } from '@/components/molecules/AdjustmentInfo';
import { PaymentEditorPopover } from '../_payment-editor/PaymentEditor';

import type { BudgetSummaryCardProps } from './BudgetSummary.types';

export function BudgetSummaryCard({ project, selectedModels, onRefresh }: BudgetSummaryCardProps) {
    const [breakdownOpen, setBreakdownOpen] = useState(false);

    // Calcular estadísticas
    const approvedModels = selectedModels.filter(m => m.client_selection === 'approved');
    const pendingModels = selectedModels.filter(m => m.client_selection === 'pending');

    // Tipo de pago del proyecto
    const projectPaymentType = project.default_model_payment_type || 'cash';

    // Helper para obtener tarifas efectivas respetando el tipo de pago
    const getFees = (model: Model) => {
        const rawCash = model.agreed_fee !== null ? model.agreed_fee : project.default_model_fee;
        const rawTrade = model.trade_fee !== null ? model.trade_fee : project.default_model_trade_fee;

        if (projectPaymentType === 'cash') {
            return { cash: rawCash || 0, trade: 0 };
        } else if (projectPaymentType === 'trade') {
            return { cash: 0, trade: rawTrade || 0 };
        } else {
            return { cash: rawCash || 0, trade: rawTrade || 0 };
        }
    };

    // Calcular totales
    let totalCash = 0;
    let totalTrade = 0;

    approvedModels.forEach(model => {
        const fees = getFees(model);
        const daysWorked = model.assignments?.length || 1;
        const adjustmentPerDayCash = model.assignments?.[0]?.adjustment_amount || 0;
        const adjustmentPerDayTrade = model.assignments?.[0]?.adjustment_amount_trade || 0;
        totalCash += (fees.cash * daysWorked) + (adjustmentPerDayCash * daysWorked);
        totalTrade += (fees.trade * daysWorked) + (adjustmentPerDayTrade * daysWorked);
    });

    const currency = project.currency || 'GTQ';

    // Default fees for display
    const defaultCash = projectPaymentType === 'trade' ? 0 : (project.default_model_fee || 0);
    const defaultTrade = projectPaymentType === 'cash' ? 0 : (project.default_model_trade_fee || 0);

    return (
        <Card className="bg-sys-bg-secondary border">
            <CardContent className="p-4 space-y-4">
                {/* Header con título y tarifas */}
                <div className="space-y-3">
                    <h3 className="text-title font-semibold text-foreground">Presupuesto</h3>

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

                {/* Estadísticas */}
                <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                    <div className="flex-1 text-center p-4 rounded-lg bg-info/20 border border-info/50">
                        <p className="text-display font-black text-info">{selectedModels.length}</p>
                        <p className="text-body text-info font-semibold">Total</p>
                    </div>
                    <div className="flex-1 text-center p-4 rounded-lg bg-warning/20 border border-warning/50">
                        <p className="text-display font-black text-warning">{pendingModels.length}</p>
                        <p className="text-body text-warning font-semibold">Pendientes</p>
                    </div>
                    <div className="flex-1 text-center p-4 rounded-lg bg-purple/20 border border-purple/50">
                        <p className="text-display font-black text-purple">{approvedModels.length}</p>
                        <p className="text-body text-purple font-semibold">Aprobados</p>
                    </div>
                </div>

                {/* Totales */}
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
}
