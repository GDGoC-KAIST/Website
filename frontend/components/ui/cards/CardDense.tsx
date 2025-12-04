import React, {ElementType, HTMLAttributes} from "react";
import {cn} from "@/lib/utils";

type PadSize = "sm" | "md" | "lg";

export interface CardDenseProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  hoverable?: boolean;
  pad?: PadSize;
}

const padClassMap: Record<PadSize, string> = {
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
};

const CardDense = React.forwardRef<HTMLElement, CardDenseProps>(
  (
    {
      as: Component = "div",
      className,
      hoverable = false,
      pad = "md",
      ...props
    },
    ref
  ) => {
    const Comp = Component as ElementType;
    return (
      <Comp
        ref={ref as any}
        className={cn(
          "rounded-2xl border border-border bg-card text-sm shadow-sm transition-colors",
          padClassMap[pad],
          hoverable && "ui-card-hover",
          className
        )}
        {...props}
      />
    );
  }
);

CardDense.displayName = "CardDense";

export default CardDense;
