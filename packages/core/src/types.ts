/**
 * bancada. — modelo de domínio partilhado (web + mobile).
 * Todos os fornecedores de dados (football-data.org, API-Football, …)
 * são normalizados para estes tipos. A UI nunca conhece o fornecedor.
 */

/** Identificador de competição (ver `leagues.ts` para o registo). */
export type LeagueId = string;

export type CompetitionKind = "league" | "continental" | "cup";
export type Region = "portugal" | "europa" | "uefa" | "americas" | "mundo";

export interface League {
  id: LeagueId;
  /** Código no fornecedor football-data.org, ex: "PPL" (quando existe) */
  fdCode?: string;
  /** Slug no fornecedor ESPN, ex: "por.1" */
  espnSlug: string;
  /** ID no fornecedor API-Football, ex: 94 */
  afId?: number;
  name: string;
  /** Nome curto para chips/navegação */
  shortName: string;
  country: string;
  countryFlag: string;
  kind: CompetitionKind;
  region: Region;
  /** Competições ativas aparecem na navegação. */
  active: boolean;
}

export type MatchStatus =
  | "SCHEDULED"
  | "TIMED"
  | "IN_PLAY"
  | "PAUSED"
  | "FINISHED"
  | "SUSPENDED"
  | "POSTPONED"
  | "CANCELLED"
  | "AWARDED";

export const LIVE_STATUSES: MatchStatus[] = ["IN_PLAY", "PAUSED"];

export interface TeamRef {
  id: number;
  name: string;
  shortName: string;
  tla: string;
  crest: string;
}

export interface Score {
  home: number | null;
  away: number | null;
}

export interface Match {
  id: number;
  leagueId: LeagueId;
  utcDate: string;
  status: MatchStatus;
  /** Minuto de jogo, quando disponível ao vivo */
  minute: number | null;
  matchday: number | null;
  home: TeamRef;
  away: TeamRef;
  score: Score;
  halfTimeScore: Score;
  venue?: string | null;
  referee?: string | null;
}

export type MatchEventType =
  | "GOAL"
  | "OWN_GOAL"
  | "PENALTY_GOAL"
  | "PENALTY_MISSED"
  | "YELLOW"
  | "RED"
  | "SUB"
  | "VAR"
  | "KICKOFF"
  | "HALFTIME"
  | "FULLTIME";

export interface MatchEvent {
  minute: number;
  extraMinute?: number | null;
  type: MatchEventType;
  teamId: number | null;
  player?: string | null;
  assist?: string | null;
  detail?: string | null;
}

export interface LineupPlayer {
  id: number | null;
  name: string;
  number: number | null;
  position: string | null;
  /** Quadrícula "linha:coluna" para desenhar o campo (formato API-Football) */
  grid?: string | null;
  rating?: number | null;
  captain?: boolean;
}

export interface TeamLineup {
  teamId: number;
  formation: string | null;
  coach: string | null;
  startXI: LineupPlayer[];
  bench: LineupPlayer[];
}

export interface MatchDetail extends Match {
  events: MatchEvent[];
  lineups: TeamLineup[] | null;
  /** Estatísticas de equipa (posse, remates, …) quando disponíveis */
  stats: MatchTeamStats[] | null;
  /** Origem do detalhe: nível de riqueza dos dados disponíveis */
  richness: "basic" | "full";
}

export interface MatchTeamStats {
  teamId: number;
  possession: number | null;
  shots: number | null;
  shotsOnTarget: number | null;
  corners: number | null;
  fouls: number | null;
  offsides: number | null;
  xg?: number | null;
}

/** Grupo/fase de uma classificação (liga simples = um grupo sem nome). */
export interface StandingsGroup {
  name: string | null;
  rows: StandingRow[];
}

export interface StandingRow {
  position: number;
  team: TeamRef;
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  /** ex: "WWDLW" (mais recente primeiro) */
  form: string | null;
}

export interface Scorer {
  player: { id: number; name: string; nationality?: string | null };
  team: TeamRef;
  goals: number;
  assists: number | null;
  penalties: number | null;
  playedMatches: number | null;
}

export interface NewsItem {
  id: string;
  title: string;
  link: string;
  source: string;
  sourceId: string;
  publishedAt: string;
  snippet?: string | null;
  image?: string | null;
  /** IDs de clubes detetados no título/resumo */
  clubs: string[];
  /** Tipo de conteúdo: notícia editorial, rumor de mercado ou post de comunidade. */
  kind?: "news" | "rumor" | "social";
}

export interface ClubMeta {
  /** slug estável, ex: "benfica" */
  slug: string;
  /** nomes/alcunhas usados para detetar o clube em notícias */
  aliases: string[];
  colors: { primary: string; secondary: string };
  officialSite?: string;
  twitter?: string;
  reddit?: string;
  /** subreddit (sem o r/) para agregar posts da comunidade */
  redditSub?: string;
  forum?: string;
  youtube?: string;
  instagram?: string;
  city?: string;
  stadium?: string;
}

export interface NewsSource {
  id: string;
  name: string;
  url: string;
  feedUrl: string;
  lang: string;
  /** fontes de confiança editorial (aparecem por omissão) */
  trusted: boolean;
}

export interface ApiHealth {
  provider: string;
  configured: boolean;
  demo: boolean;
}
