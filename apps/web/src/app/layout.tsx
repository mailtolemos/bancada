import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "bancada. — Todo o futebol. Num só lugar.",
  manifest: "/manifest.webmanifest",
  icons: { apple: "/apple-touch-icon.png" },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "bancada.",
  },
  description:
    "Resultados ao vivo, classificações, onze inicial, golos e notícias de múltiplas fontes fiáveis. Liga Portugal primeiro, o mundo a seguir.",
  applicationName: "bancada.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f5f5" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt" className={GeistSans.variable} suppressHydrationWarning>
      <head>
        {/* Os emblemas vêm quase todos do CDN da ESPN — poupa um handshake. */}
        <link rel="preconnect" href="https://a.espncdn.com" />
        <link rel="dns-prefetch" href="https://a.espncdn.com" />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
