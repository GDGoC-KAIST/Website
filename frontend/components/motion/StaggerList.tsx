"use client";

import {Children, cloneElement, isValidElement, ReactNode} from "react";
import {cn} from "@/lib/utils";
import {usePrefersReducedMotion} from "@/lib/hooks/usePrefersReducedMotion";
import {useEffect, useState} from "react";

interface StaggerListProps {
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  children: ReactNode;
}

export default function StaggerList({
  as: Component = "div",
  className,
  children,
}: StaggerListProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [hasCompleted, setHasCompleted] = useState(prefersReducedMotion);

  useEffect(() => {
    if (prefersReducedMotion) {
      setHasCompleted(true);
      return;
    }
    const timer = window.setTimeout(() => {
      setHasCompleted(true);
    }, 700);
    return () => window.clearTimeout(timer);
  }, [prefersReducedMotion]);

  const shouldAnimate = !prefersReducedMotion && !hasCompleted;

  return (
    <Component className={className}>
      {Children.map(children, (child, index) => {
        if (!isValidElement(child)) return child;
        const delay = `${index * 60}ms`;
        return cloneElement(child, {
          className: cn(child.props.className, shouldAnimate && "stagger-item"),
          style: {
            ...child.props.style,
            animationDelay: shouldAnimate ? delay : undefined,
          },
        });
      })}
    </Component>
  );
}
