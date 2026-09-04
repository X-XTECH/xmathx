'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Day } from '@/data/types';
import { loadDay } from '@/data';
import { titleFor, TOTAL_DAYS } from '@/data/outline';
import { coreSteps, recallQuizFor, withRecalls, type Quiz, type Step } from '@/engine/sequence';
import { store, useProgress } from '@/engine/store';
import { speech } from '@/engine/speech';
import { spokenText } from '@/engine/text';
import { BuildCard, ConceptCard, DoneCard, IntroCard, ReadCard, ResearchCard, SymbolCard } from './Cards';
import QuizCard, { type QuizOutcome } from './QuizCard';
import DayPicker from './DayPicker';
import { useSwipe } from './useSwipe';

interface Lesson {
  day: Day;
  steps: Step[];
  /** step key to core index, for progress and resume. */
  core: Map<string, number>;
  coreLength: number;
  conceptTotal: number;
}

const MAX_RECALLS = 8;

async function buildLesson(n: number): Promise<Lesson> {
  const day = await loadDay(n);
  const core = coreSteps(day);
  const dp = store.dayProgress(n);
  const start = dp.done ? 0 : Math.min(dp.core, core.length - 1);
  if (dp.done && dp.core !== 0) store.restartDay(n);
  const due = store.due(n, MAX_RECALLS);
  const recalls: Quiz[] = [];
  const byDay = new Map<number, string[]>();
  for (const d of due) byDay.set(d.state.day, [...(byDay.get(d.state.day) ?? []), d.id]);
  await Promise.all([...byDay.entries()].map(async ([dayNo, ids]) => {
    try { const data = await loadDay(dayNo); for (const id of ids) { const q = recallQuizFor(data, id); if (q) recalls.push(q); } } catch { /* skip */ }
  }));
  const steps = withRecalls(core, recalls, start);
  const map = new Map<string, number>();
  core.forEach((s, i) => map.set(s.key, i));
  return { day, steps, core: map, coreLength: core.length, conceptTotal: day.concepts.length };
}

export default function App() {
  const [dayNo, setDayNo] = useState<number>(() => store.get().currentDay);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [idx, setIdx] = useState(0);
  const [picker, setPicker] = useState(false);
  const [outcome, setOutcome] = useState<QuizOutcome>('pending');
  const [resumeIdx, setResumeIdx] = useState(0);
  const autoRead = useProgress((p) => p.settings.autoRead);
  const dp = useProgress((p) => p.days[dayNo]);
  const loadToken = useRef(0);

  // Load a day when the day changes.
  useEffect(() => {
    const token = ++loadToken.current;
    setLesson(null);
    buildLesson(dayNo).then((l) => {
      if (token !== loadToken.current) return;
      const start = store.dayProgress(dayNo).core;
      const first = l.steps.findIndex((s) => (l.core.get(s.key) ?? -1) >= start);
      setLesson(l);
      setIdx(0);
      setResumeIdx(first > 0 ? first : 0);
      setOutcome('pending');
    });
  }, [dayNo]);

  const step = lesson?.steps[idx];
  const text = useMemo(() => (step ? spokenText(step) : ''), [step]);

  // Read aloud on arrival when auto-read is on. Otherwise stop any speech from the previous card.
  useEffect(() => {
    if (!step) return;
    if (autoRead) speech.speak(text); else speech.stop();
    return () => { speech.stop(); };
  }, [step, text, autoRead]);

  const goto = useCallback((d: number) => {
    const n = Math.max(1, Math.min(TOTAL_DAYS, d));
    store.setDay(n);
    setPicker(false);
    setDayNo(n);
  }, []);

  const next = useCallback(() => {
    if (!lesson || !step) return;
    if (step.kind === 'quiz' && outcome !== 'right-first' && outcome !== 'right-retry') return;
    if (step.kind === 'done') { goto(Math.min(TOTAL_DAYS, dayNo + 1)); return; }
    let i = Math.min(lesson.steps.length - 1, idx + 1);
    if (step.kind === 'intro' && resumeIdx > 1) { i = resumeIdx; setResumeIdx(0); }
    const s = lesson.steps[i];
    const c = lesson.core.get(s.key);
    if (c !== undefined) store.setCore(dayNo, c);
    if (s.kind === 'done') store.finishDay(dayNo);
    setOutcome('pending');
    setIdx(i);
  }, [lesson, step, outcome, idx, dayNo, goto, resumeIdx]);

  const back = useCallback(() => {
    if (!lesson || idx === 0) return;
    setOutcome('pending');
    setIdx(idx - 1);
  }, [lesson, idx]);

  /** Grade and move on. Easy comes back later, hard sooner, wrong tomorrow. */
  const finishQuiz = useCallback((grade: 'easy' | 'hard' | 'again') => {
    if (!step || step.kind !== 'quiz') return;
    const q = step.quiz;
    store.grade(q.id, q.day, q.itemKind, grade, q.symbols);
    next();
  }, [step, next]);

  const swipe = useSwipe(() => { if (step?.kind === 'quiz') { if (outcome === 'right-first') finishQuiz('easy'); else if (outcome === 'right-retry') finishQuiz('again'); } else next(); }, back);

  // Keyboard for desktop use.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (picker) return;
      if (e.key === 'ArrowLeft') back();
      else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        if (step?.kind === 'quiz') { if (outcome === 'right-first') finishQuiz('easy'); else if (outcome === 'right-retry') finishQuiz('again'); }
        else next();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [picker, back, next, step, outcome, finishQuiz]);

  const coreIdx = step ? (lesson?.core.get(step.key) ?? null) : null;
  const progress = lesson ? (coreIdx ?? 0) / Math.max(1, lesson.coreLength - 1) : 0;
  const conceptNo = step?.kind === 'concept' && lesson ? lesson.day.concepts.findIndex((c) => c.id === step.item.id) + 1 : 0;

  return (
    <main className="app">
      <header className="top">
        <button type="button" className="daychip" onClick={() => setPicker(true)} aria-label="Choose a day">
          <span>Day {dayNo}</span><span className="t">{titleFor(dayNo)}</span><span className="v">▾</span>
        </button>
        <span className="count" aria-live="polite">{lesson && coreIdx !== null ? `${coreIdx + 1} / ${lesson.coreLength}` : ''}</span>
        <div className="bar" aria-hidden="true"><i style={{ ['--p' as string]: progress }} /></div>
      </header>

      <section className="stage" {...swipe}>
        {!lesson || !step ? (
          <div className="loading">Loading day {dayNo}…</div>
        ) : (
          <article className="card" key={step.key + ':' + idx}>
            {step.kind === 'intro' && <IntroCard day={step.day} text={text} resume={resumeIdx > 1} />}
            {step.kind === 'concept' && <ConceptCard item={step.item} text={text} n={conceptNo} total={lesson.conceptTotal} />}
            {step.kind === 'symbol' && <SymbolCard item={step.item} text={text} />}
            {step.kind === 'read' && <ReadCard item={step.item} text={text} />}
            {step.kind === 'build' && <BuildCard item={step.item} text={text} />}
            {step.kind === 'research' && <ResearchCard item={step.item} text={text} />}
            {step.kind === 'quiz' && <QuizCard quiz={step.quiz} text={text} onOutcome={setOutcome} />}
            {step.kind === 'done' && <DoneCard day={step.day} text={text} right={dp?.right ?? 0} wrong={dp?.wrong ?? 0} />}
          </article>
        )}
      </section>

      <footer className={'foot' + (step?.kind === 'quiz' && outcome === 'right-first' ? ' split' : '')}>
        <button type="button" className="back" onClick={back} disabled={idx === 0} aria-label="Back">‹</button>
        {!step ? (
          <button type="button" className="next" disabled>…</button>
        ) : step.kind === 'quiz' ? (
          outcome === 'right-first' ? (
            <>
              <button type="button" className="next ghost" onClick={() => finishQuiz('hard')}>Hard</button>
              <button type="button" className="next good" onClick={() => finishQuiz('easy')}>Easy</button>
            </>
          ) : outcome === 'right-retry' ? (
            <button type="button" className="next" onClick={() => finishQuiz('again')}>Next</button>
          ) : (
            <button type="button" className="next" disabled>{outcome === 'wrong' ? 'Try again' : 'Choose an answer'}</button>
          )
        ) : step.kind === 'intro' ? (
          <button type="button" className="next" onClick={next}>{resumeIdx > 1 ? 'Continue' : 'Start'}</button>
        ) : step.kind === 'done' ? (
          <button type="button" className="next" onClick={next} disabled={dayNo >= TOTAL_DAYS}>{dayNo >= TOTAL_DAYS ? 'Course complete' : `Day ${dayNo + 1}`}</button>
        ) : (
          <button type="button" className="next" onClick={next}>Next</button>
        )}
      </footer>

      {picker && <DayPicker current={dayNo} onPick={goto} onClose={() => setPicker(false)} />}
    </main>
  );
}
