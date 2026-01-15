import { TrendingUp, TrendingDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// Razones de ajuste predefinidas para la industria de modelaje/publicidad
export const ADJUSTMENT_REASONS = [
    // Positivos (Bonus)
    { value: 'extended_hours', label: 'Extensión de jornada', type: 'positive' },
    { value: 'usage_rights', label: 'Derechos de uso extendidos', type: 'positive' },
    { value: 'role_upgrade', label: 'Cambio de rol', type: 'positive' },
    { value: 'special_skill', label: 'Habilidad especial', type: 'positive' },
    { value: 'exclusivity', label: 'Exclusividad', type: 'positive' },
    { value: 'client_bonus', label: 'Bonificación del cliente', type: 'positive' },
    // Negativos (Deducción)
    { value: 'late_arrival', label: 'Llegada tardía', type: 'negative' },
    { value: 'early_departure', label: 'Salida anticipada', type: 'negative' },
    { value: 'requirement_breach', label: 'Incumplimiento de requisitos', type: 'negative' },
    { value: 'behavior_issue', label: 'Problema de comportamiento', type: 'negative' },
    // Neutros
    { value: 'rate_adjustment', label: 'Ajuste de tarifa', type: 'neutral' },
    { value: 'other', label: 'Otro', type: 'neutral' },
] as const;

export const AdjustmentInfo = ({ amount, reason, currency }: { amount: number, reason: string | null, currency: string }) => {
    if (amount === 0) return null;

    const isPositive = amount > 0;
    const Icon = isPositive ? TrendingUp : TrendingDown;
    const colorClass = isPositive ? 'text-success' : 'text-destructive';
    const bgClass = isPositive ? 'bg-success/10' : 'bg-destructive/10';

    // Buscar label de razón
    const reasonLabel = ADJUSTMENT_REASONS.find(r => r.value === reason)?.label || reason || 'Ajuste manual';

    return (
        <Popover>
            <PopoverTrigger asChild>
                <button type="button" className={`inline-flex items-center justify-center w-5 h-5 rounded-full ${bgClass} cursor-pointer hover:opacity-80 transition-opacity`}>
                    <Icon className={`w-3 h-3 ${colorClass}`} />
                </button>
            </PopoverTrigger>
            <PopoverContent side="top" className="w-auto p-3">
                <div className="flex flex-col gap-1">
                    <p className={`text-body font-bold ${colorClass}`}>
                        {isPositive ? '+' : ''}{currency} {amount.toLocaleString()}
                    </p>
                    <p className="text-label text-muted-foreground">{reasonLabel}</p>
                </div>
            </PopoverContent>
        </Popover>
    );
};
