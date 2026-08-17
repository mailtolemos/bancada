"use client";

/**
 * Secção de jogos com atualização automática: recebe dados renderizados no
 * servidor e faz polling leve a /api/matches para refrescar resultados ao vivo.
 */
import { useEffect, useState } from "react";
import { LIVE_STATUSES, type Dictionary, type Locale, type Match } from "@bancada/core";
import { MatchCard } from "./MatchCard";

const POLL_MS = 30_000;

export function LiveMatches({
  initial,
  locale,
  dict,
  filter = "all",
  showDay = false,
  emptyText,
  teamId,
  limit,
}: {
  initial: Match[];
  locale: Locale;
  dict: Dictionary;
  filter?: "all" | "live" | "today" | "upcoming" | "finished";
  showDay?: boolean;
  emptyText?: string;
  teamId?: number;
  limit?: number;
}) {
  const [matches, setMatches] = useState<Match[]>(initial);

  useEffect(() => {
    // Só vale a pena polling se houver (ou puder haver) jogo ao vivo hoje.
    const interval = setInterval(async () => {
      if (document.hidden) return;
      try {
        const res = await fetch("/api/matches");
        if (!res.ok) return;
        const data = (await res.json()) as { matches: Match[] };
        if (Array.isArray(data.matches) && data.matches.length) setMatches(data.matches);
      } catch {
        /* falha silenciosa; próxima tentativa em 30s */
      }
    }, POLL_MS);
    return () => clearInterval(interval);
  }, []);

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
        <MatchCard key={m.id} match={m} locale={locale} dict={dict} showDay={showDay} />
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
