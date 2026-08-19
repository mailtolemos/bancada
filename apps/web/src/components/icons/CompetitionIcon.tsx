import { Globe2, Medal, Trophy } from "lucide-react";
import type { League } from "@bancada/core";
import { Flag, hasFlag } from "./Flag";

/**
 * Ícone de uma competição: bandeira do país nas ligas nacionais, emblema
 * (troféu/medalha/globo) nas provas continentais.
 */
export function CompetitionIcon({ league, size = 16 }: { league: League; size?: number }) {
  if (league.kind === "continental") {
    const props = { size: size - 2, strokeWidth: 2.25, "aria-hidden": true as const };
    if (league.id === "champions-league")
      return <Trophy {...props} className="shrink-0 text-blue-500" />;
    if (league.id === "europa-league")
      return <Trophy {...props} className="shrink-0 text-orange-500" />;
    if (league.id === "conference-league")
      return <Medal {...props} className="shrink-0 text-emerald-500" />;
    return <Globe2 {...props} className="shrink-0 text-neutral-400" />;
  }
  if (hasFlag(league.flag)) return <Flag code={league.flag!} size={size} />;
  return <Globe2 size={size - 2} className="shrink-0 text-neutral-400" aria-hidden />;
}
