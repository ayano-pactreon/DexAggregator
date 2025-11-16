import { forwardRef } from "react"
import { cn } from "@/lib/utils"

export const Text = forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
    <p
        ref={ref}
        className={cn("text-sm leading-[1.5] text-foreground", className)}
        {...props}
    />
))
Text.displayName = "Text"
