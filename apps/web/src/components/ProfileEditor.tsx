"use client";

/**
 * Editor de preferências: clubes seguidos e competições favoritas.
 * Funciona sem sessão (guarda no dispositivo) e sincroniza com a conta
 * quando há sessão iniciada.
 */
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, Search, Star, Trash2 } from "lucide-react";
import {
  DEFAULT_LEAGUE,
  activeLeagues,
  clubMetaForTeamName,
  getLeague,
  leaguesByRegion,
  type Dictionary,
  type Locale,
  type StandingRow,
} from "@bancada/core";
import {
  applyRemotePrefs,
  getPrefs,
  setPrimaryClub,
  toggleClub,
  toggleLeague,
  PREFS_EVENT,
  type Prefs,
} from "@/lib/prefs";
import { CompetitionIcon } from "./icons/CompetitionIcon";
import { Crest } from "./Crest";

export function ProfileEditor({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const [prefs, setPrefs] = useState<Prefs>({ clubs: [], leagues: [] });
  const [signedIn, setSignedIn] = useState(false);
  const [pickerLeague, setPickerLeague] = useState<string>(DEFAULT_LEAGUE);
  const [rows, setRows] = useState<StandingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const sync = () => setPrefs(getPrefs());
    sync();
    window.addEventListener(PREFS_EVENT, sync);
    return () => window.removeEventListener(PREFS_EVENT, sync);
  }, []);

  // Traz o perfil da conta (se houver sessão) e aplica se o dispositivo estiver vazio.
  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((d: { signedIn?: boolean; profile?: { clubsMeta?: Prefs["clubs"]; leagues?: string[] } }) => {
        setSignedIn(Boolean(d.signedIn));
        if (d.signedIn && d.profile) {
          applyRemotePrefs(d.profile);
          setPrefs(getPrefs());
        }
      })
      .catch(() => {});
  }, []);

  // Lista de clubes da competição escolhida.
  useEffect(() => {
    setLoading(true);
    fetch(`/api/standings?league=${pickerLeague}`)
      .then((r) => r.json())
      .then((d: { standings?: StandingRow[] }) => setRows(d.standings ?? []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [pickerLeague]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? rows.filter((r) => r.team.name.toLowerCase().includes(q) || r.team.shortName.toLowerCase().includes(q))
      : rows;
    return [...list].sort((a, b) => a.team.shortName.localeCompare(b.team.shortName, "pt"));
  }, [rows, query]);

  const followedSlugs = new Set(prefs.clubs.map((c) => c.slug));

  return (
    <div className="space-y-8">
      <p className="text-sm text-neutral-500">
        {signedIn ? dict.profile.savedAccount : dict.profile.savedLocally}
      </p>

      {/* Clubes seguidos */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-extrabold tracking-tight">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-400/20 text-amber-600 dark:text-amber-300">
            <Star size={15} fill="currentColor" aria-hidden />
          </span>
          {dict.profile.myClubsSection}
        </h2>

        {prefs.clubs.length === 0 ? (
          <p className="card px-4 py-4 text-sm text-neutral-500">{dict.profile.noClubs}</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {prefs.clubs.map((club, i) => {
              const league = club.leagueId ? getLeague(club.leagueId) : undefined;
              return (
                <li key={club.slug} className="card flex items-center gap-3 px-3 py-2.5">
                  <span
                    className="h-8 w-1.5 shrink-0 rounded-full"
                    style={{ background: clubMetaForTeamName(club.name).colors.primary }}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/${locale}/clube/${club.slug}${club.leagueId && club.leagueId !== DEFAULT_LEAGUE ? `?liga=${club.leagueId}` : ""}`}
                      className="truncate font-bold hover:underline"
                    >
                      {club.name}
                    </Link>
                    <p className="flex items-center gap-1.5 text-xs text-neutral-500">
                      {league && <CompetitionIcon league={league} size={12} />}
                      {league?.shortName ?? ""}
                      {i === 0 && (
                        <span className="chip ml-1 bg-amber-400/20 px-1.5 py-0 text-[10px] text-amber-700 dark:text-amber-300">
                          {dict.profile.primary}
                        </span>
                      )}
                    </p>
                  </div>
                  {i > 0 && (
                    <button
                      type="button"
                      onClick={() => setPrefs(setPrimaryClub(club.slug))}
                      title={dict.profile.setPrimary}
                      className="rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-neutral-200/70 hover:text-amber-500 dark:hover:bg-neutral-800"
                    >
                      <Star size={15} aria-hidden />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setPrefs(toggleClub(club))}
                    title={dict.profile.remove}
                    className="rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-neutral-200/70 hover:text-red-500 dark:hover:bg-neutral-800"
                  >
                    <Trash2 size={15} aria-hidden />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Adicionar clube */}
      <section>
        <h2 className="mb-3 text-lg font-extrabold tracking-tight">{dict.profile.addClub}</h2>

        <div className="-mx-4 mb-3 overflow-x-auto px-4">
          <div className="flex w-max gap-1.5">
            {activeLeagues().map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => setPickerLeague(l.id)}
                className={`chip whitespace-nowrap transition-colors ${
                  l.id === pickerLeague
                    ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                    : "bg-neutral-200/80 text-neutral-600 hover:bg-neutral-300 dark:bg-neutral-800 dark:text-neutral-300"
                }`}
              >
                <CompetitionIcon league={l} size={14} /> {l.shortName}
              </button>
            ))}
          </div>
        </div>

        <label className="mb-3 flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 dark:border-neutral-800 dark:bg-neutral-900">
          <Search size={15} className="shrink-0 text-neutral-400" aria-hidden />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={dict.profile.searchClub}
            className="w-full bg-transparent text-sm outline-none placeholder:text-neutral-400"
          />
        </label>

        {loading ? (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card h-12 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((row) => {
              const slug = clubMetaForTeamName(row.team.name).slug;
              const following = followedSlugs.has(slug);
              return (
                <button
                  key={`${row.team.id}-${row.position}`}
                  type="button"
                  onClick={() =>
                    setPrefs(
                      toggleClub({
                        slug,
                        teamId: row.team.id,
                        name: row.team.shortName,
                        leagueId: pickerLeague,
                      })
                    )
                  }
                  className={`card flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors ${
                    following
                      ? "ring-1 ring-pitch-500/50"
                      : "hover:bg-neutral-100 dark:hover:bg-neutral-800/60"
                  }`}
                >
                  <Crest team={row.team} size={22} />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {row.team.shortName}
                  </span>
                  {following ? (
                    <Check size={15} className="shrink-0 text-pitch-600 dark:text-pitch-400" aria-hidden />
                  ) : (
                    <span className="shrink-0 text-xs font-semibold text-neutral-400">
                      {dict.profile.follow}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Competições favoritas */}
      <section>
        <h2 className="mb-1 text-lg font-extrabold tracking-tight">{dict.profile.leaguesSection}</h2>
        <p className="mb-3 text-xs text-neutral-500">{dict.profile.leaguesHint}</p>
        <div className="space-y-3">
          {leaguesByRegion().map((group) => (
            <div key={group.region}>
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-neutral-400">
                {group.label}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {group.leagues.map((l) => {
                  const on = prefs.leagues.includes(l.id);
                  return (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => setPrefs(toggleLeague(l.id))}
                      className={`chip transition-colors ${
                        on
                          ? "bg-pitch-600 text-white"
                          : "bg-neutral-200/80 text-neutral-600 hover:bg-neutral-300 dark:bg-neutral-800 dark:text-neutral-300"
                      }`}
                    >
                      <CompetitionIcon league={l} size={14} /> {l.shortName}
                      {on && <Check size={12} aria-hidden />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
