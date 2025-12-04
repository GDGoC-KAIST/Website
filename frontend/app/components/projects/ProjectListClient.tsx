"use client";

import Link from "next/link";
import {useEffect, useMemo, useState} from "react";
import {api} from "@/lib/api";
import {resolveThumbnailValue} from "@/lib/imageUtils";
import {normalizeUrl} from "@/lib/normalizeUrl";
import type {Project, ProjectStatus} from "@/lib/types";
import CardSurface from "@/components/ui/cards/CardSurface";
import {Button} from "@/components/ui/button";
import SmartCover from "@/components/media/SmartCover";
import StaggerList from "@/components/motion/StaggerList";

interface ProjectListClientProps {
  initialProjects: Project[];
}

const LOAD_MORE_LIMIT = 10;

type ProjectWithResolved = Project & {thumbnailResolvedUrl?: string};

const isHttpUrl = (value?: string) => !!value && /^https?:\/\//i.test(value);

export default function ProjectListClient({initialProjects}: ProjectListClientProps) {
  const [projects, setProjects] = useState<ProjectWithResolved[]>(
    initialProjects as ProjectWithResolved[]
  );
  const [offset, setOffset] = useState(initialProjects.length);
  const [filterStatus, setFilterStatus] =
    useState<"all" | ProjectStatus>("all");
  const [filterSemester, setFilterSemester] = useState<string>("All");
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastFetchCount, setLastFetchCount] = useState(initialProjects.length);

  useEffect(() => {
    let cancelled = false;

    const hydrateInitial = async () => {
      const hydrated = await Promise.all(
        (initialProjects as ProjectWithResolved[]).map(async (project) => {
          let resolved = "";
          if (isHttpUrl(project.thumbnailUrl)) {
            resolved = normalizeUrl(project.thumbnailUrl || "");
          } else if (project.thumbnailUrl) {
            const value =
              (await resolveThumbnailValue(project.thumbnailUrl).catch(
                () => ""
              )) || "";
            resolved = value ? normalizeUrl(value) : "";
          }
          return {...project, thumbnailResolvedUrl: resolved};
        })
      );

      if (!cancelled) {
        setProjects(hydrated);
      }
    };

    hydrateInitial();

    return () => {
      cancelled = true;
    };
  }, [initialProjects]);

  const availableSemesters = useMemo(() => {
    const semesters = Array.from(
      new Set(
        projects
          .map((project) => project.semester)
          .filter((semester): semester is string => Boolean(semester))
      )
    );
    return semesters.sort().reverse();
  }, [projects]);

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesStatus =
        filterStatus === "all" ? true : project.status === filterStatus;
      const matchesSemester =
        filterSemester === "All" ? true : project.semester === filterSemester;
      return matchesStatus && matchesSemester;
    });
  }, [projects, filterStatus, filterSemester]);

  const showLoadMore =
    !loadingMore && lastFetchCount >= LOAD_MORE_LIMIT && projects.length > 0;

  const handleLoadMore = async () => {
    setLoadingMore(true);
    try {
      const res = await api
        .getProjects({limit: LOAD_MORE_LIMIT, offset})
        .catch(() => ({data: []}));
      const fetched = (res.data || []) as Project[];
      const newProjects = await Promise.all(
        fetched.map(async (project) => {
          let resolved = "";
          if (isHttpUrl(project.thumbnailUrl)) {
            resolved = normalizeUrl(project.thumbnailUrl || "");
          } else if (project.thumbnailUrl) {
            const value =
              (await resolveThumbnailValue(project.thumbnailUrl).catch(
                () => ""
              )) || "";
            resolved = value ? normalizeUrl(value) : "";
          }
          return {
            ...project,
            thumbnailResolvedUrl: resolved,
          };
        })
      );

      setProjects((prev) => [...prev, ...newProjects]);
      setOffset((prev) => prev + newProjects.length);
      setLastFetchCount(newProjects.length);
    } catch (error) {
      console.error("Failed to load more projects", error);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          {["all", "ongoing", "completed"].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setFilterStatus(status as "all" | ProjectStatus)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                filterStatus === status
                  ? "border-primary bg-primary text-white"
                  : "border-gray-200 bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              {status === "all"
                ? "All"
                : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm text-gray-500">Semester</label>
          <select
            value={filterSemester}
            onChange={(event) => setFilterSemester(event.target.value)}
            className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm pointer-events-auto focus:border-primary focus:outline-none"
          >
            <option value="All">All</option>
            {availableSemesters.map((semester) => (
              <option key={semester} value={semester}>
                {semester}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filteredProjects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 p-10 text-center text-gray-500">
          No projects to display. Try adjusting filters or check back later.
        </div>
      ) : (
        <StaggerList as="div" className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredProjects.map((project) => (
            <CardSurface
              as="article"
              hoverable
              key={project.id}
              className="flex h-full flex-col overflow-hidden"
            >
              <SmartCover
                src={project.thumbnailResolvedUrl}
                alt={project.title}
                kind="project"
                sizes="(max-width: 1280px) 100vw, 33vw"
              />
              <div className="flex flex-1 flex-col gap-4 p-6">
                <div className="flex items-center justify-between text-xs uppercase tracking-wide text-gray-500">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      project.status === "ongoing"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {project.status}
                  </span>
                  <span>{project.semester}</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{project.title}</h3>
                  <p className="text-sm text-gray-500">{project.summary}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {project.techStack.slice(0, 3).map((tech) => (
                    <span
                      key={tech}
                      className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600"
                    >
                      {tech}
                    </span>
                  ))}
                  {project.techStack.length > 3 && (
                    <span className="text-xs text-gray-500">
                      +{project.techStack.length - 3} more
                    </span>
                  )}
                </div>
                <Link
                  href={`/projects/${project.id}`}
                  className="mt-auto text-sm font-semibold text-primary hover:underline"
                >
                  View Details →
                </Link>
              </div>
            </CardSurface>
          ))}
        </StaggerList>
      )}

      {showLoadMore && (
        <div className="flex justify-center pt-8">
          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="px-8"
            onClick={handleLoadMore}
            disabled={loadingMore}
          >
            {loadingMore ? "Loading..." : "Load More"}
          </Button>
        </div>
      )}
    </div>
  );
}
