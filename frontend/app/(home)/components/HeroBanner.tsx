"use client";

import Image from "next/image";
import Link from "next/link";
import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {Button} from "@/components/ui/button";
import Container from "@/components/layout/Container";
import {HERO_IMAGES} from "@/lib/heroImages";
import Sticker from "@/components/brand/Sticker";
import {useT} from "@/lib/i18n/useT";

const HOLD_MS = 5200;
const SLIDE_MS = 900;
const KEN_BURNS_SCALE = 1.07;

export default function HeroBanner() {
  const {t} = useT();
  const [index, setIndex] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [kenBurnsOn, setKenBurnsOn] = useState(false);
  const holdTimerRef = useRef<number | null>(null);
  const slideTimerRef = useRef<number | null>(null);
  const kenTimerRef = useRef<number | null>(null);

  const currentImage = useMemo(
    () => HERO_IMAGES[index] ?? HERO_IMAGES[0],
    [index]
  );
  const nextImage = useMemo(
    () => HERO_IMAGES[(index + 1) % HERO_IMAGES.length] ?? HERO_IMAGES[0],
    [index]
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
    if (HERO_IMAGES.length <= 1) return;

    setKenBurnsOn(false);
    kenTimerRef.current = window.setTimeout(() => setKenBurnsOn(true), 60);

    holdTimerRef.current = window.setTimeout(() => {
      setKenBurnsOn(false);
      setAnimating(true);
      slideTimerRef.current = window.setTimeout(() => {
        setIndex((prev) => (prev + 1) % HERO_IMAGES.length);
        setAnimating(false);
      }, SLIDE_MS);
    }, HOLD_MS);
  }, []);

  useEffect(() => {
    scheduleNext();
    return () => clearTimers();
  }, [index, scheduleNext]);

  return (
    <section className="relative isolate overflow-hidden rounded-[2.5rem] border border-white/10 bg-slate-900 text-white">
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
              alt="Google Developer Group on Campus KAIST"
              fill
              priority
              sizes="100vw"
              className="object-cover object-center"
              style={{
                transform: kenBurnsOn ? `scale(${KEN_BURNS_SCALE})` : "scale(1)",
                transition: kenBurnsOn
                  ? `transform ${HOLD_MS}ms linear`
                  : "transform 0ms",
              }}
            />
          </div>
          <div className="relative h-full w-1/2 overflow-hidden">
            <Image
              src={nextImage}
              alt="Google Developer Group on Campus KAIST next"
              fill
              sizes="100vw"
              className="object-cover object-center"
            />
          </div>
        </div>
        <div className="pointer-events-none absolute inset-0 bg-black/35" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
      </div>

      <Container className="relative flex flex-col items-start gap-6 py-24 lg:py-28">
        <Sticker
          name="brackets"
          size={100}
          className="pointer-events-none absolute right-0 top-16 opacity-100 drop-shadow-2xl max-[400px]:hidden animate-pulse z-0"
        />
        <p className="text-sm font-mono uppercase tracking-[0.35em] text-white/85">
          GDG • Campus • Korea
        </p>
        <div className="space-y-6 text-left">
          <h1 className="text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
            Google Developer Group on Campus KAIST
          </h1>
          <p className="max-w-3xl text-lg text-white/85 sm:text-xl">
            {t("home.hero.description")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild size="lg" variant="primary">
            <Link href="/recruit">{t("home.hero.ctaPrimary")}</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="secondary"
            className="border-white/40 bg-white/15 text-white backdrop-blur-md hover:border-white/60 hover:bg-white/25"
          >
            <Link href="/projects">{t("home.hero.ctaSecondary")}</Link>
          </Button>
        </div>
        <p className="font-mono text-xs uppercase tracking-[0.4em] text-white/80">
          #GDGOnCampus • Daejeon • KAIST
        </p>
      </Container>
    </section>
  );
}
