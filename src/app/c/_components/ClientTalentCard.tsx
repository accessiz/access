'use client'

import { R2_PUBLIC_URL } from '@/lib/constants'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { ArrowUpRight } from 'lucide-react'
import { SmartCroppedImage } from '@/components/atoms/SmartCroppedImage'

type Props = {
  title: string
  modelId?: string
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
  modelId,
  coverUrl,
  imageHref,
  onImageClick,
  showMobilePeekIcon,
  className,
  children,
}: Props) {
  const image = (
    <div className="relative aspect-3/4 overflow-hidden rounded-md">
      {coverUrl || modelId ? (
        <SmartCroppedImage
          src={coverUrl || `${R2_PUBLIC_URL}/${modelId}/Portada/cover.webp`}
          alt={title}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-muted rounded-md">
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
        'group rounded-lg text-card-foreground overflow-hidden border border-[rgb(var(--separator))] h-full flex flex-col',
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

      <div className="px-3 pb-3 flex-1">
        <div className="space-y-1">
          <div className="text-body sm:text-title font-medium text-foreground leading-tight line-clamp-2 sm:line-clamp-1">{title}</div>
          {children ? <div className="w-full">{children}</div> : null}
        </div>
      </div>
    </div>
  )
}
