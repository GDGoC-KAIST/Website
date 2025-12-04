import * as React from "react";
import {Slot} from "@radix-ui/react-slot";
import {cva, type VariantProps} from "class-variance-authority";

import {cn} from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold leading-none transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--primary)] text-white shadow-[var(--shadow-1)] hover:bg-[#2f6fe6] hover:shadow-[var(--shadow-2)] focus-visible:ring-[var(--primary)] active:translate-y-[1px]",
        secondary:
          "border border-[var(--border)] bg-transparent text-[var(--text-1)] hover:bg-[var(--surface-3)] hover:text-[var(--text-1)] focus-visible:ring-[var(--border-2)]",
        cta: "bg-gradient-to-r from-[#4285f4] to-[#34a853] text-white shadow-[var(--shadow-2)] hover:shadow-[var(--shadow-3)] focus-visible:ring-[#5c9cfb] active:translate-y-[1px]",
      },
      size: {
        sm: "h-9 px-4",
        default: "h-10 px-5",
        lg: "h-11 px-6",
        icon: "size-10 rounded-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({variant, size, className}))}
      {...props}
    />
  );
}

export {Button, buttonVariants};
