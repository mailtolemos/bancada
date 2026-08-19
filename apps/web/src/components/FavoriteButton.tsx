"use client";

/**
 * Seguir/deixar de seguir um clube. Guarda na lista de preferências
 * (dispositivo + conta). O primeiro clube seguido é o principal.
 */
import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { getPrefs, isFollowing, toggleClub, PREFS_EVENT, type FavoriteClub } from "@/lib/prefs";

export type { FavoriteClub };

/** Compatibilidade: clube principal (primeiro da lista). */
export function getFavoriteClub(): FavoriteClub | null {
  return getPrefs().clubs[0] ?? null;
}

export function FavoriteButton({
  club,
  labels,
}: {
  club: FavoriteClub;
  labels: { follow: string; following: string };
}) {
  const [isFav, setIsFav] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const sync = () => setIsFav(isFollowing(club.slug));
    sync();
    window.addEventListener(PREFS_EVENT, sync);
    return () => window.removeEventListener(PREFS_EVENT, sync);
  }, [club.slug]);

  return (
    <button
      type="button"
      onClick={() => setIsFav(isFollowing(club.slug, toggleClub(club)))}
      aria-pressed={isFav}
      className={`chip transition-colors ${
        mounted && isFav
          ? "bg-amber-400/20 text-amber-700 ring-1 ring-amber-400/50 dark:text-amber-300"
          : "bg-neutral-200/80 text-neutral-700 hover:bg-neutral-300 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
      }`}
    >
      <Star size={13} fill={mounted && isFav ? "currentColor" : "none"} aria-hidden />
      {mounted && isFav ? labels.following : labels.follow}
    </button>
  );
}
