"use client"

import * as React from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface TimePickerProps {
    value?: string // format "HH:mm"
    onChange?: (value: string) => void
    className?: string
}

export function TimePicker({ value, onChange, className }: TimePickerProps) {
    // Ensure we have a valid format before splitting
    const safeValue = value && value.includes(":") ? value : "12:00"
    const [hour24, minuteStr] = safeValue.split(":")
    const h24 = parseInt(hour24, 10)
    const m = parseInt(minuteStr, 10)

    const period = h24 >= 12 ? "PM" : "AM"
    const hour12 = h24 % 12 || 12
    const hour12Str = hour12.toString().padStart(2, "0")
    const minStr = m.toString().padStart(2, "0")

    const handleHourChange = (newHour12: string) => {
        let h = parseInt(newHour12, 10)
        if (period === "PM" && h < 12) h += 12
        if (period === "AM" && h === 12) h = 0
        updateValue(h, m)
    }

    const handleMinuteChange = (newMin: string) => {
        updateValue(h24, parseInt(newMin, 10))
    }

    const handlePeriodChange = (newPeriod: string) => {
        let h = h24
        if (newPeriod === "PM" && h < 12) h += 12
        if (newPeriod === "AM" && h >= 12) h -= 12
        updateValue(h, m)
    }

    const updateValue = (h: number, mm: number) => {
        const formatted = `${h.toString().padStart(2, "0")}:${mm.toString().padStart(2, "0")}`
        onChange?.(formatted)
    }

    const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, "0"))
    const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"))

    return (
        <div className={cn("flex items-center gap-1", className)}>
            <Select value={hour12Str} onValueChange={handleHourChange}>
                <SelectTrigger className="w-[70px] h-9">
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

            <Select value={minStr} onValueChange={handleMinuteChange}>
                <SelectTrigger className="w-[70px] h-9">
                    <SelectValue placeholder="mm" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                    {minutes.map((mm) => (
                        <SelectItem key={mm} value={mm}>
                            {mm}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select value={period} onValueChange={handlePeriodChange}>
                <SelectTrigger className="w-[75px] h-9">
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
