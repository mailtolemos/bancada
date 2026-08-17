import Link from "next/link";
import { notFound } from "next/navigation";
import { clubMetaForTeamName, getDictionary, isLocale } from "@bancada/core";
import { getStandings, isDemo } from "@/lib/data";
import { Crest } from "@/components/Crest";
import { DemoBanner, SectionHeader } from "@/components/SectionHeader";

export const dynamic = "force-dynamic";

export default async function ClubsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const standings = await getStandings().catch(() => []);
  const teams = [...standings].sort((a, b) => a.team.shortName.localeCompare(b.team.shortName, "pt"));

  return (
    <div className="space-y-4">
      {isDemo() && <DemoBanner text={dict.common.demoNotice} />}
      <SectionHeader title={`🛡 ${dict.clubs.title} — Liga Portugal`} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {teams.map((row) => {
          const meta = clubMetaForTeamName(row.team.name);
          return (
            <Link
              key={row.team.id}
              href={`/${locale}/clube/${meta.slug}`}
              className="card group flex flex-col items-center gap-3 overflow-hidden p-5 text-center transition-transform hover:-translate-y-1 hover:shadow-md"
            >
              <span
                className="h-1.5 w-full -translate-y-5 rounded-b"
                style={{ background: meta.colors.primary }}
              />
              <Crest team={row.team} size={52} />
              <div>
                <p className="font-bold leading-tight group-hover:underline">
                  {row.team.shortName}
                </p>
                {meta.city && <p className="mt-0.5 text-xs text-neutral-500">{meta.city}</p>}
              </div>
              <p className="text-xs text-neutral-500">
                {dict.clubs.position}: <span className="font-bold">{row.position}º</span>
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
