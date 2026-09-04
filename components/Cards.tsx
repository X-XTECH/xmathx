'use client';
import type { Build, Concept, Day, Equation, Research } from '@/data/types';
import { phaseFor } from '@/data/outline';
import Speaker from './Speaker';

/** SEE, HEAR, UNDERSTAND. One idea. */
export function ConceptCard({ item, text, n, total }: { item: Concept; text: string; n: number; total: number }) {
  return (
    <>
      <div className="chip-row"><span className="chip">Idea</span><span className="chip-note">{n} of {total}</span></div>
      <div className="body">
        <div className="term">{item.term}</div>
        <p className="big">{item.plain}</p>
        <p className="mid">{item.why}</p>
        <p className="small">{item.example}</p>
      </div>
      <Speaker text={text} />
    </>
  );
}

/** SEE the symbols, each with its fixed English word. */
export function SymbolCard({ item, text }: { item: Equation; text: string }) {
  return (
    <>
      <div className="chip-row"><span className="chip">Equation</span><span className="chip-note">{item.name}</span></div>
      <div className="body">
        <p className="eq">{item.symbol}</p>
        <div className="tokens">
          {item.tokens.map((t, i) => (<span className="tok" key={i}><b>{t.sym}</b><span>{t.word}</span></span>))}
        </div>
        <p className="small">Every symbol has one English word. Nothing else to memorise.</p>
      </div>
      <Speaker text={text} />
    </>
  );
}

/** HEAR and UNDERSTAND. The literal English reading, the meaning, a tiny example. */
export function ReadCard({ item, text }: { item: Equation; text: string }) {
  return (
    <>
      <div className="chip-row"><span className="chip">Read it</span><span className="chip-note">{item.name}</span></div>
      <div className="body">
        <p className="eq sm">{item.symbol}</p>
        <p className="quote">“{item.literal}”</p>
        <p className="mid">{item.meaning}</p>
        <p className="small">{item.example}</p>
      </div>
      <Speaker text={text} />
    </>
  );
}

/** APPLY. Build something small and real. */
export function BuildCard({ item, text }: { item: Build; text: string }) {
  return (
    <>
      <div className="chip-row"><span className="chip">Build</span><span className="chip-note">under an hour</span></div>
      <div className="body">
        <p className="big">{item.title}</p>
        <p className="mid">{item.goal}</p>
        <ol className="steps">{item.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
        <p className="small">Done when {item.done[0].toLowerCase() + item.done.slice(1)}</p>
      </div>
      <Speaker text={text} />
    </>
  );
}

/** APPLY. Ask one question nobody has answered for you. */
export function ResearchCard({ item, text }: { item: Research; text: string }) {
  return (
    <>
      <div className="chip-row"><span className="chip">Research</span><span className="chip-note">one open question</span></div>
      <div className="body">
        <p className="big">{item.question}</p>
        <p className="mid"><b>Hypothesis.</b> {item.hypothesis}</p>
        <p className="small"><b>Method.</b> {item.method}</p>
      </div>
      <Speaker text={text} />
    </>
  );
}

export function IntroCard({ day, text, resume }: { day: Day; text: string; resume: boolean }) {
  const phase = phaseFor(day.day);
  return (
    <>
      <div className="chip-row"><span className="chip">{phase.name}</span><span className="chip-note">Day {day.day} of 90</span></div>
      <div className="body">
        <p className="hero">{day.day}</p>
        <p className="big">{day.title}</p>
        <p className="mid">{day.goal}</p>
        <p className="small">{resume ? 'Pick up where you left off.' : '15 ideas, 5 equations, 2 problems, 1 build, 1 incident, 1 research task, 1 decision.'}</p>
      </div>
      <Speaker text={text} />
    </>
  );
}

export function DoneCard({ day, text, right, wrong }: { day: Day; text: string; right: number; wrong: number }) {
  const total = right + wrong;
  const pct = total ? Math.round((right / total) * 100) : 0;
  return (
    <>
      <div className="chip-row"><span className="chip recall">Complete</span><span className="chip-note">Day {day.day}</span></div>
      <div className="body center">
        <p className="hero">{pct}%</p>
        <p className="big">Day {day.day} done.</p>
        <p className="mid">{right} right, {wrong} wrong today. Anything you missed comes back tomorrow.</p>
        <p className="small">{day.day < 90 ? 'Tomorrow builds on today. Come back when you are fresh.' : 'Ninety days complete. You can defend the whole system.'}</p>
      </div>
      <Speaker text={text} />
    </>
  );
}
