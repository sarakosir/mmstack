export function mergeArray<T extends any[]>(prev: T, next: T): T {
  return next.map((item, index): T[number] =>
    mergeIfObject<T[number]>(prev[index], item),
  ) as T;
}

export function mergeIfObject<T>(prev: T, next: T): T {
  if (typeof prev !== typeof next) return next;
  if (typeof prev !== 'object' || typeof next !== 'object') return next;
  if (prev === null || next === null) return next;
  if (Array.isArray(prev) && Array.isArray(next)) return mergeArray(prev, next);
  if (Array.isArray(prev) || Array.isArray(next)) return next;

  return { ...prev, ...next };
}
