import React from 'react';

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="p-0 md:p-0">
          {children}
        </div>
      </div>
    </div>
  );
}
