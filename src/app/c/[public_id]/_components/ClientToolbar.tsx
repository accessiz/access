'use client';

import { Button } from '@/components/ui/button';
import { LayoutGrid, List } from 'lucide-react';
import { useDebouncedCallback } from 'use-debounce';
import { SearchBar } from '@/components/molecules/SearchBar';

interface ClientToolbarProps {
    onFilterChange: (filters: { key: string; value: string | null }) => void;
    onViewChange: (view: 'list' | 'grid') => void;
    currentFilters: { 
        query: string;
        view: 'list' | 'grid' 
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
          inputClassName="shadow-none"
          expand={false}
        />
      </div>

      {/* Selector de Vista (Grid/List) */}
      <div className="shrink-0">
        <div className="flex items-center rounded-md border bg-background p-0.5">
          <Button
            variant={currentFilters.view === 'list' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => onViewChange('list')}
            className="shadow-none"
          >
            <List className="h-4 w-4" />
            <span className="sr-only">Vista de lista</span>
          </Button>
          <Button
            variant={currentFilters.view === 'grid' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => onViewChange('grid')}
            className="shadow-none"
          >
            <LayoutGrid className="h-4 w-4" />
            <span className="sr-only">Vista de cuadrícula</span>
          </Button>
        </div>
      </div>
    </div>
  );
}