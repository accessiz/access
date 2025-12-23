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
            containerClass={cn('phone-input-container', className)}
            inputClass="phone-input-field"
            buttonClass="phone-input-button"
            dropdownClass="phone-input-dropdown"
            searchClass="phone-input-search"
            inputProps={{
                required: true,
            }}
        />
    )
}
