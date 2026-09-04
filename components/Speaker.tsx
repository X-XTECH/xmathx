'use client';
import { useEffect, useState } from 'react';
import { speech, type SpeechStatus } from '@/engine/speech';
import { store, useProgress } from '@/engine/store';

const IconPlay = () => (<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>);
const IconPause = () => (<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 5h4v14H6zm8 0h4v14h-4z" /></svg>);
const IconReplay = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /></svg>);

/** Read-aloud controls for one card. Play or pause, replay, slower, auto-read. */
export default function Speaker({ text }: { text: string }) {
  const [status, setStatus] = useState<SpeechStatus>('idle');
  const [rate, setRate] = useState(1);
  const autoRead = useProgress((p) => p.settings.autoRead);

  useEffect(() => {
    setStatus(speech.status());
    setRate(speech.rate());
    return speech.subscribe(setStatus);
  }, []);

  if (status === 'unsupported') return <div className="speaker"><span className="chip-note">Read aloud is not available on this browser.</span></div>;

  const playing = status === 'playing';
  return (
    <div className="speaker" role="group" aria-label="Read aloud">
      <button type="button" className="sbtn primary" onClick={() => speech.toggle(text)} aria-label={playing ? 'Pause' : 'Play'}>
        {playing ? <IconPause /> : <IconPlay />}
        <span>{playing ? 'Pause' : status === 'paused' ? 'Resume' : 'Listen'}</span>
      </button>
      <button type="button" className="sbtn" onClick={() => (status === 'idle' ? speech.speak(text) : speech.replay())} aria-label="Replay"><IconReplay /></button>
      <button type="button" className={'sbtn' + (rate < 1 ? ' on' : '')} onClick={() => setRate(speech.slower())} aria-label="Slower">{rate === 1 ? 'Slower' : `${rate.toFixed(1)}×`}</button>
      <span className="spacer" />
      <button type="button" className={'sbtn' + (autoRead ? ' on' : '')} onClick={() => store.setSettings({ autoRead: !autoRead })} aria-pressed={autoRead} aria-label="Auto-read next card">Auto</button>
    </div>
  );
}
