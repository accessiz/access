'use client'

import * as React from 'react'
import { Check } from 'lucide-react'
import { cn, toTitleCase } from '@/lib/utils'

export interface BrandOption {
    id: string
    name: string
    client_id: string
    client_name: string
}

interface BrandAutocompleteProps {
    brands: BrandOption[]
    value: string
    selectedBrandId: string | null
    selectedClientId: string | null
    onChange: (params: {
        brandName: string
        brandId: string | null
        clientId: string | null
        clientName: string | null
        isNew: boolean
    }) => void
    placeholder?: string
    disabled?: boolean
    isLoading?: boolean
}

export function BrandAutocomplete({
    brands,
    value,
    selectedBrandId,
    onChange,
    placeholder = 'Escribir marca...',
    disabled = false,
    isLoading = false,
}: BrandAutocompleteProps) {
    const [open, setOpen] = React.useState(false)
    const [inputValue, setInputValue] = React.useState(value)
    const inputRef = React.useRef<HTMLInputElement>(null)
    const dropdownRef = React.useRef<HTMLDivElement>(null)
    const isSelecting = React.useRef(false) // Flag to prevent blur from interfering

    // Sync input value when external value changes (only if not selecting)
    React.useEffect(() => {
        if (!isSelecting.current) {
            setInputValue(value)
        }
    }, [value])

    // Case-insensitive filtering
    const filteredBrands = React.useMemo(() => {
        if (!inputValue.trim()) {
            return []
        }

        const normalizedSearch = inputValue.toLowerCase().trim()
        return brands
            .filter(b => b.name.toLowerCase().includes(normalizedSearch))
            .sort((a, b) => {
                const aLower = a.name.toLowerCase()
                const bLower = b.name.toLowerCase()
                const aExact = aLower === normalizedSearch
                const bExact = bLower === normalizedSearch
                const aStarts = aLower.startsWith(normalizedSearch)
                const bStarts = bLower.startsWith(normalizedSearch)

                if (aExact && !bExact) return -1
                if (!aExact && bExact) return 1
                if (aStarts && !bStarts) return -1
                if (!aStarts && bStarts) return 1
                return a.name.localeCompare(b.name)
            })
            .slice(0, 10)
    }, [brands, inputValue])

    const handleSelectBrand = (brand: BrandOption) => {
        isSelecting.current = true // Start selection
        setInputValue(brand.name)
        onChange({
            brandName: brand.name,
            brandId: brand.id,
            clientId: brand.client_id,
            clientName: brand.client_name,
            isNew: false,
        })
        setOpen(false)

        // Reset flag after state updates
        setTimeout(() => {
            isSelecting.current = false
        }, 50)
    }

    const handleInputChange = (newValue: string) => {
        setInputValue(newValue)
        setOpen(newValue.trim().length > 0)
    }

    const handleBlur = () => {
        // Skip if we're currently selecting from dropdown
        if (isSelecting.current) {
            return
        }

        setTimeout(() => {
            // Double-check flag after timeout
            if (isSelecting.current) {
                return
            }

            if (inputValue.trim()) {
                const normalized = toTitleCase(inputValue.trim())
                setInputValue(normalized)

                const match = brands.find(b => b.name.toLowerCase() === normalized.toLowerCase())
                onChange({
                    brandName: normalized,
                    brandId: match?.id || null,
                    clientId: match?.client_id || null,
                    clientName: match?.client_name || null,
                    isNew: !match,
                })
            }
            setOpen(false)
        }, 150)
    }

    const highlightMatch = (text: string, search: string) => {
        if (!search.trim()) return text

        const normalizedSearch = search.toLowerCase()
        const lowerText = text.toLowerCase()
        const index = lowerText.indexOf(normalizedSearch)

        if (index === -1) return text

        return (
            <>
                {text.slice(0, index)}
                <span className="font-semibold text-purple">{text.slice(index, index + search.length)}</span>
                {text.slice(index + search.length)}
            </>
        )
    }

    return (
        <div className="relative w-full">
            <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => handleInputChange(e.target.value)}
                onFocus={() => setOpen(inputValue.trim().length > 0)}
                onBlur={handleBlur}
                disabled={disabled || isLoading}
                placeholder={isLoading ? 'Cargando marcas...' : placeholder}
                className={cn(
                    'flex h-12 md:h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-body ring-offset-background',
                    'placeholder:text-muted-foreground',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    'disabled:cursor-not-allowed disabled:opacity-50'
                )}
            />

            {open && filteredBrands.length > 0 && (
                <div
                    ref={dropdownRef}
                    className="absolute top-full left-0 right-0 z-50 mt-1 max-h-[300px] overflow-y-auto rounded-md border border-separator/50 bg-background/80 backdrop-blur-md shadow-2xl"
                >
                    {filteredBrands.map((brand) => {
                        const isSelected = selectedBrandId === brand.id

                        return (
                            <div
                                key={brand.id}
                                onMouseDown={(e) => {
                                    e.preventDefault()
                                    handleSelectBrand(brand)
                                }}
                                className={cn(
                                    'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-3 text-body outline-none transition-colors',
                                    'data-[disabled]:pointer-events-none data-[disabled]:opacity-50'
                                )}
                                style={{
                                    backgroundColor: isSelected ? 'rgba(var(--hover-overlay))' : 'transparent'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(var(--hover-overlay))'
                                }}
                                onMouseLeave={(e) => {
                                    if (!isSelected) {
                                        e.currentTarget.style.backgroundColor = 'transparent'
                                    }
                                }}
                            >
                                <Check
                                    className={cn(
                                        'mr-2 h-4 w-4 shrink-0',
                                        isSelected ? 'opacity-100' : 'opacity-0'
                                    )}
                                />
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-body">{highlightMatch(brand.name, inputValue)}</span>
                                    <span className="text-label opacity-70">
                                        {brand.client_name}
                                    </span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
