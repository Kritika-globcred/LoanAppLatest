import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "gradient-border-button inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90", // This will be visually overridden by gradient-border-button's styles for bg/text
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90", // Also overridden
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground", // Also overridden
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80", // Also overridden
        ghost: "hover:bg-accent hover:text-accent-foreground", // Also overridden
        link: "text-primary underline-offset-4 hover:underline", // Link variant might look different due to no background
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3", // Note: sm size still has rounded-md, might want to make this rounded-full too
        lg: "h-11 rounded-md px-8", // Note: lg size still has rounded-md, might want to make this rounded-full too
        icon: "h-10 w-10", // Icon buttons will also become rounded-full
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
