/**
 * Curriculum schema. One file per day in data/days/dayNN.ts.
 * Every item is learned through SEE → HEAR → UNDERSTAND → ANSWER → RECALL → APPLY.
 * Keep text short. Nothing on a card may overflow an iPhone screen.
 */

/** A three-option check with one correct answer and a plain explanation. */
export interface Check {
  /** The question. One sentence, at most 18 words. */
  q: string;
  /** Exactly three options, each at most 9 words. */
  options: [string, string, string];
  /** Index of the correct option, 0 to 2. */
  answer: 0 | 1 | 2;
  /** Why the correct answer is right. At most 25 words. */
  explain: string;
}

/** A single idea. */
export interface Concept {
  /** Stable id, e.g. "d01-c03". */
  id: string;
  /** The name of the idea. At most 4 words. */
  term: string;
  /** SEE. The idea in one plain sentence. At most 20 words. */
  plain: string;
  /** UNDERSTAND. Why it matters, in one or two sentences. At most 35 words. */
  why: string;
  /** UNDERSTAND. A tiny concrete example. At most 25 words. */
  example: string;
  /** ANSWER. */
  check: Check;
}

/** One symbol paired with its fixed English word. */
export interface Token {
  /** The symbol as displayed, e.g. "θ" or "∇L". */
  sym: string;
  /** The fixed English word for it, e.g. "settings" or "wrongness-direction". */
  word: string;
}

/** A maths equation, read as English. */
export interface Equation {
  /** Stable id, e.g. "d01-e02". */
  id: string;
  /** Name of the equation. At most 4 words. */
  name: string;
  /** The equation exactly as written in notation, e.g. "θₜ₊₁ = θₜ − η∇L". */
  symbol: string;
  /** Every symbol in `symbol`, each with its fixed English word. 2 to 7 tokens. */
  tokens: Token[];
  /** The literal left-to-right English reading of the equation. At most 22 words. */
  literal: string;
  /** What it means in plain language. At most 30 words. */
  meaning: string;
  /** A tiny numeric example with a result. At most 25 words. */
  example: string;
  /** ANSWER. */
  check: Check;
}

/** A small problem to solve. */
export interface Problem {
  /** Stable id, e.g. "d01-p01". */
  id: string;
  /** The problem, stated plainly. At most 30 words. */
  prompt: string;
  /** A one-line hint. At most 15 words. */
  hint: string;
  /** Three candidate answers. */
  options: [string, string, string];
  answer: 0 | 1 | 2;
  /** The worked answer in plain words. At most 35 words. */
  worked: string;
}

/** One AI build task. */
export interface Build {
  /** Stable id, e.g. "d01-b01". */
  id: string;
  /** What you build. At most 6 words. */
  title: string;
  /** The goal in one sentence. At most 22 words. */
  goal: string;
  /** Three to four concrete steps, each at most 14 words. */
  steps: string[];
  /** Definition of done. At most 18 words. */
  done: string;
  /** ANSWER. A check on the key design decision. */
  check: Check;
}

/** One cyber incident to diagnose. */
export interface Incident {
  /** Stable id, e.g. "d01-i01". */
  id: string;
  /** Headline of the alert. At most 8 words. */
  title: string;
  /** What was observed. At most 30 words. */
  signal: string;
  /** One extra clue. At most 20 words. */
  clue: string;
  /** Three possible causes or actions. */
  options: [string, string, string];
  answer: 0 | 1 | 2;
  /** The diagnosis and the fix, plainly. At most 35 words. */
  explain: string;
}

/** One research task. */
export interface Research {
  /** Stable id, e.g. "d01-r01". */
  id: string;
  /** The open question. At most 18 words. */
  question: string;
  /** A testable hypothesis. At most 20 words. */
  hypothesis: string;
  /** How you would test it, in one or two sentences. At most 30 words. */
  method: string;
  /** ANSWER. A check on research reasoning. */
  check: Check;
}

/** One Head-of-AI decision. */
export interface Decision {
  /** Stable id, e.g. "d01-l01". */
  id: string;
  /** The situation. At most 35 words. */
  situation: string;
  /** Three choices, each at most 12 words. */
  options: [string, string, string];
  /** The best choice. */
  answer: 0 | 1 | 2;
  /** The reasoning a good Head of AI would give. At most 40 words. */
  reasoning: string;
}

export interface Day {
  /** 1 to 90. */
  day: number;
  /** Day topic. At most 4 words. */
  title: string;
  /** The single outcome for the day. At most 16 words. */
  goal: string;
  /** Exactly 15. */
  concepts: Concept[];
  /** Exactly 5. */
  equations: Equation[];
  /** Exactly 2. */
  problems: Problem[];
  build: Build;
  incident: Incident;
  research: Research;
  decision: Decision;
}
