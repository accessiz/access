'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Project } from '@/lib/types'

interface ProjectCalendarViewProps {
    projects: Project[]
}

const DAYS = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM']
const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

// Get Monday of the week containing the given date
function getMonday(date: Date): Date {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(d.setDate(diff))
}

// Format date as YYYY-MM-DD
function formatDateKey(date: Date): string {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
}

export function ProjectCalendarView({ projects }: ProjectCalendarViewProps) {
    const router = useRouter()
    const [weekStart, setWeekStart] = useState(() => getMonday(new Date()))

    // Navigate weeks
    const goToPrevWeek = () => {
        const newDate = new Date(weekStart)
        newDate.setDate(newDate.getDate() - 7)
        setWeekStart(newDate)
    }

    const goToNextWeek = () => {
        const newDate = new Date(weekStart)
        newDate.setDate(newDate.getDate() + 7)
        setWeekStart(newDate)
    }

    const goToCurrentWeek = () => {
        setWeekStart(getMonday(new Date()))
    }

    // Generate week days
    const weekDays = useMemo(() => {
        const days: Date[] = []
        for (let i = 0; i < 7; i++) {
            const day = new Date(weekStart)
            day.setDate(day.getDate() + i)
            days.push(day)
        }
        return days
    }, [weekStart])

    // Map projects to days
    const projectsByDay = useMemo(() => {
        const map = new Map<string, { project: Project; startTime: string }[]>()

        projects.forEach(project => {
            if (!project.schedule) return

            project.schedule.forEach(slot => {
                if (!slot.date) return
                const dateKey = slot.date // Already YYYY-MM-DD format
                const existing = map.get(dateKey) || []
                // Avoid duplicates
                if (!existing.find(e => e.project.id === project.id)) {
                    existing.push({ project, startTime: slot.startTime || '' })
                }
                map.set(dateKey, existing)
            })
        })

        return map
    }, [projects])

    // Week range label
    const weekLabel = useMemo(() => {
        const endDate = new Date(weekStart)
        endDate.setDate(endDate.getDate() + 6)

        const startDay = weekStart.getDate()
        const endDay = endDate.getDate()
        const startMonth = MONTHS[weekStart.getMonth()]
        const endMonth = MONTHS[endDate.getMonth()]
        const year = weekStart.getFullYear()

        if (weekStart.getMonth() === endDate.getMonth()) {
            return `${startDay} - ${endDay} ${startMonth} ${year}`
        }
        return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${year}`
    }, [weekStart])

    // Check if current week
    const isCurrentWeek = useMemo(() => {
        const today = new Date()
        const currentMonday = getMonday(today)
        return formatDateKey(currentMonday) === formatDateKey(weekStart)
    }, [weekStart])

    // Today's date key
    const todayKey = formatDateKey(new Date())

    return (
        <div className="space-y-4">
            {/* Navigation */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={goToPrevWeek}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="min-w-[200px] text-center">
                        <span className="text-base font-medium">Semana del {weekLabel}</span>
                    </div>
                    <Button variant="outline" size="icon" onClick={goToNextWeek}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>

                {!isCurrentWeek && (
                    <Button variant="ghost" size="sm" onClick={goToCurrentWeek}>
                        Ir a esta semana
                    </Button>
                )}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
                {/* Day Headers */}
                {weekDays.map((day, i) => {
                    const dateKey = formatDateKey(day)
                    const isToday = dateKey === todayKey

                    return (
                        <div
                            key={i}
                            className={cn(
                                "text-center p-2 rounded-t-lg border-b-2",
                                isToday
                                    ? "bg-primary/10 border-primary"
                                    : "bg-muted/30 border-transparent"
                            )}
                        >
                            <div className={cn(
                                "text-xs font-medium",
                                isToday ? "text-primary" : "text-muted-foreground"
                            )}>
                                {DAYS[i]}
                            </div>
                            <div className={cn(
                                "text-2xl font-bold",
                                isToday ? "text-primary" : "text-foreground"
                            )}>
                                {day.getDate()}
                            </div>
                        </div>
                    )
                })}

                {/* Day Cells */}
                {weekDays.map((day, i) => {
                    const dateKey = formatDateKey(day)
                    const dayProjects = projectsByDay.get(dateKey) || []
                    const isToday = dateKey === todayKey

                    return (
                        <Card
                            key={`cell-${i}`}
                            className={cn(
                                "min-h-[140px] p-2 space-y-2",
                                isToday && "ring-1 ring-primary/50"
                            )}
                        >
                            {dayProjects.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                                    —
                                </div>
                            ) : (
                                dayProjects.map(({ project, startTime }) => (
                                    <button
                                        key={project.id}
                                        onClick={() => router.push(`/dashboard/projects/${project.id}`)}
                                        className="w-full text-left p-2 rounded-md bg-primary/10 hover:bg-primary/20 transition-colors border border-primary/20"
                                    >
                                        {startTime && (
                                            <div className="text-xs text-primary font-medium">
                                                {startTime}
                                            </div>
                                        )}
                                        <div className="text-sm font-medium text-foreground truncate">
                                            {project.project_name}
                                        </div>
                                        {project.client_name && (
                                            <div className="text-xs text-muted-foreground truncate">
                                                {project.client_name}
                                            </div>
                                        )}
                                    </button>
                                ))
                            )}
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}
