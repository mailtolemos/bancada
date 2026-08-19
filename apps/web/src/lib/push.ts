/**
 * Web Push (VAPID) — subscrições por clube + envio de notificações.
 * As subscrições vivem no KV (Upstash em produção): set por clube
 * `push:club:{slug}` e set global `push:all`.
 */
import webpush from "web-push";
import { kvSAdd, kvSMembers, kvSRem } from "./kv";

export function pushConfigured(): boolean {
  return Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

let configured = false;
function ensureConfigured(): void {
  if (configured || !pushConfigured()) return;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? "mailto:mailtolemos@gmail.com",
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
  configured = true;
}

export interface StoredSubscription {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

function clubKey(slug: string): string {
  return `push:club:${slug}`;
}

export async function subscribe(sub: StoredSubscription, clubs: string[]): Promise<void> {
  const raw = JSON.stringify(sub);
  await kvSAdd("push:all", raw);
  for (const club of clubs) await kvSAdd(clubKey(club), raw);
}

export async function unsubscribe(endpoint: string, clubs: string[]): Promise<void> {
  // Remove por endpoint: precisamos de encontrar o membro exato em cada set.
  for (const key of ["push:all", ...clubs.map(clubKey)]) {
    const members = await kvSMembers(key);
    for (const m of members) {
      try {
        if ((JSON.parse(m) as StoredSubscription).endpoint === endpoint) await kvSRem(key, m);
      } catch {
        await kvSRem(key, m);
      }
    }
  }
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

/** Envia a todos os subscritores de um clube; limpa subscrições mortas. */
export async function sendToClub(slug: string, payload: PushPayload): Promise<number> {
  return sendToKey(clubKey(slug), payload);
}

async function sendToKey(key: string, payload: PushPayload): Promise<number> {
  ensureConfigured();
  if (!configured) return 0;
  const members = await kvSMembers(key);
  let sent = 0;
  await Promise.all(
    members.map(async (raw) => {
      try {
        const sub = JSON.parse(raw) as StoredSubscription;
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          JSON.stringify(payload),
          { TTL: 300, urgency: "high" }
        );
        sent++;
      } catch (err) {
        // 404/410 = subscrição expirada → remover
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          await kvSRem(key, raw);
          await kvSRem("push:all", raw);
        }
      }
    })
  );
  return sent;
}
