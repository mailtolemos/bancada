"use client";

/**
 * Preferências do utilizador (clubes seguidos e competições favoritas).
 *
 * Guardadas no dispositivo (localStorage) e, com sessão iniciada, também na
 * conta via /api/me — o que permite sincronizar entre dispositivos.
 * Migra automaticamente o formato antigo de clube único.
 */

export interface FavoriteClub {
  slug: string;
  teamId: number;
  name: string;
  /** competição onde a equipa foi encontrada */
  leagueId?: string;
}

export interface Prefs {
  /** primeiro da lista = clube principal */
  clubs: FavoriteClub[];
  leagues: string[];
}

const KEY = "bancada:prefs";
const LEGACY_KEY = "bancada:fav-club";
export const PREFS_EVENT = "bancada:prefs-changed";

const EMPTY: Prefs = { clubs: [], leagues: [] };

export function getPrefs(): Prefs {
  if (typeof window === "undefined") return { ...EMPTY };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Prefs>;
      return {
        clubs: Array.isArray(parsed.clubs) ? parsed.clubs.filter(isClub) : [],
        leagues: Array.isArray(parsed.leagues) ? parsed.leagues.filter((l) => typeof l === "string") : [],
      };
    }
    // Migração do formato antigo (um só clube).
    const legacy = window.localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const club = JSON.parse(legacy) as FavoriteClub;
      if (isClub(club)) {
        const prefs: Prefs = { clubs: [club], leagues: [] };
        savePrefs(prefs, { sync: false });
        return prefs;
      }
    }
  } catch {
    /* armazenamento indisponível */
  }
  return { ...EMPTY };
}

function isClub(c: unknown): c is FavoriteClub {
  const club = c as FavoriteClub;
  return Boolean(club && typeof club.slug === "string" && typeof club.teamId === "number");
}

export function savePrefs(prefs: Prefs, opts?: { sync?: boolean }): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(prefs));
    // Mantém a chave antiga em dia (o clube principal) para compatibilidade.
    if (prefs.clubs[0]) window.localStorage.setItem(LEGACY_KEY, JSON.stringify(prefs.clubs[0]));
    else window.localStorage.removeItem(LEGACY_KEY);
    window.dispatchEvent(new Event(PREFS_EVENT));
    window.dispatchEvent(new Event("bancada:fav-changed"));
  } catch {
    /* ignora */
  }
  if (opts?.sync !== false) syncToAccount(prefs);
}

/** Envia para a conta (silencioso se não houver sessão). */
export function syncToAccount(prefs: Prefs): void {
  fetch("/api/me", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      club: prefs.clubs[0]?.slug ?? null,
      clubs: prefs.clubs.map((c) => c.slug),
      clubsMeta: prefs.clubs,
      leagues: prefs.leagues,
    }),
  }).catch(() => {});
}

/* ── operações ────────────────────────────────────────────────── */

export function isFollowing(slug: string, prefs = getPrefs()): boolean {
  return prefs.clubs.some((c) => c.slug === slug);
}

export function toggleClub(club: FavoriteClub): Prefs {
  const prefs = getPrefs();
  const exists = prefs.clubs.some((c) => c.slug === club.slug);
  const next: Prefs = {
    ...prefs,
    clubs: exists ? prefs.clubs.filter((c) => c.slug !== club.slug) : [...prefs.clubs, club].slice(0, 12),
  };
  savePrefs(next);
  return next;
}

export function setPrimaryClub(slug: string): Prefs {
  const prefs = getPrefs();
  const club = prefs.clubs.find((c) => c.slug === slug);
  if (!club) return prefs;
  const next: Prefs = { ...prefs, clubs: [club, ...prefs.clubs.filter((c) => c.slug !== slug)] };
  savePrefs(next);
  return next;
}

export function toggleLeague(leagueId: string): Prefs {
  const prefs = getPrefs();
  const exists = prefs.leagues.includes(leagueId);
  const next: Prefs = {
    ...prefs,
    leagues: exists ? prefs.leagues.filter((l) => l !== leagueId) : [...prefs.leagues, leagueId].slice(0, 12),
  };
  savePrefs(next);
  return next;
}

/** Aplica ao dispositivo as preferências vindas da conta (login noutro sítio). */
export function applyRemotePrefs(remote: { clubsMeta?: FavoriteClub[]; leagues?: string[] }): void {
  const local = getPrefs();
  if (!remote.clubsMeta?.length && !remote.leagues?.length) return;
  if (local.clubs.length || local.leagues.length) return; // dispositivo manda se já tem escolhas
  savePrefs(
    { clubs: (remote.clubsMeta ?? []).filter(isClub), leagues: remote.leagues ?? [] },
    { sync: false }
  );
}
