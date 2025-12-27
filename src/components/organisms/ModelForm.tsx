'use client'

// Import only used items from react-hook-form
import { useFormContext, Controller } from 'react-hook-form'
import { ModelFormData } from '@/lib/schemas'
import { countries } from '@/lib/countries'
import { genderOptions, eyeColorOptions, hairColorOptions, topSizeOptions, statusOptions, malePantsSizeOptions, femalePantsSizeOptions } from '@/lib/options'
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
// 'Model' no se está usando
import { FormField } from '@/components/molecules/FormField'
import { Combobox } from '@/components/ui/combobox'
import { DatePicker } from '@/components/ui/date-picker'
import { PhoneInputField } from '@/components/ui/phone-input'

interface ModelFormProps {
  isSubmitting: boolean;
}

export const ModelForm = ({ isSubmitting }: ModelFormProps) => {

  const { register, control, watch, formState: { errors } } = useFormContext<ModelFormData>();

  const selectedGender = watch('gender');

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

  const FieldError = ({ name }: { name: keyof ModelFormData }) => {
    const error = errors[name];
    return error ? <p className="text-label-12 text-destructive mt-1">{error.message}</p> : null;
  };

  // Helper para Inputs numéricos
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
          onKeyDown={preventNonNumericInput}
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
    <div className="space-y-16">
      <div className="space-y-4">
        <h2 className="text-heading-20">Información Básica</h2>
        <div className="border bg-card rounded-lg p-8 grid md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
          <FormField label="Nombre Completo *" htmlFor="full_name">
            <Input id="full_name" {...register("full_name")} onKeyDown={preventNumericInput} disabled={isSubmitting} placeholder="Nombre y apellidos legales" />
            <FieldError name="full_name" />
          </FormField>
          <FormField label="Alias" htmlFor="alias">
            <Input id="alias" {...register("alias")} onKeyDown={preventNumericInput} disabled={isSubmitting} placeholder="Nombre más conocido" />
            <FieldError name="alias" />
          </FormField>
          <FormField label="Fecha de Nacimiento" htmlFor="birth_date">
            <Controller name="birth_date" control={control} render={({ field }) => (
              <DatePicker
                value={field.value ?? undefined}
                onChange={(date) => field.onChange(date || null)}
                placeholder="Seleccionar fecha"
              />
            )} />
            <FieldError name="birth_date" />
          </FormField>

          <FormField label="País" htmlFor="country">
            <Controller name="country" control={control} render={({ field }) => (
              <Combobox
                options={countries}
                value={field.value ?? ''}
                onChange={field.onChange}
                placeholder="Selecciona un país..."
                searchPlaceholder="Buscar país..."
                emptyMessage="No se encontró el país."
              />
            )} />
            <FieldError name="country" />
          </FormField>

          <FormField label="Documento ID" htmlFor="national_id">
            <Controller name="national_id" control={control} render={({ field }) => (
              <Input
                id="national_id"
                {...field}
                value={field.value ?? ''}
                onKeyDown={preventNonNumericInput}
                onChange={(e) => {
                  // Sanitizar: eliminar todo lo que no sea número
                  const sanitized = e.target.value.replace(/\D/g, '');
                  field.onChange(sanitized || null);
                }}
                disabled={isSubmitting}
                placeholder="Solo números, sin espacios"
              />
            )} />
            <FieldError name="national_id" />
          </FormField>
          <FormField label="Pasaporte" htmlFor="passport_number">
            <Controller name="passport_number" control={control} render={({ field }) => (
              <Input
                id="passport_number"
                {...field}
                value={field.value ?? ''}
                onChange={(e) => {
                  // Sanitizar: permitir letras y números, eliminar espacios y caracteres especiales
                  // Convertir a mayúsculas automáticamente
                  const sanitized = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                  field.onChange(sanitized || null);
                }}
                disabled={isSubmitting}
                placeholder="Alfanumérico sin espacios"
              />
            )} />
            <FieldError name="passport_number" />
          </FormField>
          <FormField label="Género" htmlFor="gender">
            <Controller name="gender" control={control} render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value || undefined} disabled={isSubmitting}>
                <SelectTrigger id="gender"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent>{genderOptions.map(o => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}</SelectContent>
              </Select>
            )} />
            <FieldError name="gender" />
          </FormField>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-heading-20">Medidas y Tallas</h2>
        <div className="border bg-card rounded-lg p-8 grid md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-6">

          <FormField label="Estatura (cm)" htmlFor="height_cm">
            <NumericInputController name="height_cm" control={control} placeholder="183" />
            <FieldError name="height_cm" />
          </FormField>
          <FormField label="Hombros (cm)" htmlFor="shoulders_cm">
            <NumericInputController name="shoulders_cm" control={control} placeholder="40" />
            <FieldError name="shoulders_cm" />
          </FormField>

          {selectedGender === 'Male' && (
            <FormField label="Pecho (cm)" htmlFor="chest_cm">
              <NumericInputController name="chest_cm" control={control} placeholder="98" />
              <FieldError name="chest_cm" />
            </FormField>
          )}
          {selectedGender === 'Female' && (
            <FormField label="Busto (cm)" htmlFor="bust_cm">
              <NumericInputController name="bust_cm" control={control} placeholder="90" />
              <FieldError name="bust_cm" />
            </FormField>
          )}

          <FormField label="Cintura (cm)" htmlFor="waist_cm">
            <NumericInputController name="waist_cm" control={control} placeholder="72" />
            <FieldError name="waist_cm" />
          </FormField>

          <FormField label="Cadera (cm)" htmlFor="hips_cm">
            <NumericInputController name="hips_cm" control={control} placeholder="92" />
            <FieldError name="hips_cm" />
          </FormField>

          <FormField label="Talla Superior" htmlFor="top_size">
            <Controller name="top_size" control={control} render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value || undefined} disabled={isSubmitting}>
                <SelectTrigger id="top_size"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent>{topSizeOptions.map(o => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}</SelectContent>
              </Select>
            )} />
            <FieldError name="top_size" />
          </FormField>

          <FormField label="Pantalón" htmlFor="pants_size">
            <Controller name="pants_size" control={control} render={({ field }) => {
              // Seleccionar las opciones según el género
              const pantsSizeOptions = selectedGender === 'Female'
                ? femalePantsSizeOptions
                : selectedGender === 'Male'
                  ? malePantsSizeOptions
                  : [...malePantsSizeOptions, ...femalePantsSizeOptions]; // Si no hay género, mostrar todas

              // Convertir el valor a string para el Select (el schema lo convierte a number para la BD)
              const stringValue = field.value != null ? String(field.value) : '';

              return (
                <Select
                  onValueChange={(v) => field.onChange(v === '' ? null : v)}
                  value={stringValue}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="pants_size">
                    <SelectValue placeholder={selectedGender ? "Seleccionar talla" : "Selecciona género primero"} />
                  </SelectTrigger>
                  <SelectContent>
                    {pantsSizeOptions.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )
            }} />
            <FieldError name="pants_size" />
          </FormField>


          <FormField label="Zapato (US)" htmlFor="shoe_size_us">
            <Controller name="shoe_size_us" control={control} render={({ field }) => {
              const sizes = Array.from({ length: Math.round((15 - 3.5) / 0.5) + 1 }, (_, i) => Number((3.5 + i * 0.5).toFixed(1)));
              return (
                <Select onValueChange={(v) => field.onChange(v === '' ? null : Number(v))} value={field.value ? String(field.value) : ''} disabled={isSubmitting}>
                  <SelectTrigger id="shoe_size_us"><SelectValue placeholder="Seleccionar talla" /></SelectTrigger>
                  <SelectContent>
                    {sizes.map(s => (
                      <SelectItem key={s} value={String(s)}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )
            }} />
            <FieldError name="shoe_size_us" />
          </FormField>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-heading-20">Apariencia y Contacto</h2>
        <div className="border bg-card rounded-lg p-8 grid md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
          <FormField label="Color de Ojos" htmlFor="eye_color">
            <Controller name="eye_color" control={control} render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value || undefined} disabled={isSubmitting}>
                <SelectTrigger id="eye_color"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent>{eyeColorOptions.map(o => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}</SelectContent>
              </Select>
            )} />
            <FieldError name="eye_color" />
          </FormField>
          <FormField label="Color de Cabello" htmlFor="hair_color">
            <Controller name="hair_color" control={control} render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value || undefined} disabled={isSubmitting}>
                <SelectTrigger id="hair_color"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent>{hairColorOptions.map(o => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}</SelectContent>
              </Select>
            )} />
            <FieldError name="hair_color" />
          </FormField>
          <FormField label="Instagram" htmlFor="instagram">
            <Input id="instagram" {...register("instagram")} disabled={isSubmitting} />
            <FieldError name="instagram" />
          </FormField>
          <FormField label="TikTok" htmlFor="tiktok">
            <Input id="tiktok" {...register("tiktok")} disabled={isSubmitting} />
            <FieldError name="tiktok" />
          </FormField>
          <FormField label="Email" htmlFor="email">
            <Input id="email" type="email" {...register("email")} disabled={isSubmitting} placeholder="correo@ejemplo.com" />
            <FieldError name="email" />
          </FormField>

          <FormField label="Teléfono*" htmlFor="phone_e164">
            <Controller name="phone_e164" control={control} render={({ field }) => (
              <PhoneInputField
                value={field.value?.replace('+', '') ?? ''}
                onChange={(phone) => field.onChange(phone)}
                disabled={isSubmitting}
                placeholder="Número de teléfono"
              />
            )} />
            <FieldError name="phone_e164" />
          </FormField>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-heading-20">Datos de Agencia</h2>
        <div className="border bg-card rounded-lg p-8 grid md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
          <FormField label="Estado" htmlFor="status">
            <Controller name="status" control={control} render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value || 'active'} disabled={isSubmitting}>
                <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                <SelectContent>{statusOptions.map(o => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}</SelectContent>
              </Select>
            )} />
            <FieldError name="status" />
          </FormField>
          <FormField label="Fecha de Ingreso" htmlFor="date_joined_agency">
            <Controller name="date_joined_agency" control={control} render={({ field }) => (
              <DatePicker
                value={field.value ?? undefined}
                onChange={(date) => field.onChange(date || null)}
                placeholder="Seleccionar fecha"
              />
            )} />
            <FieldError name="date_joined_agency" />
          </FormField>
        </div>
      </div>
    </div>
  );
};