'use client';

import * as React from 'react';
import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Trash2, Building2, Tag } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

import { createClient } from '@/lib/supabase/client';
import { Brand } from '@/lib/types';
import { ClientWithBrands } from '@/app/dashboard/clients/page';
import { toTitleCase } from '@/lib/utils';

// Schema de validación con Zod
const brandSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, 'El nombre de la marca es requerido'),
    industry: z.string().optional(),
    logo_url: z.string().optional(),
    status: z.enum(['active', 'inactive', 'archived']).default('active'),
});

const clientFormSchema = z.object({
    name: z.string().min(1, 'El nombre es requerido'),
    email: z.string().email('Email inválido').optional().or(z.literal('')),
    phone: z.string().optional(),
    company: z.string().optional(),
    notes: z.string().optional(),
    status: z.enum(['active', 'inactive', 'archived']).default('active'),
    avatar_url: z.string().optional(),
    brands: z.array(brandSchema).optional(),
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

// Industrias disponibles
const INDUSTRIES = [
    { value: 'fashion', label: 'Moda' },
    { value: 'beauty', label: 'Belleza' },
    { value: 'food_beverage', label: 'Alimentos y Bebidas' },
    { value: 'technology', label: 'Tecnología' },
    { value: 'automotive', label: 'Automotriz' },
    { value: 'retail', label: 'Retail' },
    { value: 'entertainment', label: 'Entretenimiento' },
    { value: 'sports', label: 'Deportes' },
    { value: 'healthcare', label: 'Salud' },
    { value: 'finance', label: 'Finanzas' },
    { value: 'real_estate', label: 'Bienes Raíces' },
    { value: 'other', label: 'Otro' },
];

type ClientFormProps = {
    client?: ClientWithBrands | null;
    onSave: (client: ClientWithBrands) => void;
    onCancel: () => void;
};

export default function ClientForm({ client, onSave, onCancel }: ClientFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const supabase = createClient();

    // Inicializar el formulario con valores por defecto o del cliente existente
    const form = useForm<ClientFormValues>({
        resolver: zodResolver(clientFormSchema),
        defaultValues: {
            name: client?.name || '',
            email: client?.email || '',
            phone: client?.phone || '',
            company: client?.company || '',
            notes: client?.notes || '',
            status: (client?.status as 'active' | 'inactive' | 'archived') || 'active',
            avatar_url: client?.avatar_url || '',
            brands: client?.brands?.map(b => ({
                id: b.id,
                name: b.name,
                industry: b.industry || '',
                logo_url: b.logo_url || '',
                status: (b.status as 'active' | 'inactive' | 'archived') || 'active',
            })) || [],
        },
    });

    // Field array para manejar múltiples marcas
    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'brands',
    });

    // Manejar submit del formulario
    const onSubmit = async (values: ClientFormValues) => {
        setIsSubmitting(true);

        try {
            // Obtener usuario actual
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                toast.error('No autorizado');
                return;
            }

            let savedClient: ClientWithBrands;

            if (client) {
                // ACTUALIZAR cliente existente
                const { data: updatedClient, error: clientError } = await supabase
                    .from('clients')
                    .update({
                        name: toTitleCase(values.name),
                        email: values.email || null,
                        phone: values.phone || null,
                        company: toTitleCase(values.company),
                        notes: values.notes || null,
                        status: values.status,
                        avatar_url: values.avatar_url || null,
                    })
                    .eq('id', client.id)
                    .select()
                    .single();

                if (clientError) throw clientError;

                // Obtener IDs de marcas existentes
                const existingBrandIds = client.brands?.map(b => b.id) || [];
                const newBrandIds = values.brands?.filter(b => b.id).map(b => b.id) || [];

                // Eliminar marcas que ya no están
                const brandsToDelete = existingBrandIds.filter(id => !newBrandIds.includes(id));
                if (brandsToDelete.length > 0) {
                    const { error: deleteError } = await supabase
                        .from('brands')
                        .delete()
                        .in('id', brandsToDelete);

                    if (deleteError) throw deleteError;
                }

                // Actualizar o crear marcas
                const savedBrands: Brand[] = [];
                for (const brand of values.brands || []) {
                    if (brand.id) {
                        // Actualizar marca existente
                        const { data: updatedBrand, error } = await supabase
                            .from('brands')
                            .update({
                                name: toTitleCase(brand.name),
                                industry: brand.industry || null,
                                logo_url: brand.logo_url || null,
                                status: brand.status,
                            })
                            .eq('id', brand.id)
                            .select()
                            .single();

                        if (error) throw error;
                        savedBrands.push(updatedBrand);
                    } else {
                        // Crear nueva marca
                        const { data: newBrand, error } = await supabase
                            .from('brands')
                            .insert({
                                client_id: client.id,
                                user_id: user.id,
                                name: toTitleCase(brand.name),
                                industry: brand.industry || null,
                                logo_url: brand.logo_url || null,
                                status: brand.status,
                            })
                            .select()
                            .single();

                        if (error) throw error;
                        savedBrands.push(newBrand);
                    }
                }

                savedClient = {
                    ...updatedClient,
                    brands: savedBrands,
                    projectCount: client.projectCount,
                };

                toast.success('Cliente actualizado correctamente');
            } else {
                // CREAR nuevo cliente
                const { data: newClient, error: clientError } = await supabase
                    .from('clients')
                    .insert({
                        user_id: user.id,
                        name: toTitleCase(values.name),
                        email: values.email || null,
                        phone: values.phone || null,
                        company: toTitleCase(values.company),
                        notes: values.notes || null,
                        status: values.status,
                        avatar_url: values.avatar_url || null,
                    })
                    .select()
                    .single();

                if (clientError) throw clientError;

                // Crear marcas asociadas
                const savedBrands: Brand[] = [];
                for (const brand of values.brands || []) {
                    const { data: newBrand, error } = await supabase
                        .from('brands')
                        .insert({
                            client_id: newClient.id,
                            user_id: user.id,
                            name: toTitleCase(brand.name),
                            industry: brand.industry || null,
                            logo_url: brand.logo_url || null,
                            status: brand.status,
                        })
                        .select()
                        .single();

                    if (error) throw error;
                    savedBrands.push(newBrand);
                }

                savedClient = {
                    ...newClient,
                    brands: savedBrands,
                    projectCount: 0,
                };

                toast.success('Cliente creado correctamente');
            }

            onSave(savedClient);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Error desconocido';
            toast.error('Error al guardar cliente', {
                description: message,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Información del Cliente */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Building2 className="h-4 w-4" />
                        <span className="text-body font-medium">Información del Cliente</span>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Nombre del contacto" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="company"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Empresa / Agencia</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Nombre de la empresa" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input type="email" placeholder="correo@ejemplo.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Teléfono</FormLabel>
                                    <FormControl>
                                        <Input placeholder="+502 5555-1234" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Notas</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Notas adicionales sobre el cliente..."
                                        className="resize-none"
                                        rows={3}
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Estado</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecciona un estado" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="active">Activo</SelectItem>
                                        <SelectItem value="inactive">Inactivo</SelectItem>
                                        <SelectItem value="archived">Archivado</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <Separator />

                {/* Marcas del Cliente */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Tag className="h-4 w-4" />
                            <span className="text-body font-medium">Marcas que Representa</span>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => append({ name: '', industry: '', logo_url: '', status: 'active' })}
                        >
                            <Plus className="mr-1 h-3 w-3" />
                            Agregar Marca
                        </Button>
                    </div>

                    {fields.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-muted-foreground/25 p-6 text-center">
                            <Tag className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
                            <p className="text-body text-muted-foreground">
                                No hay marcas agregadas. Agrega las marcas que representa este cliente.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {fields.map((field, index) => (
                                <div
                                    key={field.id}
                                    className="group relative rounded-lg border bg-card p-4"
                                >
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <FormField
                                            control={form.control}
                                            name={`brands.${index}.name`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-label">Nombre de la Marca *</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Ej: Coca-Cola" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name={`brands.${index}.industry`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-label">Industria</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value || ''}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Selecciona una industria" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {INDUSTRIES.map(industry => (
                                                                <SelectItem key={industry.value} value={industry.value}>
                                                                    {industry.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => remove(index)}
                                    >
                                        <Trash2 className="h-3 w-3" />
                                        <span className="sr-only">Eliminar marca</span>
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <Separator />

                {/* Botones de acción */}
                <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={onCancel}>
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Guardando...' : client ? 'Guardar Cambios' : 'Crear Cliente'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
