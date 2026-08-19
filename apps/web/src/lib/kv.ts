/**
 * Armazenamento chave-valor partilhado.
 *
 * Em produção usa Upstash Redis via REST (env UPSTASH_REDIS_REST_URL/TOKEN —
 * grátis, cria-se em 2 min no marketplace da Vercel). Sem env vars, usa
 * memória local (suficiente em desenvolvimento; em serverless cada instância
 * teria a sua cópia, por isso o Upstash é recomendado em produção).
 */

// A integração da Vercel injeta as credenciais com nomes diferentes conforme
// a versão do marketplace — aceitamos ambas as convenções.
const URL_ = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

export function kvConfigured(): boolean {
  return Boolean(URL_ && TOKEN);
}

/** Qual a convenção de env vars encontrada (diagnóstico). */
export function kvVarScheme(): string {
  if (process.env.UPSTASH_REDIS_REST_URL) return "UPSTASH_REDIS_REST_*";
  if (process.env.KV_REST_API_URL) return "KV_REST_API_*";
  return "nenhuma";
}

async function redis(cmd: (string | number)[]): Promise<unknown> {
  const res = await fetch(`${URL_}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(cmd),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`KV ${res.status}`);
  const body = (await res.json()) as { result: unknown; error?: string };
  if (body.error) throw new Error(body.error);
  return body.result;
}

/* fallback em memória */
const mem = new Map<string, { value: string; expires: number | null }>();
const memSets = new Map<string, Set<string>>();

function memGet(key: string): string | null {
  const e = mem.get(key);
  if (!e) return null;
  if (e.expires && Date.now() > e.expires) {
    mem.delete(key);
    return null;
  }
  return e.value;
}

export async function kvGet(key: string): Promise<string | null> {
  if (!kvConfigured()) return memGet(key);
  try {
    return (await redis(["GET", key])) as string | null;
  } catch {
    return memGet(key);
  }
}

export async function kvSet(key: string, value: string, ttlSeconds?: number): Promise<void> {
  mem.set(key, { value, expires: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null });
  if (!kvConfigured()) return;
  try {
    await redis(ttlSeconds ? ["SET", key, value, "EX", ttlSeconds] : ["SET", key, value]);
  } catch {
    /* memória já tem o valor */
  }
}

/** SET NX com TTL — para locks/throttle distribuído. true se adquirido. */
export async function kvLock(key: string, ttlSeconds: number): Promise<boolean> {
  if (!kvConfigured()) {
    if (memGet(key)) return false;
    mem.set(key, { value: "1", expires: Date.now() + ttlSeconds * 1000 });
    return true;
  }
  try {
    const r = await redis(["SET", key, "1", "NX", "EX", ttlSeconds]);
    return r === "OK";
  } catch {
    return false;
  }
}

export async function kvSAdd(key: string, member: string): Promise<void> {
  if (!memSets.has(key)) memSets.set(key, new Set());
  memSets.get(key)!.add(member);
  if (!kvConfigured()) return;
  try {
    await redis(["SADD", key, member]);
  } catch {
    /* ok */
  }
}

export async function kvSRem(key: string, member: string): Promise<void> {
  memSets.get(key)?.delete(member);
  if (!kvConfigured()) return;
  try {
    await redis(["SREM", key, member]);
  } catch {
    /* ok */
  }
}

export async function kvSMembers(key: string): Promise<string[]> {
  if (!kvConfigured()) return [...(memSets.get(key) ?? [])];
  try {
    return ((await redis(["SMEMBERS", key])) as string[]) ?? [];
  } catch {
    return [...(memSets.get(key) ?? [])];
  }
}
