# bancada.

Live scores, standings, match pages and multi-source news for football, starting with Liga Portugal.

Live at https://bancada.live

bancada. is a football companion: results as they happen, tables, line-ups, in-match events and news from several Portuguese sources. The web app is public. A native Expo app in `apps/mobile` talks to the same `/api/*` backend.

The default data provider is ESPN's public API (no key). Optional keys unlock official football-data.org stats and richer API-Football match detail.

## What it does

- Live scores with polling (about every 30 seconds, paused when the tab is hidden).
- League table with European and relegation zones, plus recent form.
- Match pages: score, half-time, referee, minute-by-minute events, stats, a lineup pitch and player ratings when the provider supplies them.
- Top scorers (goals, assists, penalties) when a football-data.org key is set.
- Club pages: upcoming and recent matches, table position, club-filtered news, and links to official and social channels.
- News aggregator (A Bola, Record, O Jogo, Maisfutebol, zerozero.pt, Público, SAPO) with deduplication and club detection.
- Four languages (PT, EN, ES, FR) via Accept-Language and `/[locale]` routes.
- Light and dark themes, mobile-first layout.
- Optional sign-in (email magic link or Google) so favourites sync across devices. Without login, favourites stay on the device.
- Web push for kick-off, goals and full-time by favourite club.
- Expo mobile app (`apps/mobile`) with the same tabs: matches, table, clubs, news.

The UI works without API keys, including a demo mode (`BANCADA_DEMO=1`).

## Tech stack

pnpm workspace:

- `apps/web`: Next.js, TypeScript, Tailwind CSS, NextAuth, Upstash Redis, web-push.
- `apps/mobile`: Expo (Router) for iOS and Android.
- `packages/core`: shared types, league registry, club metadata, news sources and i18n dictionaries.

## Run locally

```bash
pnpm install
pnpm dev
```

The web app is at http://localhost:3000.

Mobile:

```bash
cd apps/mobile
pnpm start
```

The mobile app expects the live API at https://www.bancada.live by default (`extra.apiUrl` in `apps/mobile/app.json`).

## Environment

Names only. Copy `apps/web/.env.example` to `apps/web/.env.local` for the data providers:

- `FOOTBALL_DATA_API_KEY` (optional, football-data.org)
- `API_FOOTBALL_KEY` (optional, richer match detail)
- `BANCADA_DEMO` (optional, force demo data)
- `DATA_PROVIDER` (optional, set to `football-data` to prefer that provider)

Auth, cache and push (used in code, not all listed in `.env.example`):

- `AUTH_SECRET`, `AUTH_RESEND_KEY`, `AUTH_EMAIL_FROM`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (or `KV_REST_API_URL`, `KV_REST_API_TOKEN`)
- `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`
- `CRON_SECRET`
- `NEXT_PUBLIC_SITE_URL`

See `LOGIN.md` and `NOTIFICACOES.md` for how those features are wired. Do not commit secret values.

## Deploy

Vercel project `bancada`, root directory `apps/web`, framework Next.js, production domain https://bancada.live. Set the environment variable names above on the project. The Expo app is built separately (see `apps/mobile/IOS-TESTFLIGHT.md`).

## Status

Live at https://bancada.live. This repository is public.
