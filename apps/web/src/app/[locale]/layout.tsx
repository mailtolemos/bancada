import { notFound } from "next/navigation";
import { getDictionary, isLocale } from "@bancada/core";
import { Header } from "@/components/Header";

// Live scores: render dinâmico sempre — nada de HTML congelado no build.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dict = getDictionary(locale);
  return {
    title: {
      default: `${dict.appName} — ${dict.tagline}`,
      template: `%s · ${dict.appName}`,
    },
    description: dict.tagline,
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);

  return (
    <div className="flex min-h-screen flex-col">
      <Header locale={locale} dict={dict} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-6 md:pb-10">
        {children}
      </main>
      <footer className="hidden border-t border-neutral-200/70 py-6 text-center text-xs text-neutral-500 dark:border-neutral-800/70 md:block">
        <p>
          {dict.common.footer} · {dict.common.dataBy}: ESPN ·{" "}
          <a href="https://www.football-data.org" className="underline" rel="noopener noreferrer" target="_blank">
            football-data.org
          </a>
        </p>
        <p className="mt-1 text-neutral-400">{dict.common.premiumSoon}</p>
      </footer>
    </div>
  );
}
