/**
 * Autenticação (Auth.js v5). Dois métodos, ambos opcionais:
 *
 *  1. **Magic link por email** (recomendado — sem consolas de terceiros):
 *     AUTH_RESEND_KEY + AUTH_EMAIL_FROM. Guarda os tokens no Upstash Redis
 *     (as mesmas variáveis KV_REST_API_* que já usamos).
 *  2. **Google**: AUTH_GOOGLE_ID + AUTH_GOOGLE_SECRET.
 *
 * Sem nenhum configurado a app funciona na mesma (favoritos no dispositivo).
 */
import NextAuth, { type NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import { UpstashRedisAdapter } from "@auth/upstash-redis-adapter";
import { Redis } from "@upstash/redis";

const GOOGLE_ID = process.env.AUTH_GOOGLE_ID?.trim();
const GOOGLE_SECRET = process.env.AUTH_GOOGLE_SECRET?.trim();
const RESEND_KEY = process.env.AUTH_RESEND_KEY?.trim();
const EMAIL_FROM = process.env.AUTH_EMAIL_FROM?.trim() || "bancada. <onboarding@resend.dev>";

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

const hasGoogle = Boolean(GOOGLE_ID && GOOGLE_SECRET);
const hasRedis = Boolean(REDIS_URL && REDIS_TOKEN);
// Magic links precisam de armazenamento para os tokens de verificação.
const hasMagicLink = Boolean(RESEND_KEY) && hasRedis;

export const authEnabled = Boolean(process.env.AUTH_SECRET) && (hasGoogle || hasMagicLink);

/** Diagnóstico do login (sem revelar valores). */
export function authDiagnostics() {
  return {
    enabled: authEnabled,
    methods: [hasMagicLink ? "email" : null, hasGoogle ? "google" : null].filter(Boolean),
    missing: [
      !process.env.AUTH_SECRET ? "AUTH_SECRET" : null,
      !hasGoogle && !hasMagicLink ? "AUTH_RESEND_KEY (magic link) ou AUTH_GOOGLE_ID+SECRET" : null,
      RESEND_KEY && !hasRedis ? "Upstash Redis (necessário para magic link)" : null,
    ].filter(Boolean),
    // Ajuda a apanhar Client IDs truncados/trocados sem os expor.
    google: hasGoogle
      ? {
          idLength: GOOGLE_ID!.length,
          idEndsCorrectly: GOOGLE_ID!.endsWith(".apps.googleusercontent.com"),
          secretLooksLikeId: Boolean(GOOGLE_SECRET?.includes("apps.googleusercontent.com")),
        }
      : null,
    emailFrom: hasMagicLink ? EMAIL_FROM : null,
  };
}

const providers: NextAuthConfig["providers"] = [];
if (hasMagicLink) providers.push(Resend({ apiKey: RESEND_KEY!, from: EMAIL_FROM }));
if (hasGoogle) {
  providers.push(
    Google({
      clientId: GOOGLE_ID,
      clientSecret: GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
    })
  );
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  // Reserva só para o Auth.js inicializar sem credenciais configuradas.
  secret: process.env.AUTH_SECRET ?? "bancada-placeholder-secret-not-in-use",
  adapter: hasMagicLink
    ? UpstashRedisAdapter(new Redis({ url: REDIS_URL!, token: REDIS_TOKEN! }))
    : undefined,
  providers,
  session: { strategy: "jwt" },
  trustHost: true,
  callbacks: {
    jwt({ token, user, profile }) {
      if (profile?.sub) token.sub = profile.sub;
      else if (user?.id) token.sub = user.id;
      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub) session.user.id = token.sub;
      return session;
    },
  },
});
