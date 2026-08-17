/**
 * Fornecedor por omissão: API pública da ESPN (sem chave).
 * Cobre a Liga Portugal (e as principais ligas europeias) com resultados ao
 * vivo, calendário, classificação, 11 inicial, eventos e estatísticas.
 *
 * Nota comercial: é uma API não-oficial, sem SLA. Perfeita para desenvolvimento
 * e beta; antes do lançamento pago, licenciar um fornecedor oficial
 * (API-Football/SportMonks) — a arquitetura já o permite sem mudar a UI.
 */
import type {
  League,
  LineupPlayer,
  Match,
  MatchDetail,
  MatchEvent,
  MatchStatus,
  MatchTeamStats,
  Scorer,
  StandingRow,
  TeamLineup,
  TeamRef,
} from "@bancada/core";

const BASE = "https://site.api.espn.com/apis/site/v2/sports/soccer";
const BASE_V2 = "https://site.api.espn.com/apis/v2/sports/soccer";
const BASE_CORE = "https://sports.core.api.espn.com/v2/sports/soccer/leagues";

/** Época europeia: julho–dezembro pertencem à época iniciada nesse ano. */
function seasonYear(): number {
  const now = new Date();
  return now.getUTCMonth() >= 6 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;
}

async function espn<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    // Nota: o edge da ESPN rejeita alguns User-Agents; este passa de forma fiável.
    headers: { "User-Agent": "curl/8.5.0", Accept: "*/*" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`ESPN ${res.status}`);
  return res.json() as Promise<T>;
}

function slug(league: League): string {
  if (!league.espnSlug) throw new Error(`Liga sem slug ESPN: ${league.id}`);
  return league.espnSlug;
}

/* ── Normalização ─────────────────────────────────────────────── */

interface EspnTeam {
  id: string;
  displayName?: string;
  shortDisplayName?: string;
  abbreviation?: string;
  logo?: string;
  logos?: Array<{ href: string }>;
}

function team(t: EspnTeam): TeamRef {
  const name = t.displayName ?? t.shortDisplayName ?? "—";
  return {
    id: Number(t.id),
    name,
    shortName: t.shortDisplayName ?? name,
    tla: (t.abbreviation ?? name.slice(0, 3)).toUpperCase(),
    crest: t.logo ?? t.logos?.[0]?.href ?? "",
  };
}

interface EspnStatus {
  displayClock?: string;
  type: { name: string; state: "pre" | "in" | "post" };
}

function status(s: EspnStatus): MatchStatus {
  const name = s.type.name;
  if (s.type.state === "pre") return name === "STATUS_POSTPONED" ? "POSTPONED" : "TIMED";
  if (s.type.state === "in") return name === "STATUS_HALFTIME" ? "PAUSED" : "IN_PLAY";
  if (name === "STATUS_POSTPONED") return "POSTPONED";
  if (name === "STATUS_CANCELED") return "CANCELLED";
  if (name === "STATUS_SUSPENDED") return "SUSPENDED";
  return "FINISHED";
}

function minute(s: EspnStatus): number | null {
  if (s.type.state !== "in") return null;
  const m = s.displayClock?.match(/(\d+)/);
  return m ? Number(m[1]) : null;
}

interface EspnCompetition {
  venue?: { fullName?: string };
  competitors: Array<{
    homeAway: "home" | "away";
    score?: string | { displayValue?: string };
    team: EspnTeam;
    /** Golos por parte — [1ª parte, 2ª parte] — presente no summary. */
    linescores?: Array<{ displayValue?: string }>;
  }>;
}

function scoreOf(c: EspnCompetition["competitors"][number], st: MatchStatus): number | null {
  if (st === "TIMED" || st === "SCHEDULED" || st === "POSTPONED" || st === "CANCELLED") return null;
  const raw = typeof c.score === "object" ? c.score?.displayValue : c.score;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function toMatch(
  e: { id: string; date: string; status: EspnStatus; competitions: EspnCompetition[] },
  leagueId: League["id"]
): Match | null {
  const comp = e.competitions?.[0];
  if (!comp) return null;
  const home = comp.competitors.find((c) => c.homeAway === "home");
  const away = comp.competitors.find((c) => c.homeAway === "away");
  if (!home || !away) return null;
  const st = status(e.status);
  return {
    id: Number(e.id),
    leagueId,
    utcDate: new Date(e.date).toISOString(),
    status: st,
    minute: minute(e.status),
    matchday: null,
    home: team(home.team),
    away: team(away.team),
    score: { home: scoreOf(home, st), away: scoreOf(away, st) },
    halfTimeScore: { home: null, away: null },
    venue: comp.venue?.fullName ?? null,
    referee: null,
  };
}

/* ── Endpoints ────────────────────────────────────────────────── */

function ymd(offsetDays: number): string {
  return new Date(Date.now() + offsetDays * 86400_000).toISOString().slice(0, 10).replace(/-/g, "");
}

export async function getMatches(league: League): Promise<Match[]> {
  const data = await espn<{
    events: Array<{ id: string; date: string; status: EspnStatus; competitions: EspnCompetition[] }>;
  }>(`${BASE}/${slug(league)}/scoreboard?dates=${ymd(-7)}-${ymd(10)}`);
  return (data.events ?? [])
    .map((e) => toMatch(e, league.id))
    .filter((m): m is Match => m !== null);
}

export async function getStandings(league: League): Promise<StandingRow[]> {
  const [data, form] = await Promise.all([
    espn<{
      children?: Array<{ standings?: { entries?: EspnStandingEntry[] } }>;
      standings?: { entries?: EspnStandingEntry[] };
    }>(`${BASE_V2}/${slug(league)}/standings`),
    seasonForm(league).catch(() => new Map<number, string>()),
  ]);
  const entries = data.children?.[0]?.standings?.entries ?? data.standings?.entries ?? [];
  return entries
    .map((entry) => {
      const stat = (name: string) =>
        Number(entry.stats.find((s) => s.name === name)?.value ?? 0);
      return {
        position: stat("rank"),
        team: team(entry.team),
        playedGames: stat("gamesPlayed"),
        won: stat("wins"),
        draw: stat("ties"),
        lost: stat("losses"),
        points: stat("points"),
        goalsFor: stat("pointsFor"),
        goalsAgainst: stat("pointsAgainst"),
        goalDifference: stat("pointDifferential"),
        form: form.get(Number(entry.team.id)) ?? null,
      };
    })
    .sort((a, b) => a.position - b.position);
}

/** Forma real (últimos 5 resultados, mais recente primeiro) a partir da época. */
async function seasonForm(league: League): Promise<Map<number, string>> {
  const start = `${seasonYear()}0701`;
  const today = ymd(0);
  const data = await espn<{
    events: Array<{ id: string; date: string; status: EspnStatus; competitions: EspnCompetition[] }>;
  }>(`${BASE}/${slug(league)}/scoreboard?dates=${start}-${today}`);

  const results = (data.events ?? [])
    .map((e) => toMatch(e, league.id))
    .filter((m): m is Match => m !== null && m.status === "FINISHED")
    .sort((a, b) => b.utcDate.localeCompare(a.utcDate)); // mais recente primeiro

  const form = new Map<number, string>();
  for (const m of results) {
    if (m.score.home == null || m.score.away == null) continue;
    const homeRes = m.score.home > m.score.away ? "W" : m.score.home < m.score.away ? "L" : "D";
    const awayRes = homeRes === "W" ? "L" : homeRes === "L" ? "W" : "D";
    for (const [teamId, res] of [
      [m.home.id, homeRes],
      [m.away.id, awayRes],
    ] as const) {
      const cur = form.get(teamId) ?? "";
      if (cur.length < 5) form.set(teamId, cur + res);
    }
  }
  return form;
}

/* ── Melhores marcadores (API core: leaders + resolução de refs) ── */

interface CoreLeaderCategory {
  name: string;
  leaders?: Array<{
    value: number;
    athlete?: { $ref?: string };
    team?: { $ref?: string };
  }>;
}

export async function getScorers(league: League): Promise<Scorer[]> {
  const year = seasonYear();
  const data = await espn<{ categories?: CoreLeaderCategory[] }>(
    `${BASE_CORE}/${slug(league)}/seasons/${year}/types/1/leaders?lang=en&region=us`
  );
  const cat = (name: string) => data.categories?.find((c) => c.name === name)?.leaders ?? [];
  const goals = cat("goals").slice(0, 15);
  if (!goals.length) throw new Error("ESPN: sem líderes de golos");

  // Mapa de assistências por atleta (para enriquecer a lista de marcadores).
  const assistsByRef = new Map<string, number>();
  for (const l of cat("assists")) {
    if (l.athlete?.$ref) assistsByRef.set(refId(l.athlete.$ref), l.value);
  }

  // Resolve atletas e equipas em paralelo, com deduplicação de equipas.
  const teamCache = new Map<string, Promise<TeamRef>>();
  const resolveTeam = (ref: string): Promise<TeamRef> => {
    const id = refId(ref);
    if (!teamCache.has(id)) {
      teamCache.set(
        id,
        espn<EspnTeam & { logos?: Array<{ href: string }> }>(secure(ref)).then(team)
      );
    }
    return teamCache.get(id)!;
  };

  const scorers = await Promise.all(
    goals.map(async (l): Promise<Scorer | null> => {
      if (!l.athlete?.$ref) return null;
      try {
        const [athlete, teamRef] = await Promise.all([
          espn<{ id?: string; displayName?: string; citizenship?: string }>(secure(l.athlete.$ref)),
          l.team?.$ref
            ? resolveTeam(l.team.$ref)
            : Promise.resolve<TeamRef>({ id: 0, name: "—", shortName: "—", tla: "—", crest: "" }),
        ]);
        return {
          player: {
            id: Number(athlete.id ?? refId(l.athlete.$ref!)),
            name: athlete.displayName ?? "—",
            nationality: athlete.citizenship ?? null,
          },
          team: teamRef,
          goals: l.value,
          assists: assistsByRef.get(refId(l.athlete.$ref!)) ?? null,
          penalties: null,
          playedMatches: null,
        };
      } catch {
        return null;
      }
    })
  );
  return scorers.filter((s): s is Scorer => s !== null);
}

function refId(ref: string): string {
  return ref.split("?")[0]!.split("/").pop() ?? ref;
}

function secure(ref: string): string {
  return ref.replace(/^http:/, "https:");
}

interface EspnStandingEntry {
  team: EspnTeam;
  stats: Array<{ name: string; value?: number; displayValue?: string }>;
}

export async function getMatchDetail(league: League, id: number): Promise<MatchDetail> {
  const data = await espn<EspnSummary>(`${BASE}/${slug(league)}/summary?event=${id}`);
  const header = data.header?.competitions?.[0];
  if (!header) throw new Error("ESPN: jogo não encontrado");
  const base = toMatch(
    {
      id: String(id),
      date: header.date ?? new Date().toISOString(),
      status: header.status ?? { type: { name: "STATUS_SCHEDULED", state: "pre" } },
      competitions: [header],
    },
    league.id
  );
  if (!base) throw new Error("ESPN: jogo inválido");

  const events = (data.keyEvents ?? [])
    .map((k) => toEvent(k, base))
    .filter((e): e is MatchEvent => e !== null);
  const lineups = toLineups(data.rosters ?? [], base);
  const stats = toStats(data.boxscore?.teams ?? []);

  // Resultado ao intervalo a partir dos linescores (golos da 1ª parte).
  const half = (side: "home" | "away"): number | null => {
    const raw = header.competitors.find((c) => c.homeAway === side)?.linescores?.[0]?.displayValue;
    const n = Number(raw);
    return raw != null && Number.isFinite(n) ? n : null;
  };
  const played = base.score.home != null;

  return {
    ...base,
    halfTimeScore: played ? { home: half("home"), away: half("away") } : base.halfTimeScore,
    venue: data.gameInfo?.venue?.fullName ?? base.venue,
    referee: data.gameInfo?.officials?.[0]?.displayName ?? null,
    events,
    lineups,
    stats,
    richness: lineups || events.length ? "full" : "basic",
  };
}

interface EspnSummary {
  header?: {
    competitions?: Array<EspnCompetition & { date?: string; status?: EspnStatus }>;
  };
  gameInfo?: {
    venue?: { fullName?: string };
    officials?: Array<{ displayName?: string }>;
  };
  keyEvents?: EspnKeyEvent[];
  rosters?: EspnRoster[];
  boxscore?: { teams?: EspnBoxTeam[] };
}

interface EspnKeyEvent {
  type?: { text?: string };
  clock?: { displayValue?: string };
  team?: { id?: string };
  participants?: Array<{ athlete?: { displayName?: string } }>;
  text?: string;
  scoringPlay?: boolean;
}

function toEvent(k: EspnKeyEvent, match: Match): MatchEvent | null {
  const text = (k.type?.text ?? "").toLowerCase();
  const clock = k.clock?.displayValue ?? "";
  const clockMatch = clock.match(/(\d+)'(?:\s*\+\s*(\d+))?/);
  const min = clockMatch ? Number(clockMatch[1]) : 0;
  const extra = clockMatch?.[2] ? Number(clockMatch[2]) : null;
  const teamId = k.team?.id ? Number(k.team.id) : null;
  const players = (k.participants ?? [])
    .map((p) => p.athlete?.displayName)
    .filter((n): n is string => Boolean(n));

  let type: MatchEvent["type"] | null = null;
  if (text.includes("own goal")) type = "OWN_GOAL";
  else if (text.includes("penalty") && (text.includes("scored") || k.scoringPlay)) type = "PENALTY_GOAL";
  else if (text.includes("penalty") && text.includes("missed")) type = "PENALTY_MISSED";
  else if (text.includes("goal") || k.scoringPlay) type = "GOAL";
  else if (text.includes("yellow")) type = "YELLOW";
  else if (text.includes("red")) type = "RED";
  else if (text.includes("substitution")) type = "SUB";
  else if (text.includes("kickoff") || text.includes("kick off")) type = "KICKOFF";
  else if (text.includes("halftime") || text.includes("half-time")) type = "HALFTIME";
  else if (text.includes("full time") || text.includes("full-time") || text.includes("end regular")) type = "FULLTIME";
  else if (text.includes("var")) type = "VAR";
  if (!type) return null;

  const neutral = type === "KICKOFF" || type === "HALFTIME" || type === "FULLTIME";
  return {
    minute: min,
    extraMinute: extra,
    type,
    teamId: neutral ? null : teamId ?? match.home.id,
    player: players[0] ?? null,
    assist: type === "GOAL" ? players[1] ?? null : null,
    detail: type === "SUB" && players[1] ? `Sai ${players[1]}` : k.text ?? null,
  };
}

interface EspnRoster {
  homeAway?: "home" | "away";
  team?: EspnTeam;
  formation?: string;
  coach?: { firstName?: string; lastName?: string } | Array<{ firstName?: string; lastName?: string }>;
  roster?: Array<{
    starter?: boolean;
    jersey?: string;
    athlete?: { id?: string; displayName?: string };
    position?: { abbreviation?: string; name?: string };
  }>;
}

function toLineups(rosters: EspnRoster[], match: Match): TeamLineup[] | null {
  const filled = rosters.filter((r) => (r.roster?.length ?? 0) > 0);
  if (filled.length < 2) return null;

  return filled.map((r) => {
    const teamId =
      r.homeAway === "home" ? match.home.id : r.homeAway === "away" ? match.away.id : Number(r.team?.id ?? 0);
    const starters = (r.roster ?? []).filter((p) => p.starter);
    const bench = (r.roster ?? []).filter((p) => !p.starter);
    const grids = computeGrids(starters, r.formation);

    const startXI: LineupPlayer[] = starters.map((p, i) => ({
      id: p.athlete?.id ? Number(p.athlete.id) : null,
      name: p.athlete?.displayName ?? "—",
      number: p.jersey ? Number(p.jersey) : null,
      position: p.position?.abbreviation ?? null,
      grid: grids[i] ?? null,
      rating: null,
    }));

    const coach = Array.isArray(r.coach) ? r.coach[0] : r.coach;
    return {
      teamId,
      formation: r.formation ?? null,
      coach: coach ? [coach.firstName, coach.lastName].filter(Boolean).join(" ") || null : null,
      startXI,
      bench: bench.map((p) => ({
        id: p.athlete?.id ? Number(p.athlete.id) : null,
        name: p.athlete?.displayName ?? "—",
        number: p.jersey ? Number(p.jersey) : null,
        position: p.position?.abbreviation ?? null,
      })),
    };
  });
}

/**
 * Constrói a grelha "linha:coluna" a partir da formação (ex: "4-2-3-1") e da
 * semântica das posições ESPN (Goalkeeper, Center Left Defender, AM-R, …).
 */
function computeGrids(
  starters: NonNullable<EspnRoster["roster"]>,
  formation?: string
): Array<string | null> {
  const catOf = (p: (typeof starters)[number]): number => {
    const n = (p.position?.name ?? "").toLowerCase();
    if (n.includes("goalkeeper")) return 0;
    if (n.includes("defender") || n.includes("back")) return 1;
    if (n.includes("attacking midfielder")) return 3;
    if (n.includes("midfielder")) return 2;
    if (n.includes("forward") || n.includes("striker") || n.includes("winger")) return 4;
    return 2;
  };
  const sideOf = (p: (typeof starters)[number]): number => {
    const n = (p.position?.name ?? "").toLowerCase();
    if (n.includes("left")) return 0;
    if (n.includes("right")) return 2;
    return 1;
  };

  // Ordena por categoria tática (GR → defesa → meio → ataque), estável.
  const indexed = starters.map((p, i) => ({ p, i }));
  indexed.sort((a, b) => catOf(a.p) - catOf(b.p) || a.i - b.i);

  // Linhas a partir da formação; fallback: agrupar por categoria.
  const segs = (formation ?? "")
    .split("-")
    .map((n) => parseInt(n, 10))
    .filter((n) => n > 0);
  const rows =
    segs.length >= 2 && segs.reduce((a, b) => a + b, 0) === starters.length - 1
      ? [1, ...segs]
      : null;

  const grids: Array<string | null> = new Array(starters.length).fill(null);
  if (rows) {
    let cursor = 0;
    rows.forEach((count, rowIdx) => {
      const rowPlayers = indexed.slice(cursor, cursor + count);
      rowPlayers.sort((a, b) => sideOf(a.p) - sideOf(b.p) || a.i - b.i);
      rowPlayers.forEach(({ i }, col) => {
        grids[i] = `${rowIdx + 1}:${col + 1}`;
      });
      cursor += count;
    });
  } else {
    // Sem formação válida: linha = categoria.
    const counters: Record<number, number> = {};
    for (const { p, i } of indexed) {
      const row = Math.min(catOf(p) + 1, 5);
      counters[row] = (counters[row] ?? 0) + 1;
      grids[i] = `${row}:${counters[row]}`;
    }
  }
  return grids;
}

interface EspnBoxTeam {
  team?: EspnTeam;
  statistics?: Array<{ name?: string; displayValue?: string }>;
}

function toStats(teams: EspnBoxTeam[]): MatchTeamStats[] | null {
  if (teams.length < 2) return null;
  const mapped = teams.map((t) => {
    const get = (...names: string[]): number | null => {
      for (const name of names) {
        const v = t.statistics?.find((s) => s.name === name)?.displayValue;
        if (v != null) {
          const n = parseFloat(v.replace("%", ""));
          if (Number.isFinite(n)) return n;
        }
      }
      return null;
    };
    return {
      teamId: Number(t.team?.id ?? 0),
      possession: get("possessionPct"),
      shots: get("totalShots", "shotsTotal"),
      shotsOnTarget: get("shotsOnTarget"),
      corners: get("wonCorners", "cornerKicks"),
      fouls: get("foulsCommitted"),
      offsides: get("offsides"),
      xg: null,
    };
  });
  return mapped.some((m) => m.possession != null || m.shots != null) ? mapped : null;
}
