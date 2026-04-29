import { Metadata } from 'next'
import { connection } from 'next/server'
import { BirthdaysClientPage } from './birthdays-client-page'
import { getBirthdaysByMonth, getTodayBirthdays } from '@/lib/actions/birthdays'

export const metadata: Metadata = {
    title: 'Cumpleaños | Dashboard',
    description: 'Gestión de cumpleaños del talento',
}

async function getCurrentMonthInGuatemala(): Promise<number> {
    await connection()
    const monthStr = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Guatemala',
        month: 'numeric',
    }).format(new Date())

    const month = Number(monthStr)
    return month >= 1 && month <= 12 ? month : new Date().getMonth() + 1
}

export default async function BirthdaysPage() {
    const initialMonth = await getCurrentMonthInGuatemala()
    const [monthResult, todayResult] = await Promise.all([
        getBirthdaysByMonth(initialMonth),
        getTodayBirthdays(),
    ])

    return (
        <BirthdaysClientPage
            initialMonth={initialMonth}
            initialBirthdays={monthResult.success ? monthResult.data ?? [] : []}
            initialTodayBirthdays={todayResult.success ? todayResult.data ?? [] : []}
        />
    )
}
