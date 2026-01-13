"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

// Meses en español
const MONTHS = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
]

// Días de la semana en español (abreviados)
const WEEKDAYS = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"]

interface NyxaCalendarProps {
    selected?: Date | null
    onSelect?: (date: Date) => void
    minYear?: number
    maxYear?: number
    className?: string
    disabled?: boolean
}

export function NyxaCalendar({
    selected,
    onSelect,
    minYear = 2020,
    maxYear = 2030,
    className,
    disabled = false,
}: NyxaCalendarProps) {
    // Estado del calendario (mes/año visualizado)
    const [viewMonth, setViewMonth] = React.useState(() =>
        selected ? selected.getMonth() : new Date().getMonth()
    )
    const [viewYear, setViewYear] = React.useState(() =>
        selected ? selected.getFullYear() : new Date().getFullYear()
    )

    // Generar años disponibles
    const years = React.useMemo(() => {
        const arr = []
        for (let y = minYear; y <= maxYear; y++) {
            arr.push(y)
        }
        return arr
    }, [minYear, maxYear])

    // Calcular días del mes
    const daysInMonth = React.useMemo(() => {
        return new Date(viewYear, viewMonth + 1, 0).getDate()
    }, [viewMonth, viewYear])

    // Primer día de la semana (0=Domingo, ajustar para Lunes=0)
    const firstDayOfMonth = React.useMemo(() => {
        const day = new Date(viewYear, viewMonth, 1).getDay()
        // Convertir: Domingo(0) → 6, Lunes(1) → 0, etc.
        return day === 0 ? 6 : day - 1
    }, [viewMonth, viewYear])

    // Días del mes anterior para llenar primera semana
    const prevMonthDays = React.useMemo(() => {
        const prevMonth = viewMonth === 0 ? 11 : viewMonth - 1
        const prevYear = viewMonth === 0 ? viewYear - 1 : viewYear
        return new Date(prevYear, prevMonth + 1, 0).getDate()
    }, [viewMonth, viewYear])

    // Navegar mes anterior
    const goToPrevMonth = () => {
        if (viewMonth === 0) {
            setViewMonth(11)
            setViewYear(y => y - 1)
        } else {
            setViewMonth(m => m - 1)
        }
    }

    // Navegar mes siguiente
    const goToNextMonth = () => {
        if (viewMonth === 11) {
            setViewMonth(0)
            setViewYear(y => y + 1)
        } else {
            setViewMonth(m => m + 1)
        }
    }

    // Seleccionar un día
    const handleDayClick = (day: number) => {
        if (disabled) return
        const date = new Date(viewYear, viewMonth, day)
        onSelect?.(date)
    }

    // Verificar si un día es el seleccionado
    const isSelected = (day: number) => {
        if (!selected) return false
        return (
            selected.getDate() === day &&
            selected.getMonth() === viewMonth &&
            selected.getFullYear() === viewYear
        )
    }

    // Verificar si es hoy
    const isToday = (day: number) => {
        const today = new Date()
        return (
            today.getDate() === day &&
            today.getMonth() === viewMonth &&
            today.getFullYear() === viewYear
        )
    }

    // Generar grid de días
    const renderDays = () => {
        const cells = []

        // Días del mes anterior (grises)
        for (let i = firstDayOfMonth - 1; i >= 0; i--) {
            const day = prevMonthDays - i
            cells.push(
                <div
                    key={`prev-${day}`}
                    className="h-9 w-9 flex items-center justify-center text-body text-muted-foreground/40"
                >
                    {day}
                </div>
            )
        }

        // Días del mes actual
        for (let day = 1; day <= daysInMonth; day++) {
            const selected = isSelected(day)
            const today = isToday(day)

            cells.push(
                <button
                    key={`day-${day}`}
                    type="button"
                    disabled={disabled}
                    onClick={() => handleDayClick(day)}
                    className={cn(
                        "h-9 w-9 rounded-md text-body font-normal transition-colors",
                        "hover:bg-hover-overlay focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                        selected && "bg-[rgb(var(--purple))] text-primary hover:bg-[rgb(var(--purple))]",
                        !selected && today && "border border-separator bg-transparent text-foreground",
                        !selected && !today && "text-foreground"
                    )}
                >
                    {day}
                </button>
            )
        }

        // Días del mes siguiente (grises) para completar grid
        const totalCells = cells.length
        const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7)
        for (let i = 1; i <= remainingCells; i++) {
            cells.push(
                <div
                    key={`next-${i}`}
                    className="h-9 w-9 flex items-center justify-center text-body text-muted-foreground/40"
                >
                    {i}
                </div>
            )
        }

        return cells
    }

    return (
        <div className={cn("p-3 bg-popover rounded-lg border border-border", className)}>
            {/* Header: Navegación + Selects */}
            <div className="flex items-center justify-between mb-4">
                {/* Botón anterior */}
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={goToPrevMonth}
                    disabled={disabled}
                    aria-label="Mes anterior"
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>

                {/* Selectores de Mes y Año */}
                <div className="flex items-center gap-2">
                    {/* Mes */}
                    <Select
                        value={String(viewMonth)}
                        onValueChange={(v) => setViewMonth(Number(v))}
                        disabled={disabled}
                    >
                        <SelectTrigger className="h-8 w-auto min-w-[100px] border-0 bg-transparent font-medium text-body hover:bg-hover-overlay">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {MONTHS.map((month, idx) => (
                                <SelectItem key={month} value={String(idx)}>
                                    {month}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Año */}
                    <Select
                        value={String(viewYear)}
                        onValueChange={(v) => setViewYear(Number(v))}
                        disabled={disabled}
                    >
                        <SelectTrigger className="h-8 w-auto min-w-[70px] border-0 bg-transparent font-medium text-body hover:bg-hover-overlay">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {years.map((year) => (
                                <SelectItem key={year} value={String(year)}>
                                    {year}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Botón siguiente */}
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={goToNextMonth}
                    disabled={disabled}
                    aria-label="Mes siguiente"
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>

            {/* Días de la semana */}
            <div className="grid grid-cols-7 gap-1 mb-2">
                {WEEKDAYS.map((day) => (
                    <div
                        key={day}
                        className="h-8 flex items-center justify-center text-label font-medium text-muted-foreground"
                    >
                        {day}
                    </div>
                ))}
            </div>

            {/* Grid de días */}
            <div className="grid grid-cols-7 gap-1">
                {renderDays()}
            </div>
        </div>
    )
}

NyxaCalendar.displayName = "NyxaCalendar"
