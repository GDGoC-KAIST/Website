'use client';

import Image from "next/image";
import {useMemo, useState} from "react";
import {cn} from "@/lib/utils";

type SmartCoverKind = "project" | "seminar" | "member";

interface SmartCoverProps {
  src?: string | null;
  fallbackSrc?: string;
  alt: string;
  kind?: SmartCoverKind;
  className?: string;
  priority?: boolean;
  sizes?: string;
  unoptimized?: boolean;
}

const DEFAULT_FALLBACK = "/GDG-Campus-Digital-WebsiteBanner-1440x500-Blue.png";

const KIND_CONFIG: Record<
  SmartCoverKind,
  {icon: string; label: string; gradient: string}
> = {
  project: {
    icon: "/window.svg",
    label: "Project",
    gradient: "from-[#d9e9ff] via-[#e9f6ff] to-[#e1ffe9]",
  },
  seminar: {
    icon: "/globe.svg",
    label: "Seminar",
    gradient: "from-[#e3f8ff] via-[#f2ebff] to-[#fff0f0]",
  },
  member: {
    icon: "/gdgoc_icon.png",
    label: "Member",
    gradient: "from-[#f0f4ff] via-[#f8f0ff] to-[#e8fff0]",
  },
};

export default function SmartCover({
  src,
  fallbackSrc = DEFAULT_FALLBACK,
  alt,
  kind = "project",
  className,
  priority,
  sizes,
  unoptimized = true,
}: SmartCoverProps) {
  const [hasError, setHasError] = useState(false);
  const trimmedSrc = typeof src === "string" ? src.trim() : "";
  const showPrimaryImage = Boolean(trimmedSrc) && !hasError;
  const resolvedSrc = showPrimaryImage ? trimmedSrc : fallbackSrc;
  const isPlaceholder = !showPrimaryImage;

  const {icon, label, gradient} = useMemo(() => KIND_CONFIG[kind], [kind]);

  return (
    <div
      className={cn(
        "relative aspect-[16/9] w-full overflow-hidden rounded-[1.5rem]",
        className
      )}
    >
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br transition-opacity duration-500",
          gradient,
          isPlaceholder ? "opacity-100" : "opacity-0"
        )}
      />
      {resolvedSrc ? (
        <Image
          src={resolvedSrc}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          unoptimized={unoptimized}
          className="object-cover"
          onError={
            showPrimaryImage
              ? () => setHasError(true)
              : undefined
          }
        />
      ) : null}
      {isPlaceholder && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 text-white">
          <Image
            src={icon}
            alt=""
            width={84}
            height={84}
            aria-hidden
            className="opacity-90 drop-shadow-lg"
          />
          <span className="text-[11px] font-mono font-semibold uppercase tracking-[0.35em] opacity-80">
            {label}
          </span>
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 ring-1 ring-black/5" />
    </div>
  );
}
