import type { ClubMeta } from "./types";

/**
 * Metadados editoriais dos clubes (cores, links oficiais, comunidade).
 * A LISTA DE CLUBES DA ÉPOCA vem sempre da API (classificação/equipas) —
 * isto é só enriquecimento. Clube sem entrada aqui recebe um fallback neutro.
 */
export const CLUBS: ClubMeta[] = [
  {
    slug: "benfica",
    aliases: ["benfica", "sl benfica", "slb", "encarnados", "águias", "aguias", "luz"],
    colors: { primary: "#E30613", secondary: "#FFFFFF" },
    officialSite: "https://www.slbenfica.pt",
    twitter: "https://x.com/SLBenfica",
    reddit: "https://www.reddit.com/r/benfica/",
    redditSub: "benfica",
    forum: "https://forum.serbenfiquista.com",
    youtube: "https://www.youtube.com/user/SLBenfica",
    instagram: "https://www.instagram.com/slbenfica/",
    city: "Lisboa",
    stadium: "Estádio da Luz",
  },
  {
    slug: "porto",
    aliases: ["porto", "fc porto", "fcp", "dragões", "dragoes", "azuis e brancos", "dragão"],
    colors: { primary: "#00428C", secondary: "#FFFFFF" },
    officialSite: "https://www.fcporto.pt",
    twitter: "https://x.com/FCPorto",
    reddit: "https://www.reddit.com/r/fcporto/",
    redditSub: "fcporto",
    youtube: "https://www.youtube.com/user/FCPorto",
    instagram: "https://www.instagram.com/fcporto/",
    city: "Porto",
    stadium: "Estádio do Dragão",
  },
  {
    slug: "sporting",
    aliases: ["sporting", "sporting cp", "scp", "leões", "leoes", "verde e brancos", "alvalade"],
    colors: { primary: "#008057", secondary: "#FFFFFF" },
    officialSite: "https://www.sporting.pt",
    twitter: "https://x.com/SportingCP",
    reddit: "https://www.reddit.com/r/scp/",
    redditSub: "scp",
    forum: "https://forum.academiasporting.com",
    youtube: "https://www.youtube.com/user/SportingClubePortugal",
    instagram: "https://www.instagram.com/sportingclubedeportugal/",
    city: "Lisboa",
    stadium: "Estádio José Alvalade",
  },
  {
    slug: "braga",
    aliases: ["braga", "sc braga", "sporting braga", "arsenalistas", "guerreiros do minho"],
    colors: { primary: "#C8102E", secondary: "#FFFFFF" },
    officialSite: "https://www.scbraga.pt",
    twitter: "https://x.com/SCBragaOficial",
    city: "Braga",
    stadium: "Estádio Municipal de Braga",
  },
  {
    slug: "vitoria-guimaraes",
    aliases: ["vitória sc", "vitoria sc", "vitória de guimarães", "vitoria de guimaraes", "guimarães", "guimaraes", "vimaranenses", "conquistadores"],
    colors: { primary: "#FFFFFF", secondary: "#000000" },
    officialSite: "https://www.vitoriasc.pt",
    city: "Guimarães",
    stadium: "Estádio D. Afonso Henriques",
  },
  {
    slug: "famalicao",
    aliases: ["famalicão", "famalicao", "fc famalicão", "famalicenses"],
    colors: { primary: "#1B4C9C", secondary: "#FFFFFF" },
    city: "Vila Nova de Famalicão",
  },
  {
    slug: "moreirense",
    aliases: ["moreirense", "cónegos", "conegos"],
    colors: { primary: "#0E7A3C", secondary: "#FFFFFF" },
    city: "Moreira de Cónegos",
  },
  {
    slug: "estoril",
    aliases: ["estoril", "estoril praia", "gd estoril", "canarinhos"],
    colors: { primary: "#FFD200", secondary: "#003DA5" },
    city: "Estoril",
  },
  {
    slug: "casa-pia",
    aliases: ["casa pia", "gansos"],
    colors: { primary: "#000000", secondary: "#FFFFFF" },
    city: "Lisboa",
  },
  {
    slug: "rio-ave",
    aliases: ["rio ave", "vilacondenses"],
    colors: { primary: "#0B7A3E", secondary: "#FFFFFF" },
    city: "Vila do Conde",
  },
  {
    slug: "arouca",
    aliases: ["arouca", "fc arouca", "lobos"],
    colors: { primary: "#F2A900", secondary: "#000000" },
    city: "Arouca",
  },
  {
    slug: "gil-vicente",
    aliases: ["gil vicente", "gilistas", "galos"],
    colors: { primary: "#C8102E", secondary: "#002D62" },
    city: "Barcelos",
  },
  {
    slug: "estrela-amadora",
    aliases: ["estrela da amadora", "estrela amadora", "tricolores"],
    colors: { primary: "#C8102E", secondary: "#0057A8" },
    city: "Amadora",
  },
  {
    slug: "nacional",
    aliases: ["nacional", "cd nacional", "alvinegros da madeira"],
    colors: { primary: "#000000", secondary: "#FFFFFF" },
    city: "Funchal",
  },
  {
    slug: "avs",
    aliases: ["avs", "avs futebol sad", "aves"],
    colors: { primary: "#C8102E", secondary: "#FFFFFF" },
    city: "Vila das Aves",
  },
  {
    slug: "santa-clara",
    aliases: ["santa clara", "cd santa clara", "açorianos", "acorianos"],
    colors: { primary: "#C8102E", secondary: "#FFFFFF" },
    city: "Ponta Delgada",
  },
  {
    slug: "alverca",
    aliases: ["alverca", "fc alverca", "ribatejanos"],
    colors: { primary: "#C8102E", secondary: "#FFFFFF" },
    city: "Alverca do Ribatejo",
  },
  {
    slug: "tondela",
    aliases: ["tondela", "cd tondela", "beirões", "beiroes"],
    colors: { primary: "#F7D417", secondary: "#0B7A3E" },
    city: "Tondela",
  },
  {
    slug: "boavista",
    aliases: ["boavista", "axadrezados", "panteras"],
    colors: { primary: "#000000", secondary: "#FFFFFF" },
    city: "Porto",
  },
  {
    slug: "farense",
    aliases: ["farense", "sc farense", "leões de faro", "leoes de faro"],
    colors: { primary: "#000000", secondary: "#FFFFFF" },
    city: "Faro",
  },
  {
    slug: "leixoes",
    aliases: ["leixões", "leixoes", "bebés do mar", "bebes do mar"],
    colors: { primary: "#C8102E", secondary: "#000000" },
    city: "Matosinhos",
  },
  {
    slug: "maritimo",
    aliases: ["marítimo", "maritimo", "cs marítimo", "verde-rubros"],
    colors: { primary: "#0B7A3E", secondary: "#C8102E" },
    city: "Funchal",
  },
  {
    slug: "chaves",
    aliases: ["chaves", "gd chaves", "flavienses"],
    colors: { primary: "#C8102E", secondary: "#0057A8" },
    city: "Chaves",
  },
  {
    slug: "portimonense",
    aliases: ["portimonense", "alvinegros do algarve"],
    colors: { primary: "#000000", secondary: "#FFFFFF" },
    city: "Portimão",
  },
];

const FALLBACK: Omit<ClubMeta, "slug" | "aliases"> = {
  colors: { primary: "#64748B", secondary: "#FFFFFF" },
};

/** Normaliza um nome de equipa vindo da API para comparação. */
export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\b(sl|fc|cf|sc|cd|gd|cs|ac|ud|sad|futebol|clube|de|da|do|dos|das|e)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Encontra metadados de um clube a partir do nome que a API devolve. */
export function clubMetaForTeamName(teamName: string): ClubMeta {
  const norm = normalizeName(teamName);
  for (const club of CLUBS) {
    for (const alias of club.aliases) {
      const aliasNorm = normalizeName(alias);
      if (!aliasNorm) continue;
      if (norm === aliasNorm || norm.includes(aliasNorm) || aliasNorm.includes(norm)) {
        return club;
      }
    }
  }
  return { slug: slugify(teamName), aliases: [teamName.toLowerCase()], ...FALLBACK };
}

export function getClub(slug: string): ClubMeta | undefined {
  return CLUBS.find((c) => c.slug === slug);
}

export function slugify(name: string): string {
  return normalizeName(name).replace(/\s+/g, "-") || "clube";
}

/** Deteta que clubes são mencionados num texto (título/resumo de notícia). */
export function detectClubs(text: string): string[] {
  const lower = ` ${text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")} `;
  const found = new Set<string>();
  for (const club of CLUBS) {
    for (const alias of club.aliases) {
      const a = alias
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      // fronteiras simples de palavra para evitar falsos positivos
      if (new RegExp(`(^|[^a-z0-9])${escapeRegex(a)}([^a-z0-9]|$)`).test(lower)) {
        found.add(club.slug);
        break;
      }
    }
  }
  return [...found];
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
