
'use client'

import { useForm, Controller, SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { modelFormSchema, ModelFormData } from '@/lib/schemas'
import { countries } from '@/lib/countries'
import { genderOptions, eyeColorOptions, hairColorOptions, topSizeOptions, statusOptions } from '@/lib/options'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Model } from '@/lib/types'

interface ModelFormProps {
  model?: Model | null;
  onSubmit: SubmitHandler<ModelFormData>;
  isSubmitting: boolean;
}

export const ModelForm = ({ model, onSubmit, isSubmitting }: ModelFormProps) => {
  const formId = model ? "model-edit-form" : "model-create-form";

  const { register, handleSubmit, control, formState: { errors } } = useForm<ModelFormData>({
    resolver: zodResolver(modelFormSchema),
    defaultValues: {
      alias: model?.alias || '',
      full_name: model?.full_name || '',
      national_id: model?.national_id || '',
      gender: model?.gender || null,
      birth_date: model?.birth_date ? new Date(model.birth_date).toISOString().split('T')[0] : '',
      country: model?.country || null,
      height_cm: model?.height_cm || null,
      shoulders_cm: model?.shoulders_cm || null,
      chest_cm: model?.chest_cm || null,
      bust_cm: model?.bust_cm || null,
      waist_cm: model?.waist_cm || null,
      hips_cm: model?.hips_cm || null,
      top_size: model?.top_size || null,
      pants_size: model?.pants_size || null,
      shoe_size_eu: model?.shoe_size_eu || null,
      eye_color: model?.eye_color || null,
      hair_color: model?.hair_color || null,
      instagram: model?.instagram || '',
      tiktok: model?.tiktok || '',
      email: model?.email || '',
      phone_number: model?.phone_number || '', // Revertido: El valor ahora incluye el '+' si el usuario lo escribe
      status: model?.status || 'active',
      date_joined_agency: model?.date_joined_agency ? new Date(model.date_joined_agency).toISOString().split('T')[0] : '',
    }
  });

  // --- Validaciones proactivas (se mantienen) ---
  const preventNonNumericInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const isControlKey = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete', 'Enter', 'Home', 'End'].includes(e.key) || e.ctrlKey || e.metaKey;
    const isDigit = /[0-9]/.test(e.key);
    if (!isDigit && !isControlKey) {
      e.preventDefault();
    }
  };

  const preventNumericInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (/[0-9]/.test(e.key)) {
      e.preventDefault();
    }
  };
  // --- Fin de las mejoras que se mantienen ---

  const FieldError = ({ name }: { name: keyof ModelFormData }) => {
    const error = errors[name];
    return error ? <p className="text-xs text-destructive mt-1">{error.message}</p> : null;
  };

  const NumericInputController = ({ name, control: formControl, placeholder }: { name: keyof ModelFormData, control: typeof control, placeholder?: string }) => (
    <Controller
      name={name}
      control={formControl}
      render={({ field }) => (
        <Input
          {...field}
          type="number"
          step="1"
          placeholder={placeholder}
          value={field.value ?? ''}
          onKeyDown={preventNonNumericInput} // Bloqueo proactivo
          onChange={e => {
            const value = e.target.value;
            field.onChange(value === '' ? null : Number(value));
          }}
          disabled={isSubmitting}
        />
      )}
    />
  );

  return (
    // Revertido: Se quita el 'handleFormSubmit'
    <form id={formId} onSubmit={handleSubmit(onSubmit)} className="space-y-12">
        <div className="space-y-4">
            <h2 className="text-lg font-semibold">Información Básica</h2>
            <div className="border bg-card rounded-lg p-6 grid md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                <div><Label htmlFor="alias">Alias *</Label><Input id="alias" {...register("alias")} onKeyDown={preventNumericInput} disabled={isSubmitting} /><FieldError name="alias" /></div>
                <div><Label htmlFor="full_name">Nombre Completo *</Label><Input id="full_name" {...register("full_name")} onKeyDown={preventNumericInput} disabled={isSubmitting} /><FieldError name="full_name" /></div>
                <div><Label htmlFor="birth_date">Fecha de Nacimiento</Label><Input id="birth_date" type="date" {...register("birth_date")} disabled={isSubmitting} /><FieldError name="birth_date" /></div>
                <div><Label>País</Label><Controller name="country" control={control} render={({ field }) => (<Select onValueChange={field.onChange} value={field.value || undefined} disabled={isSubmitting}><SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger><SelectContent>{countries.map(c => (<SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>))}</SelectContent></Select>)} /><FieldError name="country" /></div>
                <div><Label htmlFor="national_id">Documento ID</Label><Input id="national_id" {...register("national_id")} disabled={isSubmitting} /></div>
                <div><Label>Género</Label><Controller name="gender" control={control} render={({ field }) => (<Select onValueChange={field.onChange} value={field.value || undefined} disabled={isSubmitting}><SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger><SelectContent>{genderOptions.map(o => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}</SelectContent></Select>)} /><FieldError name="gender" /></div>
            </div>
        </div>

        <div className="space-y-4">
            <h2 className="text-lg font-semibold">Medidas y Tallas</h2>
            <div className="border bg-card rounded-lg p-6 grid md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4">
                <div><Label>Estatura (cm)</Label><NumericInputController name="height_cm" control={control} /><FieldError name="height_cm" /></div>
                <div><Label>Hombros (cm)</Label><NumericInputController name="shoulders_cm" control={control} /><FieldError name="shoulders_cm" /></div>
                <div><Label>Pecho (cm)</Label><NumericInputController name="chest_cm" control={control} /><FieldError name="chest_cm" /></div>
                <div><Label>Busto (cm)</Label><NumericInputController name="bust_cm" control={control} /><FieldError name="bust_cm" /></div>
                <div><Label>Cintura (cm)</Label><NumericInputController name="waist_cm" control={control} /><FieldError name="waist_cm" /></div>
                <div><Label>Cadera (cm)</Label><NumericInputController name="hips_cm" control={control} /><FieldError name="hips_cm" /></div>
                <div><Label>Talla Superior</Label><Controller name="top_size" control={control} render={({ field }) => (<Select onValueChange={field.onChange} value={field.value || undefined} disabled={isSubmitting}><SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger><SelectContent>{topSizeOptions.map(o => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}</SelectContent></Select>)} /><FieldError name="top_size" /></div>
                <div><Label>Pantalón</Label><NumericInputController name="pants_size" control={control} /><FieldError name="pants_size" /></div>
                <div><Label>Zapato (EU)</Label><NumericInputController name="shoe_size_eu" control={control} /><FieldError name="shoe_size_eu" /></div>
            </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Apariencia y Contacto</h2>
          <div className="border bg-card rounded-lg p-6 grid md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                <div><Label>Color de Ojos</Label><Controller name="eye_color" control={control} render={({ field }) => (<Select onValueChange={field.onChange} value={field.value || undefined} disabled={isSubmitting}><SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger><SelectContent>{eyeColorOptions.map(o => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}</SelectContent></Select>)} /><FieldError name="eye_color" /></div>
                <div><Label>Color de Cabello</Label><Controller name="hair_color" control={control} render={({ field }) => (<Select onValueChange={field.onChange} value={field.value || undefined} disabled={isSubmitting}><SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger><SelectContent>{hairColorOptions.map(o => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}</SelectContent></Select>)} /><FieldError name="hair_color" /></div>
                <div><Label>Instagram</Label><Input id="instagram" {...register("instagram")} disabled={isSubmitting} /></div>
                <div><Label>TikTok</Label><Input id="tiktok" {...register("tiktok")} disabled={isSubmitting} /></div>
                <div><Label>Email</Label><Input id="email" type="email" {...register("email")} disabled={isSubmitting} /><FieldError name="email" /></div>
                <div>
                    <Label htmlFor="phone_number">Teléfono</Label>
                    {/* Revertido al Input simple */}
                    <Input id="phone_number" type="tel" {...register("phone_number")} disabled={isSubmitting} />
                    <FieldError name="phone_number" />
                </div>
          </div>
        </div>

        <div className="space-y-4">
            <h2 className="text-lg font-semibold">Datos de Agencia</h2>
            <div className="border bg-card rounded-lg p-6 grid md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                  <div><Label>Estado</Label><Controller name="status" control={control} render={({ field }) => (<Select onValueChange={field.onChange} value={field.value || 'active'} disabled={isSubmitting}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{statusOptions.map(o => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}</SelectContent></Select>)} /><FieldError name="status" /></div>
                  <div><Label htmlFor="date_joined_agency">Fecha de Ingreso</Label><Input id="date_joined_agency" type="date" {...register("date_joined_agency")} disabled={isSubmitting} /><FieldError name="date_joined_agency" /></div>
            </div>
        </div>
    </form>
  );
};
