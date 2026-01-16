"use client"
import * as React from "react"
import { Check, ChevronsUpDown, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface ComboboxWithCreateProps {
    options: { label: string; value: string }[];
    value: string;
    onChange: (value: string, isExisting: boolean) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyMessage?: string;
    createLabel?: string;
}

/**
 * Normaliza texto a Title Case (primera letra de cada palabra en mayúscula)
 */
function toTitleCase(str: string): string {
    return str
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

/**
 * ComboboxWithCreate - Campo híbrido que permite:
 * 1. Escribir libremente con autocomplete
 * 2. Seleccionar de un dropdown
 * 3. Crear valores nuevos si no existen
 * 4. Case-insensitive matching
 * 5. Normalización automática a Title Case
 */
export function ComboboxWithCreate({
    options,
    value,
    onChange,
    placeholder = "Escribe o selecciona...",
    searchPlaceholder = "Buscar...",
    emptyMessage = "No se encontraron resultados",
    createLabel = "Crear",
}: ComboboxWithCreateProps) {
    const [open, setOpen] = React.useState(false)
    const [inputValue, setInputValue] = React.useState(value)
    const [highlightedValue, setHighlightedValue] = React.useState<string | null>(null)

    // Sync inputValue when external value changes
    React.useEffect(() => {
        setInputValue(value)
    }, [value])

    // Case-insensitive filtering
    const filteredOptions = React.useMemo(() => {
        if (!inputValue) return options
        const normalizedSearch = inputValue.toLowerCase().trim()
        return options.filter(opt =>
            opt.label.toLowerCase().includes(normalizedSearch)
        )
    }, [options, inputValue])

    // Check if exact match exists (case-insensitive)
    const exactMatchExists = React.useMemo(() => {
        if (!inputValue) return false
        const normalizedInput = inputValue.toLowerCase().trim()
        return options.some(opt => opt.label.toLowerCase() === normalizedInput)
    }, [options, inputValue])

    // Show "Create new" option only if no exact match and input has value
    const showCreateOption = inputValue.trim() && !exactMatchExists

    const handleSelect = (selectedLabel: string, isNew: boolean) => {
        const normalizedLabel = toTitleCase(selectedLabel.trim())
        setInputValue(normalizedLabel)
        onChange(normalizedLabel, !isNew)
        setOpen(false)
    }

    const handleInputChange = (newValue: string) => {
        setInputValue(newValue)
        // Feedback inmediato mientras escribe
        if (newValue.trim()) {
            const normalizedInput = newValue.toLowerCase().trim()
            const match = options.find(opt => opt.label.toLowerCase() === normalizedInput)
            if (match) {
                // Existe un match exacto - marcar como existente
                onChange(match.label, true)
            } else {
                // No existe - notificar como nuevo (sin normalizar aún para UX fluida)
                onChange(newValue.trim(), false)
            }
        } else {
            onChange('', false)
        }
    }

    const handleBlur = () => {
        // Normalizar a Title Case al salir del campo
        if (inputValue.trim()) {
            const normalized = toTitleCase(inputValue.trim())
            setInputValue(normalized)
            const isExisting = options.some(
                opt => opt.label.toLowerCase() === inputValue.toLowerCase().trim()
            )
            onChange(normalized, isExisting)
        }
    }

    return (
        <Popover open={open} onOpenChange={setOpen} modal={true}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="h-12 md:h-10 w-full justify-between font-normal text-body"
                >
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => handleInputChange(e.target.value)}
                        onBlur={handleBlur}
                        onClick={(e) => {
                            e.stopPropagation()
                            setOpen(true)
                        }}
                        placeholder={placeholder}
                        className="flex-1 bg-transparent border-0 outline-none text-left"
                    />
                    <ChevronsUpDown
                        className="ml-2 h-4 w-4 shrink-0 opacity-50 cursor-pointer"
                        onClick={(e) => {
                            e.stopPropagation()
                            setOpen(!open)
                        }}
                    />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0 border-0 bg-transparent">
                <Command>
                    <CommandInput
                        placeholder={searchPlaceholder}
                        value={inputValue}
                        onValueChange={handleInputChange}
                    />
                    <CommandList>
                        {filteredOptions.length === 0 && !showCreateOption && (
                            <CommandEmpty>{emptyMessage}</CommandEmpty>
                        )}

                        {/* Opción de crear nuevo */}
                        {showCreateOption && (
                            <CommandGroup heading="Nuevo">
                                <CommandItem
                                    className="cursor-pointer text-purple"
                                    onSelect={() => handleSelect(inputValue, true)}
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    {createLabel} &quot;{toTitleCase(inputValue.trim())}&quot;
                                </CommandItem>
                            </CommandGroup>
                        )}

                        {/* Opciones existentes */}
                        {filteredOptions.length > 0 && (
                            <CommandGroup heading={showCreateOption ? "Existentes" : undefined}>
                                {filteredOptions.map((option) => {
                                    const isHighlighted = highlightedValue === option.value
                                    const isSelected = value.toLowerCase() === option.label.toLowerCase()

                                    return (
                                        <CommandItem
                                            key={option.value}
                                            value={option.label}
                                            className={cn(
                                                "cursor-pointer",
                                                "[&_[data-disabled]]:pointer-events-auto",
                                                isHighlighted && !isSelected && "bg-purple text-white"
                                            )}
                                            onMouseEnter={() => setHighlightedValue(option.value)}
                                            onMouseLeave={() => setHighlightedValue(null)}
                                            onClick={(e) => {
                                                e.preventDefault()
                                                handleSelect(option.label, false)
                                            }}
                                            onSelect={() => handleSelect(option.label, false)}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    isSelected ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            {option.label}
                                        </CommandItem>
                                    )
                                })}
                            </CommandGroup>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
