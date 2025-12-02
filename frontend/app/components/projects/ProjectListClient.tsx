"use client";

import {useMemo, useState} from "react";
import Link from "next/link";
import {api} from "@/lib/api";
import type {Project, ProjectStatus} from "@/lib/types";

interface ProjectListClientProps {
  initialProjects: Project[];
}

const LOAD_MORE_LIMIT = 10;

export default function ProjectListClient({initialProjects}: ProjectListClientProps) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [offset, setOffset] = useState(initialProjects.length);
  const [filterStatus, setFilterStatus] =
    useState<"all" | ProjectStatus>("all");
  const [filterSemester, setFilterSemester] = useState<string>("All");
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastFetchCount, setLastFetchCount] = useState(initialProjects.length);

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
      const newProjects = res.data || [];

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
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-2">
          {["all", "ongoing", "completed"].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setFilterStatus(status as "all" | ProjectStatus)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                filterStatus === status
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {status === "all"
                ? "All"
                : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
        <div>
          <label className="mr-2 text-sm text-gray-500">Semester</label>
          <select
            value={filterSemester}
            onChange={(event) => setFilterSemester(event.target.value)}
            className="rounded-full border border-gray-200 px-4 py-2 text-sm"
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
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredProjects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md cursor-pointer"
            >
              {project.thumbnailUrl ? (
                <div className="h-48 w-full overflow-hidden bg-gray-100">
                  <img
                    src={project.thumbnailUrl}
                    alt={project.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="h-48 w-full bg-gray-100" />
              )}
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
              </div>
            </Link>
          ))}
        </div>
      )}

      {showLoadMore && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="rounded-full bg-black px-8 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loadingMore ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </div>
  );
}
