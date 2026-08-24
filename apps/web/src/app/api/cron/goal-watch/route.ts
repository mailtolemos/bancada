import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { runGoalWatch } from "@/lib/goalWatch";
import { runNewsWatch } from "@/lib/newsWatch";

export const dynamic = "force-dynamic";
// Tempo para os watchers acabarem depois de a resposta já ter saído.
export const maxDuration = 60;

/**
 * Rede de segurança dos detetores (golos + notícias) — chamado por um cron
 * externo (ex: cron-job.org a cada minuto) com ?key=CRON_SECRET.
 *
 * Responde LOGO com 200 e corre os detetores depois (via `after`): em
 * arranques a frio a deteção pode demorar mais do que o timeout do serviço
 * de cron, e falhas repetidas levavam-no a desativar o job.
 *
 * ?sync=1 espera pelos resultados (útil para depurar à mão).
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const key = req.nextUrl.searchParams.get("key") ?? req.headers.get("authorization")?.replace("Bearer ", "");
  if (secret && key !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const run = () =>
    Promise.all([
      runGoalWatch(true).catch(() => ({ events: 0, sent: 0 })),
      runNewsWatch().catch(() => ({ events: 0, sent: 0 })),
    ]);

  if (req.nextUrl.searchParams.get("sync") === "1") {
    const [golos, noticias] = await run();
    return NextResponse.json({ ok: true, ...golos, noticias });
  }

  after(run);
  return NextResponse.json({ ok: true, agendado: true });
}
