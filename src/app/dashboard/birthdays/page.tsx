import { Metadata } from 'next'
import { BirthdaysClientPage } from './birthdays-client-page'

export const metadata: Metadata = {
    title: 'Cumpleaños | Dashboard',
    description: 'Gestión de cumpleaños del talento',
}

export default function BirthdaysPage() {
    return <BirthdaysClientPage />
}
