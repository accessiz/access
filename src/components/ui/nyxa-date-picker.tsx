"use client"

import * as React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { NyxaCalendar } from "@/components/ui/nyxa-calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface NyxaDatePickerProps {
    value?: Date | null
    onChange?: (date: Date | undefined) => void
    placeholder?: string
    disabled?: boolean
    className?: string
    minYear?: number
    maxYear?: number
}

export function NyxaDatePicker({
    value,
    onChange,
    placeholder = "Seleccionar fecha",
    disabled = false,
    className,
    minYear = 2020,
    maxYear = 2030,
}: NyxaDatePickerProps) {
    const [open, setOpen] = React.useState(false)

    const handleSelect = (date: Date) => {
        onChange?.(date)
        setOpen(false)
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        !value && "text-muted-foreground",
                        className
                    )}
                    disabled={disabled}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {value ? (
                        format(value, "d 'de' MMMM 'de' yyyy", { locale: es })
                    ) : (
                        <span>{placeholder}</span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <NyxaCalendar
                    selected={value}
                    onSelect={handleSelect}
                    minYear={minYear}
                    maxYear={maxYear}
                />
            </PopoverContent>
        </Popover>
    )
}

NyxaDatePicker.displayName = "NyxaDatePicker"
