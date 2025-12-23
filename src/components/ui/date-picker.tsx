"use client"

import * as React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface DatePickerProps {
    value?: string
    onChange?: (date: string) => void
    className?: string
    placeholder?: string
}

export function DatePicker({ value, onChange, className, placeholder = "Seleccionar fecha" }: DatePickerProps) {
    const [open, setOpen] = React.useState(false)

    // Parse YYYY-MM-DD string to Date object, ensuring noon to avoid timezone flips
    const date = React.useMemo(() => {
        if (!value) return undefined
        const [year, month, day] = value.split("-").map(Number)
        return new Date(year, month - 1, day, 12, 0, 0)
    }, [value])

    const handleSelect = (selectedDate: Date | undefined) => {
        if (selectedDate) {
            const y = selectedDate.getFullYear()
            const m = String(selectedDate.getMonth() + 1).padStart(2, "0")
            const d = String(selectedDate.getDate()).padStart(2, "0")
            onChange?.(`${y}-${m}-${d}`)
            setOpen(false) // Close popover on selection
        } else {
            onChange?.("")
        }
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        "w-full justify-start text-left font-normal h-9 px-3",
                        !date && "text-muted-foreground",
                        className
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP", { locale: es }) : <span>{placeholder}</span>}
                </Button>
            </PopoverTrigger>

            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={handleSelect}
                    locale={es}
                    autoFocus
                    captionLayout="dropdown"
                    startMonth={new Date(1960, 0)}
                    endMonth={new Date(2030, 11)}
                />
            </PopoverContent>
        </Popover>
    )
}
