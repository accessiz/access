
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import NextLink from 'next/link';
import { Badge } from '@/components/ui/badge';
import { ModelRankings, ModelRankingItem } from '@/lib/api/dashboard';
import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

type RankingType = 'approved' | 'refused' | 'applied';

interface ModelRankingsCardProps {
    initialData: ModelRankings;
    className?: string;
}

export function ModelRankingsCard({ initialData, className }: ModelRankingsCardProps) {
    const [view, setView] = useState<RankingType>('approved');

    const getListData = (): { data: ModelRankingItem[]; badgeVariant: 'default' | 'secondary' | 'outline' | 'destructive' | 'success' | 'warning' | 'info' | 'purple' | 'blue' | 'danger' } => {
        switch (view) {
            case 'approved':
                return { data: initialData.mostApproved, badgeVariant: 'success' };
            case 'refused':
                return { data: initialData.mostRefused, badgeVariant: 'danger' };
            case 'applied':
            default:
                return { data: initialData.mostApplied, badgeVariant: 'info' };
        }
    };

    const { data, badgeVariant } = getListData();

    return (
        <Card className={cn("bg-[rgb(var(--sys-bg-secondary))]", className)}>
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between py-6 border-b border-separator bg-quaternary rounded-t-lg">
                <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">Rankings de Talentos</CardTitle>
                </div>
                <Select value={view} onValueChange={(v) => setView(v as RankingType)}>
                    <SelectTrigger className="w-full sm:w-[200px] h-9 text-body bg-quaternary border-none">
                        <SelectValue placeholder="Seleccionar vista" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="approved">Más Aprobadas</SelectItem>
                        <SelectItem value="refused">Más Rechazadas</SelectItem>
                        <SelectItem value="applied">Más Postulaciones</SelectItem>
                    </SelectContent>
                </Select>
            </CardHeader>

            <CardContent className="p-0">
                {data.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground text-body">
                        No hay datos disponibles para esta categoría.
                    </div>
                ) : (
                    <ScrollArea className="h-[400px]">
                        <div className="divide-y divide-separator">
                            {data.map((model, index) => (
                                <NextLink
                                    key={model.model_id}
                                    href={`/dashboard/models/${model.model_id}`}
                                    className="flex items-center justify-between p-4 hover:bg-hover-overlay transition-colors group"
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="text-secondary/50 font-medium w-5 text-center shrink-0 text-sm">
                                            {index + 1}
                                        </div>
                                        <Avatar className="h-10 w-10 border border-separator">
                                            <AvatarImage src={model.coverUrl || ''} alt={model.alias} className="object-cover" />
                                            <AvatarFallback>{model.alias.substring(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0 flex flex-col">
                                            <span className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                                                {model.alias}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="pl-4 shrink-0">
                                        <Badge variant={badgeVariant} className="gap-1.5 h-7 px-2.5 min-w-[3rem] justify-center text-sm">
                                            {view === 'approved' && model.approved_count}
                                            {view === 'refused' && model.rejected_count}
                                            {view === 'applied' && model.total_count}
                                        </Badge>
                                    </div>
                                </NextLink>
                            ))}
                        </div>
                    </ScrollArea>
                )}
            </CardContent>
        </Card>
    );
}
