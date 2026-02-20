'use client';

import Link from 'next/link';
import { Info } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

type IncompleteModel = {
    id: string;
    alias: string | null;
    profile_completeness: number | null;
    missing_fields?: string[];
};

interface IncompleteProfilesListProps {
    models: IncompleteModel[];
}

export function IncompleteProfilesList({ models }: IncompleteProfilesListProps) {
    return (
        <TooltipProvider delayDuration={200}>
            <ul className="divide-y divide-separator">
                {models.map((m) => (
                    <li key={m.id} className="text-body first:pt-0 last:pb-0 py-3">
                        <Link
                            href={`/dashboard/models/${m.id}`}
                            className="flex justify-between items-center group transition-colors hover:bg-hover-overlay -mx-3 px-3 py-1 rounded-md"
                        >
                            <div className="flex items-center gap-2">
                                <span className="font-medium text-secondary group-hover:text-primary transition-colors">
                                    {m.alias || 'Sin alias'}
                                </span>
                                {m.missing_fields && m.missing_fields.length > 0 && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span
                                                className="shrink-0 cursor-help"
                                                onClick={(e) => e.preventDefault()}
                                            >
                                                <Info className="h-4 w-4 text-[rgb(var(--purple))]" />
                                            </span>
                                        </TooltipTrigger>
                                        <TooltipContent
                                            side="top"
                                            className="max-w-50 bg-[rgb(var(--purple))] border-none text-white shadow-lg p-3"
                                        >
                                            <p className="text-label font-bold mb-1 font-display">Falta:</p>
                                            <ul className="text-label list-disc list-inside opacity-90 leading-relaxed">
                                                {m.missing_fields.map((field, i) => (
                                                    <li key={i}>{field}</li>
                                                ))}
                                            </ul>
                                        </TooltipContent>
                                    </Tooltip>
                                )}
                            </div>
                            <span
                                className={
                                    `px-2 py-1 rounded-full text-label ` +
                                    ((m.profile_completeness || 0) < 50
                                        ? 'bg-destructive/10 text-destructive'
                                        : 'bg-warning/10 text-warning')
                                }
                            >
                                {Math.round(m.profile_completeness || 0)}%
                            </span>
                        </Link>
                    </li>
                ))}
            </ul>
        </TooltipProvider>
    );
}
