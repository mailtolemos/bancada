# 🔐 Login — magic link (recomendado) ou Google

A app funciona sem login (favoritos ficam no dispositivo). Com login, o clube
favorito e as preferências sincronizam entre dispositivos.

Há dois métodos, ambos opcionais — configura **um** e o botão "Entrar" aparece.

---

## Opção A — Magic link por email (mais simples)

O utilizador escreve o email, recebe um link, clica e entra. Sem passwords,
sem consolas do Google.

### 1. Conta Resend (grátis: 3.000 emails/mês)

1. https://resend.com/signup → cria conta
2. **API Keys → Create API Key** → copia (começa por `re_`)
3. **Domains → Add Domain** → `bancada.live`
   - A Resend mostra registos DNS; como o domínio está na Vercel, adiciona-os
     em Vercel → Domains → bancada.live → DNS Records (copiar/colar)
   - Verificação demora poucos minutos
   - *Atalho para testar já*: salta este passo 3 — sem domínio verificado a
     Resend só envia para o email da tua própria conta, o que chega para
     experimentares.

### 2. Variáveis na Vercel

Settings → Environment Variables (Production + Preview) → **Redeploy**:

| Nome | Valor |
|---|---|
| `AUTH_SECRET` | gera com `npx auth secret` |
| `AUTH_RESEND_KEY` | a chave `re_...` do passo 1 |
| `AUTH_EMAIL_FROM` | `bancada. <login@bancada.live>` (ou omite para usar o remetente de teste) |
| `AUTH_URL` | `https://www.bancada.live` |

> O magic link precisa do **Upstash Redis** (que já tens) para guardar os
> tokens de verificação — nada mais a fazer.

---

## Opção B — Google

### 1. Credenciais

1. https://console.cloud.google.com → projeto novo
2. **APIs & Services → OAuth consent screen** → External → preenche o mínimo
3. **Credentials → Create credentials → OAuth client ID → Web application**
   - **Authorized redirect URIs**:
     - `https://www.bancada.live/api/auth/callback/google`
     - `http://localhost:3000/api/auth/callback/google`
4. Copia **Client ID** e **Client secret**

### 2. Variáveis: `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_URL`

### ⚠️ Erro `401: invalid_client`

Significa que o Client ID não corresponde a nenhum cliente OAuth ativo. Causas
habituais (por ordem de frequência):

1. **Valor truncado** ao copiar — o ID completo termina sempre em
   `.apps.googleusercontent.com`
2. **ID e secret trocados**
3. Espaços ou aspas à volta do valor na Vercel
4. O cliente OAuth foi criado noutro projeto ou apagado
5. Faltou **Redeploy** depois de gravar as variáveis

**Diagnóstico automático** (não revela os valores):

```bash
curl https://www.bancada.live/api/me
```

Repara em `diagnostics.google`:
- `idEndsCorrectly: false` → o Client ID está truncado ou errado
- `secretLooksLikeId: true` → puseste o Client ID no campo do secret

---

## Como funciona depois

- Botão **Entrar** no topo → email ou Google.
- O clube favorito guardado no dispositivo sobe para a conta na primeira
  sessão (fusão automática, nada se perde).
- Sessão em cookie JWT; perfil no Redis/Upstash.
