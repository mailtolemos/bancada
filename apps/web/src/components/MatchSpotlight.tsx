"use client";

/**
 * Jogo em destaque no topo da home. Escolhe o jogo mais relevante do momento:
 *  1. jogo AO VIVO de um clube seguido;
 *  2. jogo de hoje de um clube seguido (por começar, ou o resultado de há pouco);
 *  3. qualquer jogo AO VIVO (competições favoritas primeiro);
 *  4. senão, o próximo jogo do clube principal.
 * Cartão dramático com as cores dos clubes e contagem decrescente ao segundo.
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

const dayFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Lisbon",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Escolhe o jogo mais relevante de entre os de hoje + fallback do clube. */
function pickSpotlight(
  agenda: Match[],
  clubs: FavoriteClub[],
  favLeagues: string[],
  fallback: Match | null
): Match | null {
  const ids = new Set(clubs.map((c) => c.teamId));
  const mine = agenda.filter((m) => ids.has(m.home.id) || ids.has(m.away.id));

  // 1. Clube seguido ao vivo.
  const mineLive = mine.find((m) => LIVE_STATUSES.includes(m.status));
  if (mineLive) return mineLive;

  // 2. Clube seguido joga hoje: o próximo por começar, senão o resultado.
  const mineNext = mine
    .filter((m) => m.status === "TIMED" || m.status === "SCHEDULED")
    .sort((a, b) => a.utcDate.localeCompare(b.utcDate))[0];
  if (mineNext) return mineNext;
  const mineDone = mine
    .filter((m) => m.status === "FINISHED")
    .sort((a, b) => b.utcDate.localeCompare(a.utcDate))[0];
  if (mineDone) return mineDone;

  // 3. Qualquer jogo ao vivo — competições favoritas primeiro.
  const live = agenda.filter((m) => LIVE_STATUSES.includes(m.status));
  if (live.length) {
    const fav = live.find((m) => favLeagues.includes(m.leagueId));
    return fav ?? live[0]!;
  }

  // 4. O próximo jogo do clube principal (pode ser daqui a dias).
  return fallback;
}

export function MatchSpotlight({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const [prefs, setPrefsState] = useState<{ clubs: FavoriteClub[]; leagues: string[] } | null>(null);
  const [match, setMatch] = useState<Match | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const club = prefs?.clubs[0] ?? null;

  useEffect(() => {
    const sync = () => {
      const p = getPrefs();
      setPrefsState({ clubs: p.clubs.slice(0, 5), leagues: p.leagues });
    };
    sync();
    window.addEventListener(PREFS_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(PREFS_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    if (!prefs || !prefs.clubs.length) return;
    const primary = prefs.clubs[0]!;
    let cancelled = false;

    const load = async () => {
      try {
        const today = dayFmt.format(new Date());
        const [agendaRes, summaryRes] = await Promise.all([
          fetch(`/api/agenda?date=${today}`).catch(() => null),
          fetch(
            `/api/team-summary?team=${primary.teamId}&league=${primary.leagueId ?? DEFAULT_LEAGUE}`
          ).catch(() => null),
        ]);
        const agenda: Match[] =
          agendaRes?.ok ? ((await agendaRes.json()) as { matches: Match[] }).matches ?? [] : [];
        const summary: TeamSummary | null =
          summaryRes?.ok ? ((await summaryRes.json()) as TeamSummary) : null;
        const fallback = summary?.live ?? summary?.next ?? null;
        if (!cancelled) {
          setMatch(pickSpotlight(agenda, prefs.clubs, prefs.leagues, fallback));
        }
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
  }, [prefs]);

  // Relógio da contagem decrescente (só quando há jogo por começar).
  const live = match != null && LIVE_STATUSES.includes(match.status);
  useEffect(() => {
    if (!match || live) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [match, live]);

  if (!club || !match) return null;
  const followedIds = new Set(prefs!.clubs.map((c) => c.teamId));

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
          <TeamSide team={match.home} mine={followedIds.has(match.home.id)} />

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

          <TeamSide team={match.away} mine={followedIds.has(match.away.id)} />
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
