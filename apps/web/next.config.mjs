/** @type {import('next').NextConfig} */
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
};

export default nextConfig;
