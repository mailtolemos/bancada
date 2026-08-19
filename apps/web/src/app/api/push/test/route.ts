import { NextRequest, NextResponse } from "next/server";
import { getClub } from "@bancada/core";
import { kvConfigured, kvSMembers, kvVarScheme } from "@/lib/kv";
import { pushConfigured, sendToClub } from "@/lib/push";

export const dynamic = "force-dynamic";

/**
 * Envia uma notificação de TESTE aos subscritores de um clube.
 * GET /api/push/test?key=CRON_SECRET&club=benfica
 * Devolve também diagnóstico: nº de subscritores e se o KV partilhado existe.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const key = req.nextUrl.searchParams.get("key");
  if (secret && key !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const club = req.nextUrl.searchParams.get("club") ?? "";
  if (!getClub(club)) {
    return NextResponse.json({ error: "clube inválido — usa ?club=benfica" }, { status: 400 });
  }

  const subscribers = (await kvSMembers(`push:club:${club}`)).length;
  const sent = await sendToClub(club, {
    title: "Teste da bancada.",
    body: "As notificações de golos estão a funcionar.",
    url: `/pt/clube/${club}`,
    tag: "teste",
  });

  return NextResponse.json({
    ok: true,
    club,
    subscribers,
    sent,
    kvPartilhado: kvConfigured(),
    kvVars: kvVarScheme(),
    pushConfigurado: pushConfigured(),
    nota:
      subscribers === 0
        ? "0 subscritores: ou ainda ninguém subscreveu neste ambiente, ou falta o Upstash Redis (sem KV partilhado, as subscrições perdem-se entre instâncias serverless)."
        : undefined,
  });
}
