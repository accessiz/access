'use client'

import * as React from 'react'
import { Badge } from '@/components/ui/badge'

type BadgeVariant = React.ComponentProps<typeof Badge>['variant']

type ProjectStatusBadgeProps = {
  status?: string | null
  size?: React.ComponentProps<typeof Badge>['size']
  className?: string
}

const STATUS_MAP: Record<
  string,
  {
    label: string
    variant: BadgeVariant
  }
> = {
  // Canonical statuses
  draft: { label: 'Borrador', variant: 'warning' },
  sent: { label: 'Enviado', variant: 'info' },
  'in-review': { label: 'En Revisión', variant: 'review' },
  completed: { label: 'Completado', variant: 'success' },
  archived: { label: 'Archivado', variant: 'neutral' },

  // Legacy/alternate statuses used in some views
  planning: { label: 'Planificando', variant: 'warning' },
  active: { label: 'Activo', variant: 'info' },
  inactive: { label: 'Inactivo', variant: 'warning' },
  in_progress: { label: 'En progreso', variant: 'info' },
  cancelled: { label: 'Cancelado', variant: 'neutral' },

  // Client selection statuses (used in Model views)
  pending: { label: 'En revisión', variant: 'warning' },
  approved: { label: 'Aprobado', variant: 'success' },
  rejected: { label: 'Rechazado', variant: 'danger' },
}

export function ProjectStatusBadge({ status, size = 'medium', className }: ProjectStatusBadgeProps) {
  const normalized = (status || '').trim()
  const config = STATUS_MAP[normalized] || { label: normalized ? normalized.replace(/[-_]/g, ' ') : '—', variant: 'neutral' as BadgeVariant }

  return (
    <Badge variant={config.variant} size={size} className={className}>
      {config.label}
    </Badge>
  )
}
