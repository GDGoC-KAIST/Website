"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type PageTransitionProps = { children: ReactNode };
const easeOut = [0.22, 1, 0.36, 1] as const;

export default function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const reduced = useReducedMotion();

  const transition = reduced
    ? { duration: 0.18, ease: easeOut }
    : { duration: 0.32, ease: easeOut }; // 조금 길게

  return (
    <AnimatePresence mode="sync" initial={false}>
      <motion.main
        key={pathname}
        initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
        animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
        // ✅ exit 제거: 배경 노출(반짝) 근본 감소
        transition={transition}
        style={{
          willChange: "transform, opacity",
          overflowX: "clip",
          minHeight: "100svh",
        }}
      >
        {children}
      </motion.main>
    </AnimatePresence>
  );
}