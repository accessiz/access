'use client'

import { useState, useEffect } from 'react'
import { Cake, ChevronLeft, ChevronRight, PartyPopper, User, Download, Instagram, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { getBirthdaysByMonth, getTodayBirthdays, BirthdayModel } from '@/lib/actions/birthdays'
import Link from 'next/link'

const MONTHS = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

// Helper para generar URL de imagen
const mediaUrl = (path: string | null): string | null => {
    if (!path) return null
    return `/api/media/${path}`
}

// Helper para parsear fecha sin problemas de timezone
// birthDate viene como "YYYY-MM-DD"
const parseBirthDate = (birthDate: string): { year: number; month: number; day: number } => {
    const [year, month, day] = birthDate.split('-').map(Number)
    return { year, month, day }
}

// Helper para calcular edad
const calculateAge = (birthDate: string): number => {
    const { year, month, day } = parseBirthDate(birthDate)
    const today = new Date()
    let age = today.getFullYear() - year
    const currentMonth = today.getMonth() + 1
    const currentDay = today.getDate()

    if (currentMonth < month || (currentMonth === month && currentDay < day)) {
        age--
    }
    return age
}

// Helper para formatear fecha
const formatBirthday = (birthDate: string): string => {
    const { month, day } = parseBirthDate(birthDate)
    return `${day} de ${MONTHS[month - 1]}`
}

// Función para descargar imagen
const downloadCoverImage = async (coverPath: string | null, name: string) => {
    if (!coverPath) return

    try {
        const response = await fetch(mediaUrl(coverPath)!)
        const blob = await response.blob()

        // Crear URL del blob
        const url = URL.createObjectURL(blob)

        // Crear link de descarga
        const link = document.createElement('a')
        link.href = url
        link.download = `${name.replace(/[^a-zA-Z0-9]/g, '_')}_cumpleanos.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        // Limpiar URL
        setTimeout(() => URL.revokeObjectURL(url), 100)
    } catch (error) {
        console.error('Error downloading image:', error)
    }
}

interface BirthdayCardProps {
    model: BirthdayModel
    isToday?: boolean
    showDownload?: boolean
}

function BirthdayCard({ model, isToday, showDownload }: BirthdayCardProps) {
    const age = calculateAge(model.birth_date)
    const name = model.alias || model.full_name || 'Sin nombre'

    const copyInstagram = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (!model.instagram) return

        try {
            await navigator.clipboard.writeText(model.instagram)
        } catch (err) {
            console.error('Error copying to clipboard:', err)
        }
    }

    return (
        <div className={`flex items-center gap-4 p-4 rounded-lg transition-colors ${isToday ? 'bg-primary/10 border border-primary/20' : 'bg-card border'}`}>
            <Link href={`/dashboard/models/${model.id}`} className="flex items-center gap-4 flex-1 min-w-0 hover:opacity-80 transition-opacity">
                <Avatar className="h-12 w-12 shrink-0">
                    <AvatarImage src={mediaUrl(model.cover_path) || undefined} alt={name} />
                    <AvatarFallback>
                        <User className="h-5 w-5" />
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{name}</p>
                    <p className="text-sm text-muted-foreground">
                        {formatBirthday(model.birth_date)} • Cumple {age + 1} años
                    </p>
                </div>
            </Link>

            <div className="flex items-center gap-2 shrink-0">
                {model.instagram && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 gap-1.5 text-muted-foreground hover:text-foreground"
                        onClick={copyInstagram}
                        title="Copiar Instagram"
                    >
                        <span className="text-xs truncate max-w-[80px]">@{model.instagram.replace('@', '')}</span>
                        <Copy className="h-3 w-3" />
                    </Button>
                )}
                {isToday && (
                    <Badge variant="secondary" className="gap-1 bg-primary/20 text-primary border-0">
                        <PartyPopper className="h-3 w-3" />
                        ¡Hoy!
                    </Badge>
                )}
                {showDownload && model.cover_path && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                            e.preventDefault()
                            downloadCoverImage(model.cover_path, name)
                        }}
                        title="Descargar foto"
                    >
                        <Download className="h-4 w-4" />
                    </Button>
                )}
            </div>
        </div>
    )
}

export function BirthdaysClientPage() {
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1)
    const [birthdays, setBirthdays] = useState<BirthdayModel[]>([])
    const [todayBirthdays, setTodayBirthdays] = useState<BirthdayModel[]>([])
    const [loading, setLoading] = useState(true)

    // Cargar cumpleaños de hoy y del mes actual
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            const [monthResult, todayResult] = await Promise.all([
                getBirthdaysByMonth(currentMonth),
                getTodayBirthdays()
            ])

            if (monthResult.success && monthResult.data) {
                setBirthdays(monthResult.data)
            }
            if (todayResult.success && todayResult.data) {
                setTodayBirthdays(todayResult.data)
            }
            setLoading(false)
        }

        fetchData()
    }, [currentMonth])

    const handlePrevMonth = () => {
        setCurrentMonth(prev => prev === 1 ? 12 : prev - 1)
    }

    const handleNextMonth = () => {
        setCurrentMonth(prev => prev === 12 ? 1 : prev + 1)
    }

    const goToCurrentMonth = () => {
        setCurrentMonth(new Date().getMonth() + 1)
    }

    // IDs de cumpleañeros de hoy para resaltarlos
    const todayIds = new Set(todayBirthdays.map(b => b.id))
    const isCurrentMonth = currentMonth === new Date().getMonth() + 1

    // Fecha de hoy formateada
    const today = new Date()
    const todayFormatted = `${today.getDate()} de ${MONTHS[today.getMonth()]}`

    return (
        <div className="grid gap-6">
            <header className="flex flex-col items-start gap-4 pb-6 border-b md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-heading-24 font-semibold">Cumpleaños</h1>
                </div>
            </header>

            {/* Sección HOY - Siempre visible */}
            <Card className={todayBirthdays.length > 0 ? 'border-primary/30 bg-gradient-to-r from-primary/10 to-primary/5' : ''}>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Cake className={`h-5 w-5 ${todayBirthdays.length > 0 ? 'text-primary' : 'text-muted-foreground'}`} />
                            <span>Hoy, {todayFormatted}</span>
                        </div>
                        {todayBirthdays.length > 0 && (
                            <Badge className="bg-primary text-primary-foreground">
                                <PartyPopper className="h-3 w-3 mr-1" />
                                {todayBirthdays.length} cumpleaños
                            </Badge>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {todayBirthdays.length > 0 ? (
                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                            {todayBirthdays.map(model => (
                                <BirthdayCard key={model.id} model={model} isToday showDownload />
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center py-8 text-muted-foreground">
                            <p className="text-sm">No hay cumpleaños hoy</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Selector de mes */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={handlePrevMonth}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="min-w-[140px] text-center">
                        <span className="text-lg font-semibold">{MONTHS[currentMonth - 1]}</span>
                    </div>
                    <Button variant="outline" size="icon" onClick={handleNextMonth}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>

                {!isCurrentMonth && (
                    <Button variant="ghost" size="sm" onClick={goToCurrentMonth}>
                        Ir al mes actual
                    </Button>
                )}
            </div>

            {/* Lista de cumpleaños del mes */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Cumpleaños en {MONTHS[currentMonth - 1]}</span>
                        {!loading && (
                            <Badge variant="secondary">{birthdays.length}</Badge>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
                        </div>
                    ) : birthdays.length > 0 ? (
                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                            {birthdays.map(model => (
                                <BirthdayCard
                                    key={model.id}
                                    model={model}
                                    isToday={todayIds.has(model.id)}
                                    showDownload
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                            <Cake className="h-12 w-12 mb-4 opacity-30" />
                            <p className="text-lg font-medium">No hay cumpleaños en {MONTHS[currentMonth - 1]}</p>
                            <p className="text-sm">Navega a otros meses para ver más cumpleaños</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

