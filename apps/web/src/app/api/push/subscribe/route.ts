import { NextRequest, NextResponse } from "next/server";
import { getClub } from "@bancada/core";
import { subscribe, unsubscribe, type StoredSubscription } from "@/lib/push";

export const dynamic = "force-dynamic";

interface Body {
  subscription?: StoredSubscription;
  endpoint?: string;
  clubs?: string[];
  action?: "subscribe" | "unsubscribe";
}

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const clubs = (body.clubs ?? []).filter((slug) => Boolean(getClub(slug))).slice(0, 5);

  if (body.action === "unsubscribe") {
    const endpoint = body.endpoint ?? body.subscription?.endpoint;
    if (!endpoint) return NextResponse.json({ error: "endpoint em falta" }, { status: 400 });
    await unsubscribe(endpoint, clubs);
    return NextResponse.json({ ok: true });
  }

  const sub = body.subscription;
  if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) {
    return NextResponse.json({ error: "subscrição inválida" }, { status: 400 });
  }
  if (!clubs.length) {
    return NextResponse.json({ error: "escolhe pelo menos um clube" }, { status: 400 });
  }
  await subscribe({ endpoint: sub.endpoint, keys: sub.keys }, clubs);
  return NextResponse.json({ ok: true, clubs });
}
