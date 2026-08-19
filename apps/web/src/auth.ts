/**
 * Autenticação (Auth.js v5) — sessão em JWT/cookie, sem base de dados.
 * O perfil do utilizador (clube favorito, competições) vive no KV.
 *
 * Ativa-se com AUTH_SECRET + AUTH_GOOGLE_ID/AUTH_GOOGLE_SECRET.
 * Sem essas variáveis a app funciona na mesma (favoritos ficam no dispositivo)
 * — o segredo de reserva evita que o Auth.js rebente ao inicializar.
 */
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

const hasGoogle = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

export const authEnabled = Boolean(process.env.AUTH_SECRET) && hasGoogle;

/** O que falta para ativar o login (diagnóstico, sem revelar valores). */
export function authMissing(): string[] {
  const missing: string[] = [];
  if (!process.env.AUTH_SECRET) missing.push("AUTH_SECRET");
  if (!process.env.AUTH_GOOGLE_ID) missing.push("AUTH_GOOGLE_ID");
  if (!process.env.AUTH_GOOGLE_SECRET) missing.push("AUTH_GOOGLE_SECRET");
  return missing;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  // Reserva só para o Auth.js inicializar sem credenciais; sem providers
  // não há sessões, por isso não protege nada de real.
  secret: process.env.AUTH_SECRET ?? "bancada-placeholder-secret-not-in-use",
  providers: hasGoogle
    ? [
        Google({
          clientId: process.env.AUTH_GOOGLE_ID,
          clientSecret: process.env.AUTH_GOOGLE_SECRET,
          allowDangerousEmailAccountLinking: true,
        }),
      ]
    : [],
  session: { strategy: "jwt" },
  trustHost: true,
  callbacks: {
    jwt({ token, profile }) {
      if (profile?.sub) token.sub = profile.sub;
      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub) session.user.id = token.sub;
      return session;
    },
  },
});
