import { NextResponse } from "next/server";
import { pushConfigured } from "@/lib/push";

export const dynamic = "force-dynamic";

/** Chave pública VAPID para o cliente subscrever push. */
export function GET() {
  if (!pushConfigured()) {
    return NextResponse.json({ error: "push não configurado" }, { status: 503 });
  }
  return NextResponse.json({ key: process.env.VAPID_PUBLIC_KEY });
}
