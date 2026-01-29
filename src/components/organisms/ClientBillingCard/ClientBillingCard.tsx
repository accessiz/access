'use client';

import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    Users,
    Clock,
    CheckCircle2,
    Building2,
    MoreHorizontal,
    FolderOpen,
    Receipt,
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
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { formatCurrency } from '@/lib/finance/utils';
import { CLIENT_PAYMENT_STATUS_CONFIG } from '@/lib/finance/constants';
import type { ClientBillingCardProps } from './ClientBillingCard.types';

export function ClientBillingCard({
    item,
    onUpdateStatus,
}: ClientBillingCardProps) {
    const statusConfig = CLIENT_PAYMENT_STATUS_CONFIG[item.payment_status];
    const StatusIcon = statusConfig.icon;

    const clientDisplay = item.registered_client_name || item.client_name || 'Sin cliente';
    const hasCash = (item.subtotal ?? 0) > 0;
    const hasTrade = (item.trade_value ?? 0) > 0;

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
                            <Badge variant={statusConfig.badgeVariant} className="gap-1 shrink-0">
                                <StatusIcon className={`h-3 w-3 ${statusConfig.className}`} />
                                {statusConfig.label}
                            </Badge>

                            {/* Options Menu - Mobile only in this position */}
                            <div className="sm:hidden">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full bg-card hover:bg-card/80 border border-border">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        {item.payment_status !== 'pending' && (
                                            <DropdownMenuItem onClick={() => onUpdateStatus('pending')}>
                                                <Clock className="mr-2 h-4 w-4 text-warning" />
                                                Marcar Pendiente
                                            </DropdownMenuItem>
                                        )}
                                        {item.payment_status !== 'invoiced' && (
                                            <DropdownMenuItem onClick={() => onUpdateStatus('invoiced')}>
                                                <Receipt className="mr-2 h-4 w-4 text-info" />
                                                Marcar Facturado
                                            </DropdownMenuItem>
                                        )}
                                        {item.payment_status !== 'paid' && (
                                            <DropdownMenuItem onClick={() => onUpdateStatus('paid')}>
                                                <CheckCircle2 className="mr-2 h-4 w-4 text-success" />
                                                Marcar Cobrado
                                            </DropdownMenuItem>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>

                        {/* Info Section */}
                        <div className="flex-1 min-w-0 space-y-1">
                            {/* Project Icon + Name */}
                            <div className="flex items-start gap-2">
                                <FolderOpen className="h-5 w-5 sm:h-4 sm:w-4 text-muted-foreground shrink-0 mt-0.5 sm:mt-0" />
                                <Link
                                    href={`/dashboard/projects/${item.project_id}`}
                                    className="font-semibold text-title sm:text-body text-foreground hover:text-primary hover:underline transition-colors"
                                >
                                    {item.project_name}
                                </Link>
                            </div>

                            {/* Client + Brand */}
                            <div className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-2 text-body text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 sm:h-3 sm:w-3 shrink-0" />
                                    <span className="truncate">{clientDisplay}</span>
                                </div>
                                {item.brand_name && (
                                    <>
                                        <span className="hidden sm:inline">•</span>
                                        <div className="flex items-center gap-2 sm:gap-1">
                                            <Building2 className="h-4 w-4 sm:h-3 sm:w-3 shrink-0" />
                                            <span className="truncate">{item.brand_name}</span>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Invoice info - desktop only inline */}
                            {item.invoice_number && (
                                <div className="flex items-center gap-2 sm:gap-1 text-label text-muted-foreground">
                                    <Receipt className="h-4 w-4 sm:h-3 sm:w-3 shrink-0" />
                                    <span>Factura #{item.invoice_number}</span>
                                    {item.invoice_date && (
                                        <span className="hidden sm:inline">({format(parseISO(item.invoice_date), "d MMM yyyy", { locale: es })})</span>
                                    )}
                                </div>
                            )}
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
                                        {formatCurrency(item.total_with_tax, item.currency)}
                                    </span>
                                </div>
                            )}
                            {hasTrade && (
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full border-2 border-blue bg-blue/20 flex items-center justify-center">
                                        <RefreshCw className="w-4 h-4 text-blue" />
                                    </div>
                                    <span className="text-body font-medium text-foreground">
                                        {formatCurrency(item.trade_value, item.currency)}
                                    </span>
                                </div>
                            )}
                            {!hasCash && !hasTrade && (
                                <span className="text-body text-muted-foreground">
                                    Sin monto definido
                                </span>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                            {/* Paid Date */}
                            {item.payment_status === 'paid' && item.payment_date && (
                                <span className="text-label text-muted-foreground">
                                    {format(parseISO(item.payment_date), "d MMM yyyy", { locale: es })}
                                </span>
                            )}

                            {/* Options Menu - Desktop */}
                            <div className="hidden sm:block">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem
                                            onClick={() => onUpdateStatus('pending')}
                                            disabled={item.payment_status === 'pending'}
                                        >
                                            <Clock className="mr-2 h-4 w-4 text-warning" />
                                            Pendiente
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => onUpdateStatus('invoiced')}
                                            disabled={item.payment_status === 'invoiced'}
                                        >
                                            <Receipt className="mr-2 h-4 w-4 text-info" />
                                            Facturado
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => onUpdateStatus('paid')}
                                            disabled={item.payment_status === 'paid'}
                                        >
                                            <CheckCircle2 className="mr-2 h-4 w-4 text-success" />
                                            Cobrado
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
