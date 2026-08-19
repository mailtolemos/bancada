# 🔐 Login (Google) — guia de ativação

A app funciona sem login (favoritos ficam no dispositivo). Com login, o clube
favorito e as preferências passam a **sincronizar entre dispositivos** e ficam
prontos para o futuro premium.

## 1. Criar credenciais Google (5 min, grátis)

1. https://console.cloud.google.com → cria um projeto (ex: "bancada")
2. Menu → **APIs & Services → OAuth consent screen**
   - User type: **External** → Create
   - App name: `bancada.` · email de suporte: o teu
   - Guarda e continua até ao fim (não precisas de verificação para começar)
3. Menu → **APIs & Services → Credentials → Create credentials → OAuth client ID**
   - Application type: **Web application**
   - Name: `bancada web`
   - **Authorized redirect URIs** — adiciona as duas:
     - `https://www.bancada.live/api/auth/callback/google`
     - `http://localhost:3000/api/auth/callback/google`
   - Create → copia o **Client ID** e o **Client secret**

## 2. Variáveis na Vercel

Vercel → projeto **bancada** → Settings → Environment Variables (Production +
Preview) e **Redeploy** no fim:

| Nome | Valor |
|---|---|
| `AUTH_SECRET` | gera com `npx auth secret` (ou qualquer string aleatória longa) |
| `AUTH_GOOGLE_ID` | o Client ID do passo 1 |
| `AUTH_GOOGLE_SECRET` | o Client secret do passo 1 |
| `AUTH_URL` | `https://www.bancada.live` |

> Sem estas variáveis o botão "Entrar" nem aparece — a app continua a
> funcionar normalmente com favoritos locais.

## 3. Como funciona

- Botão **Entrar** no topo → Google → volta autenticado.
- O clube favorito guardado no dispositivo é **enviado para a conta** na
  primeira sessão (fusão automática, sem perder nada).
- A partir daí, seguir/deixar de seguir um clube grava na conta (`/api/me`)
  e no dispositivo, por isso funciona online e offline.
- Sessão em cookie JWT (sem base de dados); o perfil vive no Redis/Upstash.

## Próximos passos naturais

- **Apple Sign-In** (obrigatório na App Store se houver login social)
- **Stripe** para o plano premium ligado à conta
- Preferências por utilizador: competições favoritas, alertas por tipo de
  evento (só golos, só início/fim), silenciar durante a noite
