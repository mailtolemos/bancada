# 🔔 Notificações de golos — guia de ativação

A web app envia notificações push de **apito inicial, golos e resultado final**
por clube (Liga Portugal). Funciona em Android/desktop diretamente e no
**iPhone (iOS 16.4+)** com o site adicionado ao ecrã principal.

## 1. Variáveis de ambiente na Vercel (obrigatório)

Vercel → projeto **bancada** → Settings → Environment Variables → adicionar
(Production + Preview) e **Redeploy** no fim:

| Nome | Valor |
|---|---|
| `VAPID_PUBLIC_KEY` | `<VAPID_PUBLIC_KEY>` |
| `VAPID_PRIVATE_KEY` | `<VAPID_PRIVATE_KEY>` |
| `VAPID_SUBJECT` | `mailto:<CONTACT_EMAIL>` |
| `CRON_SECRET` | `<CRON_SECRET>` |

## 2. Upstash Redis (recomendado para produção)

As subscrições e os snapshots de jogos precisam de armazenamento partilhado
entre instâncias serverless. Sem ele funciona, mas de forma pouco fiável.

Vercel → projeto → **Storage → Create Database → Upstash for Redis** (plano
grátis chega de sobra). As env vars `UPSTASH_REDIS_REST_URL` e
`UPSTASH_REDIS_REST_TOKEN` são injetadas automaticamente — basta Redeploy.
Bónus: o mesmo Redis passa a servir de cache partilhada das subscrições.

## 3. Cron externo (rede de segurança)

O detetor de golos dispara sozinho com o tráfego do site (quem tem a app
aberta durante um jogo alimenta a deteção). Para garantir notificações mesmo
sem ninguém no site, cria um cron grátis em https://cron-job.org:

- URL: `https://www.bancada.live/api/cron/goal-watch?key=CRON_SECRET`
- Frequência: a cada 1 minuto
- (opcional: restringe o horário a tardes/noites de jogos para poupar)

## 4. Como o utilizador ativa

- **Android/desktop**: página do clube → botão "🔔 Receber golos deste clube"
  → aceitar a permissão. Fim.
- **iPhone**: Safari → Partilhar → **Adicionar ao ecrã principal** → abrir a
  bancada. a partir do ícone → página do clube → botão 🔔. (Fora do ecrã
  principal, o botão mostra a instrução automaticamente.)

## Testar manualmente

```bash
# disparar um ciclo de deteção:
curl "https://www.bancada.live/api/cron/goal-watch?key=CRON_SECRET"
# → {"ok":true,"events":N,"sent":M}
```

Durante um jogo da Liga Portugal com subscritores, cada golo dispara `sent > 0`.
