/**
 * Perfil do utilizador guardado no KV (Redis) — sincroniza entre dispositivos.
 * Sem sessão iniciada, a app usa localStorage; ao entrar, o perfil local é
 * fundido com o do servidor.
 */
import { kvGet, kvSet } from "./kv";

export interface UserProfile {
  /** clube favorito principal (slug) */
  club?: string | null;
  /** clubes seguidos (inclui o principal) */
  clubs: string[];
  /** competições preferidas (ids) */
  leagues: string[];
  updatedAt: string;
}

const EMPTY: UserProfile = { club: null, clubs: [], leagues: [], updatedAt: "" };

function key(userId: string): string {
  return `user:${userId}:profile`;
}

export async function getProfile(userId: string): Promise<UserProfile> {
  const raw = await kvGet(key(userId));
  if (!raw) return { ...EMPTY };
  try {
    const parsed = JSON.parse(raw) as Partial<UserProfile>;
    return {
      club: parsed.club ?? null,
      clubs: Array.isArray(parsed.clubs) ? parsed.clubs.slice(0, 20) : [],
      leagues: Array.isArray(parsed.leagues) ? parsed.leagues.slice(0, 20) : [],
      updatedAt: parsed.updatedAt ?? "",
    };
  } catch {
    return { ...EMPTY };
  }
}

export async function saveProfile(
  userId: string,
  patch: Partial<Omit<UserProfile, "updatedAt">>
): Promise<UserProfile> {
  const current = await getProfile(userId);
  const next: UserProfile = {
    club: patch.club !== undefined ? patch.club : current.club,
    clubs: dedupe(patch.clubs ?? current.clubs).slice(0, 20),
    leagues: dedupe(patch.leagues ?? current.leagues).slice(0, 20),
    updatedAt: new Date().toISOString(),
  };
  // O clube principal está sempre na lista de seguidos.
  if (next.club && !next.clubs.includes(next.club)) next.clubs.unshift(next.club);
  await kvSet(key(userId), JSON.stringify(next));
  return next;
}

function dedupe(list: string[]): string[] {
  return [...new Set(list.filter((s) => typeof s === "string" && s.length > 0))];
}
