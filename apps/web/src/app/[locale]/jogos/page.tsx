import { notFound } from "next/navigation";
import { getDictionary, isLocale } from "@bancada/core";
import { getMatches, isDemo } from "@/lib/data";
import { LiveMatches } from "@/components/LiveMatches";
import { DemoBanner, SectionHeader } from "@/components/SectionHeader";

export const dynamic = "force-dynamic";

export default async function MatchesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const matches = await getMatches().catch(() => []);

  return (
    <div className="space-y-8">
      {isDemo() && <DemoBanner text={dict.common.demoNotice} />}
      <section>
        <SectionHeader title={`🔴 ${dict.home.liveNow}`} />
        <LiveMatches
          initial={matches}
          locale={locale}
          dict={dict}
          filter="live"
          emptyText={dict.home.noLive}
        />
      </section>
      <section>
        <SectionHeader title={dict.home.upcoming} />
        <LiveMatches initial={matches} locale={locale} dict={dict} filter="upcoming" showDay />
      </section>
      <section>
        <SectionHeader title={dict.home.recent} />
        <LiveMatches initial={matches} locale={locale} dict={dict} filter="finished" showDay />
      </section>
    </div>
  );
}
