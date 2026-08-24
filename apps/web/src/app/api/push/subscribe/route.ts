import { NextRequest, NextResponse } from "next/server";
import { subscribe, unsubscribe, type StoredSubscription } from "@/lib/push";

/**
 * Qualquer clube pode ser subscrito — o slug vem de clubMetaForTeamName e
 * inclui clubes estrangeiros sem metadados PT. Validamos só o formato.
 * (O bug antigo — aceitar apenas clubes com metadados — fazia o botão
 * "Receber golos" falhar em silêncio na maioria das páginas de clube.)
 */
const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,48}$/;

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

  const clubs = (body.clubs ?? []).filter((slug) => SLUG_RE.test(slug)).slice(0, 10);

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
