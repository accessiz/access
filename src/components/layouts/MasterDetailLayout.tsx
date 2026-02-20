'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { PanelLeft } from 'lucide-react';

/**
 * MasterDetailLayout
 * 
 * A responsive two-column layout component following the master-detail pattern.
 * - Desktop (≥1024px): Side-by-side columns with fixed master width
 * - Mobile (<1024px): Stacked or sheet-based navigation
 * 
 * Usage:
 * ```tsx
 * <MasterDetailLayout>
 *   <MasterDetailLayout.Master>
 *     <ModelsList items={models} selectedId={selected} onSelect={setSelected} />
 *   </MasterDetailLayout.Master>
 *   <MasterDetailLayout.Detail>
 *     <ModelDetail model={selectedModel} />
 *   </MasterDetailLayout.Detail>
 * </MasterDetailLayout>
 * ```
 */

interface MasterDetailLayoutProps {
    children: React.ReactNode;
    className?: string;
    /** Selected item ID (controls active state styling) */
    selectedId?: string | null;
    /** Whether the master panel is collapsed on mobile */
    collapsedOnMobile?: boolean;
    /** Custom width for master panel (CSS value like '400px' or '30%') */
    masterWidth?: string;
}

interface MasterProps {
    children: React.ReactNode;
    className?: string;
    /** Title for the mobile sheet header */
    title?: string;
}

interface DetailProps {
    children: React.ReactNode;
    className?: string;
    /** Empty state when no item is selected */
    emptyState?: React.ReactNode;
    /** Whether an item is selected */
    hasSelection?: boolean;
}

// Context for sharing state between Master and Detail
interface MasterDetailContextValue {
    selectedId: string | null;
    isMobileOpen: boolean;
    setMobileOpen: (open: boolean) => void;
}

const MasterDetailContext = React.createContext<MasterDetailContextValue | null>(null);

function useMasterDetail() {
    const context = React.useContext(MasterDetailContext);
    if (!context) {
        throw new Error('MasterDetailLayout compound components must be used within MasterDetailLayout');
    }
    return context;
}

// Root component
function MasterDetailLayout({
    children,
    className,
    selectedId = null,
    masterWidth,
}: MasterDetailLayoutProps) {
    const [isMobileOpen, setMobileOpen] = React.useState(false);

    const contextValue = React.useMemo(
        () => ({ selectedId, isMobileOpen, setMobileOpen }),
        [selectedId, isMobileOpen]
    );

    const style = masterWidth
        ? ({ '--master-width': masterWidth } as React.CSSProperties)
        : undefined;

    return (
        <MasterDetailContext.Provider value={contextValue}>
            <div
                className={cn('layout-master-detail lg:h-full', className)}
                style={style}
            >
                {children}
            </div>
        </MasterDetailContext.Provider>
    );
}

// Master panel (left sidebar)
function Master({ children, className, title = 'Lista' }: MasterProps) {
    const { isMobileOpen, setMobileOpen } = useMasterDetail();

    return (
        <>
            {/* Desktop: Always visible */}
            <aside className={cn('master-panel hidden lg:block', className)}>
                {children}
            </aside>

            {/* Mobile: Sheet-based navigation */}
            <div className="lg:hidden">
                <Sheet open={isMobileOpen} onOpenChange={setMobileOpen}>
                    <SheetTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2 mb-4">
                            <PanelLeft className="h-4 w-4" />
                            {title}
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-[320px] p-0">
                        <div className="h-full overflow-y-auto p-4">
                            {children}
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </>
    );
}

// Detail panel (main content)
function Detail({
    children,
    className,
    emptyState,
    hasSelection = true,
}: DetailProps) {
    const defaultEmptyState = (
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="text-muted-foreground space-y-2">
                <p className="text-title font-medium">Selecciona un elemento</p>
                <p className="text-body">
                    Elige un elemento de la lista para ver sus detalles aquí.
                </p>
            </div>
        </div>
    );

    return (
        <main className={cn('detail-panel', className)}>
            {hasSelection ? children : (emptyState || defaultEmptyState)}
        </main>
    );
}

// Compound component pattern
MasterDetailLayout.Master = Master;
MasterDetailLayout.Detail = Detail;

export { MasterDetailLayout, useMasterDetail };
