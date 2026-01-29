'use client';

import * as React from 'react';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    Users,
    CheckCircle2,
    XCircle,
    Building2,
    MoreHorizontal,
    ChevronDown,
    User,
    Banknote,
    RefreshCw,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { AdjustmentInfo } from '@/components/molecules/AdjustmentInfo';

import { formatCurrency } from '@/lib/finance/utils';
import { PAYMENT_STATUS_CONFIG } from '@/lib/finance/constants';
import type { ProjectGroupCardProps } from './ProjectGroupCard.types';

export function ProjectGroupCard({
    group,
    onMarkAsPaid,
    onMarkAllAsPaid,
    onMarkAsCancelled,
    currentRate,
}: ProjectGroupCardProps) {
    const [isOpen, setIsOpen] = React.useState(false);
    const clientDisplay = group.brand_name || group.client_name || '-';
    const pendingModels = group.models.filter(m => m.payment_status === 'pending' || m.payment_status === 'partial');
    const hasPendingPayments = pendingModels.length > 0;

    const handleMarkAllAsPaid = () => {
        onMarkAllAsPaid(pendingModels);
    };

    return (
        <Card className="hover:bg-hover-overlay transition-colors">
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                <CardContent className="p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                        {/* Mobile Top Row: Badge + Chevron (Desktop: Badge + Info start) */}
                        <div className="flex items-center justify-between w-full sm:w-auto sm:justify-start sm:items-center sm:gap-4 sm:flex-1 sm:min-w-0">
                            {/* Pending badge */}
                            {hasPendingPayments ? (
                                <Badge variant="warning" className="shrink-0 text-label gap-x-1">
                                    {pendingModels.length} Pendiente{pendingModels.length !== 1 && 's'}
                                </Badge>
                            ) : (
                                <div className="sm:hidden" /> /* Spacer for mobile layout consistency */
                            )}

                            {/* Mobile Chevron */}
                            <CollapsibleTrigger asChild className="sm:hidden">
                                <Button variant="secondary" size="icon" className="h-8 w-8 ml-auto rounded-full bg-card hover:bg-card/80 border border-border">
                                    <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : 'rotate-0'}`} />
                                </Button>
                            </CollapsibleTrigger>

                            {/* Desktop Info */}
                            <div className="hidden sm:block flex-1 min-w-0">
                                <div className="flex items-center gap-x-2">
                                    <h3 className="font-semibold text-body truncate">
                                        <Link
                                            href={`/dashboard/projects/${group.project_id}`}
                                            className="hover:text-primary hover:underline transition-colors"
                                        >
                                            {group.project_name}
                                        </Link>
                                    </h3>
                                </div>
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-label text-muted-foreground">
                                    <div className="flex items-center gap-x-1">
                                        <Building2 className="h-3 w-3 shrink-0" />
                                        <span className="truncate">{clientDisplay}</span>
                                    </div>
                                    <span>•</span>
                                    <div className="flex items-center gap-x-1">
                                        <Users className="h-3 w-3 shrink-0" />
                                        <span>{group.models.length} {group.models.length === 1 ? 'modelo' : 'modelos'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Mobile Info Row */}
                        <div className="sm:hidden w-full">
                            <div className="flex items-center gap-x-2 mb-1">
                                <h3 className="font-semibold text-body truncate">
                                    <Link
                                        href={`/dashboard/projects/${group.project_id}`}
                                        className="hover:text-primary hover:underline transition-colors"
                                    >
                                        {group.project_name}
                                    </Link>
                                </h3>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-label text-muted-foreground">
                                <div className="flex items-center gap-x-1">
                                    <Building2 className="h-3 w-3 shrink-0" />
                                    <span className="truncate">{clientDisplay}</span>
                                </div>
                                <div className="flex items-center gap-x-1">
                                    <Users className="h-3 w-3 shrink-0" />
                                    <span>{group.models.length} {group.models.length === 1 ? 'modelo' : 'modelos'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Bottom/Right Section: Amounts + Actions */}
                        <div className="flex items-end justify-between w-full sm:w-auto sm:items-center sm:justify-end sm:gap-6">
                            {/* Amount display */}
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                                {/* Cash amount - green */}
                                {group.total_amount > 0 && (
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-full border-2 border-success bg-success/20 flex items-center justify-center">
                                            <Banknote className="w-4 h-4 text-success" />
                                        </div>
                                        <span className="text-body font-medium text-foreground">
                                            {formatCurrency(group.total_amount, group.currency)}
                                        </span>
                                        {group.currency !== 'GTQ' && (
                                            <span className="text-xs text-muted-foreground">
                                                ({formatCurrency(group.total_amount * currentRate, 'GTQ')})
                                            </span>
                                        )}
                                    </div>
                                )}
                                {/* Trade amount - blue */}
                                {group.total_trade_value > 0 && (
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-full border-2 border-blue bg-blue/20 flex items-center justify-center">
                                            <RefreshCw className="w-4 h-4 text-blue" />
                                        </div>
                                        <span className="text-body font-medium text-foreground">
                                            {formatCurrency(group.total_trade_value, group.currency)}
                                        </span>
                                        {group.currency !== 'GTQ' && (
                                            <span className="text-xs text-muted-foreground">
                                                ({formatCurrency(group.total_trade_value * currentRate, 'GTQ')})
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                                {hasPendingPayments && (
                                    <Button
                                        size="sm"
                                        onClick={handleMarkAllAsPaid}
                                        className="gap-x-1.5 text-label bg-transparent hover:bg-hover-overlay text-foreground border border-separator"
                                    >
                                        Pagar Todo
                                    </Button>
                                )}

                                {/* Desktop Chevron */}
                                <CollapsibleTrigger asChild className="hidden sm:inline-flex">
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : 'rotate-0'}`} />
                                    </Button>
                                </CollapsibleTrigger>
                            </div>
                        </div>
                    </div>

                    {/* Collapsible Model List */}
                    <CollapsibleContent>
                        <Separator className="my-4" />
                        <div className="space-y-2 ml-6">
                            {group.models.map((model) => {
                                const status = model.payment_status || 'pending';
                                const statusConfig = PAYMENT_STATUS_CONFIG[status];
                                const StatusIcon = statusConfig.icon;
                                const modelDisplay = model.model_alias || model.model_name;
                                const daysText = model.days_worked === 1 ? '1 día' : `${model.days_worked} días`;

                                // Check for cash vs trade
                                const hasCash = (model.daily_fee ?? 0) > 0;
                                const hasTrade = (model.daily_trade_fee ?? 0) > 0;

                                return (
                                    <div
                                        key={model.id}
                                        className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between py-2 px-3 rounded-lg bg-quaternary"
                                    >
                                        <div className="flex items-center gap-x-3 gap-y-3 min-w-0">
                                            <User className="h-4 w-4 text-muted-foreground shrink-0" />
                                            <div className="min-w-0">
                                                <div className="font-medium truncate">{modelDisplay}</div>
                                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-label text-muted-foreground">
                                                    <span>{daysText}</span>
                                                    {hasCash && <span>× {formatCurrency(model.daily_fee, model.currency)}/día</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                                            {/* Cash badge */}
                                            {hasCash && (
                                                <Badge variant="success" size="small" className="gap-1">
                                                    <Banknote className="h-3 w-3" />
                                                    {formatCurrency(model.total_amount, model.currency)}
                                                    {model.currency !== 'GTQ' && (
                                                        <span className="text-secondary/70 ml-1">
                                                            ({formatCurrency(model.total_amount * currentRate, 'GTQ')})
                                                        </span>
                                                    )}
                                                </Badge>
                                            )}
                                            <AdjustmentInfo
                                                amount={(model.adjustment_amount || 0) * (model.days_worked || 1)}
                                                reason={model.adjustment_reason || null}
                                                currency={model.currency}
                                            />
                                            {/* Trade badge */}
                                            {hasTrade && (
                                                <Badge variant="blue" size="small" className="gap-1">
                                                    <RefreshCw className="h-3 w-3" />
                                                    {formatCurrency(model.total_trade_value || 0, model.currency)}
                                                    {model.currency !== 'GTQ' && (
                                                        <span className="text-secondary/70 ml-1">
                                                            ({formatCurrency((model.total_trade_value || 0) * currentRate, 'GTQ')})
                                                        </span>
                                                    )}
                                                </Badge>
                                            )}
                                            <AdjustmentInfo
                                                amount={(model.adjustment_amount_trade || 0) * (model.days_worked || 1)}
                                                reason={model.adjustment_reason_trade || null}
                                                currency={model.currency}
                                            />
                                            {/* Fallback if no fee defined */}
                                            {!hasCash && !hasTrade && (
                                                <span className="text-muted-foreground text-label">Sin tarifa</span>
                                            )}
                                            <Badge variant={statusConfig.badgeVariant} className="gap-x-1 gap-y-1 text-label">
                                                <StatusIcon className={`h-3 w-3 ${statusConfig.className}`} />
                                                {statusConfig.label}
                                            </Badge>
                                            {status === 'paid' && model.payment_date && (
                                                <span className="text-label text-muted-foreground">
                                                    {format(parseISO(model.payment_date), "d MMM", { locale: es })}
                                                </span>
                                            )}
                                            {(status === 'pending' || status === 'partial') && (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => onMarkAsPaid(model)}>
                                                            <CheckCircle2 className="mr-2 h-4 w-4 text-success" />
                                                            Marcar como Pagado
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() => onMarkAsCancelled(model)}
                                                            className="text-destructive focus:text-destructive"
                                                        >
                                                            <XCircle className="mr-2 h-4 w-4" />
                                                            Cancelar Pago
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CollapsibleContent>
                </CardContent>
            </Collapsible>
        </Card>
    );
}
