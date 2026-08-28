'use client';

import { List, LayoutGrid, Rows3, Users, Calendar } from 'lucide-react';
import { useDebouncedCallback } from 'use-debounce';
import { SegmentedControl } from '@/components/molecules/SegmentedControl';
import { SearchBar } from '@/components/molecules/SearchBar';

interface ClientToolbarProps {
  onFilterChange: (filters: { key: string; value: string | null }) => void;
  onViewChange: (view: 'list' | 'grid' | 'single') => void;
  onGroupByChange?: (mode: 'gender' | 'date') => void;
  hasSchedule?: boolean;
  currentFilters: {
    query: string;
    view: 'list' | 'grid' | 'single';
    groupBy?: 'gender' | 'date';
  };
}

export function ClientToolbar({
  onFilterChange,
  onViewChange,
  onGroupByChange,
  hasSchedule,
  currentFilters,
}: ClientToolbarProps) {
  const handleSearch = useDebouncedCallback((term: string) => {
    onFilterChange({ key: 'query', value: term });
  }, 300);

  return (
    <div className="flex flex-col sm:flex-row w-full items-stretch sm:items-center justify-between gap-2.5">
      <div className="min-w-0 flex-1">
        <SearchBar
          className="w-full"
          placeholder="Buscar nombre o alias..."
          ariaLabel="Buscar nombre o alias"
          onValueChange={handleSearch}
          defaultValue={currentFilters.query}
          expand={false}
        />
      </div>

      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
        {/* Selector de Agrupación (Género vs Fechas) */}
        {hasSchedule && onGroupByChange && (
          <SegmentedControl
            value={currentFilters.groupBy || 'gender'}
            onValueChange={onGroupByChange}
            ariaLabel="Agrupar por"
            options={[
              { value: 'gender', label: 'Género', icon: <Users className="h-4 w-4" /> },
              { value: 'date', label: 'Fechas', icon: <Calendar className="h-4 w-4" /> },
            ]}
          />
        )}

        {/* Selector de Vista (Grid/List/Single) */}
        <SegmentedControl
          value={currentFilters.view}
          onValueChange={onViewChange}
          ariaLabel="Vista"
          options={[
            { value: 'list', label: 'Lista', icon: <List className="h-4 w-4" />, iconOnly: true },
            { value: 'single', label: 'Vertical', icon: <Rows3 className="h-4 w-4" />, iconOnly: true, className: 'sm:hidden' },
            { value: 'grid', label: 'Cuadrícula', icon: <LayoutGrid className="h-4 w-4" />, iconOnly: true },
          ]}
        />
      </div>
    </div>
  );
}
