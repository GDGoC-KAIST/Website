"use client";

import Image from "next/image";
import {cn} from "@/lib/utils";
import {usePrefersReducedMotion} from "@/lib/hooks/usePrefersReducedMotion";

type StickerName = "assembly" | "brackets" | "slider";

const stickerMap: Record<
  StickerName,
  {
    src: string;
    alt: string;
    staticSrc: string;
  }
> = {
  assembly: {
    src: "/GDG-Sticker-Assembly.gif",
    staticSrc: "/GDG-Sticker-Assembly.gif",
    alt: "Assembly sticker",
  },
  brackets: {
    src: "/GDG-Sticker-Brackets.gif",
    staticSrc: "/GDG-Sticker-Brackets.gif",
    alt: "Brackets sticker",
  },
  slider: {
    src: "/GDG-Sticker-Slider.gif",
    staticSrc: "/GDG-Sticker-Slider.gif",
    alt: "Slider sticker",
  },
};

interface StickerProps {
  name: StickerName;
  size?: number;
  className?: string;
  loading?: "lazy" | "eager";
}

export default function Sticker({
  name,
  size = 64,
  className,
  loading,
}: StickerProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const asset = stickerMap[name];
  if (!asset) return null;

  return (
    <Image
      src={prefersReducedMotion ? asset.staticSrc : asset.src}
      alt={asset.alt}
      width={size}
      height={size}
      className={cn("select-none", className)}
      loading={loading}
      style={{height: size, width: "auto"}}
    />
  );
}
