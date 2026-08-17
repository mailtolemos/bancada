/**
 * Filtro de relevância: garante que só conteúdo de FUTEBOL entra na app.
 *
 * Regra: um item é aceite se NÃO tocar na blocklist (outros desportos,
 * TV/audiências, entretenimento, modalidades dos clubes) E tiver um sinal
 * de futebol (clube detetado ou vocabulário futebolístico).
 * A blocklist vence sempre — "Benfica vence no andebol" é excluído mesmo
 * mencionando o clube.
 */
import { detectClubs } from "./clubs";

/** Termos que excluem um item mesmo que mencione um clube. */
const BLOCKLIST: string[] = [
  // outras modalidades (frequentes nos media desportivos PT)
  "andebol", "basquetebol", "basquete", "voleibol", "voleib", "hoquei", "hóquei",
  "futsal", "futebol de praia", "tenis de mesa", "ténis de mesa", " tenis", " ténis",
  "padel", "golfe", "ciclismo", "volta a portugal", "atletismo", "natacao", "natação",
  "judo", "karate", "karaté", "ginastica", "ginástica", "canoagem", "vela ", "surf",
  "xadrez", "esgrima", "triatlo", "maratona", "râguebi", "raguebi", "rugby",
  "motogp", "moto2", "moto3", "formula 1", "fórmula 1", " f1 ", "rali", "dakar",
  "nba", "nfl", "mlb", "nhl", "euroliga", "eurobasket",
  "ufc", "boxe", "kickbox", "mma ", "wrestling",
  "esports", "e-sports", "gaming",
  // TV, audiências e entretenimento
  "audiencia", "audiência", "audiencias", "audiências", "share", "espectadores a cada",
  "telespectador", "tvi", "sic ", " rtp", "cmtv", "now ", "streaming", "novela",
  "big brother", "reality", "festival", "concerto", "cinema", "filme",
  "programa da", "programa de tv", "apresentador",
  // núcleos/casas de adeptos e equipas secundárias não-futebol
  "casa benfica", "casas do benfica", "casa do sporting", "casa do fc porto", "nucleo", "núcleo",
];

/** Vocabulário que identifica futebol (PT + EN/ES para fontes estrangeiras). */
const FOOTBALL_TERMS: string[] = [
  "futebol", "liga", "jornada", "golo", "gols", "goleada", "goleia", "penalti", "penálti",
  "treinador", "avancado", "avançado", "guarda-redes", "defesa central", "lateral",
  "medio", "médio", "extremo", "plantel", "onze", "titular", "suplente",
  "estadio", "estádio", "relvado", "balneario", "balneário", "adeptos", "claque",
  "arbitro", "árbitro", "arbitragem", "var ", "fora de jogo",
  "mercado", "transferencia", "transferência", "reforco", "reforço", "emprestimo", "empréstimo",
  "contratacao", "contratação", "rescisao", "rescisão", "clausula", "cláusula",
  "selecao", "seleção", "convocados", "convocatoria", "convocatória",
  "champions", "europa league", "liga europa", "conference", "liga dos campeoes", "liga dos campeões",
  "taca de portugal", "taça de portugal", "taca da liga", "taça da liga", "supertaca", "supertaça",
  "uefa", "fifa", "futebolista", "derbi", "dérbi", "classico", "clássico",
  "primeira liga", "liga betclic", "liga portugal", "segunda liga", "liga 2",
  "premier league", "la liga", "serie a", "bundesliga", "ligue 1", "brasileirao", "brasileirão",
  "transfer", "signing", "loan deal", "fichaje", "traspaso",
];

function normalize(text: string): string {
  return ` ${text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")} `;
}

/** true se o texto tocar num termo da blocklist. */
export function isBlockedTopic(text: string): boolean {
  const norm = normalize(text);
  return BLOCKLIST.some((term) =>
    norm.includes(
      ` ${term.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()}`
    )
  );
}

/**
 * Decide se um item noticioso pertence à app (futebol).
 * @param text título + resumo concatenados
 */
export function isFootballRelevant(text: string): boolean {
  if (isBlockedTopic(text)) return false;
  if (detectClubs(text).length > 0) return true;
  const norm = normalize(text);
  return FOOTBALL_TERMS.some((term) =>
    norm.includes(term.normalize("NFD").replace(/[\u0300-\u036f]/g, ""))
  );
}
