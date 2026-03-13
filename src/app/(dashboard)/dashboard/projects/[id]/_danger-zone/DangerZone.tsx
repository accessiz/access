'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DeleteProjectDialog } from '@/components/organisms/DeleteProjectDialog';
import { ChevronDown, Copy } from 'lucide-react';

import type { DangerZoneProps } from './DangerZone.types';

export function DangerZone({ project }: DangerZoneProps) {
    const [open, setOpen] = useState(false);

    const handleCopyId = () => {
        navigator.clipboard.writeText(project.id);
        toast.success('UUID copiado al portapapeles');
    };

    return (
        <div className="space-y-4">
            <Collapsible open={open} onOpenChange={setOpen}>
                <Card className="border-destructive">
                    <CardHeader className="flex flex-row items-start justify-between gap-3">
                        <div className="min-w-0">
                            <CardTitle className="text-destructive">Zona de Peligro</CardTitle>
                            <CardDescription className="text-destructive/80">Estas acciones son permanentes y no se pueden deshacer.</CardDescription>
                        </div>
                        <CollapsibleTrigger asChild>
                            <Button
                                variant="outline"
                                size="icon"
                                className="shrink-0"
                                aria-label={open ? 'Cerrar zona de peligro' : 'Abrir zona de peligro'}
                                title={open ? 'Cerrar' : 'Abrir'}
                            >
                                <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
                            </Button>
                        </CollapsibleTrigger>
                    </CardHeader>
                    <CollapsibleContent>
                        <CardContent>
                            <div className="flex items-center justify-between rounded-lg border border-destructive bg-destructive/5 p-4">
                                <div>
                                    <p className="text-body text-foreground">Eliminar este proyecto</p>
                                    <p className="text-label text-muted-foreground">Toda la información y selección de talentos se perderá.</p>
                                </div>
                                <DeleteProjectDialog projectId={project.id} projectName={project.project_name || 'este proyecto'}>
                                    <Button variant="destructive">Eliminar</Button>
                                </DeleteProjectDialog>
                            </div>
                        </CardContent>
                    </CollapsibleContent>
                </Card>
            </Collapsible>

            {/* UUID del proyecto */}
            <div className="flex items-center justify-center gap-2 pt-2">
                <span className="text-label text-muted-foreground font-mono">{project.id}</span>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                    onClick={handleCopyId}
                    title="Copiar UUID"
                >
                    <Copy className="h-3.5 w-3.5" />
                </Button>
            </div>
        </div>
    );
}
