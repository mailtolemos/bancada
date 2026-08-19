/**
 * Autenticação (Auth.js v5) — sessão em JWT/cookie, sem base de dados.
 * O perfil do utilizador (clube favorito, competições) vive no KV.
 *
 * Ativa-se com AUTH_SECRET + AUTH_GOOGLE_ID/AUTH_GOOGLE_SECRET.
 * Sem essas variáveis a app funciona na mesma (favoritos ficam no dispositivo).
 */
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const authEnabled = Boolean(
  process.env.AUTH_SECRET && process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
);

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: authEnabled
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
