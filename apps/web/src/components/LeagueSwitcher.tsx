"use client";

/**
 * Seletor de competição. As competições marcadas como favoritas no perfil
 * aparecem primeiro (com estrela); as restantes seguem agrupadas por região.
 */
import Link from "next/link";
import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { DEFAULT_LEAGUE, getLeague, leaguesByRegion, type League } from "@bancada/core";
import { getPrefs, PREFS_EVENT } from "@/lib/prefs";
import { CompetitionIcon } from "./icons/CompetitionIcon";

export function LeagueSwitcher({ basePath, current }: { basePath: string; current: string }) {
  const [favourites, setFavourites] = useState<string[]>([]);

  useEffect(() => {
    const sync = () => setFavourites(getPrefs().leagues);
    sync();
    window.addEventListener(PREFS_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(PREFS_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const regions = leaguesByRegion();
  if (regions.length === 0) return null;

  const favLeagues = favourites
    .map((id) => getLeague(id))
    .filter((l): l is League => Boolean(l?.active));
  const favIds = new Set(favLeagues.map((l) => l.id));

  const chip = (league: League, starred = false) => {
    const active = league.id === current;
    const href = league.id === DEFAULT_LEAGUE ? basePath : `${basePath}?liga=${league.id}`;
    return (
      <Link
        key={`${starred ? "fav-" : ""}${league.id}`}
        href={href}
        title={league.name}
        className={`chip whitespace-nowrap transition-colors ${
          active
            ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
            : "bg-neutral-200/80 text-neutral-600 hover:bg-neutral-300 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
        }`}
      >
        {starred && (
          <Star size={11} className="text-amber-500" fill="currentColor" aria-hidden />
        )}
        <CompetitionIcon league={league} size={15} /> {league.shortName}
      </Link>
    );
  };

  return (
    <div className="-mx-4 mb-4 overflow-x-auto px-4 pb-1">
      <div className="flex w-max items-center gap-1.5">
        {favLeagues.length > 0 && (
          <>
            {favLeagues.map((l) => chip(l, true))}
            <span className="mx-1 h-4 w-px bg-neutral-300 dark:bg-neutral-700" aria-hidden />
          </>
        )}
        {regions.map((group, gi) => {
          const rest = group.leagues.filter((l) => !favIds.has(l.id));
          if (!rest.length) return null;
          return (
            <div key={group.region} className="flex items-center gap-1.5">
              {gi > 0 && favLeagues.length === 0 && (
                <span className="mx-1 h-4 w-px bg-neutral-300 dark:bg-neutral-700" aria-hidden />
              )}
              {rest.map((l) => chip(l))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
