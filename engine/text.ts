import type { Step } from './sequence';

/** Turn a token word list into a spoken sentence, e.g. "theta means settings". */
function tokensSpoken(tokens: { sym: string; word: string }[]): string {
  return tokens.map((t) => t.word).join(', ');
}

/** The human text read aloud for a step. Never raw notation. */
export function spokenText(step: Step): string {
  switch (step.kind) {
    case 'intro':
      return `Day ${step.day.day}. ${step.day.title}. Today you will ${lower(step.day.goal)}`;
    case 'concept':
      return `${step.item.term}. ${step.item.plain} ${step.item.why} For example, ${lower(step.item.example)}`;
    case 'symbol':
      return `${step.item.name}. Read it as, ${step.item.literal}. The words are, ${tokensSpoken(step.item.tokens)}.`;
    case 'read':
      return `${step.item.literal}. ${step.item.meaning} For example, ${lower(step.item.example)}`;
    case 'build':
      return `Build. ${step.item.title}. ${step.item.goal} ${step.item.steps.map((s, i) => `Step ${i + 1}. ${s}`).join(' ')} Done when ${lower(step.item.done)}`;
    case 'research':
      return `Research. ${step.item.question} Hypothesis. ${step.item.hypothesis} Method. ${step.item.method}`;
    case 'quiz': {
      const q = step.quiz;
      const head = [q.title, ...(q.body ?? [])].filter(Boolean).join('. ');
      const opts = q.options.map((o, i) => `Option ${i + 1}. ${o}.`).join(' ');
      return `${head ? head + '. ' : ''}${q.q} ${opts}`;
    }
    case 'done':
      return `Day ${step.day.day} complete. Well done.`;
  }
}

/** Text spoken after an answer. */
export function spokenFeedback(correct: boolean, explain: string): string {
  return `${correct ? 'Correct.' : 'Not quite.'} ${explain}`;
}

function lower(s: string): string {
  return s.length ? s[0].toLowerCase() + s.slice(1) : s;
}
