"use client";

import Link from "next/link";
import Container from "@/components/layout/Container";
import CardSurface from "@/components/ui/cards/CardSurface";
import Sticker from "@/components/brand/Sticker";
import {useT} from "@/lib/i18n/useT";

export default function SectionContact() {
  const {t} = useT();

  return (
    <section className="w-full">
      <Container className="space-y-8">
        <div className="space-y-2">
          <p className="font-mono text-xs uppercase tracking-[0.35em] text-muted-foreground">
            Contact
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-[var(--text-1)]">
            Got an idea or collaboration in mind?
          </h2>
          <p className="text-sm text-muted-foreground">{t("home.contact.subtitle")}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
          <CardSurface className="relative overflow-hidden p-6 space-y-4">
            <Sticker
              name="slider"
              size={64}
              className="pointer-events-none absolute right-4 bottom-4 opacity-90 drop-shadow-2xl hidden sm:block"
            />
            <h3 className="text-xl font-semibold text-[var(--text-1)]">
              Let&apos;s build something together
            </h3>
            <p className="text-sm text-muted-foreground">{t("home.contact.cardBody")}</p>
            <div className="flex flex-wrap gap-3 pt-3">
              <Link
                href="/contact"
                className="rounded-full bg-[var(--primary)] px-5 py-2 text-sm font-semibold text-white shadow-[var(--shadow-1)] hover:bg-[#2f6fe6]"
              >
                Contact form
              </Link>
              <a
                href="mailto:gdgoc.kaist@gmail.com"
                className="rounded-full border border-[var(--border)] px-5 py-2 text-sm font-semibold text-[var(--text-1)] hover:bg-[var(--surface-3)]"
              >
                Email us
              </a>
            </div>
            <p className="font-mono text-xs uppercase tracking-[0.35em] text-muted-foreground">
              {t("home.contact.responseTime")}
            </p>
          </CardSurface>
          <CardSurface className="p-6 space-y-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                Email
              </p>
              <a
                href="mailto:gdgoc.kaist@gmail.com"
                className="text-sm font-semibold text-primary"
              >
                gdgoc.kaist@gmail.com
              </a>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                Location
              </p>
              <p className="text-sm text-[var(--text-1)]">KAIST, Daejeon, South Korea</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                Social
              </p>
              <div className="flex gap-3 text-sm font-semibold">
                <a href="https://www.instagram.com/gdgoc_kaist" className="text-primary hover:underline" target="_blank" rel="noreferrer">
                  Instagram
                </a>
                <span>•</span>
                <a href="https://gdg.community.dev/gdg-on-campus-kaist-daejeon-s-korea/" className="text-primary hover:underline" target="_blank" rel="noreferrer">
                  Community
                </a>
              </div>
            </div>
          </CardSurface>
        </div>
      </Container>
    </section>
  );
}
