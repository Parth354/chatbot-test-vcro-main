import { cn } from "@/lib/utils"

interface FieldErrorProps {
  message?: string
  className?: string
}

export const FieldError = ({ message, className }: FieldErrorProps) => {
  if (!message) return null
  
  return (
    <p className={cn("text-sm text-destructive mt-1", className)}>
      {message}
    </p>
  )
}