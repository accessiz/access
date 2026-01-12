'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { ArrowUpRight } from 'lucide-react'

type Props = {
  title: string
  heightCm?: number | null
  coverUrl?: string | null
  imageHref?: string
  onImageClick?: () => void
  showMobilePeekIcon?: boolean
  className?: string
  children?: React.ReactNode
}

export function ClientTalentCard({
  title,
  coverUrl,
  imageHref,
  onImageClick,
  showMobilePeekIcon,
  className,
  children,
}: Props) {
  const image = (
    <div className="relative aspect-3/4 overflow-hidden rounded-md bg-muted">
      {coverUrl ? (
        <img
          src={coverUrl}
          alt={title}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          decoding="async"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <span className="text-body text-muted-foreground">Sin foto</span>
        </div>
      )}

      {showMobilePeekIcon ? (
        <div
          className={cn(
            'pointer-events-none absolute right-2 top-2 inline-flex items-center justify-center',
            'text-foreground/70',
            'md:hidden'
          )}
          aria-hidden="true"
        >
          <ArrowUpRight className="h-4 w-4" />
        </div>
      ) : null}
    </div>
  )

  return (
    <div
      className={cn(
        'group rounded-lg bg-card text-card-foreground border border-border overflow-hidden',
        className
      )}
    >
      <div className="p-2">
        {imageHref ? (
          <Link href={imageHref} className="block" onClick={onImageClick}>
            {image}
          </Link>
        ) : (
          image
        )}
      </div>

      <div className="px-3 pb-3">
        <div className="space-y-1">
          <div className="text-body sm:text-title font-medium text-foreground leading-tight line-clamp-2 sm:line-clamp-1">{title}</div>
          {children ? <div className="w-full">{children}</div> : null}
        </div>
      </div>
    </div>
  )
}
