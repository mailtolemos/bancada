import type { Dictionary, MatchDetail } from "@futiq/core";

export function StatsBars({ match, dict }: { match: MatchDetail; dict: Dictionary }) {
  if (!match.stats || match.stats.length < 2) return null;
  const home = match.stats.find((s) => s.teamId === match.home.id) ?? match.stats[0];
  const away = match.stats.find((s) => s.teamId === match.away.id) ?? match.stats[1];

  const rows: Array<{ label: string; h: number | null; a: number | null; pct?: boolean }> = [
    { label: dict.match.possession, h: home.possession, a: away.possession, pct: true },
    { label: dict.match.shots, h: home.shots, a: away.shots },
    { label: dict.match.shotsOnTarget, h: home.shotsOnTarget, a: away.shotsOnTarget },
    { label: "xG", h: home.xg ?? null, a: away.xg ?? null },
    { label: dict.match.corners, h: home.corners, a: away.corners },
    { label: dict.match.fouls, h: home.fouls, a: away.fouls },
    { label: dict.match.offsides, h: home.offsides, a: away.offsides },
  ];

  return (
    <div className="space-y-3">
      {rows
        .filter((r) => r.h != null || r.a != null)
        .map((row) => {
          const h = row.h ?? 0;
          const a = row.a ?? 0;
          const total = h + a || 1;
          return (
            <div key={row.label}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="font-bold tabular-nums">
                  {h}
                  {row.pct ? "%" : ""}
                </span>
                <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                  {row.label}
                </span>
                <span className="font-bold tabular-nums">
                  {a}
                  {row.pct ? "%" : ""}
                </span>
              </div>
              <div className="flex h-1.5 gap-0.5 overflow-hidden rounded-full">
                <span className="bg-pitch-600" style={{ width: `${(h / total) * 100}%` }} />
                <span
                  className="bg-neutral-300 dark:bg-neutral-700"
                  style={{ width: `${(a / total) * 100}%` }}
                />
              </div>
            </div>
          );
        })}
    </div>
  );
}
