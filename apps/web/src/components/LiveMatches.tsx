"use client";

/**
 * Secção de jogos com atualização automática: recebe dados renderizados no
 * servidor e faz polling leve a /api/matches para refrescar resultados ao vivo.
 */
import { useEffect, useState } from "react";
import { LIVE_STATUSES, type Dictionary, type Locale, type Match } from "@bancada/core";
import { MatchCard } from "./MatchCard";

const POLL_LIVE_MS = 12_000; // há jogos a decorrer → quase tempo real
const POLL_IDLE_MS = 60_000; // sem jogos → poupa bateria e pedidos

export function LiveMatches({
  initial,
  locale,
  dict,
  filter = "all",
  showDay = false,
  emptyText,
  teamId,
  limit,
  leagueId = "primeira-liga",
}: {
  initial: Match[];
  locale: Locale;
  dict: Dictionary;
  filter?: "all" | "live" | "today" | "upcoming" | "finished";
  showDay?: boolean;
  emptyText?: string;
  teamId?: number;
  limit?: number;
  leagueId?: string;
}) {
  const [matches, setMatches] = useState<Match[]>(initial);

  useEffect(() => {
    setMatches(initial);
  }, [initial]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const tick = async () => {
      let live = false;
      if (!document.hidden) {
        try {
          // Com teamId, a API agrega liga + provas europeias da equipa.
          const teamParam = teamId != null ? `&team=${teamId}` : "";
          const res = await fetch(`/api/matches?league=${leagueId}${teamParam}`);
          if (res.ok) {
            const data = (await res.json()) as { matches: Match[] };
            if (Array.isArray(data.matches) && data.matches.length) {
              setMatches(data.matches);
              live = data.matches.some((m) => LIVE_STATUSES.includes(m.status));
            }
          }
        } catch {
          /* falha silenciosa; nova tentativa no próximo ciclo */
        }
      }
      timer = setTimeout(tick, live ? POLL_LIVE_MS : POLL_IDLE_MS);
    };

    timer = setTimeout(tick, POLL_LIVE_MS);
    return () => clearTimeout(timer);
  }, [leagueId, teamId]);

  let list = matches;
  if (teamId != null) list = list.filter((m) => m.home.id === teamId || m.away.id === teamId);
  list = applyFilter(list, filter);
  if (limit) list = list.slice(0, limit);

  if (!list.length) {
    return emptyText ? (
      <p className="card px-4 py-6 text-center text-sm text-neutral-500">{emptyText}</p>
    ) : null;
  }

  return (
    <div className="grid gap-2.5 sm:grid-cols-2">
      {list.map((m) => (
        <MatchCard
          key={m.id}
          match={m}
          locale={locale}
          dict={dict}
          showDay={showDay}
          showCompetition={teamId != null}
        />
      ))}
    </div>
  );
}

function applyFilter(matches: Match[], filter: string): Match[] {
  const now = Date.now();
  const dayMs = 86_400_000;
  switch (filter) {
    case "live":
      return matches.filter((m) => LIVE_STATUSES.includes(m.status));
    case "today": {
      const isToday = (iso: string) => {
        const d = new Date(iso);
        const n = new Date();
        return (
          d.getFullYear() === n.getFullYear() &&
          d.getMonth() === n.getMonth() &&
          d.getDate() === n.getDate()
        );
      };
      return matches.filter((m) => isToday(m.utcDate));
    }
    case "upcoming":
      return matches
        .filter(
          (m) =>
            (m.status === "SCHEDULED" || m.status === "TIMED") &&
            new Date(m.utcDate).getTime() > now - 2 * 3600_000
        )
        .sort((a, b) => a.utcDate.localeCompare(b.utcDate));
    case "finished":
      return matches
        .filter((m) => m.status === "FINISHED" && new Date(m.utcDate).getTime() > now - 8 * dayMs)
        .sort((a, b) => b.utcDate.localeCompare(a.utcDate));
    default:
      return [...matches].sort((a, b) => a.utcDate.localeCompare(b.utcDate));
  }
}
