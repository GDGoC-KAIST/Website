"use client";

import Image from "next/image";
import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import Container from "@/components/layout/Container";
import Sticker from "@/components/brand/Sticker";
import {useLanguage, type Language} from "@/lib/i18n-context";

const HOLD_MS = 5200;
const SLIDE_MS = 900;
const KEN_BURNS_SCALE = 1.07;

interface StickerConfig {
  name: "assembly" | "brackets" | "slider";
  size?: number;
  className?: string;
}

interface HeroLocalizedContent {
  eyebrow?: string;
  title?: string;
  description?: string;
}

interface PageHeroProps {
  images: readonly string[];
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
  variant?: "default" | "compact";
  sticker?: StickerConfig;
  bilingualCopy?: Partial<Record<Language, HeroLocalizedContent>>;
}

export default function PageHero({
  images,
  eyebrow,
  title,
  description,
  actions,
  className = "",
  variant = "default",
  sticker,
  bilingualCopy,
}: PageHeroProps) {
  const [index, setIndex] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [kenBurnsOn, setKenBurnsOn] = useState(false);
  const holdTimerRef = useRef<number | null>(null);
  const slideTimerRef = useRef<number | null>(null);
  const kenTimerRef = useRef<number | null>(null);

  const currentImage = useMemo(() => images[index] ?? images[0], [images, index]);
  const nextImage = useMemo(
    () => images[(index + 1) % images.length] ?? images[0],
    [images, index]
  );

  const clearTimers = () => {
    if (holdTimerRef.current) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (slideTimerRef.current) {
      window.clearTimeout(slideTimerRef.current);
      slideTimerRef.current = null;
    }
    if (kenTimerRef.current) {
      window.clearTimeout(kenTimerRef.current);
      kenTimerRef.current = null;
    }
  };

  const scheduleNext = useCallback(() => {
    clearTimers();
    if (images.length <= 1) return;

    setKenBurnsOn(false);
    kenTimerRef.current = window.setTimeout(() => setKenBurnsOn(true), 60);

    holdTimerRef.current = window.setTimeout(() => {
      setKenBurnsOn(false);
      setAnimating(true);
      slideTimerRef.current = window.setTimeout(() => {
        setIndex((prev) => (prev + 1) % images.length);
        setAnimating(false);
      }, SLIDE_MS);
    }, HOLD_MS);
  }, [images.length]);

  useEffect(() => {
    scheduleNext();
    return () => clearTimers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, scheduleNext]);

  const {language} = useLanguage();
  const resolvedCopy = bilingualCopy ? bilingualCopy[language] : null;
  const resolvedEyebrow = resolvedCopy?.eyebrow ?? eyebrow;
  const resolvedTitle = resolvedCopy?.title ?? title;
  const resolvedDescription = resolvedCopy?.description ?? description;

  const isCompact = variant === "compact";

  return (
    <section
      className={`relative isolate overflow-hidden rounded-[2.5rem] border border-white/10 bg-slate-900 text-white ${className}`}
    >
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="flex h-full w-[200%]"
          style={{
            transform: animating ? "translateX(-50%)" : "translateX(0)",
            transition: animating
              ? `transform ${SLIDE_MS}ms cubic-bezier(0.16, 1, 0.3, 1)`
              : "none",
          }}
        >
          <div className="relative h-full w-1/2 overflow-hidden">
            <Image
              src={currentImage}
              alt={resolvedTitle}
              fill
              priority
              sizes="100vw"
              className="object-cover object-center"
              style={{
                transform: kenBurnsOn ? `scale(${KEN_BURNS_SCALE})` : "scale(1)",
                transition: kenBurnsOn ? `transform ${HOLD_MS}ms linear` : "transform 0ms",
              }}
            />
          </div>
          <div className="relative h-full w-1/2 overflow-hidden">
            <Image
              src={nextImage}
              alt={`${title} next`}
              fill
              sizes="100vw"
              className="object-cover object-center"
            />
          </div>
        </div>
        <div className="pointer-events-none absolute inset-0 bg-black/35" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
      </div>

      <Container
        className={`relative flex flex-col items-start gap-6 ${
          isCompact ? "py-16 lg:py-20" : "py-24 lg:py-28"
        }`}
      >
        {sticker && (
          <Sticker
            name={sticker.name}
            size={sticker.size ?? 100}
            className={sticker.className ?? "pointer-events-none absolute right-0 top-16 opacity-100 drop-shadow-2xl hidden xl:block animate-pulse z-0"}
          />
        )}
        {resolvedEyebrow && (
          <p className="text-sm font-mono uppercase tracking-[0.35em] text-white/85">
            {resolvedEyebrow}
          </p>
        )}
        <div className="space-y-6 text-left">
          <h1
            className={`font-semibold leading-tight tracking-tight text-white ${
              isCompact
                ? "text-3xl sm:text-4xl lg:text-5xl"
                : "text-4xl sm:text-5xl lg:text-6xl"
            }`}
          >
            {resolvedTitle}
          </h1>
          {resolvedDescription && (
            <p className="max-w-3xl text-lg text-white/85 sm:text-xl">{resolvedDescription}</p>
          )}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
      </Container>
    </section>
  );
}
