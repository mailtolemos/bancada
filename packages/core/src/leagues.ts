import type { League, LeagueId } from "./types";

/**
 * Registo de ligas. Ativar uma nova liga = mudar `active: true`
 * (e garantir que o plano da API a cobre). A UI adapta-se sozinha.
 */
export const LEAGUES: League[] = [
  {
    id: "primeira-liga",
    fdCode: "PPL",
    espnSlug: "por.1",
    afId: 94,
    name: "Liga Portugal",
    country: "Portugal",
    countryFlag: "🇵🇹",
    active: true,
  },
  {
    id: "premier-league",
    fdCode: "PL",
    espnSlug: "eng.1",
    afId: 39,
    name: "Premier League",
    country: "Inglaterra",
    countryFlag: "🏴",
    active: false,
  },
  {
    id: "la-liga",
    fdCode: "PD",
    espnSlug: "esp.1",
    afId: 140,
    name: "La Liga",
    country: "Espanha",
    countryFlag: "🇪🇸",
    active: false,
  },
  {
    id: "serie-a",
    fdCode: "SA",
    espnSlug: "ita.1",
    afId: 135,
    name: "Serie A",
    country: "Itália",
    countryFlag: "🇮🇹",
    active: false,
  },
  {
    id: "bundesliga",
    fdCode: "BL1",
    espnSlug: "ger.1",
    afId: 78,
    name: "Bundesliga",
    country: "Alemanha",
    countryFlag: "🇩🇪",
    active: false,
  },
  {
    id: "ligue-1",
    fdCode: "FL1",
    espnSlug: "fra.1",
    afId: 61,
    name: "Ligue 1",
    country: "França",
    countryFlag: "🇫🇷",
    active: false,
  },
  {
    id: "champions-league",
    fdCode: "CL",
    espnSlug: "uefa.champions",
    afId: 2,
    name: "Champions League",
    country: "Europa",
    countryFlag: "🇪🇺",
    active: false,
  },
];

export const DEFAULT_LEAGUE: LeagueId = "primeira-liga";

export function getLeague(id: string): League | undefined {
  return LEAGUES.find((l) => l.id === id);
}

export function activeLeagues(): League[] {
  return LEAGUES.filter((l) => l.active);
}
