'use client';
import { useState } from 'react';
import type { Quiz } from '@/engine/sequence';
import Speaker from './Speaker';

export type QuizOutcome = 'pending' | 'right-first' | 'right-retry' | 'wrong';

interface Props {
  quiz: Quiz;
  text: string;
  onOutcome: (o: QuizOutcome) => void;
}

/** ANSWER. Tap one of three. Immediate feedback. Wrong answers explain, then retry. */
export default function QuizCard({ quiz, text, onOutcome }: Props) {
  const [picked, setPicked] = useState<number | null>(null);
  const [wrongOnce, setWrongOnce] = useState(false);
  const [hint, setHint] = useState(false);

  const answered = picked !== null;
  const correct = answered && picked === quiz.answer;

  function choose(i: number) {
    if (answered && correct) return;
    setPicked(i);
    if (i === quiz.answer) onOutcome(wrongOnce ? 'right-retry' : 'right-first');
    else { setWrongOnce(true); onOutcome('wrong'); }
  }

  const chipClass = quiz.recall ? 'chip recall' : quiz.itemKind === 'incident' ? 'chip warn' : 'chip';
  return (
    <>
      <div className="chip-row"><span className={chipClass}>{quiz.tag}</span>{quiz.title && <span className="chip-note">{quiz.title}</span>}</div>
      <div className="body start">
        {!answered && quiz.body?.map((b, i) => <p className={quiz.body!.length === 1 && b.length < 40 ? 'eq sm' : 'mid'} key={i}>{b}</p>)}
        {!(answered && !correct) && <p className={'q' + (answered ? ' compact' : quiz.q.length > 110 ? ' long' : '')}>{quiz.q}</p>}
        {answered && !correct && (
          <div className="feedback bad" role="status"><b>Not quite.</b>{quiz.explain} Tap the right answer to carry on.</div>
        )}
        <div className="opts" role="group" aria-label="Answers">
          {quiz.options.map((o, i) => {
            if (correct && i !== quiz.answer) return null;
            let cls = 'opt';
            if (answered) {
              if (i === quiz.answer && (correct || picked === i)) cls += ' right';
              else if (i === picked) cls += ' wrong';
              else if (correct) cls += ' dim';
            }
            if (answered && !correct && i === quiz.answer) cls = 'opt';
            return (
              <button type="button" key={i} className={cls} onClick={() => choose(i)} disabled={correct} aria-pressed={picked === i}>
                <span className="n">{i + 1}</span>
                <span>{o}</span>
              </button>
            );
          })}
        </div>
        {!answered && quiz.hint && (hint ? <p className="small">{quiz.hint}</p> : <button type="button" className="hintbtn" onClick={() => setHint(true)}>Show hint</button>)}
        {correct && (
          <div className="feedback good" role="status">
            <b>{wrongOnce ? 'Right this time.' : 'Correct.'}</b>
            {quiz.explain}
          </div>
        )}
      </div>
      <Speaker text={answered && correct ? `${wrongOnce ? 'Right this time.' : 'Correct.'} ${quiz.explain}` : text} />
    </>
  );
}
