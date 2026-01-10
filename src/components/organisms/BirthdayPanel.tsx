'use client'

import { useState, useEffect } from 'react'
import { Cake, PartyPopper, User } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { MonthSelect, type MonthValue } from '@/components/molecules/MonthSelect'
import { getBirthdaysByMonth, getTodayBirthdays, BirthdayModel } from '@/lib/actions/birthdays'
import Link from 'next/link'
import { SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar'

const MONTHS = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

const GUATEMALA_TIME_ZONE = 'America/Guatemala'

function getCurrentMonthInGuatemala(): number {
    const monthStr = new Intl.DateTimeFormat('en-US', {
        timeZone: GUATEMALA_TIME_ZONE,
        month: 'numeric',
    }).format(new Date())

    const month = Number(monthStr)
    return month >= 1 && month <= 12 ? month : new Date().getMonth() + 1
}

// Helper para generar URL de imagen
const mediaUrl = (path: string | null): string | null => {
    if (!path) return null
    return `/api/media/${path}`
}

// Helper para calcular edad
const calculateAge = (birthDate: string): number => {
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--
    }
    return age
}

// Helper para formatear fecha
const formatBirthday = (birthDate: string): string => {
    const [, month, day] = birthDate.split('-')
    return `${parseInt(day, 10)} de ${MONTHS[parseInt(month, 10) - 1]}`
}

interface BirthdayCardProps {
    model: BirthdayModel
    isToday?: boolean
}

function BirthdayCard({ model, isToday }: BirthdayCardProps) {
    const age = calculateAge(model.birth_date)
    const name = model.alias || model.full_name || 'Sin nombre'

    return (
        <Link
            href={`/dashboard/models/${model.id}`}
            className={`flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-muted/50 ${isToday ? 'bg-primary/10 border border-primary/20' : ''}`}
        >
            <Avatar className="h-10 w-10">
                <AvatarImage src={mediaUrl(model.cover_path) || undefined} alt={name} />
                <AvatarFallback>
                    <User className="h-4 w-4" />
                </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
                <p className="text-body font-medium truncate">{name}</p>
                <div className="flex items-center gap-2 text-label text-muted-foreground">
                    {model.instagram && (
                        <span className="truncate">@{model.instagram.replace('@', '')}</span>
                    )}
                    {model.instagram && <span>•</span>}
                    <span>{formatBirthday(model.birth_date)} • {age + 1} años</span>
                </div>
            </div>
            {isToday && (
                <Badge variant="secondary" className="shrink-0 gap-1 bg-primary/20 text-primary border-0">
                    <PartyPopper className="h-3 w-3" />
                    Hoy
                </Badge>
            )}
        </Link>
    )
}

export function BirthdayPanel() {
    const [open, setOpen] = useState(false)
    const [currentMonth, setCurrentMonth] = useState(() => getCurrentMonthInGuatemala())
    const [birthdays, setBirthdays] = useState<BirthdayModel[]>([])
    const [todayBirthdays, setTodayBirthdays] = useState<BirthdayModel[]>([])
    const [loading, setLoading] = useState(false)

    // Cargar cumpleaños de hoy al montar (para el indicador)
    useEffect(() => {
        const fetchTodayBirthdays = async () => {
            const result = await getTodayBirthdays()
            if (result.success && result.data) {
                setTodayBirthdays(result.data)
            }
        }
        fetchTodayBirthdays()
    }, [])

    // Cargar cumpleaños del mes cuando se abre el dialog
    useEffect(() => {
        if (!open) return

        const fetchMonthBirthdays = async () => {
            setLoading(true)
            const result = await getBirthdaysByMonth(currentMonth)
            if (result.success && result.data) {
                setBirthdays(result.data)
            }
            setLoading(false)
        }

        fetchMonthBirthdays()
    }, [open, currentMonth])

    // IDs de cumpleañeros de hoy para resaltarlos
    const todayIds = new Set(todayBirthdays.map(b => b.id))

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Cumpleaños" className="relative">
                        <Cake />
                        <span>Cumpleaños</span>
                        {/* Indicador si hay cumpleaños hoy */}
                        {todayBirthdays.length > 0 && (
                            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary animate-pulse" />
                        )}
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Cake className="h-5 w-5 text-primary" />
                        Cumpleaños
                    </DialogTitle>
                </DialogHeader>

                {/* Cumpleañeros de hoy */}
                {todayBirthdays.length > 0 && (
                    <div className="mb-4 p-4 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
                        <div className="flex items-center gap-2 mb-3">
                            <PartyPopper className="h-4 w-4 text-primary" />
                            <span className="text-body font-semibold text-primary">¡Hoy cumplen años!</span>
                        </div>
                        <div className="space-y-2">
                            {todayBirthdays.map(model => (
                                <BirthdayCard key={model.id} model={model} isToday />
                            ))}
                        </div>
                    </div>
                )}

                {/* Selector de mes */}
                <div className="mb-4">
                    <MonthSelect
                        includeAll={false}
                        value={String(currentMonth) as MonthValue}
                        onValueChange={(v) => {
                            if (v === 'all') return
                            setCurrentMonth(Number(v))
                        }}
                        placeholder="Mes"
                        triggerClassName="w-full"
                    />
                </div>

                {/* Lista de cumpleaños del mes */}
                <ScrollArea className="h-[300px] pr-4">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                        </div>
                    ) : birthdays.length > 0 ? (
                        <div className="space-y-1">
                            {birthdays.map(model => (
                                <BirthdayCard
                                    key={model.id}
                                    model={model}
                                    isToday={todayIds.has(model.id)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                            <Cake className="h-8 w-8 mb-2 opacity-50" />
                            <p className="text-body">No hay cumpleaños en {MONTHS[currentMonth - 1]}</p>
                        </div>
                    )}
                </ScrollArea>

                {/* Contador */}
                {!loading && birthdays.length > 0 && (
                    <p className="text-label text-center text-muted-foreground mt-2">
                        {birthdays.length} cumpleaños en {MONTHS[currentMonth - 1]}
                    </p>
                )}
            </DialogContent>
        </Dialog>
    )
}
