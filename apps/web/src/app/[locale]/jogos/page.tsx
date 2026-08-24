import { notFound } from "next/navigation";
import { CalendarPlus } from "lucide-react";
import { getDictionary, isLocale } from "@bancada/core";
import { getAgendaMatches, isDemo, todayKey } from "@/lib/data";
import { DayMatchBoard } from "@/components/DayMatchBoard";
import { DemoBanner } from "@/components/SectionHeader";

export const dynamic = "force-dynamic";

/**
 * Página de jogos estilo agenda (Flashscore): um dia escolhido, todos os
 * jogos desse dia em todas as competições — os dos clubes seguidos primeiro.
 */
export default async function MatchesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);

  const today = todayKey();
  const matches = await getAgendaMatches(today).catch(() => []);

  return (
    <div className="space-y-6">
      {isDemo() && <DemoBanner text={dict.common.demoNotice} />}

      <DayMatchBoard locale={locale} dict={dict} initialDay={today} initialMatches={matches} />

      {/* Exportar calendário */}
      <div className="flex flex-wrap gap-1.5">
        <a
          href="/api/calendar?all=1"
          className="chip bg-neutral-200/80 text-neutral-700 transition-colors hover:bg-neutral-300 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
        >
          <CalendarPlus size={13} aria-hidden /> {dict.clubs.addToCalendar} — {dict.common.allLeagues}
        </a>
      </div>
    </div>
  );
}
