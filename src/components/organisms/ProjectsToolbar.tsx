'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Search } from 'lucide-react';
import { useDebouncedCallback } from 'use-debounce';

const availableYears = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
const availableMonths = [
    { label: 'Enero', value: '1' }, { label: 'Febrero', value: '2' },
    { label: 'Marzo', value: '3' }, { label: 'Abril', value: '4' },
    { label: 'Mayo', value: '5' }, { label: 'Junio', value: '6' },
    { label: 'Julio', value: '7' }, { label: 'Agosto', value: '8' },
    { label: 'Septiembre', value: '9' }, { label: 'Octubre', value: '10' },
    { label: 'Noviembre', value: '11' }, { label: 'Diciembre', value: '12' },
];
const statusOptions = [
    { label: 'Todos', value: 'all' },
    { label: 'Borrador', value: 'draft' },
    { label: 'Enviado', value: 'sent' },
    { label: 'En Revisión', value: 'in-review' },
    { label: 'Completado', value: 'completed' },
    { label: 'Archivado', value: 'archived' },
];

export function ProjectsToolbar() {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();

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
            params.delete(key);
        } else {
            params.set(key, value);
        }
        router.replace(`${pathname}?${params.toString()}`);
    }

    return (
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Buscar por proyecto o cliente..."
                    className="pl-9 w-full"
                    onChange={(e) => handleSearch(e.target.value)}
                    defaultValue={searchParams.get('q')?.toString()}
                />
            </div>
            <div className="flex items-stretch gap-2">
                <Select
                    onValueChange={(value) => handleFilterChange('status', value)}
                    defaultValue={searchParams.get('status') || 'all'}
                >
                    <SelectTrigger className="w-full sm:w-auto min-w-[140px]"><SelectValue placeholder="Estado" /></SelectTrigger>
                    <SelectContent>
                        {statusOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select
                    onValueChange={(value) => handleFilterChange('year', value)}
                    defaultValue={searchParams.get('year') || 'all'}
                >
                    <SelectTrigger className="w-full sm:w-auto"><SelectValue placeholder="Año" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {availableYears.map(year => <SelectItem key={year} value={String(year)}>{year}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select
                    onValueChange={(value) => handleFilterChange('month', value)}
                    defaultValue={searchParams.get('month') || 'all'}
                >
                    <SelectTrigger className="w-full sm:w-auto"><SelectValue placeholder="Mes" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {availableMonths.map(month => <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}
