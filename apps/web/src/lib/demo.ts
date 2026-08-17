/**
 * Modo demonstração — dados realistas gerados localmente para que a app
 * funcione de imediato, sem chaves de API. Inclui um jogo AO VIVO com
 * eventos, 11 inicial e ratings para mostrar a experiência completa.
 */
import type {
  Match,
  MatchDetail,
  NewsItem,
  Scorer,
  StandingRow,
  TeamRef,
} from "@futiq/core";

const T = (id: number, name: string, shortName: string, tla: string): TeamRef => ({
  id,
  name,
  shortName,
  tla,
  crest: "",
});

export const DEMO_TEAMS: TeamRef[] = [
  T(1, "SL Benfica", "Benfica", "SLB"),
  T(2, "FC Porto", "Porto", "FCP"),
  T(3, "Sporting CP", "Sporting", "SCP"),
  T(4, "SC Braga", "Braga", "SCB"),
  T(5, "Vitória SC", "Vitória SC", "VSC"),
  T(6, "FC Famalicão", "Famalicão", "FAM"),
  T(7, "Moreirense FC", "Moreirense", "MOR"),
  T(8, "GD Estoril Praia", "Estoril", "EST"),
  T(9, "Casa Pia AC", "Casa Pia", "CPA"),
  T(10, "Rio Ave FC", "Rio Ave", "RAV"),
  T(11, "FC Arouca", "Arouca", "ARO"),
  T(12, "Gil Vicente FC", "Gil Vicente", "GVI"),
  T(13, "CF Estrela da Amadora", "E. Amadora", "EAM"),
  T(14, "CD Nacional", "Nacional", "NAC"),
  T(15, "AVS", "AVS", "AVS"),
  T(16, "CD Santa Clara", "Santa Clara", "SCL"),
  T(17, "FC Alverca", "Alverca", "ALV"),
  T(18, "CD Tondela", "Tondela", "TON"),
];

const team = (id: number) => DEMO_TEAMS[id - 1];

function iso(offsetHours: number): string {
  return new Date(Date.now() + offsetHours * 3600_000).toISOString();
}

/** Jogo ao vivo de vitrine: Benfica 2–1 Porto, min 67. */
const LIVE_MATCH_ID = 900001;

export function demoMatches(): Match[] {
  const md = 2;
  return [
    // AO VIVO agora
    {
      id: LIVE_MATCH_ID,
      leagueId: "primeira-liga",
      utcDate: iso(-1.2),
      status: "IN_PLAY",
      minute: 67,
      matchday: md,
      home: team(1),
      away: team(2),
      score: { home: 2, away: 1 },
      halfTimeScore: { home: 1, away: 1 },
      venue: "Estádio da Luz",
      referee: "Artur Soares Dias",
    },
    {
      id: 900002,
      leagueId: "primeira-liga",
      utcDate: iso(-1.2),
      status: "IN_PLAY",
      minute: 66,
      matchday: md,
      home: team(4),
      away: team(10),
      score: { home: 0, away: 0 },
      halfTimeScore: { home: 0, away: 0 },
      venue: "Estádio Municipal de Braga",
      referee: "João Pinheiro",
    },
    // Hoje, mais tarde
    {
      id: 900003,
      leagueId: "primeira-liga",
      utcDate: iso(3),
      status: "TIMED",
      minute: null,
      matchday: md,
      home: team(3),
      away: team(5),
      score: { home: null, away: null },
      halfTimeScore: { home: null, away: null },
      venue: "Estádio José Alvalade",
      referee: null,
    },
    {
      id: 900004,
      leagueId: "primeira-liga",
      utcDate: iso(5.5),
      status: "TIMED",
      minute: null,
      matchday: md,
      home: team(14),
      away: team(6),
      score: { home: null, away: null },
      halfTimeScore: { home: null, away: null },
      venue: "Estádio da Madeira",
      referee: null,
    },
    // Ontem
    {
      id: 900005,
      leagueId: "primeira-liga",
      utcDate: iso(-26),
      status: "FINISHED",
      minute: 90,
      matchday: md,
      home: team(8),
      away: team(9),
      score: { home: 3, away: 1 },
      halfTimeScore: { home: 2, away: 0 },
      venue: "Estádio António Coimbra da Mota",
      referee: null,
    },
    {
      id: 900006,
      leagueId: "primeira-liga",
      utcDate: iso(-28),
      status: "FINISHED",
      minute: 90,
      matchday: md,
      home: team(11),
      away: team(12),
      score: { home: 1, away: 1 },
      halfTimeScore: { home: 0, away: 1 },
      venue: "Estádio Municipal de Arouca",
      referee: null,
    },
    {
      id: 900007,
      leagueId: "primeira-liga",
      utcDate: iso(-27),
      status: "FINISHED",
      minute: 90,
      matchday: md,
      home: team(16),
      away: team(13),
      score: { home: 2, away: 0 },
      halfTimeScore: { home: 1, away: 0 },
      venue: "Estádio de São Miguel",
      referee: null,
    },
    // Amanhã
    {
      id: 900008,
      leagueId: "primeira-liga",
      utcDate: iso(22),
      status: "TIMED",
      minute: null,
      matchday: md,
      home: team(7),
      away: team(15),
      score: { home: null, away: null },
      halfTimeScore: { home: null, away: null },
      venue: "Parque Joaquim de Almeida Freitas",
      referee: null,
    },
    {
      id: 900009,
      leagueId: "primeira-liga",
      utcDate: iso(24.5),
      status: "TIMED",
      minute: null,
      matchday: md,
      home: team(17),
      away: team(18),
      score: { home: null, away: null },
      halfTimeScore: { home: null, away: null },
      venue: "Estádio do FC Alverca",
      referee: null,
    },
  ];
}

export function demoMatchDetail(id: number): MatchDetail | null {
  const base = demoMatches().find((m) => m.id === id);
  if (!base) return null;
  if (id !== LIVE_MATCH_ID) {
    return { ...base, events: [], lineups: null, stats: null, richness: "basic" };
  }
  return {
    ...base,
    richness: "full",
    events: [
      { minute: 1, type: "KICKOFF", teamId: null },
      { minute: 12, type: "GOAL", teamId: 1, player: "Vangelis Pavlidis", assist: "Kerem Aktürkoğlu" },
      { minute: 23, type: "YELLOW", teamId: 2, player: "Alan Varela", detail: "Falta dura" },
      { minute: 38, type: "GOAL", teamId: 2, player: "Samu Aghehowa", assist: "Pepê" },
      { minute: 45, type: "HALFTIME", teamId: null },
      { minute: 52, type: "YELLOW", teamId: 1, player: "Fredrik Aursnes" },
      { minute: 58, type: "SUB", teamId: 2, player: "William Gomes", detail: "Sai Borja Sainz" },
      { minute: 63, type: "PENALTY_GOAL", teamId: 1, player: "Vangelis Pavlidis", detail: "Grande penalidade" },
      { minute: 66, type: "SUB", teamId: 1, player: "Orkun Kökçü", detail: "Sai Leandro Barreiro" },
    ],
    lineups: [
      {
        teamId: 1,
        formation: "4-2-3-1",
        coach: "José Mourinho",
        startXI: [
          { id: 101, name: "Anatoliy Trubin", number: 1, position: "G", grid: "1:1", rating: 7.1 },
          { id: 102, name: "Alexander Bah", number: 50, position: "D", grid: "2:4", rating: 7.0 },
          { id: 103, name: "Nicolás Otamendi", number: 30, position: "D", grid: "2:3", rating: 7.4, captain: true },
          { id: 104, name: "António Silva", number: 4, position: "D", grid: "2:2", rating: 6.9 },
          { id: 105, name: "Álvaro Carreras", number: 3, position: "D", grid: "2:1", rating: 7.2 },
          { id: 106, name: "Fredrik Aursnes", number: 8, position: "M", grid: "3:2", rating: 6.8 },
          { id: 107, name: "Leandro Barreiro", number: 18, position: "M", grid: "3:1", rating: 6.7 },
          { id: 108, name: "Kerem Aktürkoğlu", number: 7, position: "M", grid: "4:3", rating: 7.8 },
          { id: 109, name: "Georgiy Sudakov", number: 20, position: "M", grid: "4:2", rating: 7.0 },
          { id: 110, name: "Bruma", number: 17, position: "M", grid: "4:1", rating: 7.3 },
          { id: 111, name: "Vangelis Pavlidis", number: 14, position: "A", grid: "5:1", rating: 8.9 },
        ],
        bench: [
          { id: 112, name: "Samuel Soares", number: 24, position: "G" },
          { id: 113, name: "Tomás Araújo", number: 44, position: "D" },
          { id: 114, name: "Orkun Kökçü", number: 10, position: "M", rating: 6.9 },
          { id: 115, name: "Andrea Belotti", number: 11, position: "A" },
        ],
      },
      {
        teamId: 2,
        formation: "4-3-3",
        coach: "Francesco Farioli",
        startXI: [
          { id: 201, name: "Diogo Costa", number: 99, position: "G", grid: "1:1", rating: 6.8 },
          { id: 202, name: "João Mário", number: 23, position: "D", grid: "2:4", rating: 6.5 },
          { id: 203, name: "Otávio", number: 4, position: "D", grid: "2:3", rating: 6.7 },
          { id: 204, name: "Zé Pedro", number: 97, position: "D", grid: "2:2", rating: 6.6 },
          { id: 205, name: "Francisco Moura", number: 45, position: "D", grid: "2:1", rating: 6.9 },
          { id: 206, name: "Alan Varela", number: 5, position: "M", grid: "3:3", rating: 6.4 },
          { id: 207, name: "Stephen Eustáquio", number: 6, position: "M", grid: "3:2", rating: 6.8, captain: true },
          { id: 208, name: "Rodrigo Mora", number: 86, position: "M", grid: "3:1", rating: 7.5 },
          { id: 209, name: "Pepê", number: 11, position: "A", grid: "4:3", rating: 7.6 },
          { id: 210, name: "Samu Aghehowa", number: 9, position: "A", grid: "4:2", rating: 7.9 },
          { id: 211, name: "Borja Sainz", number: 17, position: "A", grid: "4:1", rating: 6.3 },
        ],
        bench: [
          { id: 212, name: "Cláudio Ramos", number: 14, position: "G" },
          { id: 213, name: "Nehuén Pérez", number: 24, position: "D" },
          { id: 214, name: "William Gomes", number: 21, position: "A", rating: 6.8 },
          { id: 215, name: "Deniz Gül", number: 19, position: "A" },
        ],
      },
    ],
    stats: [
      { teamId: 1, possession: 56, shots: 14, shotsOnTarget: 7, corners: 6, fouls: 9, offsides: 2, xg: 2.4 },
      { teamId: 2, possession: 44, shots: 9, shotsOnTarget: 4, corners: 3, fouls: 12, offsides: 1, xg: 1.1 },
    ],
  };
}

export function demoStandings(): StandingRow[] {
  const rows: Array<[number, number, number, number, number, number, number, string]> = [
    // teamId, played, won, draw, lost, gf, ga, form
    [3, 2, 2, 0, 0, 6, 1, "WW"],
    [1, 2, 1, 1, 0, 5, 2, "DW"],
    [2, 2, 1, 1, 0, 4, 2, "WD"],
    [4, 2, 1, 1, 0, 3, 1, "DW"],
    [12, 2, 1, 1, 0, 3, 2, "WD"],
    [8, 2, 1, 0, 1, 4, 3, "LW"],
    [16, 2, 1, 0, 1, 3, 2, "WL"],
    [5, 2, 1, 0, 1, 2, 2, "LW"],
    [6, 2, 1, 0, 1, 2, 3, "WL"],
    [10, 2, 0, 2, 0, 2, 2, "DD"],
    [14, 2, 0, 2, 0, 1, 1, "DD"],
    [7, 2, 0, 1, 1, 1, 2, "DL"],
    [11, 2, 0, 1, 1, 2, 4, "LD"],
    [9, 2, 0, 1, 1, 2, 4, "DL"],
    [17, 2, 0, 1, 1, 0, 1, "LD"],
    [15, 2, 0, 1, 1, 1, 3, "DL"],
    [18, 2, 0, 0, 2, 0, 3, "LL"],
    [13, 2, 0, 0, 2, 0, 4, "LL"],
  ];
  return rows.map(([teamId, p, w, d, l, gf, ga, form], i) => ({
    position: i + 1,
    team: team(teamId),
    playedGames: p,
    won: w,
    draw: d,
    lost: l,
    points: w * 3 + d,
    goalsFor: gf,
    goalsAgainst: ga,
    goalDifference: gf - ga,
    form,
  }));
}

export function demoScorers(): Scorer[] {
  return [
    { player: { id: 111, name: "Vangelis Pavlidis" }, team: team(1), goals: 4, assists: 1, penalties: 1, playedMatches: 2 },
    { player: { id: 301, name: "Viktor Gyökeres" }, team: team(3), goals: 3, assists: 1, penalties: 0, playedMatches: 2 },
    { player: { id: 210, name: "Samu Aghehowa" }, team: team(2), goals: 3, assists: 0, penalties: 1, playedMatches: 2 },
    { player: { id: 401, name: "Ricardo Horta" }, team: team(4), goals: 2, assists: 2, penalties: 0, playedMatches: 2 },
    { player: { id: 801, name: "Alejandro Marqués" }, team: team(8), goals: 2, assists: 0, penalties: 0, playedMatches: 2 },
    { player: { id: 209, name: "Pepê" }, team: team(2), goals: 1, assists: 3, penalties: 0, playedMatches: 2 },
  ];
}

export function demoNews(): NewsItem[] {
  const now = Date.now();
  const item = (
    id: string,
    title: string,
    sourceId: string,
    source: string,
    hoursAgo: number,
    clubs: string[],
    snippet: string
  ): NewsItem => ({
    id,
    title,
    link: "#",
    source,
    sourceId,
    publishedAt: new Date(now - hoursAgo * 3600_000).toISOString(),
    snippet,
    image: null,
    clubs,
  });
  return [
    item("d1", "Pavlidis bisa e Benfica vira o clássico na Luz", "abola", "A Bola", 0.3, ["benfica", "porto"], "O avançado grego chegou aos quatro golos na época e deixou a Luz ao rubro num clássico eletrizante."),
    item("d2", "Mourinho: «Este grupo tem fome de títulos»", "record", "Record", 1.5, ["benfica"], "O técnico encarnado destacou a atitude da equipa após a reviravolta frente ao FC Porto."),
    item("d3", "Farioli lamenta erros defensivos no clássico", "ojogo", "O Jogo", 1.8, ["porto"], "O treinador italiano do FC Porto pediu «cabeça fria» após o desaire em Lisboa."),
    item("d4", "Sporting prepara receção ao Vitória com casa cheia", "maisfutebol", "Maisfutebol", 3, ["sporting", "vitoria-guimaraes"], "Alvalade esgotado para o jogo desta noite; Rui Borges promete «intensidade máxima»."),
    item("d5", "Braga segura empate em jogo de loucos", "zerozero", "zerozero.pt", 4, ["braga", "rio-ave"], "Arsenalistas e vilacondenses protagonizaram um dos jogos mais emotivos da jornada."),
    item("d6", "Mercado: Estoril garante extremo brasileiro por empréstimo", "abola", "A Bola", 6, ["estoril"], "Reforço chega do Brasileirão e assina até final da época, com opção de compra."),
    item("d7", "Liga Portugal bate recorde de assistências na jornada inaugural", "publico", "Público Desporto", 9, [], "Mais de 180 mil adeptos passaram pelos estádios na primeira jornada do campeonato."),
    item("d8", "Análise: o novo 4-2-3-1 do Benfica explicado", "zerozero", "zerozero.pt", 12, ["benfica"], "Como a chegada de Aktürkoğlu mudou a dinâmica ofensiva das águias."),
  ];
}
