'use client';

import { List, LayoutGrid, Rows3 } from 'lucide-react';
import { useDebouncedCallback } from 'use-debounce';
import { SegmentedControl } from '@/components/molecules/SegmentedControl';
import { SearchBar } from '@/components/molecules/SearchBar';

interface ClientToolbarProps {
  onFilterChange: (filters: { key: string; value: string | null }) => void;
  onViewChange: (view: 'list' | 'grid' | 'single') => void;
  currentFilters: {
    query: string;
    view: 'list' | 'grid' | 'single'
  };
}

export function ClientToolbar({ onFilterChange, onViewChange, currentFilters }: ClientToolbarProps) {

  const handleSearch = useDebouncedCallback((term: string) => {
    onFilterChange({ key: 'query', value: term });
  }, 300);

  return (
    <div className="flex w-full items-center gap-2">
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

      {/* Selector de Vista (Grid/List/Single) */}
      <div className="shrink-0">
        <SegmentedControl
          value={currentFilters.view}
          onValueChange={onViewChange}
          ariaLabel="Vista"
          options={[
            { value: 'list', label: 'Lista', icon: <List className="h-4 w-4" />, iconOnly: true },
            { value: 'single', label: 'Vertical', icon: <Rows3 className="h-4 w-4" />, iconOnly: true, className: 'sm:hidden' },
            { value: 'grid', label: 'Cuadrícula', icon: <LayoutGrid className="h-4 w-4" />, iconOnly: true }
          ]}
        />
      </div>
    </div>
  );
}
