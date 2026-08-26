"use client";

/**
 * Jogo em destaque no topo da home: o próximo (ou atual) jogo do clube
 * principal do utilizador, num cartão dramático com as cores dos clubes,
 * contagem decrescente para o apito inicial e resultado grande ao vivo.
 */
import Link from "next/link";
import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import {
  DEFAULT_LEAGUE,
  LIVE_STATUSES,
  clubMetaForTeamName,
  getLeague,
  type Dictionary,
  type Locale,
  type Match,
} from "@bancada/core";
import { formatDate, formatTime } from "@/lib/format";
import { getPrefs, PREFS_EVENT, type FavoriteClub } from "@/lib/prefs";
import { Crest } from "./Crest";
import { CompetitionIcon } from "./icons/CompetitionIcon";

interface TeamSummary {
  last: Match | null;
  next: Match | null;
  live: Match | null;
}

export function MatchSpotlight({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const [club, setClub] = useState<FavoriteClub | null>(null);
  const [match, setMatch] = useState<Match | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const sync = () => setClub(getPrefs().clubs[0] ?? null);
    sync();
    window.addEventListener(PREFS_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(PREFS_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    if (!club) return;
    let cancelled = false;
    const load = async () => {
      try {
        const league = club.leagueId ?? DEFAULT_LEAGUE;
        const res = await fetch(`/api/team-summary?team=${club.teamId}&league=${league}`);
        if (!res.ok) return;
        const data = (await res.json()) as TeamSummary;
        if (!cancelled) setMatch(data.live ?? data.next ?? null);
      } catch {
        /* fica como está */
      }
    };
    load();
    const timer = setInterval(load, 30_000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [club]);

  // Relógio da contagem decrescente (só quando há jogo por começar).
  const live = match != null && LIVE_STATUSES.includes(match.status);
  useEffect(() => {
    if (!match || live) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [match, live]);

  if (!club || !match) return null;

  const league = getLeague(match.leagueId);
  const homeMeta = clubMetaForTeamName(match.home.name);
  const awayMeta = clubMetaForTeamName(match.away.name);
  const colorA = homeMeta.colors.primary !== "#64748B" ? homeMeta.colors.primary : "#0a9a58";
  const colorB = awayMeta.colors.primary !== "#64748B" ? awayMeta.colors.primary : "#14532d";

  const kickoff = new Date(match.utcDate).getTime();
  const delta = Math.max(0, kickoff - now);
  const days = Math.floor(delta / 86_400_000);
  const hours = Math.floor((delta % 86_400_000) / 3_600_000);
  const mins = Math.floor((delta % 3_600_000) / 60_000);
  const secs = Math.floor((delta % 60_000) / 1000);
  const played = match.score.home != null;

  const ligaParam = match.leagueId !== DEFAULT_LEAGUE ? `?liga=${match.leagueId}` : "";

  return (
    <Link
      href={`/${locale}/jogo/${match.id}${ligaParam}`}
      className={`relative block overflow-hidden rounded-3xl text-white transition-transform hover:-translate-y-0.5 ${
        live ? "shadow-glow-live" : "shadow-glow"
      } animate-fade-up`}
      style={{ background: "#0b0e0c" }}
    >
      {/* faixas de cor dos dois clubes */}
      <div
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{
          background: `radial-gradient(640px 320px at 0% 50%, ${colorA}55, transparent 65%), radial-gradient(640px 320px at 100% 50%, ${colorB}55, transparent 65%), radial-gradient(900px 300px at 50% -120px, rgb(34 229 132 / 0.16), transparent 70%)`,
        }}
        aria-hidden
      />

      <div className="relative px-5 py-6 sm:px-8">
        {/* topo: competição */}
        <div className="mb-5 flex items-center justify-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-white/70">
          {league && <CompetitionIcon league={league} size={13} />}
          {league?.name}
          {match.matchday ? ` · J${match.matchday}` : ""}
        </div>

        <div className="flex items-center justify-between gap-3 sm:gap-8">
          <TeamSide team={match.home} mine={match.home.id === club.teamId} />

          <div className="flex w-40 shrink-0 flex-col items-center gap-1.5 sm:w-48">
            {live ? (
              <>
                <span className="chip bg-red-500/20 text-red-300 ring-1 ring-red-400/40">
                  <span className="h-1.5 w-1.5 animate-pulse-live rounded-full bg-red-400" />
                  {match.status === "PAUSED"
                    ? dict.match.halftime
                    : match.minute != null
                      ? `${match.minute}'`
                      : dict.match.live}
                </span>
                <p className="text-5xl font-black tabular-nums tracking-tight sm:text-6xl">
                  {match.score.home}
                  <span className="mx-1 text-white/40">–</span>
                  {match.score.away}
                </p>
              </>
            ) : played ? (
              <p className="text-5xl font-black tabular-nums tracking-tight sm:text-6xl">
                {match.score.home}
                <span className="mx-1 text-white/40">–</span>
                {match.score.away}
              </p>
            ) : (
              <>
                <p className="text-3xl font-black tabular-nums sm:text-4xl">
                  {formatTime(match.utcDate, locale)}
                </p>
                {/* contagem decrescente */}
                {delta > 0 && days < 10 && (
                  <div className="flex items-center gap-1 text-center">
                    {(days > 0 ? [[days, "d"], [hours, "h"], [mins, "m"]] : [[hours, "h"], [mins, "m"], [secs, "s"]]).map(
                      ([v, u]) => (
                        <span
                          key={u as string}
                          className="min-w-[2.4rem] rounded-lg bg-white/[0.08] px-1.5 py-1 text-sm font-bold tabular-nums ring-1 ring-white/10"
                        >
                          {String(v).padStart(2, "0")}
                          <span className="ml-0.5 text-[10px] font-semibold text-white/50">{u}</span>
                        </span>
                      )
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          <TeamSide team={match.away} mine={match.away.id === club.teamId} />
        </div>

        {/* rodapé: data e estádio */}
        <p className="mt-5 flex items-center justify-center gap-1.5 text-xs text-white/60">
          {formatDate(match.utcDate, locale)}
          {match.venue && (
            <>
              <span className="text-white/30">·</span>
              <MapPin size={12} aria-hidden /> {match.venue}
            </>
          )}
        </p>
      </div>
    </Link>
  );
}

function TeamSide({ team, mine }: { team: Match["home"]; mine: boolean }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-2.5">
      <Crest team={team} size={64} />
      <p
        className={`max-w-full truncate text-center text-sm sm:text-base ${
          mine ? "font-extrabold" : "font-semibold text-white/85"
        }`}
      >
        {team.shortName}
      </p>
    </div>
  );
}
