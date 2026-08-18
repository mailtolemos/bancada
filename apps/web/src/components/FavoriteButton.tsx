"use client";

/**
 * "O meu clube" — clube favorito guardado localmente (migra para conta
 * quando existir auth). Dispara evento para a home reagir de imediato.
 */
import { useEffect, useState } from "react";
import { Star } from "lucide-react";

export interface FavoriteClub {
  slug: string;
  teamId: number;
  name: string;
}

const KEY = "bancada:fav-club";

export function getFavoriteClub(): FavoriteClub | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as FavoriteClub) : null;
  } catch {
    return null;
  }
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
    setIsFav(getFavoriteClub()?.slug === club.slug);
  }, [club.slug]);

  function toggle() {
    const next = !isFav;
    try {
      if (next) window.localStorage.setItem(KEY, JSON.stringify(club));
      else window.localStorage.removeItem(KEY);
      window.dispatchEvent(new Event("bancada:fav-changed"));
    } catch {
      /* armazenamento indisponível */
    }
    setIsFav(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
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
