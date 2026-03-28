"use client"

import * as React from "react"
import { ControllerProps, FieldPath, FieldValues, useFormContext } from "react-hook-form"

import { FormField } from "@/components/ui/form"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface FieldContextValue {
  name: FieldPath<FieldValues>
}

const FieldContext = React.createContext<FieldContextValue | null>(null)

const Field = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FieldContext.Provider value={{ name: props.name }}>
      <FormField {...props} />
    </FieldContext.Provider>
  )
}

const useFormField = () => {
  const fieldContext = React.use(FieldContext)
  const itemContext = React.use(FormItemContext)
  const { getFieldState, formState } = useFormContext()

  if (!fieldContext) {
    throw new Error("useFormField should be used within <Field>")
  }

  if (!itemContext) {
    throw new Error("useFormField should be used within <FieldItem>")
  }

  const fieldState = getFieldState(fieldContext.name, formState)

  const { id } = itemContext

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  }
}

interface FormItemContextValue {
  id: string
}

const FormItemContext = React.createContext<FormItemContextValue | null>(null)

function FieldItem({ className, ref, ...props }: React.ComponentPropsWithRef<"div">) {
  const id = React.useId()

  return (
    <FormItemContext.Provider value={{ id }}>
      <div ref={ref} className={cn("space-y-2", className)} {...props} />
    </FormItemContext.Provider>
  )
}
FieldItem.displayName = "FieldItem"

function FieldLabel({
  className,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof Label> & {
  ref?: React.Ref<React.ElementRef<typeof Label>>
}) {
  const { error, formItemId } = useFormField()

  return (
    <Label
      ref={ref}
      className={cn(error && "text-destructive", className)}
      htmlFor={formItemId}
      {...props}
    />
  )
}
FieldLabel.displayName = "FieldLabel"


function FieldDescription({ className, ref, ...props }: React.ComponentPropsWithRef<"p">) {
  const { formDescriptionId } = useFormField()

  return (
    <p
      ref={ref}
      id={formDescriptionId}
      className={cn("text-body text-muted-foreground", className)}
      {...props}
    />
  )
}
FieldDescription.displayName = "FieldDescription"

function FieldMessage({ className, children, ref, ...props }: React.ComponentPropsWithRef<"p">) {
  const { error, formMessageId } = useFormField()
  const body = error ? String(error?.message) : children

  if (!body) {
    return null
  }

  return (
    <p
      ref={ref}
      id={formMessageId}
      className={cn("text-body text-destructive", className)}
      {...props}
    >
      {body}
    </p>
  )
}
FieldMessage.displayName = "FieldMessage"

export { Field, useFormField, FieldItem, FieldLabel, FieldDescription, FieldMessage }