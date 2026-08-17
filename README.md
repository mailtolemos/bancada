# ⚽ Bancada — Todo o futebol, ao segundo

A app definitiva de futebol: **resultados ao vivo, classificações, 11 inicial, eventos ao minuto, notas de jogadores e notícias agregadas de múltiplas fontes fiáveis**. Liga Portugal primeiro — arquitetura pronta para o mundo.

## O que já está feito

- 🔴 **Live scores** com atualização automática (polling inteligente de 30s, pausa quando o separador está oculto)
- 📊 **Classificação** com zonas europeias/despromoção e forma recente
- ⚽ **Página de jogo**: placar, intervalo, árbitro, eventos ao minuto, estatísticas (posse, remates, xG), campo com 11 inicial e notas de jogadores
- 🥇 **Melhores marcadores** (golos, assistências, penáltis)
- 🛡 **Página de cada clube**: próximos/últimos jogos, posição, notícias filtradas do clube, links para site oficial, X/Twitter, Instagram, YouTube, Reddit e fóruns
- 📰 **Agregador de notícias** multi-fonte (A Bola, Record, O Jogo, Maisfutebol, zerozero.pt, Público, SAPO) com deduplicação e deteção automática de clubes
- 🌍 **4 idiomas nativos** (PT, EN, ES, FR) com deteção automática via Accept-Language
- 🌗 **Light / dark mode** (com respeito pelo tema do sistema)
- 📱 **Mobile-first** com barra de navegação inferior estilo app nativa
- ⚡ **Modo demonstração**: funciona sem chaves de API, com um jogo ao vivo de vitrine

## Arranque rápido

```bash
pnpm install
cp apps/web/.env.example apps/web/.env.local   # e cola as tuas chaves
pnpm dev                                        # http://localhost:3000
```

Sem chaves, a app corre em **modo demonstração** (badge visível na UI).

### Chave gratuita (dados reais da Liga Portugal)

1. Regista-te em https://www.football-data.org/client/register (grátis)
2. Cola o token em `apps/web/.env.local` → `FOOTBALL_DATA_API_KEY=...`

Free tier: resultados, calendário, classificação e marcadores da Liga Portugal (10 pedidos/min — a cache interna garante que nunca passas o limite).

### Upgrade para dados premium (quando quiseres)

`API_FOOTBALL_KEY=...` (https://www.api-football.com, ~$29/mês) desbloqueia **11 inicial real, eventos ao minuto, ratings de jogadores e estatísticas de jogo** — sem mudar uma linha de código. A camada de fornecedores deteta a chave e enriquece automaticamente as páginas de jogo.

## Arquitetura (pensada para escalar)

```
bancada/
├── packages/core          # ❤️ partilhado web + mobile (futuro Expo)
│   └── src/
│       ├── types.ts       # modelo de domínio (Match, StandingRow, NewsItem, …)
│       ├── leagues.ts     # registo de ligas — ativar nova liga = 1 linha
│       ├── clubs.ts       # metadados editoriais + deteção de clubes em texto
│       ├── news-sources.ts# fontes RSS de confiança
│       └── i18n/          # dicionários PT/EN/ES/FR
└── apps/web               # Next.js 15 (App Router, TypeScript, Tailwind)
    └── src/
        ├── lib/
        │   ├── cache.ts             # TTL + stale-while-revalidate (trocável por Redis)
        │   ├── providers/           # football-data.org + API-Football normalizados
        │   ├── data.ts              # fachada única — a UI nunca conhece o fornecedor
        │   └── news.ts              # agregador RSS resiliente (fontes falham isoladas)
        ├── app/[locale]/            # páginas server-rendered por idioma
        ├── app/api/                 # endpoints internos para polling do cliente
        └── components/              # UI reutilizável
```

**Princípios:**

- **Fornecedores plugáveis** — a UI consome tipos de domínio; trocar/adicionar APIs não toca nas páginas.
- **Cache primeiro** — todos os pedidos externos passam por cache com stale-while-revalidate; free tiers aguentam tráfego real.
- **Resiliência** — cada fonte de notícias falha isoladamente; API em baixo → serve-se o último valor conhecido.
- **Multi-liga por design** — `packages/core/src/leagues.ts` já tem Premier League, La Liga, Serie A, Bundesliga, Ligue 1 e Champions preparadas (`active: false`).

## Roadmap sugerido

1. **Contas + Premium** — Auth (Clerk/Auth.js) + Stripe; gate de funcionalidades premium (notificações de golos, estatísticas avançadas, zero anúncios). A UI já mostra o teaser no rodapé.
2. **App nativa iOS/Android** — criar `apps/mobile` com Expo; reutiliza `@bancada/core` (tipos, i18n, ligas, clubes) e os endpoints `/api/*` já existentes como backend.
3. **Notificações push de golos** — worker que compara snapshots de `/api/matches` e dispara via Expo Push/FCM.
4. **Mais ligas** — ativar em `leagues.ts`; o free tier da football-data.org já cobre PL, La Liga, Serie A, Bundesliga, Ligue 1, Champions.
5. **Escala** — trocar `lib/cache.ts` por Upstash Redis (mesma interface), ISR/edge para classificações.

## Deploy

Vercel (recomendado): root directory = `apps/web`, framework Next.js. Definir env vars `FOOTBALL_DATA_API_KEY` (+ `API_FOOTBALL_KEY` quando existir).

---

Dados de jogos: [football-data.org](https://www.football-data.org) · Notícias: fontes citadas em cada cartão · Feito com paixão pelo futebol português 🇵🇹
