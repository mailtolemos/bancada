"use client";

/**
 * Agenda estilo Flashscore: um dia sempre escolhido (hoje por omissão),
 * todos os jogos desse dia agrupados por competição — os jogos dos clubes
 * seguidos aparecem primeiro em "Os meus jogos", depois as competições
 * favoritas e o resto. Grupos colapsáveis; filtro AO VIVO; atualização
 * automática quando o dia escolhido é hoje.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Radio, Star } from "lucide-react";
import {
  LIVE_STATUSES,
  activeLeagues,
  getLeague,
  type Dictionary,
  type Locale,
  type Match,
} from "@bancada/core";
import { getPrefs, PREFS_EVENT } from "@/lib/prefs";
import { MatchCard } from "./MatchCard";
import { CompetitionIcon } from "./icons/CompetitionIcon";
import { SectionSkeleton } from "./SectionHeader";

const TZ = "Europe/Lisbon";
const DAYS_BACK = 3;
const DAYS_FORWARD = 10;
const POLL_LIVE_MS = 12_000;
const POLL_TODAY_MS = 45_000;

const keyFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const localeMap: Record<string, string> = { pt: "pt-PT", en: "en-GB", es: "es-ES", fr: "fr-FR" };

interface Day {
  key: string;
  offset: number;
  date: Date;
}

function buildDays(): Day[] {
  const days: Day[] = [];
  for (let i = -DAYS_BACK; i <= DAYS_FORWARD; i++) {
    const date = new Date(Date.now() + i * 86_400_000);
    days.push({ key: keyFmt.format(date), offset: i, date });
  }
  return days;
}

export function DayMatchBoard({
  locale,
  dict,
  initialDay,
  initialMatches,
}: {
  locale: Locale;
  dict: Dictionary;
  /** dia de hoje calculado no servidor (hora de Portugal) */
  initialDay: string;
  /** jogos de hoje já renderizados no servidor */
  initialMatches: Match[];
}) {
  const [days, setDays] = useState<Day[]>([]);
  const [selected, setSelected] = useState<string>(initialDay);
  const [matches, setMatches] = useState<Match[]>(initialMatches);
  const [loading, setLoading] = useState(false);
  const [liveOnly, setLiveOnly] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [prefs, setPrefsState] = useState<{ teamIds: number[]; leagues: string[] }>({
    teamIds: [],
    leagues: [],
  });
  const selectedRef = useRef(selected);
  selectedRef.current = selected;
  const matchesRef = useRef(matches);
  matchesRef.current = matches;

  useEffect(() => {
    setDays(buildDays());
    const sync = () => {
      const p = getPrefs();
      setPrefsState({ teamIds: p.clubs.map((c) => c.teamId), leagues: p.leagues });
    };
    sync();
    window.addEventListener(PREFS_EVENT, sync);
    return () => window.removeEventListener(PREFS_EVENT, sync);
  }, []);

  // Carrega o dia escolhido e mantém-no fresco (mais depressa com jogos ao vivo).
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const isToday = selected === initialDay;

    const load = async (showSpinner: boolean) => {
      if (showSpinner) {
        setLoading(true);
        setMatches([]);
      }
      try {
        const res = await fetch(`/api/agenda?date=${selected}`);
        if (res.ok && !cancelled && selectedRef.current === selected) {
          const data = (await res.json()) as { matches: Match[] };
          if (Array.isArray(data.matches)) setMatches(data.matches);
        }
      } catch {
        /* próxima ronda */
      } finally {
        if (!cancelled) setLoading(false);
      }
      if (isToday && !cancelled) {
        const live = matchesRef.current.some((m) => LIVE_STATUSES.includes(m.status));
        timer = setTimeout(() => load(false), live ? POLL_LIVE_MS : POLL_TODAY_MS);
      }
    };

    if (selected === initialDay && initialMatches.length) {
      // primeiro paint já veio do servidor; só agenda o refresco
      if (isToday) {
        const live = initialMatches.some((m) => LIVE_STATUSES.includes(m.status));
        timer = setTimeout(() => load(false), live ? POLL_LIVE_MS : POLL_TODAY_MS);
      }
    } else {
      load(true);
    }
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  const liveCount = matches.filter((m) => LIVE_STATUSES.includes(m.status)).length;
  const shown = liveOnly ? matches.filter((m) => LIVE_STATUSES.includes(m.status)) : matches;

  // "Os meus jogos" + grupos por competição (favoritas primeiro).
  const { mine, groups } = useMemo(() => {
    const mineList = shown.filter(
      (m) => prefs.teamIds.includes(m.home.id) || prefs.teamIds.includes(m.away.id)
    );
    const mineIds = new Set(mineList.map((m) => m.id));
    const byLeague = new Map<string, Match[]>();
    for (const m of shown) {
      if (mineIds.has(m.id)) continue;
      const list = byLeague.get(m.leagueId) ?? [];
      list.push(m);
      byLeague.set(m.leagueId, list);
    }
    const order = [
      ...prefs.leagues,
      ...activeLeagues()
        .map((l) => l.id)
        .filter((id) => !prefs.leagues.includes(id)),
    ];
    const grouped: Array<{ leagueId: string; matches: Match[] }> = [];
    for (const id of order) {
      const list = byLeague.get(id);
      if (list) grouped.push({ leagueId: id, matches: list });
    }
    return { mine: mineList, groups: grouped };
  }, [shown, prefs]);

  const weekday = new Intl.DateTimeFormat(localeMap[locale] ?? "pt-PT", { weekday: "short", timeZone: TZ });
  const dayNum = new Intl.DateTimeFormat(localeMap[locale] ?? "pt-PT", { day: "numeric", month: "numeric", timeZone: TZ });

  const labelFor = (d: Day): { top: string; bottom: string } => {
    if (d.offset === 0) return { top: dict.common.today, bottom: dayNum.format(d.date) };
    if (d.offset === 1) return { top: dict.common.tomorrow, bottom: dayNum.format(d.date) };
    if (d.offset === -1) return { top: dict.common.yesterday, bottom: dayNum.format(d.date) };
    return { top: weekday.format(d.date).replace(/\.$/, ""), bottom: dayNum.format(d.date) };
  };

  const toggleCollapsed = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const group = (id: string, title: React.ReactNode, list: Match[], starred = false) => {
    const isCollapsed = collapsed.has(id);
    return (
      <section key={id} className="card overflow-hidden">
        <button
          type="button"
          onClick={() => toggleCollapsed(id)}
          aria-expanded={!isCollapsed}
          className="flex w-full items-center gap-2 px-4 py-2.5 text-left transition-colors hover:bg-neutral-100/70 dark:hover:bg-neutral-800/50"
        >
          {starred && (
            <span className="flex h-5 w-5 items-center justify-center rounded bg-amber-400/20 text-amber-600 dark:text-amber-300">
              <Star size={12} fill="currentColor" aria-hidden />
            </span>
          )}
          <span className="flex min-w-0 flex-1 items-center gap-1.5 text-[13px] font-bold">
            {title}
          </span>
          <span className="text-[11px] tabular-nums text-neutral-500">{list.length}</span>
          <ChevronDown
            size={15}
            className={`text-neutral-400 transition-transform ${isCollapsed ? "-rotate-90" : ""}`}
            aria-hidden
          />
        </button>
        {!isCollapsed && (
          <div className="grid gap-2 border-t border-neutral-100 p-2.5 sm:grid-cols-2 dark:border-neutral-800/60">
            {list.map((m) => (
              <MatchCard key={m.id} match={m} locale={locale} dict={dict} showCompetition={starred} />
            ))}
          </div>
        )}
      </section>
    );
  };

  return (
    <div>
      {/* barra de dias + filtro ao vivo */}
      <div className="-mx-4 mb-3 overflow-x-auto px-4 pb-1">
        <div className="flex w-max items-center gap-1.5">
          <button
            type="button"
            onClick={() => setLiveOnly((v) => !v)}
            aria-pressed={liveOnly}
            className={`flex min-w-[56px] flex-col items-center rounded-xl px-2.5 py-1.5 transition-colors ${
              liveOnly
                ? "bg-red-600 text-white"
                : "bg-red-600/10 text-red-600 hover:bg-red-600/20 dark:bg-red-500/15 dark:text-red-400"
            }`}
          >
            <span className="flex items-center gap-1 text-[11px] font-bold uppercase leading-tight tracking-wide">
              <Radio size={11} aria-hidden /> {dict.match.live}
            </span>
            <span className={`text-[11px] leading-tight tabular-nums ${liveOnly ? "text-white/85" : "text-red-500/80 dark:text-red-400/80"}`}>
              {liveCount}
            </span>
          </button>
          <span className="mx-0.5 h-6 w-px bg-neutral-300 dark:bg-neutral-700" aria-hidden />
          {(days.length ? days : []).map((d) => {
            const active = selected === d.key;
            const label = labelFor(d);
            return (
              <button
                key={d.key}
                type="button"
                onClick={() => setSelected(d.key)}
                aria-pressed={active}
                className={`flex min-w-[56px] flex-col items-center rounded-xl px-2.5 py-1.5 text-center transition-colors ${
                  active
                    ? "bg-pitch-600 text-white dark:bg-pitch-500"
                    : d.offset === 0
                      ? "bg-neutral-200/80 font-semibold text-neutral-800 hover:bg-neutral-300 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700"
                      : "bg-neutral-200/60 text-neutral-600 hover:bg-neutral-300 dark:bg-neutral-800/70 dark:text-neutral-400 dark:hover:bg-neutral-700"
                }`}
              >
                <span className="text-[11px] font-bold uppercase leading-tight tracking-wide">{label.top}</span>
                <span className={`text-[11px] leading-tight ${active ? "text-white/85" : "text-neutral-500"}`}>
                  {label.bottom}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {loading && <SectionSkeleton rows={4} />}

      {!loading && !shown.length && (
        <p className="card px-4 py-8 text-center text-sm text-neutral-500">
          {liveOnly ? dict.home.noLive : dict.home.noMatchesDay}
        </p>
      )}

      {!loading && shown.length > 0 && (
        <div className="space-y-3">
          {mine.length > 0 && group("mine", dict.home.myMatches, mine, true)}
          {groups.map(({ leagueId, matches: list }) => {
            const league = getLeague(leagueId);
            return group(
              leagueId,
              <>
                {league && <CompetitionIcon league={league} size={15} />}
                <span className="truncate">{league?.name ?? leagueId}</span>
              </>,
              list
            );
          })}
        </div>
      )}
    </div>
  );
}
