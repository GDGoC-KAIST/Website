import React, {ElementType, HTMLAttributes} from "react";
import {cn} from "@/lib/utils";

export interface CardFeaturedProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  hoverable?: boolean;
  innerClassName?: string;
}

const CardFeatured = React.forwardRef<HTMLElement, CardFeaturedProps>(
  (
    {
      as: Component = "div",
      className,
      hoverable = true,
      innerClassName,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = Component as ElementType;
    return (
      <Comp
        ref={ref as any}
        className={cn(
          "relative rounded-[var(--r-card)] bg-gradient-to-r from-[#4285f4] via-[#34a853] to-[#f9ab00] p-[1.5px]",
          hoverable && "transition-shadow duration-300 hover:shadow-[0_20px_45px_rgba(66,133,244,0.25)]",
          className
        )}
        {...props}
      >
        <div
          className={cn(
            "h-full w-full rounded-[calc(var(--r-card)-2px)] bg-card p-6",
            hoverable && "ui-card-hover",
            innerClassName
          )}
        >
          {children}
        </div>
      </Comp>
    );
  }
);

CardFeatured.displayName = "CardFeatured";

export default CardFeatured;
