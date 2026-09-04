import type { Day } from './types';

/** Lazy-load one day. Each day is its own chunk. */
export async function loadDay(n: number): Promise<Day> {
  const key = String(n).padStart(2, '0');
  const mod = await import(`./days/day${key}`);
  return mod.default as Day;
}
