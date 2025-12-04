"use client";

import Link from "next/link";
import Container from "@/components/layout/Container";
import type {RecruitConfig} from "@/lib/recruitApi";
import {useT} from "@/lib/i18n/useT";

interface SectionRecruitCTAProps {
  config: RecruitConfig | null;
}

function formatWindow(config: RecruitConfig | null) {
  if (!config?.openAt || !config?.closeAt) return null;
  const formatter = new Intl.DateTimeFormat("ko-KR", {month: "short", day: "numeric"});
  try {
    return `${formatter.format(new Date(config.openAt))} – ${formatter.format(new Date(config.closeAt))}`;
  } catch {
    return null;
  }
}

export default function SectionRecruitCTA({config}: SectionRecruitCTAProps) {
  const {t} = useT();
  const isOpen = Boolean(config?.isOpen);
  const windowLabel = formatWindow(config);
  const statusCopy = isOpen ?
    {label: "Recruiting now", badge: "bg-emerald-100 text-emerald-700"} :
    {label: "Recruiting closed", badge: "bg-slate-200 text-slate-700"};

  return (
    <section className="w-full">
      <Container className="rounded-[2.5rem] border border-dashed border-slate-300 bg-gradient-to-r from-slate-50 to-white p-8 shadow-[0_20px_80px_rgba(15,23,42,0.08)] sm:p-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground">
              <span>Recruit</span>
              <span className={`rounded-full px-3 py-1 text-[0.65rem] ${statusCopy.badge}`}>
                {statusCopy.label}
              </span>
            </div>
            <h2 className="text-2xl font-semibold text-[var(--text-1)] sm:text-3xl">
              Join GDG on Campus KAIST
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("home.recruit.description")}
            </p>
            {windowLabel && (
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground">
                {windowLabel}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/recruit"
              className="rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 hover:bg-slate-800"
            >
              {isOpen ? t("home.recruit.ctaPrimaryOpen") : t("home.recruit.ctaPrimaryClosed")}
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
