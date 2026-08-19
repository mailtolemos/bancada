/**
 * URL público do site. Usa NEXT_PUBLIC_SITE_URL quando definido; caso
 * contrário o domínio de produção da Vercel; por fim o domínio próprio.
 * Assim a app não fica presa a um domínio no código.
 */
const fromEnv =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : undefined);

export const SITE_URL = (fromEnv ?? "https://www.bancada.live").replace(/\/$/, "");

/** Domínio sem protocolo, para mostrar na UI (ex: cartões de partilha). */
export const SITE_HOST = SITE_URL.replace(/^https?:\/\//, "");
