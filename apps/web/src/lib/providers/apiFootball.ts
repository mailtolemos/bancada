/**
 * Fornecedor avançado (opcional): API-Football.
 * Quando API_FOOTBALL_KEY está definida, enriquece o detalhe de jogo com
 * 11 inicial, eventos ao minuto, estatísticas e ratings de jogadores.
 * Sem chave, a app funciona só com o fornecedor primário.
 */
import type {
  League,
  Match,
  MatchEvent,
  MatchTeamStats,
  TeamLineup,
} from "@futiq/core";

const BASE = "https://v3.football.api-sports.io";

export function isConfigured(): boolean {
  return Boolean(process.env.API_FOOTBALL_KEY) && process.env.FUTIQ_DEMO !== "1";
}

async function af<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "x-apisports-key": process.env.API_FOOTBALL_KEY! },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`API-Football ${res.status}`);
  const body = (await res.json()) as { response: T };
  return body.response;
}

interface Enrichment {
  events: MatchEvent[];
  lineups: TeamLineup[] | null;
  stats: MatchTeamStats[] | null;
}

/**
 * Encontra o fixture da API-Football correspondente a um jogo do fornecedor
 * primário (mesma data + nomes de equipa aproximados) e devolve o detalhe rico.
 */
export async function enrichMatch(league: League, match: Match): Promise<Enrichment | null> {
  if (!league.afId) return null;
  const date = match.utcDate.slice(0, 10);
  const season = seasonFor(match.utcDate);

  const fixtures = await af<Array<{
    fixture: { id: number };
    teams: { home: { id: number; name: string }; away: { id: number; name: string } };
  }>>(`/fixtures?league=${league.afId}&season=${season}&date=${date}`);

  const target = fixtures.find(
    (f) =>
      similar(f.teams.home.name, match.home.name) &&
      similar(f.teams.away.name, match.away.name)
  );
  if (!target) return null;

  const fixtureId = target.fixture.id;
  const homeAfId = target.teams.home.id;

  const [events, lineups, stats, players] = await Promise.all([
    af<Array<{
      time: { elapsed: number; extra: number | null };
      team: { id: number };
      player: { name: string | null };
      assist: { name: string | null };
      type: string;
      detail: string;
    }>>(`/fixtures/events?fixture=${fixtureId}`).catch(() => []),
    af<Array<{
      team: { id: number };
      formation: string | null;
      coach: { name: string | null };
      startXI: Array<{ player: { id: number; name: string; number: number; pos: string | null; grid: string | null } }>;
      substitutes: Array<{ player: { id: number; name: string; number: number; pos: string | null } }>;
    }>>(`/fixtures/lineups?fixture=${fixtureId}`).catch(() => []),
    af<Array<{
      team: { id: number };
      statistics: Array<{ type: string; value: number | string | null }>;
    }>>(`/fixtures/statistics?fixture=${fixtureId}`).catch(() => []),
    af<Array<{
      team: { id: number };
      players: Array<{ player: { id: number }; statistics: Array<{ games: { rating: string | null; captain: boolean } }> }>;
    }>>(`/fixtures/players?fixture=${fixtureId}`).catch(() => []),
  ]);

  const ratingById = new Map<number, { rating: number | null; captain: boolean }>();
  for (const teamPlayers of players) {
    for (const p of teamPlayers.players) {
      const g = p.statistics[0]?.games;
      ratingById.set(p.player.id, {
        rating: g?.rating ? parseFloat(g.rating) : null,
        captain: Boolean(g?.captain),
      });
    }
  }

  const mapTeamId = (afTeamId: number) => (afTeamId === homeAfId ? match.home.id : match.away.id);

  return {
    events: events.map((e) => ({
      minute: e.time.elapsed,
      extraMinute: e.time.extra,
      type: eventType(e.type, e.detail),
      teamId: mapTeamId(e.team.id),
      player: e.player.name,
      assist: e.assist.name,
      detail: e.detail,
    })),
    lineups: lineups.length
      ? lineups.map((l) => ({
          teamId: mapTeamId(l.team.id),
          formation: l.formation,
          coach: l.coach?.name ?? null,
          startXI: l.startXI.map((s) => ({
            id: s.player.id,
            name: s.player.name,
            number: s.player.number,
            position: s.player.pos,
            grid: s.player.grid,
            rating: ratingById.get(s.player.id)?.rating ?? null,
            captain: ratingById.get(s.player.id)?.captain ?? false,
          })),
          bench: l.substitutes.map((s) => ({
            id: s.player.id,
            name: s.player.name,
            number: s.player.number,
            position: s.player.pos,
            rating: ratingById.get(s.player.id)?.rating ?? null,
          })),
        }))
      : null,
    stats: stats.length
      ? stats.map((s) => {
          const get = (type: string) => {
            const v = s.statistics.find((x) => x.type === type)?.value;
            if (v == null) return null;
            if (typeof v === "string") return parseFloat(v.replace("%", "")) || null;
            return v;
          };
          return {
            teamId: mapTeamId(s.team.id),
            possession: get("Ball Possession"),
            shots: get("Total Shots"),
            shotsOnTarget: get("Shots on Goal"),
            corners: get("Corner Kicks"),
            fouls: get("Fouls"),
            offsides: get("Offsides"),
            xg: get("expected_goals"),
          };
        })
      : null,
  };
}

function eventType(type: string, detail: string): MatchEvent["type"] {
  const d = detail.toLowerCase();
  if (type === "Goal") {
    if (d.includes("own")) return "OWN_GOAL";
    if (d.includes("penalty")) return "PENALTY_GOAL";
    if (d.includes("missed")) return "PENALTY_MISSED";
    return "GOAL";
  }
  if (type === "Card") return d.includes("red") ? "RED" : "YELLOW";
  if (type === "subst") return "SUB";
  if (type === "Var") return "VAR";
  return "VAR";
}

function similar(a: string, b: string): boolean {
  const norm = (s: string) =>
    s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
  const na = norm(a);
  const nb = norm(b);
  return na.includes(nb) || nb.includes(na) || overlap(na, nb) > 0.6;
}

function overlap(a: string, b: string): number {
  const shorter = a.length < b.length ? a : b;
  const longer = a.length < b.length ? b : a;
  let hits = 0;
  for (let i = 0; i <= shorter.length - 3; i++) {
    if (longer.includes(shorter.slice(i, i + 3))) hits++;
  }
  return shorter.length > 3 ? hits / (shorter.length - 2) : 0;
}

/** Época europeia: jogos de julho–dezembro pertencem à época iniciada nesse ano. */
function seasonFor(utcDate: string): number {
  const d = new Date(utcDate);
  return d.getUTCMonth() >= 6 ? d.getUTCFullYear() : d.getUTCFullYear() - 1;
}
