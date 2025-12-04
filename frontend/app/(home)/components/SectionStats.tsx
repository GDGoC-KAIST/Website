import Container from "@/components/layout/Container";

interface SectionStatsProps {
  membersCount: number;
  sessionsCount: number;
  projectsCount: number;
}

const STAT_ITEMS = [
  {id: "members", label: "Members"},
  {id: "sessions", label: "Sessions this semester"},
  {id: "projects", label: "Projects shipped"},
];

export default function SectionStats({membersCount, sessionsCount, projectsCount}: SectionStatsProps) {
  const statMap: Record<string, number> = {
    members: membersCount,
    sessions: sessionsCount,
    projects: projectsCount,
  };

  return (
    <section className="w-full">
      <Container className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface-2)]/70 px-6 py-8 shadow-[0_25px_70px_rgba(15,23,42,0.12)] sm:px-10">
        <div className="grid gap-6 text-left sm:grid-cols-3">
          {STAT_ITEMS.map((stat) => (
            <div key={stat.id} className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground">
                {stat.label}
              </p>
              <p className="text-4xl font-semibold text-[var(--text-1)]">
                {statMap[stat.id] ?? 0}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
