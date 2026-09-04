'use client';
import { useState } from 'react';
import { PHASES, TOTAL_DAYS, titleFor } from '@/data/outline';
import { store, useProgress } from '@/engine/store';

interface Props {
  current: number;
  onPick: (day: number) => void;
  onClose: () => void;
}

const SKILLS: Array<[string, string]> = [['concept', 'Ideas'], ['equation', 'Equations'], ['problem', 'Problems'], ['build', 'Builds'], ['incident', 'Incidents'], ['research', 'Research'], ['decision', 'Decisions']];

/** Full-screen sheet. Phase, then day. Progress and settings live here, out of the lesson. */
export default function DayPicker({ current, onPick, onClose }: Props) {
  const [view, setView] = useState<'phases' | 'days' | 'progress'>('phases');
  const [phaseIdx, setPhaseIdx] = useState(() => PHASES.findIndex((p) => current >= p.from && current <= p.to));
  const days = useProgress((p) => p.days);
  const skills = useProgress((p) => p.skills);
  const symbols = useProgress((p) => p.symbols);
  const autoRead = useProgress((p) => p.settings.autoRead);

  const doneCount = (from: number, to: number) => { let n = 0; for (let d = from; d <= to; d++) if (days[d]?.done) n++; return n; };
  const totalDone = doneCount(1, TOTAL_DAYS);

  return (
    <div className="sheet" role="dialog" aria-modal="true" aria-label="Choose a day">
      <div className="sheet-top">
        {view === 'phases' ? <span /> : <button type="button" className="back" onClick={() => setView('phases')} aria-label="Back">‹</button>}
        <h2>{view === 'phases' ? `Day ${current} of 90` : view === 'days' ? PHASES[phaseIdx].name : 'Progress'}</h2>
        <button type="button" className="back" onClick={onClose} aria-label="Close">×</button>
      </div>
      <div className="sheet-body">
        {view === 'phases' && (
          <>
            {PHASES.map((p, i) => (
              <button type="button" key={p.name} className={'phase' + (i === phaseIdx ? ' on' : '')} onClick={() => { setPhaseIdx(i); setView('days'); }}>
                <span><span className="n">{p.name}</span><br /><span className="s">Days {p.from} to {p.to}</span></span>
                <span className="pct">{doneCount(p.from, p.to)}/15</span>
              </button>
            ))}
            <button type="button" className="phase" onClick={() => setView('progress')}>
              <span><span className="n">Progress and settings</span><br /><span className="s">Mastery, symbols, read aloud</span></span>
              <span className="pct">{totalDone}/90</span>
            </button>
          </>
        )}
        {view === 'days' && (
          <div className="days">
            {PHASES[phaseIdx].days.map((t, i) => {
              const d = PHASES[phaseIdx].from + i;
              const st = days[d];
              return (
                <button type="button" key={d} className={'dayb' + (d === current ? ' on' : '') + (st?.done ? ' done' : '')} onClick={() => onPick(d)}>
                  <span className="num">{st?.done ? '✓ ' : ''}{d}</span>
                  <span className="ttl">{t}</span>
                </button>
              );
            })}
          </div>
        )}
        {view === 'progress' && (
          <>
            <div className="mastery">
              {SKILLS.map(([k, label]) => {
                const t = skills[k]; const n = (t?.right ?? 0) + (t?.wrong ?? 0); const p = n ? (t!.right / n) : 0;
                return (<div className="mrow" key={k}><span>{label}</span><span className="mb"><i style={{ ['--p' as string]: p }} /></span><span className="mv">{n ? `${Math.round(p * 100)}%` : '–'}</span></div>);
              })}
            </div>
            <div className="mastery">
              <div className="mrow"><span>Symbols</span><span className="mv" style={{ textAlign: 'left' }}>{Object.keys(symbols).length} met</span><span /></div>
              <div className="sym-grid">
                {Object.entries(symbols).slice(0, 24).map(([s, t]) => (<span className="sym" key={s}><b>{s}</b><span>{Math.round((t.right / Math.max(1, t.right + t.wrong)) * 100)}%</span></span>))}
              </div>
            </div>
            <div className="row"><span>Auto-read each card</span><button type="button" className={'toggle' + (autoRead ? ' on' : '')} onClick={() => store.setSettings({ autoRead: !autoRead })} aria-pressed={autoRead} aria-label="Auto-read"><i /></button></div>
            <div className="row"><span>Current day {current}. {titleFor(current)}</span><button type="button" className="hintbtn" onClick={() => { store.restartDay(current); onPick(current); }}>Restart day</button></div>
            <div className="row"><span>Start again from day 1</span><button type="button" className="hintbtn danger" onClick={() => { if (window.confirm('Delete all progress?')) { store.reset(); onPick(1); } }}>Reset</button></div>
          </>
        )}
      </div>
    </div>
  );
}
