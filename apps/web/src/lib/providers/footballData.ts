/**
 * Fornecedor primário: football-data.org (v4).
 * Free tier: Liga Portugal (PPL) — resultados, calendário, classificação,
 * melhores marcadores. Sem 11 inicial nem eventos (isso vem do fornecedor
 * avançado quando configurado).
 */
import type {
  League,
  Match,
  MatchDetail,
  MatchStatus,
  Scorer,
  StandingRow,
  TeamRef,
} from "@futiq/core";

const BASE = "https://api.football-data.org/v4";

function apiKey(): string | undefined {
  return process.env.FOOTBALL_DATA_API_KEY || undefined;
}

export function isConfigured(): boolean {
  return Boolean(apiKey()) && process.env.FUTIQ_DEMO !== "1";
}

async function fd<T>(path: string): Promise<T> {
  const key = apiKey();
  if (!key) throw new Error("FOOTBALL_DATA_API_KEY não definida");
  const res = await fetch(`${BASE}${path}`, {
    headers: { "X-Auth-Token": key },
    // Cache no nível do nosso módulo `cached()` — aqui pedimos sempre fresco.
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`football-data.org ${res.status}: ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

/* ── Normalização ─────────────────────────────────────────────── */

interface FdTeam {
  id: number;
  name: string;
  shortName: string | null;
  tla: string | null;
  crest: string | null;
}

function team(t: FdTeam): TeamRef {
  return {
    id: t.id,
    name: t.name ?? "—",
    shortName: t.shortName ?? t.name ?? "—",
    tla: t.tla ?? (t.shortName ?? t.name ?? "?").slice(0, 3).toUpperCase(),
    crest: t.crest ?? "",
  };
}

interface FdMatch {
  id: number;
  utcDate: string;
  status: MatchStatus;
  minute?: number | null;
  matchday: number | null;
  homeTeam: FdTeam;
  awayTeam: FdTeam;
  score: {
    fullTime: { home: number | null; away: number | null };
    halfTime: { home: number | null; away: number | null };
  };
  venue?: string | null;
  referees?: { name: string }[];
}

function match(m: FdMatch, leagueId: League["id"]): Match {
  return {
    id: m.id,
    leagueId,
    utcDate: m.utcDate,
    status: m.status,
    minute: typeof m.minute === "number" ? m.minute : null,
    matchday: m.matchday,
    home: team(m.homeTeam),
    away: team(m.awayTeam),
    score: { home: m.score.fullTime.home, away: m.score.fullTime.away },
    halfTimeScore: { home: m.score.halfTime.home, away: m.score.halfTime.away },
    venue: m.venue ?? null,
    referee: m.referees?.[0]?.name ?? null,
  };
}

/* ── Endpoints ────────────────────────────────────────────────── */

export async function getMatches(league: League, opts?: { dateFrom?: string; dateTo?: string; matchday?: number }): Promise<Match[]> {
  const params = new URLSearchParams();
  if (opts?.dateFrom) params.set("dateFrom", opts.dateFrom);
  if (opts?.dateTo) params.set("dateTo", opts.dateTo);
  if (opts?.matchday) params.set("matchday", String(opts.matchday));
  const qs = params.toString();
  const data = await fd<{ matches: FdMatch[] }>(
    `/competitions/${league.fdCode}/matches${qs ? `?${qs}` : ""}`
  );
  return data.matches.map((m) => match(m, league.id));
}

export async function getMatch(league: League, id: number): Promise<MatchDetail> {
  const m = await fd<FdMatch>(`/matches/${id}`);
  return {
    ...match(m, league.id),
    events: [],
    lineups: null,
    stats: null,
    richness: "basic",
  };
}

export async function getStandings(league: League): Promise<StandingRow[]> {
  const data = await fd<{
    standings: { type: string; table: Array<{
      position: number;
      team: FdTeam;
      playedGames: number;
      won: number;
      draw: number;
      lost: number;
      points: number;
      goalsFor: number;
      goalsAgainst: number;
      goalDifference: number;
      form: string | null;
    }> }[];
  }>(`/competitions/${league.fdCode}/standings`);
  const total = data.standings.find((s) => s.type === "TOTAL") ?? data.standings[0];
  return (total?.table ?? []).map((row) => ({
    position: row.position,
    team: team(row.team),
    playedGames: row.playedGames,
    won: row.won,
    draw: row.draw,
    lost: row.lost,
    points: row.points,
    goalsFor: row.goalsFor,
    goalsAgainst: row.goalsAgainst,
    goalDifference: row.goalDifference,
    form: row.form ? row.form.replace(/,/g, "") : null,
  }));
}

export async function getScorers(league: League): Promise<Scorer[]> {
  const data = await fd<{ scorers: Array<{
    player: { id: number; name: string; nationality: string | null };
    team: FdTeam;
    goals: number;
    assists: number | null;
    penalties: number | null;
    playedMatches: number | null;
  }> }>(`/competitions/${league.fdCode}/scorers?limit=20`);
  return data.scorers.map((s) => ({
    player: s.player,
    team: team(s.team),
    goals: s.goals,
    assists: s.assists,
    penalties: s.penalties,
    playedMatches: s.playedMatches,
  }));
}

export async function getCurrentMatchday(league: League): Promise<number | null> {
  const data = await fd<{ currentSeason?: { currentMatchday: number | null } }>(
    `/competitions/${league.fdCode}`
  );
  return data.currentSeason?.currentMatchday ?? null;
}
