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
  // === PROJECT WORKFLOW STATES ===
  // Following DESIGN_SYSTEM.md Section 1.3
  draft: { label: 'Borrador', variant: 'info' },           // Blue - neutral, internal
  sent: { label: 'Enviado', variant: 'cyan' },             // Cyan - in transit
  'in-review': { label: 'En Revisión', variant: 'warning' }, // Yellow - attention
  approved: { label: 'Aprobado', variant: 'purple' },      // Purple - TOP, validated
  completed: { label: 'Completado', variant: 'purple' },   // Purple - TOP, final
  archived: { label: 'Archivado', variant: 'indigo' },     // Indigo - historical

  // === CLIENT SELECTION/REVIEW STATES ===
  pending: { label: 'En revisión', variant: 'warning' },   // Yellow - awaiting
  rejected: { label: 'Rechazado', variant: 'danger' },     // Red - not approved

  // === LEGACY/ALTERNATE STATUSES ===
  planning: { label: 'Planificando', variant: 'info' },    // Blue - internal
  active: { label: 'Activo', variant: 'cyan' },            // Cyan - in progress
  inactive: { label: 'Inactivo', variant: 'warning' },     // Yellow - needs attention
  in_progress: { label: 'En progreso', variant: 'cyan' },  // Cyan - transit
  cancelled: { label: 'Cancelado', variant: 'danger' },    // Red - stopped

  // === FINANCE STATES ===
  paid: { label: 'Pagado', variant: 'success' },           // Green - money received
  invoiced: { label: 'Facturado', variant: 'info' },       // Blue - document
  finished: { label: 'Finalizado', variant: 'purple' },    // Purple - final

  // === AVAILABILITY STATES ===
  busy: { label: 'Ocupado', variant: 'danger' },           // Red - blocked
  free: { label: 'Libre', variant: 'success' },            // Green - available
  error: { label: 'Error', variant: 'danger' },            // Red - problem
  waiting: { label: 'En espera', variant: 'warning' },     // Yellow - pending
  paused: { label: 'En pausa', variant: 'orange' },        // Orange - warning/hold
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
