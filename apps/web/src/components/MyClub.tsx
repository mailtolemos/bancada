"use client";

/**
 * "O meu clube" na home: caixa do último jogo (resultado) e caixa do próximo
 * jogo, cada uma com competição, data e adversário. Se houver jogo a decorrer,
 * ele toma o lugar do próximo.
 */
import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronRight, Star } from "lucide-react";
import {
  DEFAULT_LEAGUE,
  LIVE_STATUSES,
  getLeague,
  type Dictionary,
  type Locale,
  type Match,
} from "@bancada/core";
import { formatDate, formatTime } from "@/lib/format";
import { getFavoriteClub, type FavoriteClub } from "./FavoriteButton";
import { CompetitionIcon } from "./icons/CompetitionIcon";
import { Crest } from "./Crest";

const POLL_MS = 60_000;

interface TeamSummary {
  last: Match | null;
  next: Match | null;
  live: Match | null;
}

export function MyClub({
  matches,
  locale,
  dict,
}: {
  /** jogos já renderizados no servidor (evita ecrã vazio no arranque) */
  matches: Match[];
  locale: Locale;
  dict: Dictionary;
}) {
  const [fav, setFav] = useState<FavoriteClub | null>(null);
  const [summary, setSummary] = useState<TeamSummary | null>(null);

  useEffect(() => {
    const sync = () => setFav(getFavoriteClub());
    sync();
    window.addEventListener("bancada:fav-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("bancada:fav-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  // Resumo do clube: último jogo, jogo a decorrer e próximo (época completa).
  useEffect(() => {
    if (!fav) return;
    const leagueId = fav.leagueId ?? DEFAULT_LEAGUE;
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch(`/api/team-summary?team=${fav.teamId}&league=${leagueId}`);
        if (!res.ok) return;
        const data = (await res.json()) as TeamSummary;
        if (!cancelled) setSummary(data);
      } catch {
        /* mantém o que já tem */
      }
    };

    load();
    const timer = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [fav]);

  if (!fav) return null;

  // Enquanto o resumo não chega, usa o que veio do servidor para não piscar.
  const fallback = matches.filter((m) => m.home.id === fav.teamId || m.away.id === fav.teamId);
  const live =
    summary?.live ?? fallback.find((m) => LIVE_STATUSES.includes(m.status)) ?? undefined;
  const last =
    summary?.last ??
    fallback.filter((m) => m.status === "FINISHED").sort((a, b) => b.utcDate.localeCompare(a.utcDate))[0];
  const next =
    summary?.next ??
    fallback
      .filter((m) => m.status === "TIMED" || m.status === "SCHEDULED")
      .sort((a, b) => a.utcDate.localeCompare(b.utcDate))[0];

  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-400/20 text-amber-600 dark:text-amber-300">
            <Star size={15} fill="currentColor" aria-hidden />
          </span>
          {dict.home.myClub}
        </h2>
        <Link
          href={`/${locale}/clube/${fav.slug}${fav.leagueId && fav.leagueId !== DEFAULT_LEAGUE ? `?liga=${fav.leagueId}` : ""}`}
          className="flex shrink-0 items-center gap-0.5 text-sm font-semibold text-pitch-600 hover:underline dark:text-pitch-400"
        >
          {fav.name} <ChevronRight size={15} aria-hidden />
        </Link>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2">
        <EventBox
          label={dict.home.lastMatch}
          match={last}
          teamId={fav.teamId}
          locale={locale}
          dict={dict}
          emptyText={dict.home.noRecentMatch}
        />
        <EventBox
          label={live ? dict.home.liveNowShort : dict.home.nextMatch}
          match={live ?? next}
          teamId={fav.teamId}
          locale={locale}
          dict={dict}
          emptyText={dict.home.noNextMatch}
          highlight={Boolean(live)}
        />
      </div>
    </section>
  );
}

function EventBox({
  label,
  match,
  teamId,
  locale,
  dict,
  emptyText,
  highlight = false,
}: {
  label: string;
  match: Match | undefined;
  teamId: number;
  locale: Locale;
  dict: Dictionary;
  emptyText: string;
  highlight?: boolean;
}) {
  if (!match) {
    return (
      <div className="card px-4 py-4">
        <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-neutral-500">{label}</p>
        <p className="text-sm text-neutral-500">{emptyText}</p>
      </div>
    );
  }

  const league = getLeague(match.leagueId);
  const played = match.score.home != null;
  const isHome = match.home.id === teamId;
  const myScore = isHome ? match.score.home : match.score.away;
  const theirScore = isHome ? match.score.away : match.score.home;
  const outcome =
    played && myScore != null && theirScore != null
      ? myScore > theirScore
        ? "win"
        : myScore < theirScore
          ? "loss"
          : "draw"
      : null;

  const ligaParam = match.leagueId !== DEFAULT_LEAGUE ? `?liga=${match.leagueId}` : "";

  return (
    <Link
      href={`/${locale}/jogo/${match.id}${ligaParam}`}
      className={`card block px-4 py-3 transition-transform hover:-translate-y-0.5 hover:shadow-md ${
        highlight ? "ring-1 ring-red-500/40" : ""
      }`}
    >
      {/* cabeçalho: rótulo + competição + data */}
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <span
          className={`text-[11px] font-bold uppercase tracking-wide ${
            highlight ? "text-red-600 dark:text-red-400" : "text-neutral-500"
          }`}
        >
          {highlight && (
            <span className="mr-1 inline-block h-1.5 w-1.5 animate-pulse-live rounded-full bg-red-600 align-middle dark:bg-red-400" />
          )}
          {label}
        </span>
        <span className="flex min-w-0 items-center gap-1.5 text-[11px] text-neutral-500">
          {league && <CompetitionIcon league={league} size={13} />}
          <span className="truncate">{league?.shortName ?? ""}</span>
        </span>
      </div>

      {/* equipas + resultado */}
      <div className="space-y-1.5">
        <TeamLine
          team={match.home}
          score={match.score.home}
          mine={match.home.id === teamId}
          played={played}
        />
        <TeamLine
          team={match.away}
          score={match.score.away}
          mine={match.away.id === teamId}
          played={played}
        />
      </div>

      {/* rodapé: quando aconteceu / vai acontecer */}
      <p className="mt-2.5 flex items-center gap-1.5 border-t border-neutral-100 pt-2 text-[11px] text-neutral-500 dark:border-neutral-800/60">
        {outcome && (
          <span
            className={`inline-flex h-4 w-4 items-center justify-center rounded text-[10px] font-black text-white ${
              outcome === "win" ? "bg-emerald-500" : outcome === "loss" ? "bg-red-500" : "bg-neutral-400"
            }`}
          >
            {outcome === "win" ? "V" : outcome === "loss" ? "D" : "E"}
          </span>
        )}
        {formatDate(match.utcDate, locale)}
        {!played && ` · ${formatTime(match.utcDate, locale)}`}
        {match.venue ? ` · ${match.venue}` : ""}
      </p>
    </Link>
  );
}

function TeamLine({
  team,
  score,
  mine,
  played,
}: {
  team: Match["home"];
  score: number | null;
  mine: boolean;
  played: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <Crest team={team} size={20} />
      <span className={`min-w-0 flex-1 truncate text-sm ${mine ? "font-bold" : "font-medium text-neutral-600 dark:text-neutral-400"}`}>
        {team.shortName}
      </span>
      {played && score != null && (
        <span className={`text-sm tabular-nums ${mine ? "font-extrabold" : "font-semibold"}`}>{score}</span>
      )}
    </div>
  );
}
