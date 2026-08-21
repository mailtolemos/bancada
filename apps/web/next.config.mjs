/** @type {import('next').NextConfig} */
const securityHeaders = [
  // Impede o browser de adivinhar tipos de conteúdo (mitiga XSS por sniffing).
  { key: "X-Content-Type-Options", value: "nosniff" },
  // O site não deve ser embebido em iframes de terceiros (clickjacking).
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  // Não vazar URLs completos para outros domínios.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // APIs sensíveis do browser que não usamos ficam desligadas.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  // HTTPS sempre (a Vercel já redireciona; isto fixa-o no browser).
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig = {
  transpilePackages: ["@bancada/core"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "crests.football-data.org" },
      { protocol: "https", hostname: "media.api-sports.io" },
      { protocol: "https", hostname: "**" },
    ],
  },
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
