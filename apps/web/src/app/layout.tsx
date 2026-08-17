import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Bancada — Todo o futebol, ao segundo",
    template: "%s · Bancada",
  },
  description:
    "Resultados ao vivo, classificações, onze inicial, golos e notícias de múltiplas fontes fiáveis. Liga Portugal primeiro, o mundo a seguir.",
  applicationName: "Bancada",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f5f5" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt" suppressHydrationWarning>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
