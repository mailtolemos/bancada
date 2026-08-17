import type { NewsSource } from "./types";

/**
 * Fontes noticiosas de confiança (RSS). O agregador tolera fontes em baixo:
 * cada feed falha isoladamente sem afetar os restantes.
 */
export const NEWS_SOURCES: NewsSource[] = [
  {
    id: "abola",
    name: "A Bola",
    url: "https://www.abola.pt",
    feedUrl: "https://www.abola.pt/rss",
    lang: "pt",
    trusted: true,
  },
  {
    id: "record",
    name: "Record",
    url: "https://www.record.pt",
    feedUrl: "https://www.record.pt/rss",
    lang: "pt",
    trusted: true,
  },
  {
    id: "ojogo",
    name: "O Jogo",
    url: "https://www.ojogo.pt",
    feedUrl: "https://www.ojogo.pt/rss",
    lang: "pt",
    trusted: true,
  },
  {
    id: "maisfutebol",
    name: "Maisfutebol",
    url: "https://maisfutebol.iol.pt",
    feedUrl: "https://maisfutebol.iol.pt/rss",
    lang: "pt",
    trusted: true,
  },
  {
    id: "zerozero",
    name: "zerozero.pt",
    url: "https://www.zerozero.pt",
    feedUrl: "https://www.zerozero.pt/rss/noticias.php",
    lang: "pt",
    trusted: true,
  },
  {
    id: "publico",
    name: "Público Desporto",
    url: "https://www.publico.pt/desporto",
    feedUrl: "https://feeds.feedburner.com/PublicoDesporto",
    lang: "pt",
    trusted: true,
  },
  {
    id: "sapo",
    name: "SAPO Desporto",
    url: "https://desporto.sapo.pt",
    feedUrl: "https://desporto.sapo.pt/rss",
    lang: "pt",
    trusted: true,
  },
];

export function getSource(id: string): NewsSource | undefined {
  return NEWS_SOURCES.find((s) => s.id === id);
}
