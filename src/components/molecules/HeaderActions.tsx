'use client'

import * as React from 'react'
import { ThemeToggle } from '@/components/molecules/ThemeToggle'

export function HeaderActions() {
    return (
        <div className="flex items-center gap-1">
            <ThemeToggle />
        </div>
    )
}
