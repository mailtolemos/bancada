import type { League, LeagueId, Region } from "./types";

/**
 * Registo de competições — apenas as grandes competições mundiais.
 *
 * Ordem pensada para o público português: Liga Portugal, provas europeias
 * (UCL/UEL/UECL), grandes ligas europeias e depois o resto do mundo.
 */
export const LEAGUES: League[] = [
  /* ── Portugal ─────────────────────────────────────────── */
  {
    id: "primeira-liga",
    espnSlug: "por.1",
    fdCode: "PPL",
    afId: 94,
    name: "Liga Portugal",
    shortName: "Liga Portugal",
    country: "Portugal",
    flag: "PT",
    kind: "league",
    region: "portugal",
    active: true,
  },

  /* ── Competições UEFA ─────────────────────────────────── */
  {
    id: "champions-league",
    espnSlug: "uefa.champions",
    fdCode: "CL",
    afId: 2,
    name: "UEFA Champions League",
    shortName: "Champions",
    country: "Europa",
    kind: "continental",
    region: "uefa",
    active: true,
  },
  {
    id: "europa-league",
    espnSlug: "uefa.europa",
    fdCode: "EL",
    afId: 3,
    name: "UEFA Europa League",
    shortName: "Europa League",
    country: "Europa",
    kind: "continental",
    region: "uefa",
    active: true,
  },
  {
    id: "conference-league",
    espnSlug: "uefa.europa.conf",
    afId: 848,
    name: "UEFA Conference League",
    shortName: "Conference",
    country: "Europa",
    kind: "continental",
    region: "uefa",
    active: true,
  },

  /* ── Grandes ligas europeias ──────────────────────────── */
  {
    id: "premier-league",
    espnSlug: "eng.1",
    fdCode: "PL",
    afId: 39,
    name: "Premier League",
    shortName: "Premier League",
    country: "Inglaterra",
    flag: "GB-ENG",
    kind: "league",
    region: "europa",
    active: true,
  },
  {
    id: "la-liga",
    espnSlug: "esp.1",
    fdCode: "PD",
    afId: 140,
    name: "LaLiga",
    shortName: "LaLiga",
    country: "Espanha",
    flag: "ES",
    kind: "league",
    region: "europa",
    active: true,
  },
  {
    id: "serie-a",
    espnSlug: "ita.1",
    fdCode: "SA",
    afId: 135,
    name: "Serie A",
    shortName: "Serie A",
    country: "Itália",
    flag: "IT",
    kind: "league",
    region: "europa",
    active: true,
  },
  {
    id: "bundesliga",
    espnSlug: "ger.1",
    fdCode: "BL1",
    afId: 78,
    name: "Bundesliga",
    shortName: "Bundesliga",
    country: "Alemanha",
    flag: "DE",
    kind: "league",
    region: "europa",
    active: true,
  },
  {
    id: "ligue-1",
    espnSlug: "fra.1",
    fdCode: "FL1",
    afId: 61,
    name: "Ligue 1",
    shortName: "Ligue 1",
    country: "França",
    flag: "FR",
    kind: "league",
    region: "europa",
    active: true,
  },
  {
    id: "eredivisie",
    espnSlug: "ned.1",
    fdCode: "DED",
    afId: 88,
    name: "Eredivisie",
    shortName: "Eredivisie",
    country: "Países Baixos",
    flag: "NL",
    kind: "league",
    region: "europa",
    active: true,
  },

  /* ── Américas ─────────────────────────────────────────── */
  {
    id: "brasileirao",
    espnSlug: "bra.1",
    fdCode: "BSA",
    afId: 71,
    name: "Brasileirão Série A",
    shortName: "Brasileirão",
    country: "Brasil",
    flag: "BR",
    kind: "league",
    region: "americas",
    active: true,
  },
  {
    id: "libertadores",
    espnSlug: "conmebol.libertadores",
    afId: 13,
    name: "CONMEBOL Libertadores",
    shortName: "Libertadores",
    country: "América do Sul",
    kind: "continental",
    region: "americas",
    active: true,
  },
  {
    id: "liga-argentina",
    espnSlug: "arg.1",
    afId: 128,
    name: "Liga Profesional Argentina",
    shortName: "Argentina",
    country: "Argentina",
    flag: "AR",
    kind: "league",
    region: "americas",
    active: true,
  },
  {
    id: "mls",
    espnSlug: "usa.1",
    afId: 253,
    name: "Major League Soccer",
    shortName: "MLS",
    country: "EUA / Canadá",
    flag: "US",
    kind: "league",
    region: "americas",
    active: true,
  },
  {
    id: "liga-mx",
    espnSlug: "mex.1",
    afId: 262,
    name: "Liga MX",
    shortName: "Liga MX",
    country: "México",
    flag: "MX",
    kind: "league",
    region: "americas",
    active: true,
  },

  /* ── Resto do mundo ───────────────────────────────────── */
  {
    id: "saudi-pro-league",
    espnSlug: "ksa.1",
    afId: 307,
    name: "Saudi Pro League",
    shortName: "Saudi League",
    country: "Arábia Saudita",
    flag: "SA",
    kind: "league",
    region: "mundo",
    active: true,
  },
];

export const DEFAULT_LEAGUE: LeagueId = "primeira-liga";

export const REGION_LABELS: Record<Region, string> = {
  portugal: "Portugal",
  uefa: "Europa",
  europa: "Ligas europeias",
  americas: "Américas",
  mundo: "Mundo",
};

export function getLeague(id: string): League | undefined {
  return LEAGUES.find((l) => l.id === id);
}

export function activeLeagues(): League[] {
  return LEAGUES.filter((l) => l.active);
}

/** Competições agrupadas por região (para navegação). */
export function leaguesByRegion(): Array<{ region: Region; label: string; leagues: League[] }> {
  const order: Region[] = ["portugal", "uefa", "europa", "americas", "mundo"];
  return order
    .map((region) => ({
      region,
      label: REGION_LABELS[region],
      leagues: activeLeagues().filter((l) => l.region === region),
    }))
    .filter((g) => g.leagues.length > 0);
}
