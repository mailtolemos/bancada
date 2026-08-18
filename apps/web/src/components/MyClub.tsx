"use client";

/**
 * Destaque "O meu clube" na home: mostra o jogo ao vivo ou o próximo jogo
 * do clube favorito, com atalho para a página do clube.
 */
import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronRight, Star } from "lucide-react";
import { LIVE_STATUSES, type Dictionary, type Locale, type Match } from "@bancada/core";
import { getFavoriteClub, type FavoriteClub } from "./FavoriteButton";
import { MatchCard } from "./MatchCard";

export function MyClub({
  matches,
  locale,
  dict,
}: {
  matches: Match[];
  locale: Locale;
  dict: Dictionary;
}) {
  const [fav, setFav] = useState<FavoriteClub | null>(null);

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

  if (!fav) return null;

  const clubMatches = matches.filter(
    (m) => m.home.id === fav.teamId || m.away.id === fav.teamId
  );
  const live = clubMatches.find((m) => LIVE_STATUSES.includes(m.status));
  const next = clubMatches
    .filter((m) => (m.status === "TIMED" || m.status === "SCHEDULED") && new Date(m.utcDate).getTime() > Date.now() - 2 * 3600_000)
    .sort((a, b) => a.utcDate.localeCompare(b.utcDate))[0];
  const featured = live ?? next;

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
          href={`/${locale}/clube/${fav.slug}`}
          className="flex shrink-0 items-center gap-0.5 text-sm font-semibold text-pitch-600 hover:underline dark:text-pitch-400"
        >
          {fav.name} <ChevronRight size={15} aria-hidden />
        </Link>
      </div>
      {featured ? (
        <div className="grid gap-2.5 sm:grid-cols-2">
          <MatchCard match={featured} locale={locale} dict={dict} showDay />
        </div>
      ) : (
        <p className="card px-4 py-4 text-sm text-neutral-500">{dict.home.noLive}</p>
      )}
    </section>
  );
}
