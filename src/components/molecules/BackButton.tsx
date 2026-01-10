'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'

import { Button, type ButtonProps } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type BackButtonProps = Omit<ButtonProps, 'asChild' | 'children' | 'onClick'> & {
  href?: string
  /** Accessible label (also used as tooltip when iconOnly). */
  label?: string
  /** Visible text shown when iconOnly is false. */
  text?: string
  /** Optional custom icon. Defaults to ChevronLeft. */
  icon?: React.ReactNode
  /**
   * When true, renders as an icon-only button (default).
   * When false, renders icon + text.
   */
  iconOnly?: boolean
  /** Optional click handler; defaults to router.back() when no href. */
  onClick?: () => void
}

export function BackButton({
  href,
  label,
  text,
  icon,
  iconOnly = true,
  variant = 'outline',
  size,
  className,
  disabled,
  onClick,
  ...rest
}: BackButtonProps) {
  const router = useRouter()

  const resolvedLabel = label ?? text ?? 'Regresar'
  const iconNode =
    icon ?? (
      <ChevronLeft
        className={cn(
          iconOnly ? 'h-4 w-4' : 'mr-2 h-4 w-4'
        )}
      />
    )

  if (href) {
    return (
      <Button
        asChild
        variant={variant}
        size={size ?? (iconOnly ? 'icon' : 'default')}
        className={cn(iconOnly && 'shrink-0', className)}
        disabled={disabled}
        {...rest}
      >
        <Link
          href={href}
          aria-label={resolvedLabel}
          title={iconOnly ? resolvedLabel : undefined}
        >
          {iconNode}
          {iconOnly ? <span className="sr-only">{resolvedLabel}</span> : text}
        </Link>
      </Button>
    )
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size ?? (iconOnly ? 'icon' : 'default')}
      className={cn(iconOnly && 'shrink-0', className)}
      aria-label={resolvedLabel}
      title={iconOnly ? resolvedLabel : undefined}
      disabled={disabled}
      onClick={() => (onClick ? onClick() : router.back())}
      {...rest}
    >
      {iconNode}
      {iconOnly ? <span className="sr-only">{resolvedLabel}</span> : text}
    </Button>
  )
}
