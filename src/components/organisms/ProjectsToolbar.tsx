'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { SearchBar } from '@/components/molecules/SearchBar';
import { MonthSelect, type MonthValue } from '@/components/molecules/MonthSelect';
import { YearSelect, type YearValue } from '@/components/molecules/YearSelect';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useDebouncedCallback } from 'use-debounce';

type ProjectsToolbarProps = {
    availableYears: number[];
};
const statusOptions = [
    { label: 'Todos', value: 'all' },
    { label: 'Borrador', value: 'draft' },
    { label: 'Enviado', value: 'sent' },
    { label: 'En Revisión', value: 'in-review' },
    { label: 'Completado', value: 'completed' },
    { label: 'Archivado', value: 'archived' },
];

export function ProjectsToolbar({ availableYears }: ProjectsToolbarProps) {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();

    const monthValues = ['all', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'] as const;
    const isMonthValue = (value: string): value is MonthValue => (monthValues as readonly string[]).includes(value);

    const yearParam = searchParams.get('year');
    const yearDefaultValue: YearValue | undefined =
        yearParam === null
            ? undefined
            : yearParam === 'all'
                ? 'all'
                : /^\d{4}$/.test(yearParam)
                    ? (yearParam as YearValue)
                    : undefined;

    const monthParam = searchParams.get('month');
    const monthDefaultValue: MonthValue | undefined =
        monthParam === null
            ? undefined
            : isMonthValue(monthParam)
                ? monthParam
                : undefined;

    const handleSearch = useDebouncedCallback((term: string) => {
        const params = new URLSearchParams(searchParams);
        params.set('page', '1');
        if (term) params.set('q', term); else params.delete('q');
        router.replace(`${pathname}?${params.toString()}`);
    }, 300);

    const handleFilterChange = (key: 'year' | 'month' | 'status', value: string) => {
        const params = new URLSearchParams(searchParams);
        params.set('page', '1');

        if (value === 'all') {
            // For month, keep `month=all` so selecting "Todos" persists on refresh.
            if (key === 'month') {
                params.set(key, 'all');
            } else {
                params.delete(key);
            }
        } else {
            params.set(key, value);
        }
        router.replace(`${pathname}?${params.toString()}`);
    }

    return (
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
            <SearchBar
                className="w-full sm:w-64"
                placeholder="Buscar por proyecto o cliente..."
                defaultValue={searchParams.get('q')?.toString()}
                onValueChange={handleSearch}
            />
            <div className="flex items-stretch gap-2">
                <Select
                    onValueChange={(value) => handleFilterChange('status', value)}
                    defaultValue={searchParams.get('status') || 'all'}
                >
                    <SelectTrigger className="w-full sm:w-auto min-w-35"><SelectValue placeholder="Estado" /></SelectTrigger>
                    <SelectContent>
                        {statusOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                    </SelectContent>
                </Select>
                <YearSelect
                    years={availableYears}
                    onValueChange={(value) => handleFilterChange('year', value)}
                    defaultValue={yearDefaultValue}
                    triggerClassName="w-full sm:w-auto"
                />
                <MonthSelect
                    onValueChange={(value) => handleFilterChange('month', value)}
                    defaultValue={monthDefaultValue}
                    triggerClassName="w-full sm:w-auto"
                />
            </div>
        </div>
    );
}
