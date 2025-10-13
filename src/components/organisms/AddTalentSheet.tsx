
'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller, SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { modelFormSchema, ModelFormData } from '@/lib/schemas'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { countries } from '@/lib/countries'
import { genderOptions, eyeColorOptions, hairColorOptions, topSizeOptions } from '@/lib/options'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// --- Helper Functions ---
const toTitleCase = (str: string | null | undefined) => {
  if (!str) return "";
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
};
const sanitizeNumeric = (str: string | null | undefined) => str ? str.replace(/\D/g, '') : "";

// --- Main Component ---
export const AddTalentSheet = React.memo(function AddTalentSheet({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const { register, handleSubmit, control, formState: { errors, isSubmitting }, reset } = useForm<ModelFormData>({
    resolver: zodResolver(modelFormSchema),
    defaultValues: {
      alias: '', full_name: '', national_id: '', gender: null, birth_date: '',
      country: null, height_cm: null, shoulders_cm: null, chest_cm: null,
      bust_cm: null, waist_cm: null, hips_cm: null, top_size: null,
      pants_size: '', shoe_size_eu: null, eye_color: null, hair_color: null,
      instagram: '', tiktok: '', email: '', phone_number: '',
    }
  });

  const onSubmit: SubmitHandler<ModelFormData> = async (data) => {
    let sanitizedPhoneNumber = null;
    if (data.phone_number) {
        const digits = data.phone_number.replace(/\D/g, '');
        if (digits) { sanitizedPhoneNumber = `+${digits}`; }
    }
    const sanitizedData = { ...data, full_name: toTitleCase(data.full_name), national_id: sanitizeNumeric(data.national_id), phone_number: sanitizedPhoneNumber };
    const { error } = await supabase.from('models').insert([sanitizedData]);

    if (error) {
      toast.error('Error al crear el perfil', { description: error.message });
    } else {
      toast.success('Talento añadido con éxito', { description: `${data.alias || data.full_name} ha sido añadido.` });
      setIsOpen(false);
      reset();
      router.refresh();
    }
  };

  // --- Helper Components for Form Fields ---
  const FieldError = ({ name }: { name: keyof ModelFormData }) => {
    const error = errors[name];
    return error ? <p className="text-sm text-destructive mt-1">{error.message}</p> : null;
  };

  const NumericInputController = ({ name, control: formControl, placeholder }: { name: keyof ModelFormData, control: typeof control, placeholder?: string }) => (
    <Controller
      name={name}
      control={formControl}
      render={({ field }) => (
        <Input
          {...field}
          type="number"
          placeholder={placeholder}
          value={field.value ?? ''}
          onChange={e => field.onChange(e.target.value === '' ? null : e.target.valueAsNumber)}
        />
      )}
    />
  );

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) reset(); }}>
      {children}
      <SheetContent className="flex flex-col p-0">
        <div className="w-full max-w-5xl mx-auto flex flex-col h-full">
          <SheetHeader className="px-8 pt-16 pb-4 shrink-0">
            <SheetTitle>Añadir Nuevo Talento</SheetTitle>
            <SheetDescription>Rellena los datos para crear un nuevo perfil. Los campos marcados con * son obligatorios.</SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-8">
              <div className="space-y-8 py-6">
                
                {/* --- Basic Information Section --- */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Información Básica</h3>
                  <div className="grid md:grid-cols-2 gap-x-6 gap-y-4 p-6 bg-card border rounded-lg">
                    <div><Label htmlFor="alias">Alias *</Label><Input id="alias" placeholder="Ej: Sofi G." {...register("alias")} /><FieldError name="alias" /></div>
                    <div><Label htmlFor="full_name">Nombre Completo *</Label><Input id="full_name" placeholder="Ej: Sofía Gómez" {...register("full_name")} /><FieldError name="full_name" /></div>
                    <div><Label htmlFor="birth_date">Fecha de Nacimiento</Label><Input id="birth_date" type="date" {...register("birth_date")} /><FieldError name="birth_date" /></div>
                    <div><Label>País</Label><Controller name="country" control={control} render={({ field }) => (<Select onValueChange={field.onChange} value={field.value || undefined}><SelectTrigger><SelectValue placeholder="Seleccionar país..." /></SelectTrigger><SelectContent>{countries.map(c => (<SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>))}</SelectContent></Select>)} /><FieldError name="country" /></div>
                    <div><Label htmlFor="national_id">Documento ID</Label><Input id="national_id" {...register("national_id")} /></div>
                    <div><Label>Género</Label><Controller name="gender" control={control} render={({ field }) => (<Select onValueChange={field.onChange} value={field.value || undefined}><SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger><SelectContent>{genderOptions.map(o => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}</SelectContent></Select>)} /><FieldError name="gender" /></div>
                  </div>
                </div>

                {/* --- Measurements and Sizes Section --- */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Medidas y Tallas</h3>
                  <div className="grid md:grid-cols-3 gap-x-6 gap-y-4 p-6 bg-card border rounded-lg">
                    <div><Label>Estatura (cm)</Label><NumericInputController name="height_cm" control={control} placeholder="175" /><FieldError name="height_cm" /></div>
                    <div><Label>Hombros (cm)</Label><NumericInputController name="shoulders_cm" control={control} placeholder="40" /><FieldError name="shoulders_cm" /></div>
                    <div><Label>Pecho (cm)</Label><NumericInputController name="chest_cm" control={control} placeholder="88" /><FieldError name="chest_cm" /></div>
                    <div><Label>Busto (cm)</Label><NumericInputController name="bust_cm" control={control} placeholder="85" /><FieldError name="bust_cm" /></div>
                    <div><Label>Cintura (cm)</Label><NumericInputController name="waist_cm" control={control} placeholder="62" /><FieldError name="waist_cm" /></div>
                    <div><Label>Cadera (cm)</Label><NumericInputController name="hips_cm" control={control} placeholder="90" /><FieldError name="hips_cm" /></div>
                    <div><Label>Talla Superior</Label><Controller name="top_size" control={control} render={({ field }) => (<Select onValueChange={field.onChange} value={field.value || undefined}><SelectTrigger><SelectValue placeholder="Seleccionar talla..." /></SelectTrigger><SelectContent>{topSizeOptions.map(o => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}</SelectContent></Select>)} /><FieldError name="top_size" /></div>
                    <div><Label htmlFor="pants_size">Pantalón</Label><Input id="pants_size" placeholder="28, 30..." {...register("pants_size")} /></div>
                    <div><Label>Zapato (EU)</Label><NumericInputController name="shoe_size_eu" control={control} placeholder="39" /><FieldError name="shoe_size_eu" /></div>
                  </div>
                </div>

                {/* --- Appearance and Contact Section --- */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Apariencia y Contacto</h3>
                  <div className="grid md:grid-cols-2 gap-x-6 gap-y-4 p-6 bg-card border rounded-lg">
                    <div><Label>Color de Ojos</Label><Controller name="eye_color" control={control} render={({ field }) => (<Select onValueChange={field.onChange} value={field.value || undefined}><SelectTrigger><SelectValue placeholder="Seleccionar color..." /></SelectTrigger><SelectContent>{eyeColorOptions.map(o => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}</SelectContent></Select>)} /><FieldError name="eye_color" /></div>
                    <div><Label>Color de Cabello</Label><Controller name="hair_color" control={control} render={({ field }) => (<Select onValueChange={field.onChange} value={field.value || undefined}><SelectTrigger><SelectValue placeholder="Seleccionar color..." /></SelectTrigger><SelectContent>{hairColorOptions.map(o => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}</SelectContent></Select>)} /><FieldError name="hair_color" /></div>
                    <div><Label htmlFor="instagram">Instagram</Label><Input id="instagram" placeholder="usuario" {...register("instagram")} /></div>
                    <div><Label htmlFor="tiktok">TikTok</Label><Input id="tiktok" placeholder="usuario" {...register("tiktok")} /></div>
                    <div><Label htmlFor="email">Email</Label><Input id="email" type="email" placeholder="correo@ejemplo.com" {...register("email")} /><FieldError name="email" /></div>
                    <div><Label htmlFor="phone_number">Teléfono</Label><Input id="phone_number" type="tel" placeholder="+502 1234 5678" {...register("phone_number")} /><FieldError name="phone_number" /></div>
                  </div>
                </div>
              </div>
            </div>
            <SheetFooter className="px-8 pt-6 pb-16 border-t mt-auto shrink-0">
              <SheetClose asChild><Button type="button" variant="outline">Cancelar</Button></SheetClose>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Guardando...' : 'Guardar Perfil'}</Button>
            </SheetFooter>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
});
