/**
 * Fachada de dados — o único módulo que as páginas/rotas conhecem.
 *
 * Fornecedores (por ordem):
 *   1. ESPN (por omissão) — grátis, sem chave: live scores, 11 inicial,
 *      eventos, estatísticas. Não-oficial → trocar por fornecedor licenciado
 *      antes do lançamento comercial.
 *   2. football-data.org — oficial; usado se DATA_PROVIDER=football-data.
 *   3. API-Football — enriquecimento (ratings) quando há chave.
 *   4. Demo — BANCADA_DEMO=1 ou todos os fornecedores em baixo.
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
import * as espn from "./providers/espn";
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
  return process.env.BANCADA_DEMO === "1";
}

function useFootballData(): boolean {
  return process.env.DATA_PROVIDER === "football-data" && fd.isConfigured();
}

export function health(): ApiHealth[] {
  return [
    { provider: "espn (default)", configured: !useFootballData(), demo: isDemo() },
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
  return cached(
    `matches:${lg.id}`,
    TTL.matchesLive,
    () =>
      useFootballData()
        ? fd.getMatches(lg, { dateFrom: dateStr(-7), dateTo: dateStr(10) })
        : espn.getMatches(lg),
    TTL.matchesIdle * 6
  ).catch(() => (lg.id === DEFAULT_LEAGUE ? demoMatches() : []));
}

export async function getLiveMatches(leagueId?: string): Promise<Match[]> {
  const matches = await getMatches(leagueId);
  return matches.filter((m) => LIVE_STATUSES.includes(m.status));
}

export async function getMatchDetail(id: number, leagueId?: string): Promise<MatchDetail | null> {
  const lg = league(leagueId);
  if (isDemo()) return demoMatchDetail(id);

  const base = await cached(`match:${id}`, TTL.matchDetail, () =>
    useFootballData() ? fd.getMatch(lg, id) : espn.getMatchDetail(lg, id)
  ).catch(() => null);
  if (!base) return demoMatchDetail(id);

  // Enriquecimento opcional (ratings de jogadores) via API-Football.
  if (af.isConfigured() && base.richness !== "full") {
    const enrichment = await cached(
      `match:${id}:rich`,
      TTL.matchDetail,
      () => af.enrichMatch(lg, base),
      TTL.matchesIdle
    ).catch(() => null);
    if (enrichment) {
      return {
        ...base,
        events: enrichment.events.length ? enrichment.events : base.events,
        lineups: enrichment.lineups ?? base.lineups,
        stats: enrichment.stats ?? base.stats,
        richness: "full",
      };
    }
  }
  return base;
}

export async function getStandings(leagueId?: string): Promise<StandingRow[]> {
  const lg = league(leagueId);
  if (isDemo()) return demoStandings();
  return cached(`standings:${lg.id}`, TTL.standings, () =>
    useFootballData() ? fd.getStandings(lg) : espn.getStandings(lg)
  ).catch(() => (lg.id === DEFAULT_LEAGUE ? demoStandings() : []));
}

/** Marcadores reais: ESPN leaders; football-data como alternativa; demo em último caso. */
export function isScorersDemo(): boolean {
  return isDemo();
}

export async function getScorers(leagueId?: string): Promise<Scorer[]> {
  const lg = league(leagueId);
  if (isDemo()) return demoScorers();
  return cached(`scorers:${lg.id}`, TTL.scorers, async () => {
    if (useFootballData() && lg.id === DEFAULT_LEAGUE) return fd.getScorers(lg);
    try {
      return await espn.getScorers(lg);
    } catch {
      if (fd.isConfigured() && lg.id === DEFAULT_LEAGUE) return fd.getScorers(lg);
      throw new Error("sem fornecedor de marcadores");
    }
  }).catch(() => (lg.id === DEFAULT_LEAGUE ? demoScorers() : []));
}

export { getNews } from "./news";
