import { cn } from '@/lib/utils';
import React from 'react';

// Un componente simple para crear layouts de rejilla (grid) fácilmente.
interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: 1 | 2 | 3 | 4 | 5;
}

export const Grid = ({ className, cols = 2, ...props }: GridProps) => {
  const gridColsClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5',
  };

  return (
    <div
      className={cn('grid gap-6', gridColsClass[cols], className)}
      {...props}
    />
  );
};