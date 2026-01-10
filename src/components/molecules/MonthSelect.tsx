'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const GUATEMALA_TIME_ZONE = 'America/Guatemala'

export type MonthValue = 'all' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12'

const MONTHS: Array<{ label: string; value: Exclude<MonthValue, 'all'> }> = [
  { label: 'Enero', value: '1' },
  { label: 'Febrero', value: '2' },
  { label: 'Marzo', value: '3' },
  { label: 'Abril', value: '4' },
  { label: 'Mayo', value: '5' },
  { label: 'Junio', value: '6' },
  { label: 'Julio', value: '7' },
  { label: 'Agosto', value: '8' },
  { label: 'Septiembre', value: '9' },
  { label: 'Octubre', value: '10' },
  { label: 'Noviembre', value: '11' },
  { label: 'Diciembre', value: '12' },
]

function getCurrentMonthInGuatemala(): Exclude<MonthValue, 'all'> {
  const month = new Intl.DateTimeFormat('en-US', {
    timeZone: GUATEMALA_TIME_ZONE,
    month: 'numeric',
  }).format(new Date())

  // month is '1'..'12' in this locale; cast is safe.
  return month as Exclude<MonthValue, 'all'>
}

export interface MonthSelectProps {
  value?: MonthValue
  defaultValue?: MonthValue
  onValueChange: (value: MonthValue) => void

  includeAll?: boolean
  allLabel?: string
  placeholder?: string

  triggerClassName?: string
  contentClassName?: string

  disabled?: boolean

  /**
   * When `value`/`defaultValue` are not provided, preselects the current month
   * in Guatemala (GMT-6) instead of leaving it empty.
   */
  defaultToCurrentMonth?: boolean
}

export function MonthSelect({
  value,
  defaultValue,
  onValueChange,
  includeAll = true,
  allLabel = 'Todos',
  placeholder = 'Mes',
  triggerClassName,
  contentClassName,
  disabled,
  defaultToCurrentMonth = true,
}: MonthSelectProps) {
  const computedDefaultValue: MonthValue | undefined =
    defaultValue ?? (defaultToCurrentMonth ? getCurrentMonthInGuatemala() : undefined)

  const rootProps =
    value === undefined
      ? { defaultValue: computedDefaultValue }
      : { value }

  return (
    <Select
      {...rootProps}
      onValueChange={(v) => onValueChange(v as MonthValue)}
      disabled={disabled}
    >
      <SelectTrigger className={triggerClassName}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className={contentClassName}>
        {includeAll && <SelectItem value="all">{allLabel}</SelectItem>}
        {MONTHS.map((month) => (
          <SelectItem key={month.value} value={month.value}>
            {month.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
