"use client";

import Link from "next/link";
import CardFeatured from "@/components/ui/cards/CardFeatured";
import Container from "@/components/layout/Container";
import {useT} from "@/lib/i18n/useT";

const ITEMS = [
  {
    id: "sessions",
    eyebrow: "SESSIONS",
    title: "Sessions & Seminars",
    href: "/seminars",
    descriptionKey: "home.whatWeDo.cards.sessions",
  },
  {
    id: "projects",
    eyebrow: "PROJECTS",
    title: "Build Projects",
    href: "/projects",
    descriptionKey: "home.whatWeDo.cards.projects",
  },
  {
    id: "community",
    eyebrow: "COMMUNITY",
    title: "Community & Mentoring",
    href: "/members",
    descriptionKey: "home.whatWeDo.cards.community",
  },
];

export default function SectionWhatWeDo() {
  const {t} = useT();

  return (
    <section className="w-full">
      <Container className="space-y-6 text-left">
        <div className="space-y-2 text-left">
          <p className="font-mono text-xs uppercase tracking-[0.35em] text-muted-foreground">
            What we do
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-[var(--text-1)] sm:text-4xl">
            Learn, build, and grow together
          </h2>
          <p className="max-w-2xl text-base text-muted-foreground">
            {t("home.whatWeDo.description")}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {ITEMS.map((item) => (
            <CardFeatured key={item.id} innerClassName="p-6">
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
                {item.eyebrow}
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-[var(--text-1)]">{item.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{t(item.descriptionKey)}</p>
              <Link
                href={item.href}
                className="mt-4 inline-flex items-center text-sm font-semibold text-primary hover:underline"
              >
                Learn more →
              </Link>
            </CardFeatured>
          ))}
        </div>
      </Container>
    </section>
  );
}
