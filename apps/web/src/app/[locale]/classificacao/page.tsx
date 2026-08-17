import { notFound } from "next/navigation";
import { getDictionary, isLocale } from "@futiq/core";
import { getStandings, isDemo } from "@/lib/data";
import { StandingsTable } from "@/components/StandingsTable";
import { DemoBanner, SectionHeader } from "@/components/SectionHeader";

export const dynamic = "force-dynamic";

export default async function StandingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const standings = await getStandings().catch(() => []);

  return (
    <div className="space-y-4">
      {isDemo() && <DemoBanner text={dict.common.demoNotice} />}
      <SectionHeader title={`🇵🇹 Liga Portugal — ${dict.nav.standings}`} />
      <StandingsTable standings={standings} locale={locale} dict={dict} />
    </div>
  );
}
