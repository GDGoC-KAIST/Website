"use client";

import Link from "next/link";
import Image from "next/image";
import Container from "@/components/layout/Container";
import type {Project} from "@/lib/types";
import {useT} from "@/lib/i18n/useT";

interface FeaturedProjectsProps {
  projects: Project[];
}

const statusCopy: Record<string, {label: string; badgeClass: string}> = {
  ongoing: {label: "Ongoing", badgeClass: "bg-emerald-100 text-emerald-700"},
  completed: {label: "Completed", badgeClass: "bg-slate-200 text-slate-800"},
};

export default function SectionFeaturedProjects({projects}: FeaturedProjectsProps) {
  const {t} = useT();
  if (!projects.length) return null;

  return (
    <section className="w-full">
      <Container className="space-y-6">
        <div className="space-y-2 text-left">
          <p className="font-mono text-xs uppercase tracking-[0.35em] text-muted-foreground">
            Featured Projects
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-[var(--text-1)] sm:text-4xl">
            Highlights from recent semesters
          </h2>
          <p className="max-w-2xl text-base text-muted-foreground">
            {t("home.featured.description")}
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const statusInfo = statusCopy[project.status ?? ""] ?? statusCopy.completed;
            return (
              <article
                key={project.id}
                className="flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface-2)] shadow-[0_20px_70px_rgba(15,23,42,0.14)] transition hover:-translate-y-1"
              >
                <div className="relative h-48 w-full overflow-hidden">
                  {project.thumbnailUrl ? (
                    <Image
                      src={project.thumbnailUrl}
                      alt={project.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1280px) 33vw, 360px"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-slate-900 text-white">
                      <span className="text-xs tracking-[0.4em] uppercase">GDG</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col space-y-4 p-6">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground">
                    <span className="rounded-full border border-[var(--border)] px-3 py-1">
                      {project.semester ?? "—"}
                    </span>
                    <span className={`rounded-full px-3 py-1 text-[0.65rem] ${statusInfo.badgeClass}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-semibold text-[var(--text-1)]">{project.title}</h3>
                    <p className="text-sm text-muted-foreground">{project.summary}</p>
                  </div>
                  {project.techStack?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {project.techStack.slice(0, 4).map((tech) => (
                        <span
                          key={`${project.id}-${tech}`}
                          className="rounded-full bg-[var(--surface-3)] px-3 py-1 text-xs font-semibold text-muted-foreground"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <div className="mt-auto flex items-center justify-between pt-2 text-sm font-semibold text-primary">
                    <Link href={`/projects/${project.id}`} className="hover:underline">
                      View case →
                    </Link>
                    {project.githubUrl && (
                      <a href={project.githubUrl} target="_blank" rel="noreferrer" className="hover:underline">
                        GitHub
                      </a>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
