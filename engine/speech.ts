'use client';
/** Read aloud with the browser's SpeechSynthesis. Reads human words, never raw notation. */

export type SpeechStatus = 'idle' | 'playing' | 'paused' | 'unsupported';

type Listener = (s: SpeechStatus) => void;

const RATES = [1, 0.8, 0.6];

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

function pickVoice(): void {
  const s = synth();
  if (!s || voice) return;
  const voices = s.getVoices();
  if (!voices.length) return;
  voice = voices.find((v) => v.lang === 'en-GB' && /Daniel|Serena|Google UK English Female|Google UK English Male|Kate|Oliver/i.test(v.name))
    ?? voices.find((v) => v.lang === 'en-GB')
    ?? voices.find((v) => v.lang.startsWith('en'))
    ?? null;
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.addEventListener?.('voiceschanged', pickVoice);
}

export const speech = {
  supported(): boolean { return synth() !== null; },
  status(): SpeechStatus { return synth() ? status : 'unsupported'; },
  rate(): number { return RATES[rateIndex]; },
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
    u.lang = 'en-GB';
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
