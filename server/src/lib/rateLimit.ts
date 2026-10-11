type Entry = { count: number; resetAt: number };

// In-memory limiter: fine for a single server instance. Counters reset on restart.
export function createLimiter(options: { max: number; windowMs: number }) {
  const store = new Map<string, Entry>();

  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) if (entry.resetAt <= now) store.delete(key);
  }, 60_000);
  cleanup.unref();

  return {
    /** Seconds until the key may try again, or 0 if it is not blocked. */
    blockedFor(key: string) {
      const entry = store.get(key);
      if (!entry || entry.resetAt <= Date.now() || entry.count < options.max) return 0;
      return Math.ceil((entry.resetAt - Date.now()) / 1000);
    },
    hit(key: string) {
      const now = Date.now();
      const entry = store.get(key);
      if (!entry || entry.resetAt <= now) {
        store.set(key, { count: 1, resetAt: now + options.windowMs });
      } else {
        entry.count += 1;
      }
    },
    clear(key: string) {
      store.delete(key);
    },
  };
}
