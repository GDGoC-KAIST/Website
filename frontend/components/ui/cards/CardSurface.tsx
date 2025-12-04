import React, {ElementType, HTMLAttributes} from "react";
import {cn} from "@/lib/utils";

export interface CardSurfaceProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  hoverable?: boolean;
}

const CardSurface = React.forwardRef<HTMLElement, CardSurfaceProps>(
  ({as: Component = "div", className, hoverable = true, ...props}, ref) => {
    const Comp = Component as ElementType;
    return (
      <Comp
        ref={ref as any}
        className={cn("ui-card", hoverable && "ui-card-hover", className)}
        {...props}
      />
    );
  }
);

CardSurface.displayName = "CardSurface";

export default CardSurface;
