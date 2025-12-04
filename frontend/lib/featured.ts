import type {Project} from "@/lib/types";

const statusRank = (status?: string) => (status === "ongoing" ? 0 : 1);

const semesterScore = (semester?: string) => {
  if (!semester) return -1;
  const match = semester.match(/^(\d{4})-(\d)$/);
  if (!match) return -1;
  const year = Number(match[1]);
  const term = Number(match[2]);
  return year * 10 + term;
};

const timeScore = (project: Project) => {
  const raw = (project.updatedAt ?? project.createdAt) as any;
  if (!raw) return 0;
  if (typeof raw === "number") return raw;
  if (typeof raw === "string") return Date.parse(raw) || 0;
  if (raw?.toMillis) return raw.toMillis();
  if (raw?.seconds) return raw.seconds * 1000;
  return 0;
};

export function pickFeaturedProjects(all: Project[], limit = 3) {
  return all
    .slice()
    .sort((a, b) => {
      const statusDiff = statusRank(a.status) - statusRank(b.status);
      if (statusDiff) return statusDiff;

      const semesterDiff = semesterScore(b.semester) - semesterScore(a.semester);
      if (semesterDiff) return semesterDiff;

      return timeScore(b) - timeScore(a);
    })
    .slice(0, limit);
}
