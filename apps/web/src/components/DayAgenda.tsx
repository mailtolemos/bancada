"use client";

/**
 * Barra de dias no topo: desliza horizontalmente pelos dias da semana e,
 * ao escolher um, mostra os jogos desse dia em todas as competições,
 * agrupados por prova (favoritas primeiro). Voltar a tocar no mesmo dia fecha.
 */
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import {
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
const DAYS_BACK = 2;
const DAYS_FORWARD = 10;

const keyFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

interface Day {
  key: string; // AAAA-MM-DD
  offset: number; // dias em relação a hoje
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

const localeMap: Record<string, string> = { pt: "pt-PT", en: "en-GB", es: "es-ES", fr: "fr-FR" };

export function DayAgenda({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const [days, setDays] = useState<Day[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [favLeagues, setFavLeagues] = useState<string[]>([]);

  // Dias calculados no cliente (evita divergência servidor/cliente à meia-noite).
  useEffect(() => {
    setDays(buildDays());
    const sync = () => setFavLeagues(getPrefs().leagues);
    sync();
    window.addEventListener(PREFS_EVENT, sync);
    return () => window.removeEventListener(PREFS_EVENT, sync);
  }, []);

  useEffect(() => {
    if (!selected) return;
    let cancelled = false;
    setLoading(true);
    setMatches(null);
    fetch(`/api/agenda?date=${selected}`)
      .then((r) => (r.ok ? r.json() : { matches: [] }))
      .then((data: { matches: Match[] }) => {
        if (!cancelled) setMatches(Array.isArray(data.matches) ? data.matches : []);
      })
      .catch(() => {
        if (!cancelled) setMatches([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selected]);

  if (!days.length) {
    return <div className="mb-4 h-[52px]" aria-hidden />;
  }

  const weekday = new Intl.DateTimeFormat(localeMap[locale] ?? "pt-PT", {
    weekday: "short",
    timeZone: TZ,
  });
  const dayNum = new Intl.DateTimeFormat(localeMap[locale] ?? "pt-PT", {
    day: "numeric",
    month: "numeric",
    timeZone: TZ,
  });

  const labelFor = (d: Day): { top: string; bottom: string } => {
    if (d.offset === 0) return { top: dict.common.today, bottom: dayNum.format(d.date) };
    if (d.offset === 1) return { top: dict.common.tomorrow, bottom: dayNum.format(d.date) };
    if (d.offset === -1) return { top: dict.common.yesterday, bottom: dayNum.format(d.date) };
    return { top: weekday.format(d.date).replace(/\.$/, ""), bottom: dayNum.format(d.date) };
  };

  // Agrupa por competição, favoritas primeiro, resto pela ordem do registo.
  const groups: Array<{ leagueId: string; matches: Match[] }> = [];
  if (matches) {
    const byLeague = new Map<string, Match[]>();
    for (const m of matches) {
      const list = byLeague.get(m.leagueId) ?? [];
      list.push(m);
      byLeague.set(m.leagueId, list);
    }
    const order = [
      ...favLeagues,
      ...activeLeagues()
        .map((l) => l.id)
        .filter((id) => !favLeagues.includes(id)),
    ];
    for (const id of order) {
      const list = byLeague.get(id);
      if (list) groups.push({ leagueId: id, matches: list });
    }
  }

  return (
    <div className="mb-4">
      {/* barra de dias */}
      <div className="-mx-4 overflow-x-auto px-4 pb-1">
        <div className="flex w-max items-center gap-1.5">
          {days.map((d) => {
            const active = selected === d.key;
            const label = labelFor(d);
            return (
              <button
                key={d.key}
                type="button"
                onClick={() => setSelected(active ? null : d.key)}
                aria-pressed={active}
                className={`flex min-w-[56px] flex-col items-center rounded-xl px-2.5 py-1.5 text-center transition-colors ${
                  active
                    ? "bg-pitch-600 text-white dark:bg-pitch-500"
                    : d.offset === 0
                      ? "bg-neutral-200/80 font-semibold text-neutral-800 hover:bg-neutral-300 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700"
                      : "bg-neutral-200/60 text-neutral-600 hover:bg-neutral-300 dark:bg-neutral-800/70 dark:text-neutral-400 dark:hover:bg-neutral-700"
                }`}
              >
                <span className="text-[11px] font-bold uppercase leading-tight tracking-wide">
                  {label.top}
                </span>
                <span className={`text-[11px] leading-tight ${active ? "text-white/85" : "text-neutral-500"}`}>
                  {label.bottom}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* painel do dia escolhido */}
      {selected && (
        <div className="card mt-2 px-4 py-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-sm font-bold">
              {new Intl.DateTimeFormat(localeMap[locale] ?? "pt-PT", {
                weekday: "long",
                day: "numeric",
                month: "long",
                timeZone: TZ,
              }).format(new Date(`${selected}T12:00:00Z`))}
            </p>
            <button
              type="button"
              onClick={() => setSelected(null)}
              aria-label={dict.common.close}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-200/70 dark:hover:bg-neutral-800"
            >
              <X size={15} aria-hidden />
            </button>
          </div>

          {loading && <SectionSkeleton rows={3} />}
          {!loading && matches && !matches.length && (
            <p className="py-4 text-center text-sm text-neutral-500">{dict.home.noMatchesDay}</p>
          )}
          {!loading && groups.length > 0 && (
            <div className="space-y-5">
              {groups.map(({ leagueId, matches: list }) => {
                const league = getLeague(leagueId);
                return (
                  <section key={leagueId}>
                    <h3 className="mb-2 flex items-center gap-1.5 text-[13px] font-bold text-neutral-700 dark:text-neutral-300">
                      {league && <CompetitionIcon league={league} size={15} />}
                      {league?.name ?? leagueId}
                    </h3>
                    <div className="grid gap-2.5 sm:grid-cols-2">
                      {list.map((m) => (
                        <MatchCard key={m.id} match={m} locale={locale} dict={dict} />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
