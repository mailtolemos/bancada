"use client";

/**
 * Vista de jogo com atualização automática (polling leve ao endpoint interno).
 */
import { useEffect, useState } from "react";
import { LIVE_STATUSES, type Dictionary, type Locale, type MatchDetail } from "@bancada/core";
import { formatDate, formatTime } from "@/lib/format";
import { Crest } from "./Crest";
import { StatusBadge } from "./MatchCard";
import { EventTimeline } from "./EventTimeline";
import { LineupField } from "./LineupField";
import { StatsBars } from "./StatsBars";

const POLL_MS = 12_000;

export function MatchDetailView({
  initial,
  locale,
  dict,
}: {
  initial: MatchDetail;
  locale: Locale;
  dict: Dictionary;
}) {
  const [match, setMatch] = useState<MatchDetail>(initial);
  const live = LIVE_STATUSES.includes(match.status);

  useEffect(() => {
    if (!LIVE_STATUSES.includes(initial.status) && initial.status !== "TIMED") return;
    const interval = setInterval(async () => {
      if (document.hidden) return;
      try {
        const res = await fetch(`/api/match/${initial.id}?league=${initial.leagueId}`);
        if (!res.ok) return;
        const data = (await res.json()) as { match: MatchDetail };
        if (data.match) setMatch(data.match);
      } catch {
        /* próxima tentativa */
      }
    }, POLL_MS);
    return () => clearInterval(interval);
  }, [initial.id, initial.status]);

  const played = match.score.home != null;

  return (
    <div className="space-y-6">
      {/* Cabeçalho / placar */}
      <div className="card px-4 py-6 text-center">
        <p className="mb-4 text-xs font-medium text-neutral-500">
          {formatDate(match.utcDate, locale)} · {formatTime(match.utcDate, locale)}
          {match.venue ? ` · ${match.venue}` : ""}
          {match.matchday ? ` · ${dict.home.matchday} ${match.matchday}` : ""}
        </p>
        <div className="flex items-center justify-center gap-4 sm:gap-8">
          <TeamCol team={match.home} />
          <div className="flex w-28 flex-col items-center gap-2">
            {played ? (
              <span className={`text-4xl font-black tabular-nums ${live ? "text-red-600 dark:text-red-400" : ""}`}>
                {match.score.home}–{match.score.away}
              </span>
            ) : (
              <span className="text-3xl font-black tabular-nums text-neutral-400">
                {formatTime(match.utcDate, locale)}
              </span>
            )}
            <StatusBadge match={match} dict={dict} />
            {played && match.halfTimeScore.home != null && (
              <span className="text-xs text-neutral-500">
                {dict.match.halftime}: {match.halfTimeScore.home}–{match.halfTimeScore.away}
              </span>
            )}
          </div>
          <TeamCol team={match.away} />
        </div>
        {match.referee && (
          <p className="mt-4 text-xs text-neutral-500">
            {dict.match.referee}: {match.referee}
          </p>
        )}
      </div>

      {/* Eventos */}
      {match.events.length > 0 && (
        <section className="card px-4 py-4">
          <h2 className="mb-3 text-base font-extrabold">{dict.match.events}</h2>
          <EventTimeline match={match} dict={dict} />
        </section>
      )}

      {/* Estatísticas */}
      {match.stats && (
        <section className="card px-4 py-4">
          <h2 className="mb-3 text-base font-extrabold">{dict.match.stats}</h2>
          <StatsBars match={match} dict={dict} />
        </section>
      )}

      {/* Onze inicial */}
      {match.lineups ? (
        <section className="card px-4 py-4">
          <h2 className="mb-3 text-base font-extrabold">{dict.match.lineups}</h2>
          <LineupField match={match} dict={dict} />
        </section>
      ) : (
        match.richness === "basic" && (
          <p className="card px-4 py-4 text-xs leading-relaxed text-neutral-500">
            ℹ️ {dict.match.needsRichProvider}
          </p>
        )
      )}
    </div>
  );
}

function TeamCol({ team }: { team: MatchDetail["home"] }) {
  return (
    <div className="flex w-24 flex-col items-center gap-2 sm:w-32">
      <Crest team={team} size={56} />
      <span className="text-center text-sm font-bold leading-tight">{team.shortName}</span>
    </div>
  );
}
