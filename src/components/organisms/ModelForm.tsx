'use client'

// 1. Importamos 'FieldPath' además de los otros
import { useFormContext, Controller, ControllerRenderProps, FieldValues, FieldPath } from 'react-hook-form'
import { ModelFormData } from '@/lib/schemas'
import { countries } from '@/lib/countries'
import { genderOptions, eyeColorOptions, hairColorOptions, topSizeOptions, statusOptions } from '@/lib/options'
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
    return error ? <p className="text-xs text-destructive mt-1">{error.message}</p> : null;
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
  
  // ✅ INICIO DE LA CORRECCIÓN
  // El tipo del 'field' ahora usa 'ModelFormData' directamente,
  // que es el tipo del 'useFormContext'.
  const handleNumericChange = (
    field: ControllerRenderProps<ModelFormData, FieldPath<ModelFormData>>,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
  // ✅ FIN DE LA CORRECCIÓN
    const value = e.target.value;
    if (value === '') {
      field.onChange(null);
      return;
    }
    const parsed = parseInt(value, 10);
    field.onChange(isNaN(parsed) ? null : parsed);
  };

  return (
    <div className="space-y-16">
        <div className="space-y-4">
            <h2 className="text-lg font-semibold">Información Básica</h2>
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
                  <Input id="birth_date" type="date" {...register("birth_date")} disabled={isSubmitting} />
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
                  <Input id="national_id" {...register("national_id")} disabled={isSubmitting} placeholder="13 dígitos sin espacios..." />
                  <FieldError name="national_id" />
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
            <h2 className="text-lg font-semibold">Medidas y Tallas</h2>
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
                  <Controller name="pants_size" control={control} render={({ field }) => (
                    <Input
                      type="number"
                      placeholder={selectedGender === 'Female' ? "4" : "32"}
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => handleNumericChange(field, e)}
                      disabled={isSubmitting}
                    />
                  )} />
                  <FieldError name="pants_size" />
                </FormField>
                
                <FormField label="Zapato (EU)" htmlFor="shoe_size_eu">
                   <Controller name="shoe_size_eu" control={control} render={({ field }) => (
                    <Input
                      type="number"
                      placeholder={selectedGender === 'Female' ? "5" : "9"}
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => handleNumericChange(field, e)}
                      disabled={isSubmitting}
                    />
                  )} />
                  <FieldError name="shoe_size_eu" />
                </FormField>
            </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Apariencia y Contacto</h2>
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
                    <Input id="phone_e164" type="tel" {...register("phone_e164")} disabled={isSubmitting} placeholder="+50212345678" />
                    <FieldError name="phone_e164" />
                </FormField>
          </div>
        </div>

        <div className="space-y-4">
            <h2 className="text-lg font-semibold">Datos de Agencia</h2>
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
                    <Input id="date_joined_agency" type="date" {...register("date_joined_agency")} disabled={isSubmitting} />
                    <FieldError name="date_joined_agency" />
                  </FormField>
            </div>
        </div>
    </div>
  );
};