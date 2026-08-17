/**
 * Cache em memória com TTL + stale-while-revalidate.
 *
 * Objetivo: respeitar rate limits dos free tiers (football-data.org = 10 req/min)
 * servindo a maioria dos pedidos a partir de cache, sem nunca bloquear a UI.
 *
 * Nota de escala: em produção multi-instância (Vercel serverless), cada
 * instância tem a sua cache. Para escalar, trocar este módulo por
 * Redis/Upstash mantendo a mesma interface `cached()` — mais nada muda.
 */

interface Entry<T> {
  value: T;
  fresh: number; // timestamp até quando é "fresco"
  stale: number; // timestamp até quando ainda pode ser servido stale
}

const store = new Map<string, Entry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

export async function cached<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>,
  staleMs = ttlMs * 10
): Promise<T> {
  const now = Date.now();
  const entry = store.get(key) as Entry<T> | undefined;

  if (entry && now < entry.fresh) return entry.value;

  // Stale-while-revalidate: serve o valor antigo e atualiza em background.
  if (entry && now < entry.stale) {
    if (!inflight.has(key)) {
      const p = fetcher()
        .then((value) => {
          store.set(key, { value, fresh: Date.now() + ttlMs, stale: Date.now() + ttlMs + staleMs });
          return value;
        })
        .catch(() => entry.value)
        .finally(() => inflight.delete(key));
      inflight.set(key, p);
    }
    return entry.value;
  }

  // Sem valor utilizável: deduplica pedidos concorrentes para a mesma chave.
  const existing = inflight.get(key) as Promise<T> | undefined;
  if (existing) return existing;

  const p = fetcher()
    .then((value) => {
      store.set(key, { value, fresh: Date.now() + ttlMs, stale: Date.now() + ttlMs + staleMs });
      return value;
    })
    .catch((err) => {
      // Última linha de defesa: se falhar mas houver algo expirado, serve isso.
      if (entry) return entry.value;
      throw err;
    })
    .finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p as Promise<T>;
}

export function invalidate(prefix: string): void {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}
