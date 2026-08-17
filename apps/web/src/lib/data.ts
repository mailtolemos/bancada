/**
 * Fachada de dados — o único módulo que as páginas/rotas conhecem.
 * Decide entre modo demo e fornecedores reais, aplica cache com TTLs
 * pensados para os rate limits, e enriquece o detalhe de jogo quando o
 * fornecedor avançado está configurado.
 */
import {
  DEFAULT_LEAGUE,
  LIVE_STATUSES,
  getLeague,
  type ApiHealth,
  type Match,
  type MatchDetail,
  type Scorer,
  type StandingRow,
} from "@bancada/core";
import { cached } from "./cache";
import * as fd from "./providers/footballData";
import * as af from "./providers/apiFootball";
import {
  demoMatchDetail,
  demoMatches,
  demoScorers,
  demoStandings,
} from "./demo";

const TTL = {
  matchesLive: 30 * 1000, //  jogos com potencial ao vivo: 30s
  matchesIdle: 5 * 60 * 1000, // fora de janelas de jogo: 5 min
  standings: 10 * 60 * 1000,
  scorers: 30 * 60 * 1000,
  matchDetail: 30 * 1000,
} as const;

export function isDemo(): boolean {
  return !fd.isConfigured();
}

export function health(): ApiHealth[] {
  return [
    { provider: "football-data.org", configured: fd.isConfigured(), demo: isDemo() },
    { provider: "API-Football", configured: af.isConfigured(), demo: isDemo() },
  ];
}

function league(leagueId?: string) {
  return getLeague(leagueId ?? DEFAULT_LEAGUE) ?? getLeague(DEFAULT_LEAGUE)!;
}

function dateStr(offsetDays: number): string {
  return new Date(Date.now() + offsetDays * 86400_000).toISOString().slice(0, 10);
}

/** Janela relevante: 7 dias para trás e 10 para a frente. */
export async function getMatches(leagueId?: string): Promise<Match[]> {
  const lg = league(leagueId);
  if (isDemo()) return demoMatches();
  // Chave inválida ou API em baixo → demo em vez de ecrã vazio.
  return cached(
    `matches:${lg.id}`,
    TTL.matchesLive,
    () => fd.getMatches(lg, { dateFrom: dateStr(-7), dateTo: dateStr(10) }),
    TTL.matchesIdle * 6
  ).catch(() => demoMatches());
}

export async function getLiveMatches(leagueId?: string): Promise<Match[]> {
  const matches = await getMatches(leagueId);
  return matches.filter((m) => LIVE_STATUSES.includes(m.status));
}

export async function getMatchDetail(id: number, leagueId?: string): Promise<MatchDetail | null> {
  const lg = league(leagueId);
  if (isDemo()) return demoMatchDetail(id);

  const base = await cached(`match:${id}`, TTL.matchDetail, () => fd.getMatch(lg, id)).catch(
    () => null
  );
  if (!base) return null;

  if (af.isConfigured()) {
    const enrichment = await cached(
      `match:${id}:rich`,
      TTL.matchDetail,
      () => af.enrichMatch(lg, base),
      TTL.matchesIdle
    ).catch(() => null);
    if (enrichment) {
      return {
        ...base,
        events: enrichment.events,
        lineups: enrichment.lineups,
        stats: enrichment.stats,
        richness: "full",
      };
    }
  }
  return base;
}

export async function getStandings(leagueId?: string): Promise<StandingRow[]> {
  const lg = league(leagueId);
  if (isDemo()) return demoStandings();
  return cached(`standings:${lg.id}`, TTL.standings, () => fd.getStandings(lg)).catch(() =>
    demoStandings()
  );
}

export async function getScorers(leagueId?: string): Promise<Scorer[]> {
  const lg = league(leagueId);
  if (isDemo()) return demoScorers();
  return cached(`scorers:${lg.id}`, TTL.scorers, () => fd.getScorers(lg)).catch(() =>
    demoScorers()
  );
}

export { getNews } from "./news";
