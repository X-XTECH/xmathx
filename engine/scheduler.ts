/**
 * Spaced retrieval. Intervals are in calendar days.
 *  again  wrong. Retry now, then see it again tomorrow.
 *  hard   correct but difficult. Comes back sooner.
 *  easy   correct and easy. Comes back later.
 */
export type Grade = 'again' | 'hard' | 'easy';

export interface ItemState {
  /** Day the item belongs to, so its content can be lazy-loaded for recall. */
  day: number;
  /** Item kind for skill tracking: concept, equation, problem, build, incident, research, decision. */
  kind: string;
  /** Successful reviews in a row. */
  reps: number;
  /** Current interval in days. */
  interval: number;
  /** Ease multiplier, 1.3 to 3.0. */
  ease: number;
  /** Day number (days since epoch) when the item is next due. */
  due: number;
  /** Total times answered wrong. */
  lapses: number;
  /** Total times answered. */
  seen: number;
  /** Last grade. */
  last?: Grade;
}

export function todayIndex(now: number = Date.now()): number {
  return Math.floor(now / 86400000);
}

export function freshItem(day: number, kind: string, today: number): ItemState {
  return { day, kind, reps: 0, interval: 0, ease: 2.3, due: today, lapses: 0, seen: 0 };
}

export function applyGrade(s: ItemState, grade: Grade, today: number): ItemState {
  const n: ItemState = { ...s, seen: s.seen + 1, last: grade };
  if (grade === 'again') {
    n.reps = 0;
    n.interval = 0;
    n.lapses = s.lapses + 1;
    n.ease = Math.max(1.3, s.ease - 0.2);
    n.due = today + 1;
  } else if (grade === 'hard') {
    n.reps = s.reps + 1;
    n.interval = s.reps === 0 ? 1 : Math.max(1, Math.round(s.interval * 1.2));
    n.ease = Math.max(1.3, s.ease - 0.15);
    n.due = today + n.interval;
  } else {
    n.reps = s.reps + 1;
    n.interval = s.reps === 0 ? 3 : Math.max(2, Math.round(Math.max(1, s.interval) * s.ease));
    n.ease = Math.min(3.0, s.ease + 0.1);
    n.due = today + n.interval;
  }
  return n;
}

/** 0 to 1. A simple mastery score from reps and lapses. */
export function mastery(s: ItemState | undefined): number {
  if (!s || s.seen === 0) return 0;
  const base = Math.min(1, s.reps / 4);
  const penalty = Math.min(0.5, s.lapses * 0.1);
  return Math.max(0, Math.min(1, base - penalty + (s.last === 'easy' ? 0.1 : 0)));
}
