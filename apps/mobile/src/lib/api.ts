/**
 * Cliente da API bancada. — a app móvel consome os mesmos endpoints /api/*
 * do backend web (Vercel). Zero lógica de fornecedores aqui: isso vive no servidor.
 */
import Constants from "expo-constants";
import type { Match, MatchDetail, NewsItem, Scorer, StandingRow } from "@bancada/core";

const API =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  "https://bancada-gules.vercel.app";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json() as Promise<T>;
}

export const api = {
  matches: (league?: string) =>
    get<{ matches: Match[] }>(`/api/matches${league ? `?league=${league}` : ""}`).then(
      (d) => d.matches
    ),
  match: (id: number, league?: string) =>
    get<{ match: MatchDetail }>(`/api/match/${id}${league ? `?league=${league}` : ""}`).then(
      (d) => d.match
    ),
  standings: (league?: string) =>
    get<{ standings: StandingRow[] }>(
      `/api/standings${league ? `?league=${league}` : ""}`
    ).then((d) => d.standings),
  scorers: (league?: string) =>
    get<{ scorers: Scorer[] }>(`/api/scorers${league ? `?league=${league}` : ""}`).then(
      (d) => d.scorers
    ),
  news: (club?: string) =>
    get<{ news: NewsItem[] }>(`/api/news${club ? `?club=${club}` : ""}`).then((d) => d.news),
  rumors: (club?: string) =>
    get<{ rumors: NewsItem[] }>(`/api/rumors${club ? `?club=${club}` : ""}`).then(
      (d) => d.rumors
    ),
  community: (club?: string) =>
    get<{ community: NewsItem[] }>(`/api/community${club ? `?club=${club}` : ""}`).then(
      (d) => d.community
    ),
};

export { API };
