import { NextRequest, NextResponse } from "next/server";
import { kvConfigured, kvSMembers, kvVarScheme } from "@/lib/kv";
import { pushConfigured, sendToClub, type PushTopic } from "@/lib/push";

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
  if (!/^[a-z0-9][a-z0-9-]{1,48}$/.test(club)) {
    return NextResponse.json({ error: "clube inválido — usa ?club=benfica" }, { status: 400 });
  }

  const topic: PushTopic = req.nextUrl.searchParams.get("topic") === "news" ? "news" : "goals";
  const setKey = topic === "news" ? `push:news:${club}` : `push:club:${club}`;
  const subscribers = (await kvSMembers(setKey)).length;
  // dry=1: só diagnóstico, não envia nada.
  const dry = req.nextUrl.searchParams.get("dry") === "1";
  const sent = dry
    ? 0
    : await sendToClub(
        club,
        {
          title: "Teste da bancada.",
          body:
            topic === "news"
              ? "As notificações de notícias estão a funcionar."
              : "As notificações de golos estão a funcionar.",
          url: `/pt/clube/${club}`,
          tag: "teste",
        },
        topic
      );

  return NextResponse.json({
    ok: true,
    club,
    topic,
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
