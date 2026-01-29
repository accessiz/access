'use client';

import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    CheckCircle2,
    XCircle,
    Calendar,
    Building2,
    MoreHorizontal,
    CreditCard,
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
import { AdjustmentInfo } from '@/components/molecules/AdjustmentInfo';

import { formatCurrency, formatDateRange } from '@/lib/finance/utils';
import { PAYMENT_STATUS_CONFIG } from '@/lib/finance/constants';
import type { PaymentCardProps } from './PaymentCard.types';

export function PaymentCard({
    item,
    onMarkAsPaid,
    onMarkAsCancelled,
    currentRate,
}: PaymentCardProps) {
    const status = item.payment_status || 'pending';
    const statusConfig = PAYMENT_STATUS_CONFIG[status];
    const StatusIcon = statusConfig.icon;

    const clientDisplay = item.brand_name || item.registered_client_name || item.client_name || '-';
    const modelDisplay = item.model_alias || item.model_name;
    const daysText = item.days_worked === 1 ? '1 día' : `${item.days_worked} días`;

    // Build breakdown text based on payment type
    const hasCash = (item.daily_fee ?? 0) > 0;
    const hasTrade = (item.daily_trade_fee ?? 0) > 0;

    let breakdownText = daysText;
    if (hasCash) {
        breakdownText += ` × ${formatCurrency(item.daily_fee || 0, item.currency)}/día`;
    }

    const isPending = status === 'pending' || status === 'partial';

    return (
        <Card className="hover:bg-hover-overlay transition-colors">
            <CardContent className="p-4">
                {/* Main container: vertical on mobile, horizontal on desktop */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                    {/* Left section: Badge + Info */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 flex-1 min-w-0">

                        {/* Top Row Mobile / First item Desktop: Status Badge + Options */}
                        <div className="flex items-center justify-between sm:contents">
                            {/* Status Badge */}
                            {isPending ? (
                                <Badge variant="warning" className="text-label shrink-0">
                                    Pendiente
                                </Badge>
                            ) : (
                                <Badge variant={statusConfig.badgeVariant} className="gap-1 shrink-0">
                                    <StatusIcon className={`h-3 w-3 ${statusConfig.className}`} />
                                    {statusConfig.label}
                                </Badge>
                            )}

                            {/* Options Menu - Mobile only in this position */}
                            <div className="sm:hidden">
                                {isPending && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full bg-card hover:bg-card/80 border border-border">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={onMarkAsPaid}>
                                                <CheckCircle2 className="mr-2 h-4 w-4 text-success" />
                                                Marcar como Pagado
                                            </DropdownMenuItem>
                                            <DropdownMenuItem>
                                                <CreditCard className="mr-2 h-4 w-4" />
                                                Registrar Pago Parcial
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                onClick={onMarkAsCancelled}
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

                        {/* Info Section */}
                        <div className="flex-1 min-w-0 space-y-1">
                            {/* Model Name */}
                            <h3 className="font-semibold text-title sm:text-body text-foreground truncate">
                                <Link
                                    href={`/dashboard/models/${item.model_id}?tab=trabajos`}
                                    className="hover:text-primary hover:underline transition-colors"
                                >
                                    {modelDisplay}
                                </Link>
                            </h3>

                            {/* Project + Client */}
                            <div className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-2 text-body text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <Building2 className="h-4 w-4 sm:h-3 sm:w-3 shrink-0" />
                                    <Link
                                        href={`/dashboard/projects/${item.project_id}`}
                                        className="hover:text-foreground hover:underline transition-colors truncate"
                                    >
                                        {item.project_name}
                                    </Link>
                                </div>
                                <span className="hidden sm:inline">•</span>
                                <div className="flex items-center gap-2 sm:gap-1">
                                    <Building2 className="h-4 w-4 sm:h-3 sm:w-3 shrink-0" />
                                    <span className="truncate">{clientDisplay}</span>
                                </div>
                            </div>

                            {/* Date Range */}
                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3 text-label text-muted-foreground">
                                <div className="flex items-center gap-2 sm:gap-1">
                                    <Calendar className="h-4 w-4 sm:h-3 sm:w-3 shrink-0" />
                                    <span>{formatDateRange(item.first_work_date, item.last_work_date)}</span>
                                </div>
                                <span className="ml-6 sm:ml-0 text-foreground/70">({breakdownText})</span>
                            </div>
                        </div>
                    </div>

                    {/* Right section: Amounts + Actions */}
                    <div className="flex items-end justify-between sm:items-center sm:gap-4 sm:shrink-0">

                        {/* Amounts with circular icons */}
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                            {hasCash && (
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full border-2 border-success bg-success/20 flex items-center justify-center">
                                        <Banknote className="w-4 h-4 text-success" />
                                    </div>
                                    <span className="text-body font-medium text-foreground">
                                        {formatCurrency(item.total_amount, item.currency)}
                                    </span>
                                    {item.currency !== 'GTQ' && (
                                        <span className="text-xs text-muted-foreground">
                                            ({formatCurrency(item.total_amount * currentRate, 'GTQ')})
                                        </span>
                                    )}
                                    <AdjustmentInfo
                                        amount={(item.adjustment_amount || 0) * (item.days_worked || 1)}
                                        reason={item.adjustment_reason || null}
                                        currency={item.currency}
                                    />
                                </div>
                            )}
                            {hasTrade && (
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full border-2 border-blue bg-blue/20 flex items-center justify-center">
                                        <RefreshCw className="w-4 h-4 text-blue" />
                                    </div>
                                    <span className="text-body font-medium text-foreground">
                                        {formatCurrency(item.total_trade_value || 0, item.currency)}
                                    </span>
                                    {item.currency !== 'GTQ' && (
                                        <span className="text-xs text-muted-foreground">
                                            ({formatCurrency((item.total_trade_value || 0) * currentRate, 'GTQ')})
                                        </span>
                                    )}
                                    <AdjustmentInfo
                                        amount={(item.adjustment_amount_trade || 0) * (item.days_worked || 1)}
                                        reason={item.adjustment_reason_trade || null}
                                        currency={item.currency}
                                    />
                                </div>
                            )}
                            {!hasCash && !hasTrade && (
                                <span className="text-body font-medium text-foreground">
                                    {formatCurrency(item.total_amount, item.currency)}
                                </span>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                            {/* Pay Button */}
                            {isPending && (
                                <Button
                                    size="sm"
                                    onClick={onMarkAsPaid}
                                    className="gap-x-1.5 text-label bg-transparent hover:bg-hover-overlay text-foreground border border-separator"
                                >
                                    Pagar Todo
                                </Button>
                            )}

                            {/* Paid Date */}
                            {status === 'paid' && item.payment_date && (
                                <span className="text-label text-muted-foreground">
                                    {format(parseISO(item.payment_date), "d MMM yyyy", { locale: es })}
                                </span>
                            )}

                            {/* Options Menu - Desktop */}
                            <div className="hidden sm:block">
                                {isPending && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={onMarkAsPaid}>
                                                <CheckCircle2 className="mr-2 h-4 w-4 text-success" />
                                                Marcar como Pagado
                                            </DropdownMenuItem>
                                            <DropdownMenuItem>
                                                <CreditCard className="mr-2 h-4 w-4" />
                                                Registrar Pago Parcial
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                onClick={onMarkAsCancelled}
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
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
