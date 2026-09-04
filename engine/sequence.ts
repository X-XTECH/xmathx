import type { Build, Check, Concept, Day, Decision, Equation, Incident, Problem, Research } from '@/data/types';

export type Kind = 'concept' | 'equation' | 'problem' | 'build' | 'incident' | 'research' | 'decision';

/** One screen. One idea. */
export type Step =
  | { key: string; kind: 'intro'; day: Day }
  | { key: string; kind: 'concept'; item: Concept }
  | { key: string; kind: 'symbol'; item: Equation }
  | { key: string; kind: 'read'; item: Equation }
  | { key: string; kind: 'build'; item: Build }
  | { key: string; kind: 'research'; item: Research }
  | { key: string; kind: 'quiz'; quiz: Quiz }
  | { key: string; kind: 'done'; day: Day };

export interface Quiz {
  /** Item id used for scheduling and mastery. */
  id: string;
  day: number;
  itemKind: Kind;
  /** Short label shown in the chip, e.g. Check, Problem, Incident, Decide, Recall. */
  tag: string;
  /** Optional heading above the question. */
  title?: string;
  /** Optional lines shown above the question. */
  body?: string[];
  /** Optional hint, revealed on tap. */
  hint?: string;
  q: string;
  options: [string, string, string];
  answer: 0 | 1 | 2;
  explain: string;
  /** True when this is a spaced recall of an earlier item. */
  recall: boolean;
  /** Symbols credited when answered, for equation checks. */
  symbols?: string[];
}

function quizOf(c: Check, id: string, day: number, itemKind: Kind, tag: string, recall: boolean, extra: Partial<Quiz> = {}): Quiz {
  return { id, day, itemKind, tag, q: c.q, options: c.options, answer: c.answer, explain: c.explain, recall, ...extra };
}

export function problemQuiz(p: Problem, day: number, recall = false): Quiz {
  return { id: p.id, day, itemKind: 'problem', tag: recall ? 'Recall' : 'Problem', hint: p.hint, q: p.prompt, options: p.options, answer: p.answer, explain: p.worked, recall };
}
export function incidentQuiz(i: Incident, day: number, recall = false): Quiz {
  return { id: i.id, day, itemKind: 'incident', tag: recall ? 'Recall' : 'Incident', title: i.title, body: [i.signal], hint: i.clue, q: 'What is going on?', options: i.options, answer: i.answer, explain: i.explain, recall };
}
export function decisionQuiz(d: Decision, day: number, recall = false): Quiz {
  return { id: d.id, day, itemKind: 'decision', tag: recall ? 'Recall' : 'Decide', title: 'You are Head of AI', body: [d.situation], q: 'What do you do?', options: d.options, answer: d.answer, explain: d.reasoning, recall };
}
export function conceptQuiz(c: Concept, day: number, recall = false): Quiz {
  return quizOf(c.check, c.id, day, 'concept', recall ? 'Recall' : 'Check', recall, { title: c.term });
}
export function equationQuiz(e: Equation, day: number, recall = false): Quiz {
  return quizOf(e.check, e.id, day, 'equation', recall ? 'Recall' : 'Check', recall, { title: e.name, body: recall ? [e.symbol] : undefined, symbols: e.tokens.map((t) => t.sym) });
}
export function buildQuiz(b: Build, day: number, recall = false): Quiz {
  return quizOf(b.check, b.id, day, 'build', recall ? 'Recall' : 'Build', recall, { title: b.title });
}
export function researchQuiz(r: Research, day: number, recall = false): Quiz {
  return quizOf(r.check, r.id, day, 'research', recall ? 'Recall' : 'Research', recall, { title: 'Research' });
}

/** Find an item by id in a day and turn it into a recall quiz. */
export function recallQuizFor(day: Day, id: string): Quiz | null {
  const c = day.concepts.find((x) => x.id === id); if (c) return conceptQuiz(c, day.day, true);
  const e = day.equations.find((x) => x.id === id); if (e) return equationQuiz(e, day.day, true);
  const p = day.problems.find((x) => x.id === id); if (p) return problemQuiz(p, day.day, true);
  if (day.build.id === id) return buildQuiz(day.build, day.day, true);
  if (day.incident.id === id) return incidentQuiz(day.incident, day.day, true);
  if (day.research.id === id) return researchQuiz(day.research, day.day, true);
  if (day.decision.id === id) return decisionQuiz(day.decision, day.day, true);
  return null;
}

/**
 * The core sequence for a day, without recalls.
 * Concepts and equations are interleaved so the maths lands next to the idea it serves.
 * SEE, HEAR and UNDERSTAND happen on the idea card. ANSWER is the check right after it.
 */
export function coreSteps(day: Day): Step[] {
  const s: Step[] = [];
  const n = day.day;
  const c = day.concepts;
  const e = day.equations;
  const p = day.problems;
  s.push({ key: 'intro', kind: 'intro', day });
  const concept = (x: Concept) => { s.push({ key: x.id, kind: 'concept', item: x }); s.push({ key: x.id + ':q', kind: 'quiz', quiz: conceptQuiz(x, n) }); };
  const equation = (x: Equation) => { s.push({ key: x.id + ':s', kind: 'symbol', item: x }); s.push({ key: x.id + ':r', kind: 'read', item: x }); s.push({ key: x.id + ':q', kind: 'quiz', quiz: equationQuiz(x, n) }); };

  concept(c[0]); concept(c[1]); concept(c[2]); equation(e[0]);
  concept(c[3]); concept(c[4]); concept(c[5]); equation(e[1]);
  s.push({ key: p[0].id, kind: 'quiz', quiz: problemQuiz(p[0], n) });
  concept(c[6]); concept(c[7]); concept(c[8]); equation(e[2]);
  s.push({ key: day.build.id, kind: 'build', item: day.build });
  s.push({ key: day.build.id + ':q', kind: 'quiz', quiz: buildQuiz(day.build, n) });
  concept(c[9]); concept(c[10]); concept(c[11]); equation(e[3]);
  s.push({ key: day.incident.id, kind: 'quiz', quiz: incidentQuiz(day.incident, n) });
  concept(c[12]); concept(c[13]); concept(c[14]); equation(e[4]);
  s.push({ key: p[1].id, kind: 'quiz', quiz: problemQuiz(p[1], n) });
  s.push({ key: day.research.id, kind: 'research', item: day.research });
  s.push({ key: day.research.id + ':q', kind: 'quiz', quiz: researchQuiz(day.research, n) });
  s.push({ key: day.decision.id, kind: 'quiz', quiz: decisionQuiz(day.decision, n) });
  s.push({ key: 'done', kind: 'done', day });
  return s;
}

/** The number of core steps that count towards the progress bar. */
export function coreLength(day: Day): number {
  return coreSteps(day).length;
}

/**
 * Insert recall quizzes into the core sequence, starting after `from`.
 * One recall every four steps, never before the first concept check.
 */
export function withRecalls(core: Step[], recalls: Quiz[], from: number): Step[] {
  if (!recalls.length) return core;
  const out: Step[] = [];
  let r = 0;
  for (let i = 0; i < core.length; i++) {
    out.push(core[i]);
    const isLast = core[i].kind === 'done';
    if (!isLast && i >= Math.max(from, 3) && (i - from) % 4 === 3 && r < recalls.length) {
      const q = recalls[r++];
      out.push({ key: 'recall:' + q.id + ':' + i, kind: 'quiz', quiz: q });
    }
  }
  return out;
}
