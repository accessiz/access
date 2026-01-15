"use client"
import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface ComboboxProps {
  options: { label: string; value: string }[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  searchPlaceholder = "Search...",
  emptyMessage = "No results found"
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [highlightedValue, setHighlightedValue] = React.useState<string | null>(null)

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-12 md:h-10 w-full justify-between font-normal text-body"
        >
          {value
            ? options.find((option) => option.value === value)?.label
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 border-0 bg-transparent">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isHighlighted = highlightedValue === option.value
                const isSelected = value === option.value

                return (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    className={cn(
                      "cursor-pointer",
                      // ✅ FIX: Permite mouse events
                      "[&_[data-disabled]]:pointer-events-auto",
                      // ✅ Hover visual como flecha ↓
                      isHighlighted && !isSelected && "bg-purple text-white"
                    )}
                    // ✅ MOUSE HOVER: Selección visual
                    onMouseEnter={() => setHighlightedValue(option.value)}
                    onMouseLeave={() => setHighlightedValue(null)}
                    // ✅ MOUSE CLICK: Como Enter
                    onClick={(e) => {
                      e.preventDefault()
                      onChange(option.value)
                      setOpen(false)
                    }}
                    // ✅ TECLADO: onSelect nativo
                    onSelect={() => {
                      onChange(option.value)
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.label}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}