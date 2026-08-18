import { notFound } from "next/navigation";
import { getDictionary, isLocale } from "@bancada/core";
import { getMatchDetail, isDemo } from "@/lib/data";
import { MatchDetailView } from "@/components/MatchDetailView";
import { DemoBanner } from "@/components/SectionHeader";

export const dynamic = "force-dynamic";

export default async function MatchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ liga?: string }>;
}) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const { liga } = await searchParams;

  const match = await getMatchDetail(Number(id), liga).catch(() => null);
  if (!match) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      {isDemo() && <DemoBanner text={dict.common.demoNotice} />}
      <MatchDetailView initial={match} locale={locale} dict={dict} />
    </div>
  );
}
