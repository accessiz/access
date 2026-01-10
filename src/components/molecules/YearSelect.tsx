'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const GUATEMALA_TIME_ZONE = 'America/Guatemala'

type YearString = `${number}`
export type YearValue = 'all' | YearString

function getCurrentYearInGuatemala(): number {
  const yearStr = new Intl.DateTimeFormat('en-US', {
    timeZone: GUATEMALA_TIME_ZONE,
    year: 'numeric',
  }).format(new Date())

  const year = Number(yearStr)
  return Number.isFinite(year) ? year : new Date().getFullYear()
}

export interface YearSelectProps {
  years: number[]

  value?: YearValue
  defaultValue?: YearValue
  onValueChange: (value: YearValue) => void

  includeAll?: boolean
  allLabel?: string
  placeholder?: string

  triggerClassName?: string
  contentClassName?: string

  disabled?: boolean

  /**
   * When `value`/`defaultValue` are not provided, preselects the current year
   * in Guatemala (GMT-6) if it exists in `years`; otherwise selects the newest year.
   */
  defaultToCurrentYear?: boolean
}

export function YearSelect({
  years,
  value,
  defaultValue,
  onValueChange,
  includeAll = true,
  allLabel = 'Todos',
  placeholder = 'Año',
  triggerClassName,
  contentClassName,
  disabled,
  defaultToCurrentYear = true,
}: YearSelectProps) {
  const normalizedYears = [...new Set(years.filter((y) => Number.isFinite(y)))].sort((a, b) => b - a)

  const computedDefaultValue: YearValue | undefined = (() => {
    if (defaultValue) return defaultValue
    if (!defaultToCurrentYear) return undefined

    const currentYear = getCurrentYearInGuatemala()
    if (normalizedYears.includes(currentYear)) return String(currentYear) as YearString

    const newest = normalizedYears[0]
    return newest ? (String(newest) as YearString) : undefined
  })()

  const rootProps =
    value === undefined
      ? { defaultValue: computedDefaultValue }
      : { value }

  return (
    <Select
      {...rootProps}
      onValueChange={(v) => onValueChange(v as YearValue)}
      disabled={disabled}
    >
      <SelectTrigger className={triggerClassName}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className={contentClassName}>
        {includeAll && <SelectItem value="all">{allLabel}</SelectItem>}
        {normalizedYears.map((y) => (
          <SelectItem key={y} value={String(y)}>
            {y}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
