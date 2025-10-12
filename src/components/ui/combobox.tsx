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

  return (
    // --- INICIO DE LA CORRECCIÓN ---
    // Añadimos la propiedad `modal={true}`.
    // Esto fuerza al Popover a capturar el foco, resolviendo el conflicto
    // de eventos con el Sheet (panel lateral) que lo contiene. Al ser modal,
    // el Popover se convierte en el elemento interactivo principal, permitiendo
    // el scroll y el clic en sus opciones sin que el panel de fondo interfiera.
    <Popover open={open} onOpenChange={setOpen} modal={true}>
    {/* --- FIN DE LA CORRECCIÓN --- */}
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {value
            ? options.find((option) => option.value === value)?.label
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label} // Se busca por la etiqueta visible
                  onSelect={() => {
                    onChange(option.value)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
