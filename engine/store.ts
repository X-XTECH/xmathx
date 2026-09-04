'use client';
import { useSyncExternalStore } from 'react';
import { applyGrade, freshItem, todayIndex, type Grade, type ItemState } from './scheduler';

export interface DayProgress {
  /** Index of the next core step to do. */
  core: number;
  done: boolean;
  right: number;
  wrong: number;
}

export interface Tally { right: number; wrong: number }

export interface Progress {
  v: 1;
  currentDay: number;
  days: Record<number, DayProgress>;
  items: Record<string, ItemState>;
  /** Mastery per symbol, keyed by the symbol as displayed, e.g. "θ". */
  symbols: Record<string, Tally>;
  /** Mastery per skill: concept, equation, problem, build, incident, research, decision. */
  skills: Record<string, Tally>;
  settings: { autoRead: boolean; rate: number; voice: string };
}

const KEY = 'xmathx.progress.v1';

function blank(): Progress {
  return { v: 1, currentDay: 1, days: {}, items: {}, symbols: {}, skills: {}, settings: { autoRead: true, rate: 1, voice: '' } };
}

/** Plain object check that rejects arrays and prototype tricks from tampered storage. */
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v) && Object.getPrototypeOf(v) === Object.prototype;
}

function clampDay(v: unknown): number {
  const n = typeof v === 'number' && Number.isFinite(v) ? Math.round(v) : 1;
  return Math.max(1, Math.min(90, n));
}

let state: Progress = blank();
let loaded = false;
const listeners = new Set<() => void>();
let saveTimer: ReturnType<typeof setTimeout> | null = null;

function load(): void {
  if (loaded || typeof window === 'undefined') return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Progress>;
      if (isRecord(parsed) && parsed.v === 1) {
        const b = blank();
        state = {
          v: 1,
          currentDay: clampDay(parsed.currentDay),
          days: isRecord(parsed.days) ? (parsed.days as Progress['days']) : b.days,
          items: isRecord(parsed.items) ? (parsed.items as Progress['items']) : b.items,
          symbols: isRecord(parsed.symbols) ? (parsed.symbols as Progress['symbols']) : b.symbols,
          skills: isRecord(parsed.skills) ? (parsed.skills as Progress['skills']) : b.skills,
          settings: { autoRead: parsed.settings?.autoRead !== false, rate: typeof parsed.settings?.rate === 'number' ? parsed.settings.rate : 1, voice: typeof parsed.settings?.voice === 'string' ? parsed.settings.voice : '' },
        };
      }
    }
  } catch {
    state = blank();
  }
}

function flush(): void {
  if (typeof window === 'undefined') return;
  if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
  try { window.localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage may be unavailable */ }
}

function persist(): void {
  if (typeof window === 'undefined') return;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(flush, 150);
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });
}

function emit(): void {
  for (const l of listeners) l();
}

function set(next: Progress): void {
  state = next;
  persist();
  emit();
}

export const store = {
  get(): Progress { load(); return state; },
  subscribe(l: () => void): () => void { load(); listeners.add(l); return () => { listeners.delete(l); }; },

  setDay(day: number): void {
    set({ ...state, currentDay: day });
  },

  dayProgress(day: number): DayProgress {
    load();
    return state.days[day] ?? { core: 0, done: false, right: 0, wrong: 0 };
  },

  setCore(day: number, core: number): void {
    const d = store.dayProgress(day);
    if (d.core === core) return;
    set({ ...state, days: { ...state.days, [day]: { ...d, core } } });
  },

  finishDay(day: number): void {
    const d = store.dayProgress(day);
    set({ ...state, days: { ...state.days, [day]: { ...d, done: true } } });
  },

  restartDay(day: number): void {
    const d = store.dayProgress(day);
    set({ ...state, days: { ...state.days, [day]: { ...d, core: 0, done: false } } });
  },

  /** Record one answer. Symbols are credited when an equation is answered. */
  grade(id: string, day: number, kind: string, grade: Grade, symbols: string[] = []): void {
    const today = todayIndex();
    const prev = state.items[id] ?? freshItem(day, kind, today);
    const next = applyGrade(prev, grade, today);
    const right = grade !== 'again';
    const bump = (t: Tally | undefined): Tally => ({ right: (t?.right ?? 0) + (right ? 1 : 0), wrong: (t?.wrong ?? 0) + (right ? 0 : 1) });
    const sym = { ...state.symbols };
    for (const s of symbols) sym[s] = bump(sym[s]);
    const d = store.dayProgress(day);
    set({
      ...state,
      items: { ...state.items, [id]: next },
      symbols: sym,
      skills: { ...state.skills, [kind]: bump(state.skills[kind]) },
      days: { ...state.days, [day]: { ...d, right: d.right + (right ? 1 : 0), wrong: d.wrong + (right ? 0 : 1) } },
    });
  },

  /** Items due for recall, oldest first. */
  due(beforeDay: number, limit: number): Array<{ id: string; state: ItemState }> {
    load();
    const today = todayIndex();
    return Object.entries(state.items)
      .filter(([, s]) => s.day < beforeDay && s.due <= today)
      .sort((a, b) => a[1].due - b[1].due || b[1].lapses - a[1].lapses)
      .slice(0, limit)
      .map(([id, s]) => ({ id, state: s }));
  },

  setSettings(patch: Partial<Progress['settings']>): void {
    set({ ...state, settings: { ...state.settings, ...patch } });
  },

  reset(): void {
    set(blank());
  },
};

const serverSnapshot = blank();

/** Subscribe to a slice of progress. Only components that call this re-render. */
export function useProgress<T>(selector: (p: Progress) => T): T {
  return useSyncExternalStore(store.subscribe, () => selector(store.get()), () => selector(serverSnapshot));
}
