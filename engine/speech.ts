'use client';
/** Read aloud with the browser's SpeechSynthesis. Reads human words, never raw notation. */

export type SpeechStatus = 'idle' | 'playing' | 'paused' | 'unsupported';

type Listener = (s: SpeechStatus) => void;

/** Gentle by default. Slower steps for hard cards. */
const RATES = [0.94, 0.8, 0.66];
const PITCH = 1.05;

/** Preferred voices, softest and most natural first. Names differ by device. */
const PREFERRED = ['Serena', 'Martha', 'Kate', 'Stephanie', 'Moira', 'Fiona', 'Google UK English Female', 'Microsoft Sonia', 'Microsoft Libby', 'Samantha', 'Ava', 'Allison', 'Google US English', 'Daniel', 'Oliver', 'Arthur', 'Google UK English Male'];
let wanted: string | null = null;

let status: SpeechStatus = 'idle';
let rateIndex = 0;
let lastText = '';
let voice: SpeechSynthesisVoice | null = null;
const listeners = new Set<Listener>();
let onEndCb: (() => void) | null = null;

function synth(): SpeechSynthesis | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  return window.speechSynthesis;
}

function setStatus(s: SpeechStatus): void {
  status = s;
  for (const l of listeners) l(s);
}

function englishVoices(): SpeechSynthesisVoice[] {
  const s = synth();
  if (!s) return [];
  return s.getVoices().filter((v) => /^en[-_]/i.test(v.lang));
}

/** Rank a voice: chosen by the user, then preferred names, enhanced or premium builds, British English. */
function score(v: SpeechSynthesisVoice): number {
  let n = 0;
  if (wanted && v.name === wanted) n += 1000;
  const i = PREFERRED.findIndex((p) => v.name.startsWith(p));
  if (i >= 0) n += 500 - i * 10;
  if (/enhanced|premium|natural|neural/i.test(v.name)) n += 60;
  if (/^en[-_]GB/i.test(v.lang)) n += 30;
  if (v.localService) n += 5;
  if (/compact|eloquence|novelty|whisper|bad news|bells|boing|bubbles|cellos|zarvox|trinoids|albert|fred|junior|ralph|kathy/i.test(v.name)) n -= 400;
  return n;
}

function pickVoice(): void {
  const list = englishVoices();
  if (!list.length) return;
  voice = [...list].sort((a, b) => score(b) - score(a))[0] ?? null;
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.addEventListener?.('voiceschanged', () => { voice = null; pickVoice(); });
}

export const speech = {
  supported(): boolean { return synth() !== null; },
  status(): SpeechStatus { return synth() ? status : 'unsupported'; },
  rate(): number { return RATES[rateIndex]; },
  /** English voices on this device, best first. */
  voices(): SpeechSynthesisVoice[] { return englishVoices().sort((a, b) => score(b) - score(a)); },
  current(): string { pickVoice(); return voice?.name ?? ''; },
  /** Choose a voice by name. Empty means automatic. */
  setVoice(name: string): void { wanted = name || null; voice = null; pickVoice(); },
  /** Unlock audio on iOS from a user gesture. */
  prime(): void { const s = synth(); if (!s || status !== 'idle') return; const u = new SpeechSynthesisUtterance(' '); u.volume = 0; s.speak(u); },
  subscribe(l: Listener): () => void { listeners.add(l); return () => { listeners.delete(l); }; },

  speak(text: string, onEnd?: () => void): void {
    const s = synth();
    if (!s) return;
    pickVoice();
    s.cancel();
    lastText = text;
    onEndCb = onEnd ?? null;
    const u = new SpeechSynthesisUtterance(text);
    u.rate = RATES[rateIndex];
    u.pitch = PITCH;
    u.lang = voice?.lang ?? 'en-GB';
    if (voice) u.voice = voice;
    u.onstart = () => setStatus('playing');
    u.onend = () => { setStatus('idle'); const cb = onEndCb; onEndCb = null; cb?.(); };
    u.onerror = () => { setStatus('idle'); onEndCb = null; };
    s.speak(u);
    setStatus('playing');
  },

  pause(): void { const s = synth(); if (!s) return; if (status === 'playing') { s.pause(); setStatus('paused'); } },
  resume(): void { const s = synth(); if (!s) return; if (status === 'paused') { s.resume(); setStatus('playing'); } },
  toggle(text: string): void {
    if (status === 'playing') speech.pause();
    else if (status === 'paused' && lastText === text) speech.resume();
    else speech.speak(text);
  },
  replay(): void { if (lastText) speech.speak(lastText, onEndCb ?? undefined); },
  slower(): number {
    rateIndex = (rateIndex + 1) % RATES.length;
    if (status === 'playing' || status === 'paused') speech.replay();
    return RATES[rateIndex];
  },
  stop(): void { const s = synth(); if (!s) return; onEndCb = null; s.cancel(); setStatus('idle'); },
};
