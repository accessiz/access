"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
    className,
    classNames,
    showOutsideDays = true,
    captionLayout = "dropdown",
    locale,
    ...props
}: CalendarProps) {
    return (
        <DayPicker
            showOutsideDays={showOutsideDays}
            captionLayout={captionLayout}
            locale={locale}
            className={cn("p-3", className)}
            classNames={{
                /* ================= MONTH ================= */
                months: "flex flex-col sm:flex-row gap-4",
                month: "space-y-4",

                /* ================= CAPTION ================= */
                // Grid para centrar dropdowns + espacio inferior para que no choque con el grid de días
                month_caption:
                    "relative grid grid-cols-[1fr_auto_1fr] items-center pt-1 pb-4",

                caption_label: "hidden",

                /* ================= NAV ================= */
                // Nav flota arriba y empuja botones a extremos
                nav:
                    "absolute inset-x-0 top-1 z-20 flex items-center justify-between px-2 pointer-events-none",

                button_previous: cn(
                    buttonVariants({ variant: "outline" }),
                    "pointer-events-auto h-8 w-8 bg-transparent p-0 opacity-60 hover:opacity-100"
                ),
                button_next: cn(
                    buttonVariants({ variant: "outline" }),
                    "pointer-events-auto h-8 w-8 bg-transparent p-0 opacity-60 hover:opacity-100"
                ),

                /* ================= DROPDOWNS ================= */
                // Dropdowns centrados SIEMPRE
                dropdowns: "flex items-center justify-center gap-2 col-start-2",

                months_dropdown:
                    "bg-transparent p-1 outline-none text-body font-medium",
                years_dropdown:
                    "bg-transparent p-1 outline-none text-body font-medium",

                /* ================= TABLE ================= */
                month_grid: "w-full border-collapse",
                weekdays: "flex",
                weekday:
                    "w-9 text-center text-label font-normal text-muted-foreground",
                weeks: "space-y-1",
                week: "flex w-full",

                /* ================= DAYS ================= */
                day: cn(
                    "relative h-9 w-9 p-0 text-center text-body focus-within:z-20",
                    "[&:has([aria-selected].day-range-start)]:rounded-l-md",
                    "[&:has([aria-selected].day-range-end)]:rounded-r-md",
                    "[&:has([aria-selected])]:bg-accent",
                    "[&:has([aria-selected].day-outside)]:bg-accent/50"
                ),

                day_button: cn(
                    buttonVariants({ variant: "ghost" }),
                    "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
                ),

                /* ================= MODIFIERS ================= */
                range_start: "day-range-start",
                range_end: "day-range-end",
                range_middle:
                    "aria-selected:bg-accent aria-selected:text-accent-foreground",

                selected:
                    "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",

                today: "bg-accent text-accent-foreground",
                outside:
                    "day-outside text-muted-foreground aria-selected:bg-accent/50",
                disabled: "opacity-50 text-muted-foreground",
                hidden: "invisible",

                ...classNames,
            }}
            components={{
                Chevron: ({ orientation }) => {
                    const Icon = orientation === "left" ? ChevronLeft : ChevronRight
                    return <Icon className="h-4 w-4" />
                },
            }}
            {...props}
        />
    )
}

Calendar.displayName = "Calendar"

export { Calendar }
