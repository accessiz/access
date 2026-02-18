'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Grid } from '@/components/ui/grid';

export function ModelProfileSkeleton() {
    return (
        <div className="p-6 space-y-8 animate-in fade-in duration-500">
            {/* Header Skeleton */}
            <header className="flex flex-col items-start gap-x-4 gap-y-4 pb-6 border-b md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-4 w-48" />
                </div>
                <div className="flex items-center gap-x-2 gap-y-2">
                    <Skeleton className="h-10 w-10 rounded-md" />
                </div>
            </header>

            {/* Tabs Skeleton */}
            <div className="w-full">
                <div className="flex gap-2 mb-6 border-b pb-2">
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-10 w-32" />
                </div>

                <div className="space-y-6">
                    {/* Fila 1: Información Personal Skeleton */}
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-48" />
                        </CardHeader>
                        <CardContent>
                            <Grid cols={3}>
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="space-y-2">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-5 w-32" />
                                    </div>
                                ))}
                            </Grid>
                        </CardContent>
                    </Card>

                    {/* Fila 2: Medidas y Tallas Skeleton */}
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-40" />
                        </CardHeader>
                        <CardContent>
                            <Grid cols={5}>
                                {[...Array(10)].map((_, i) => (
                                    <div key={i} className="space-y-2">
                                        <Skeleton className="h-4 w-20" />
                                        <Skeleton className="h-5 w-24" />
                                    </div>
                                ))}
                            </Grid>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
