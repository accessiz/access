'use client'

import PhoneInput from 'react-phone-input-2'
import 'react-phone-input-2/lib/style.css'
import { cn } from '@/lib/utils'

interface PhoneInputFieldProps {
    value?: string
    onChange?: (value: string) => void
    disabled?: boolean
    placeholder?: string
    className?: string
}

export function PhoneInputField({
    value,
    onChange,
    disabled,
    placeholder = 'Número de teléfono',
    className,
}: PhoneInputFieldProps) {
    return (
        <PhoneInput
            country="gt" // Guatemala por defecto
            value={value}
            onChange={(phone) => {
                // Siempre agregar el + al inicio para formato E.164
                onChange?.(`+${phone}`)
            }}
            disabled={disabled}
            placeholder={placeholder}
            enableSearch
            searchPlaceholder="Buscar país..."
            searchNotFound="País no encontrado"
            preferredCountries={['gt', 'mx', 'us', 'sv', 'hn', 'ni', 'cr', 'pa']}
            containerClass={cn('phone-input-container !w-full', className)}
            inputClass={cn(
                "flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-body transition-colors placeholder:text-muted-foreground focus:outline-none focus:border-purple disabled:cursor-not-allowed disabled:opacity-50",
                "!pl-12 !bg-transparent !border !border-input !text-body !w-full !h-10 !rounded-md" // Override for flag spacing and force styles
            )}
            buttonClass="!bg-transparent !border-0 !rounded-l-md"
            dropdownClass="!bg-card !text-popover-foreground !border-border"
            searchClass="!bg-background !text-foreground"
            inputProps={{
                required: true,
            }}
        />
    )
}
