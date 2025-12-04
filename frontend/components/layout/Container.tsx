import {ReactNode} from "react";
import {cn} from "@/lib/utils";

interface ContainerProps {
  children: ReactNode;
  className?: string;
}

export default function Container({children, className}: ContainerProps) {
  return (
    <div className={cn("mx-auto w-full max-w-6xl px-6 lg:px-10", className)}>
      {children}
    </div>
  );
}
