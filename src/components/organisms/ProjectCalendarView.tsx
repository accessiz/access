'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
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

// Helper to get status-based styles
const getStatusStyles = (status: Project['status']) => {
    switch (status) {
        case 'draft':
            return "bg-info/10 hover:bg-info/20 border-info/20 text-info"
        case 'sent':
            return "bg-cyan/10 hover:bg-cyan/20 border-cyan/20 text-cyan"
        case 'in-review':
            return "bg-warning/10 hover:bg-warning/20 border-warning/20 text-warning"
        case 'completed':
            return "bg-purple/10 hover:bg-purple/20 border-purple/20 text-purple"
        case 'archived':
            return "bg-indigo/10 hover:bg-indigo/20 border-indigo/20 text-indigo"
        default:
            return "bg-primary/10 hover:bg-primary/20 border-primary/20 text-primary"
    }
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
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={goToPrevWeek}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="min-w-0 flex-1 text-center">
                        <span className="text-body font-medium">Semana del {weekLabel}</span>
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

            {/* Mobile: Day-by-day list */}
            <div className="space-y-2 sm:hidden">
                {weekDays.map((day, i) => {
                    const dateKey = formatDateKey(day)
                    const dayProjects = projectsByDay.get(dateKey) || []
                    const isToday = dateKey === todayKey

                    return (
                        <Card
                            key={`mobile-day-${i}`}
                            className={cn("p-3 bg-sys-bg-secondary border-0")}
                        >
                            <div className="flex items-center justify-between border-b border-purple pb-2 mb-2">
                                <div className={cn(
                                    "text-label font-medium",
                                    isToday ? "text-primary" : "text-muted-foreground"
                                )}>
                                    {DAYS[i]}
                                </div>
                                <div className={cn(
                                    "text-body font-semibold",
                                    isToday ? "text-primary" : "text-foreground"
                                )}>
                                    {day.getDate()} {MONTHS[day.getMonth()]}
                                </div>
                            </div>

                            {dayProjects.length === 0 ? (
                                <div className="py-2 text-center text-body text-muted-foreground">—</div>
                            ) : (
                                <div className="space-y-2">
                                    {dayProjects.map(({ project, startTime }) => {
                                        const statusStyles = getStatusStyles(project.status)
                                        return (
                                            <button
                                                key={project.id}
                                                onClick={() => router.push(`/dashboard/projects/${project.id}`)}
                                                className={cn(
                                                    "w-full text-left p-2 rounded-md transition-colors border",
                                                    statusStyles
                                                )}
                                            >
                                                {startTime && (
                                                    <div className="text-label font-medium opacity-90">
                                                        {startTime}
                                                    </div>
                                                )}
                                                <div className="text-body font-medium text-foreground wrap-break-word">
                                                    {project.project_name}
                                                </div>
                                                {project.client_name && (
                                                    <div className="text-label text-muted-foreground wrap-break-word">
                                                        {project.client_name}
                                                    </div>
                                                )}
                                            </button>
                                        )
                                    })}
                                </div>
                            )}
                        </Card>
                    )
                })}
            </div>

            {/* Desktop+: Calendar Grid */}
            <div className="hidden sm:grid grid-cols-7 gap-2">
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
                                    ? "bg-sys-bg-tertiary border-purple"
                                    : "bg-sys-bg-tertiary border-transparent"
                            )}
                        >
                            <div className={cn(
                                "text-label font-medium",
                                isToday ? "text-purple" : "text-muted-foreground"
                            )}>
                                {DAYS[i]}
                            </div>
                            <div className={cn(
                                "text-display font-bold",
                                isToday ? "text-purple" : "text-foreground"
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


                    return (
                        <Card
                            key={`cell-${i}`}
                            className={cn(
                                "min-h-35 p-2 space-y-2 bg-sys-bg-secondary border-0"
                            )}
                        >
                            {dayProjects.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-muted-foreground text-body">
                                    —
                                </div>
                            ) : (
                                dayProjects.map(({ project, startTime }) => {
                                    const statusStyles = getStatusStyles(project.status)
                                    return (
                                        <button
                                            key={project.id}
                                            onClick={() => router.push(`/dashboard/projects/${project.id}`)}
                                            className={cn(
                                                "w-full text-left p-2 rounded-md transition-colors border",
                                                statusStyles
                                            )}
                                        >
                                            {startTime && (
                                                <div className="text-label font-medium opacity-90">
                                                    {startTime}
                                                </div>
                                            )}
                                            <div className="text-body font-medium text-foreground truncate">
                                                {project.project_name}
                                            </div>
                                            {project.client_name && (
                                                <div className="text-label text-muted-foreground truncate">
                                                    {project.client_name}
                                                </div>
                                            )}
                                        </button>
                                    )
                                })
                            )}
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}
