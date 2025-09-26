// Simple in-memory cache with TTL
// Not suitable for multi-instance deployments; for that use Redis or similar

const store = new Map();

function makeKey(prefix, params) {
  try {
    return `${prefix}:${JSON.stringify(params || {})}`;
  } catch {
    return `${prefix}:__key__`;
  }
}

export function cacheGet(prefix, params) {
  const key = makeKey(prefix, params);
  const entry = store.get(key);
  if (!entry) return undefined;
  const { expires, value } = entry;
  if (Date.now() > expires) {
    store.delete(key);
    return undefined;
  }
  return value;
}

export function cacheSet(prefix, params, value, ttlMs = 60_000) {
  const key = makeKey(prefix, params);
  store.set(key, { value, expires: Date.now() + ttlMs });
}

export function cacheClearPrefix(prefix) {
  for (const k of store.keys()) {
    if (k.startsWith(prefix + ':')) store.delete(k);
  }
}
