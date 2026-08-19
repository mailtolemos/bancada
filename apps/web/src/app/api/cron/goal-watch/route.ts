import { NextRequest, NextResponse } from "next/server";
import { runGoalWatch } from "@/lib/goalWatch";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * Rede de segurança do detetor de golos — chamado por um cron externo
 * (ex: cron-job.org a cada minuto) com ?key=CRON_SECRET.
 * O detetor também dispara oportunisticamente com o tráfego do site.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const key = req.nextUrl.searchParams.get("key") ?? req.headers.get("authorization")?.replace("Bearer ", "");
  if (secret && key !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const result = await runGoalWatch(true);
  return NextResponse.json({ ok: true, ...result });
}
