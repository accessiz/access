"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface TimePickerProps {
    value?: string // format "HH:mm AM/PM" (e.g., "09:00 AM")
    onChange?: (value: string) => void
    className?: string
}

// Convierte formato 12h a 24h para el input nativo
function to24h(time12h: string): string {
    if (!time12h) return "09:00"

    const match = time12h.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i)
    if (!match) return "09:00"

    let hours = parseInt(match[1], 10)
    const minutes = match[2]
    const period = match[3]?.toUpperCase()

    if (period === "PM" && hours < 12) hours += 12
    if (period === "AM" && hours === 12) hours = 0

    return `${hours.toString().padStart(2, "0")}:${minutes}`
}

// Convierte formato 24h a 12h 
function to12h(time24h: string): string {
    if (!time24h) return "09:00 AM"

    const [hoursStr, minutes] = time24h.split(":")
    let hours = parseInt(hoursStr, 10)

    const period = hours >= 12 ? "PM" : "AM"
    hours = hours % 12 || 12

    return `${hours.toString().padStart(2, "0")}:${minutes} ${period}`
}

export function TimePicker({ value, onChange, className }: TimePickerProps) {
    // Estado local para manejar el valor 24h del input nativo
    const [time24h, setTime24h] = React.useState(() => to24h(value || "09:00 AM"))

    // Sincronizar cuando el valor externo cambie
    React.useEffect(() => {
        if (value) {
            setTime24h(to24h(value))
        }
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTime24h = e.target.value
        setTime24h(newTime24h)

        // Convertir a 12h y notificar
        const time12h = to12h(newTime24h)
        onChange?.(time12h)
    }

    return (
        <Input
            type="time"
            value={time24h}
            onChange={handleChange}
            className={cn("w-full", className)}
        />
    )
}

// Versión con selects (alternativa visual) - por si se necesita después
export function TimePickerSelect({ value, onChange, className }: TimePickerProps) {
    const safeValue = value || "09:00 AM"

    // Parse time
    let hour12 = 9
    let minute = 0
    let period = "AM"

    const match = safeValue.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i)
    if (match) {
        hour12 = parseInt(match[1], 10)
        minute = parseInt(match[2], 10)
        period = match[3]?.toUpperCase() || "AM"
    }

    const formatTime = (h: number, m: number, p: string) => {
        return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")} ${p}`
    }

    const handleHourChange = (newHour: string) => {
        onChange?.(formatTime(parseInt(newHour, 10), minute, period))
    }

    const handleMinuteChange = (newMinute: string) => {
        onChange?.(formatTime(hour12, parseInt(newMinute, 10), period))
    }

    const handlePeriodChange = (newPeriod: string) => {
        onChange?.(formatTime(hour12, minute, newPeriod))
    }

    const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, "0"))
    const minutes = ["00", "15", "30", "45"] // Intervalos de 15 min para simplificar

    return (
        <div className={cn("flex items-center gap-1", className)}>
            <Select value={hour12.toString().padStart(2, "0")} onValueChange={handleHourChange}>
                <SelectTrigger className="w-17.5 h-12 md:h-10">
                    <SelectValue placeholder="HH" />
                </SelectTrigger>
                <SelectContent>
                    {hours.map((h) => (
                        <SelectItem key={h} value={h}>
                            {h}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <span className="text-muted-foreground font-medium">:</span>

            <Select value={minute.toString().padStart(2, "0")} onValueChange={handleMinuteChange}>
                <SelectTrigger className="w-17.5 h-12 md:h-10">
                    <SelectValue placeholder="mm" />
                </SelectTrigger>
                <SelectContent>
                    {minutes.map((mm) => (
                        <SelectItem key={mm} value={mm}>
                            {mm}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select value={period} onValueChange={handlePeriodChange}>
                <SelectTrigger className="w-18.75 h-12 md:h-10">
                    <SelectValue placeholder="AM/PM" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="AM">AM</SelectItem>
                    <SelectItem value="PM">PM</SelectItem>
                </SelectContent>
            </Select>
        </div>
    )
}
