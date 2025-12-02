"use client";

import {useMemo, useState} from "react";
import Link from "next/link";
import {api} from "@/lib/api";
import type {Seminar, SeminarType} from "@/lib/types";

export interface SeminarWithImage extends Seminar {
  coverImageUrl?: string;
}

interface SeminarListClientProps {
  initialSeminars: SeminarWithImage[];
}

const LOAD_MORE_LIMIT = 10;

export default function SeminarListClient({initialSeminars}: SeminarListClientProps) {
  const [seminars, setSeminars] = useState<SeminarWithImage[]>(initialSeminars);
  const [offset, setOffset] = useState(initialSeminars.length);
  const [filterType, setFilterType] = useState<"all" | SeminarType>("all");
  const [filterSemester, setFilterSemester] = useState<string>("All");
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastFetchCount, setLastFetchCount] = useState(initialSeminars.length);

  const availableSemesters = useMemo(() => {
    const semesters = Array.from(
      new Set(
        seminars
          .map((seminar) => seminar.semester)
          .filter((semester): semester is string => Boolean(semester))
      )
    );
    return semesters.sort().reverse();
  }, [seminars]);

  const filteredSeminars = useMemo(() => {
    return seminars.filter((seminar) => {
      const matchesType =
        filterType === "all" ? true : seminar.type === filterType;
      const matchesSemester =
        filterSemester === "All" ? true : seminar.semester === filterSemester;
      return matchesType && matchesSemester;
    });
  }, [seminars, filterType, filterSemester]);

  const showLoadMore =
    !loadingMore && lastFetchCount >= LOAD_MORE_LIMIT && seminars.length > 0;

  const handleLoadMore = async () => {
    setLoadingMore(true);
    try {
      const res = await api
        .getSeminars({limit: LOAD_MORE_LIMIT, offset})
        .catch(() => ({data: []}));
      const newSeminars = res.data || [];

      const seminarImageResults = await Promise.allSettled(
        newSeminars.map(async (seminar) => {
          if (!seminar.coverImageId) {
            return {seminarId: seminar.id, coverImageUrl: undefined};
          }
          try {
            const image = await api.getImage(seminar.coverImageId);
            return {seminarId: seminar.id, coverImageUrl: image.url};
          } catch {
            return {seminarId: seminar.id, coverImageUrl: undefined};
          }
        })
      );

      const coverImageMap = new Map<string, string | undefined>();
      seminarImageResults.forEach((result) => {
        if (result.status === "fulfilled") {
          coverImageMap.set(result.value.seminarId, result.value.coverImageUrl);
        }
      });

      const withImages: SeminarWithImage[] = newSeminars.map((seminar) => ({
        ...seminar,
        coverImageUrl: coverImageMap.get(seminar.id),
      }));

      setSeminars((prev) => [...prev, ...withImages]);
      setOffset((prev) => prev + newSeminars.length);
      setLastFetchCount(newSeminars.length);
    } catch (error) {
      console.error("Failed to load more seminars", error);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-2">
          {["all", "invited", "internal"].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setFilterType(type as "all" | SeminarType)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                filterType === type
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {type === "all"
                ? "All"
                : type.charAt(0).toUpperCase() + type.slice(1)}
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

      {filteredSeminars.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 p-10 text-center text-gray-500">
          No seminars to display. Try adjusting filters or check back later.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredSeminars.map((seminar) => (
            <Link
              key={seminar.id}
              href={`/seminars/${seminar.id}`}
              className="flex h-full flex-col rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md cursor-pointer"
            >
              {seminar.coverImageUrl ? (
                <div className="h-48 w-full overflow-hidden rounded-t-2xl bg-gray-100">
                  <img
                    src={seminar.coverImageUrl}
                    alt={seminar.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="h-48 w-full rounded-t-2xl bg-gray-100" />
              )}
              <div className="flex flex-1 flex-col gap-4 p-6">
                <div className="flex items-center justify-between text-xs uppercase tracking-wide text-gray-500">
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold">
                    {seminar.type}
                  </span>
                  <span>{seminar.semester}</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{seminar.title}</h3>
                  {seminar.date && (
                    <p className="text-sm text-gray-500">
                      {new Date(seminar.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  )}
                </div>
                <p className="text-sm text-gray-600 line-clamp-3">
                  {seminar.summary}
                </p>
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
