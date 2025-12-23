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
    // Ensure we have a valid format before splitting. Support both "HH:mm" and "HH:mm AM/PM"
    const safeValue = value || "12:00 AM"

    // Parse time and period
    let h24 = 12
    let m = 0
    let currentPeriod = "AM"

    if (safeValue.includes(" ")) {
        // Format: "09:00 AM"
        const [time, p] = safeValue.split(" ")
        const [hStr, mStr] = time.split(":")
        let h12 = parseInt(hStr, 10)
        m = parseInt(mStr, 10)
        currentPeriod = p

        h24 = h12
        if (currentPeriod === "PM" && h12 < 12) h24 += 12
        if (currentPeriod === "AM" && h12 === 12) h24 = 0
    } else {
        // Format: "09:00" (24h)
        const [hStr, mStr] = safeValue.split(":")
        h24 = parseInt(hStr, 10)
        m = parseInt(mStr, 10)
        currentPeriod = h24 >= 12 ? "PM" : "AM"
    }

    const hour12 = h24 % 12 || 12
    const hour12Str = hour12.toString().padStart(2, "0")
    const minStr = m.toString().padStart(2, "0")

    const handleHourChange = (newHour12: string) => {
        let h = parseInt(newHour12, 10)
        const formatted = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")} ${currentPeriod}`
        onChange?.(formatted)
    }

    const handleMinuteChange = (newMin: string) => {
        const formatted = `${hour12Str}:${newMin.padStart(2, "0")} ${currentPeriod}`
        onChange?.(formatted)
    }

    const handlePeriodChange = (newPeriod: string) => {
        const formatted = `${hour12Str}:${minStr} ${newPeriod}`
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

            <Select value={currentPeriod} onValueChange={handlePeriodChange}>
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

