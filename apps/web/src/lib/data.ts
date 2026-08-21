/**
 * Fachada de dados — o único módulo que as páginas/rotas conhecem.
 *
 * Fornecedores:
 *   1. ESPN (por omissão) — grátis, sem chave, rápido (~350 ms): live scores,
 *      11 inicial, eventos, estatísticas, marcadores. Não-oficial → trocar por
 *      fornecedor licenciado antes do lançamento comercial.
 *   2. football-data.org — oficial; usado com DATA_PROVIDER=football-data.
 *   3. API-Football — enriquecimento (ratings) quando há chave.
 *
 * Velocidade ao vivo: os TTL de cache adaptam-se — 10 s quando há jogos a
 * decorrer, 3 min quando não há. A UI polla mais depressa nesses períodos.
 */
import {
  DEFAULT_LEAGUE,
  LIVE_STATUSES,
  activeLeagues,
  clubMetaForTeamName,
  getLeague,
  type ApiHealth,
  type League,
  type Match,
  type MatchDetail,
  type Scorer,
  type StandingRow,
  type StandingsGroup,
} from "@bancada/core";
import { cached } from "./cache";
import * as espn from "./providers/espn";
import * as fd from "./providers/footballData";
import * as af from "./providers/apiFootball";
import { demoMatchDetail, demoMatches, demoScorers, demoStandings } from "./demo";

const TTL = {
  live: 10 * 1000, // há jogos a decorrer → dados quase em tempo real
  idle: 3 * 60 * 1000, // sem jogos → poupa pedidos
  standings: 10 * 60 * 1000,
  scorers: 30 * 60 * 1000,
  fixtures: 6 * 3600 * 1000,
} as const;

export function isDemo(): boolean {
  return process.env.BANCADA_DEMO === "1";
}

function useFootballData(league: League): boolean {
  return process.env.DATA_PROVIDER === "football-data" && fd.isConfigured() && Boolean(league.fdCode);
}

export function health(): ApiHealth[] {
  return [
    { provider: "espn (default)", configured: true, demo: isDemo() },
    { provider: "football-data.org", configured: fd.isConfigured(), demo: isDemo() },
    { provider: "API-Football", configured: af.isConfigured(), demo: isDemo() },
  ];
}

function league(leagueId?: string): League {
  return getLeague(leagueId ?? DEFAULT_LEAGUE) ?? getLeague(DEFAULT_LEAGUE)!;
}

function dateStr(offsetDays: number): string {
  return new Date(Date.now() + offsetDays * 86400_000).toISOString().slice(0, 10);
}

/** Memória curta de "esta liga tem jogo ao vivo" para escolher o TTL. */
const liveHint = new Map<string, number>();

function ttlFor(leagueId: string): number {
  const until = liveHint.get(leagueId) ?? 0;
  return Date.now() < until ? TTL.live : TTL.idle;
}

function noteLive(leagueId: string, matches: Match[]): void {
  if (matches.some((m) => LIVE_STATUSES.includes(m.status))) {
    // mantém o modo rápido durante 10 min após a última observação ao vivo
    liveHint.set(leagueId, Date.now() + 10 * 60 * 1000);
  }
}

/** Há jogos a decorrer nesta competição? (usado pela UI para pollar mais rápido) */
export function hasLiveHint(leagueId: string): boolean {
  return Date.now() < (liveHint.get(leagueId) ?? 0);
}

/** Janela relevante: 7 dias para trás e 10 para a frente. */
export async function getMatches(leagueId?: string): Promise<Match[]> {
  const lg = league(leagueId);
  if (isDemo()) return demoMatches();
  const matches = await cached<Match[]>(
    `matches:${lg.id}`,
    ttlFor(lg.id),
    () =>
      useFootballData(lg)
        ? fd.getMatches(lg, { dateFrom: dateStr(-7), dateTo: dateStr(10) })
        : espn.getMatches(lg),
    TTL.idle * 6
  ).catch(() => (lg.id === DEFAULT_LEAGUE ? demoMatches() : []));
  noteLive(lg.id, matches);
  return matches;
}

export async function getLiveMatches(leagueId?: string): Promise<Match[]> {
  const matches = await getMatches(leagueId);
  return matches.filter((m) => LIVE_STATUSES.includes(m.status));
}

/** Jogos ao vivo em TODAS as competições ativas (para a home e o detetor). */
export async function getAllLiveMatches(): Promise<Match[]> {
  const lists = await Promise.all(
    activeLeagues().map((l) => getMatches(l.id).catch(() => [] as Match[]))
  );
  return lists.flat().filter((m) => LIVE_STATUSES.includes(m.status));
}

/**
 * Competições onde uma equipa desta liga também pode jogar (provas europeias
 * para clubes europeus, Libertadores para sul-americanos). Usado para agregar
 * o calendário completo de um clube — liga + Europa.
 */
export function companionLeagues(leagueId?: string): League[] {
  const lg = league(leagueId);
  if (lg.kind === "continental") return [lg];
  const ids =
    lg.region === "portugal" || lg.region === "europa"
      ? ["champions-league", "europa-league", "conference-league"]
      : lg.region === "americas"
        ? ["libertadores"]
        : [];
  const extras = ids
    .map((id) => getLeague(id))
    .filter((l): l is League => Boolean(l?.active) && l!.id !== lg.id);
  return [lg, ...extras];
}

/**
 * Todos os jogos de uma equipa em todas as competições relevantes
 * (janela recente + época completa), sem duplicados.
 */
export async function getTeamMatches(
  teamId: number,
  leagueId?: string
): Promise<{ window: Match[]; fixtures: Match[] }> {
  const comps = companionLeagues(leagueId);
  const mine = (m: Match) => m.home.id === teamId || m.away.id === teamId;
  const dedupe = (list: Match[]) => {
    const seen = new Set<number>();
    return list.filter((m) => (seen.has(m.id) ? false : (seen.add(m.id), true)));
  };
  const [windows, fixtures] = await Promise.all([
    Promise.all(comps.map((l) => getMatches(l.id).catch(() => [] as Match[]))),
    Promise.all(comps.map((l) => getSeasonFixtures(l.id).catch(() => [] as Match[]))),
  ]);
  return {
    window: dedupe(windows.flat().filter(mine)).sort((a, b) => a.utcDate.localeCompare(b.utcDate)),
    fixtures: dedupe(fixtures.flat().filter(mine)).sort((a, b) =>
      a.utcDate.localeCompare(b.utcDate)
    ),
  };
}

/** Todos os jogos futuros da época (para exportação de calendário). */
export async function getSeasonFixtures(leagueId?: string): Promise<Match[]> {
  const lg = league(leagueId);
  if (isDemo()) return demoMatches().filter((m) => m.status === "TIMED");
  return cached<Match[]>(`fixtures:${lg.id}`, TTL.fixtures, () => espn.getSeasonFixtures(lg)).catch(
    () => []
  );
}

export async function getMatchDetail(id: number, leagueId?: string): Promise<MatchDetail | null> {
  const lg = league(leagueId);
  if (isDemo()) return demoMatchDetail(id);

  const base = await cached<MatchDetail>(`match:${id}`, ttlFor(lg.id), () =>
    useFootballData(lg) ? fd.getMatch(lg, id) : espn.getMatchDetail(lg, id)
  ).catch(() => null);
  if (!base) return isDemo() ? demoMatchDetail(id) : null;

  if (af.isConfigured() && base.richness !== "full") {
    const enrichment = await cached(
      `match:${id}:rich`,
      ttlFor(lg.id),
      () => af.enrichMatch(lg, base),
      TTL.idle
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

/** Classificação por grupos (liga simples = um grupo sem nome). */
export async function getStandingsGroups(leagueId?: string): Promise<StandingsGroup[]> {
  const lg = league(leagueId);
  if (isDemo()) return [{ name: null, rows: demoStandings() }];
  return cached<StandingsGroup[]>(`standings:${lg.id}`, TTL.standings, async () => {
    if (useFootballData(lg)) return [{ name: null, rows: await fd.getStandings(lg) }];
    return espn.getStandings(lg);
  }).catch(() => (lg.id === DEFAULT_LEAGUE ? [{ name: null, rows: demoStandings() }] : []));
}

/** Classificação achatada (compatível com vistas simples). */
export async function getStandings(leagueId?: string): Promise<StandingRow[]> {
  const groups = await getStandingsGroups(leagueId);
  return groups.flatMap((g) => g.rows);
}

export function isScorersDemo(): boolean {
  return isDemo();
}

export async function getScorers(leagueId?: string): Promise<Scorer[]> {
  const lg = league(leagueId);
  if (isDemo()) return demoScorers();
  return cached<Scorer[]>(`scorers:${lg.id}`, TTL.scorers, async () => {
    if (useFootballData(lg)) return fd.getScorers(lg);
    try {
      return await espn.getScorers(lg);
    } catch {
      if (fd.isConfigured() && lg.fdCode) return fd.getScorers(lg);
      throw new Error("sem fornecedor de marcadores");
    }
  }).catch(() => (lg.id === DEFAULT_LEAGUE ? demoScorers() : []));
}

/** Etiqueta da época em curso, ex: "2026-27" (para mostrar na UI). */
export async function getSeasonLabel(leagueId?: string): Promise<string | null> {
  const lg = league(leagueId);
  if (isDemo()) return null;
  const year = await cached<number | null>(`season:${lg.id}`, 12 * 3600 * 1000, () =>
    espn.getSeasonYear(lg)
  ).catch(() => null);
  if (!year) return null;
  return lg.region === "americas" && lg.kind === "league" ? String(year) : `${year}-${String(year + 1).slice(2)}`;
}

/**
 * Encontra uma equipa pelo slug em qualquer competição ativa.
 * Procura primeiro na competição indicada, depois nas restantes.
 */
export async function findTeamBySlug(
  slug: string,
  preferredLeagueId?: string
): Promise<{ league: League; row: StandingRow } | null> {
  const order = [
    ...(preferredLeagueId ? [league(preferredLeagueId)] : []),
    league(DEFAULT_LEAGUE),
    ...activeLeagues(),
  ];
  const seen = new Set<string>();

  for (const lg of order) {
    if (seen.has(lg.id)) continue;
    seen.add(lg.id);
    const rows = await getStandings(lg.id).catch(() => [] as StandingRow[]);
    const row = rows.find((r) => clubMetaForTeamName(r.team.name).slug === slug);
    if (row) return { league: lg, row };
  }
  return null;
}

export { getNews } from "./news";
