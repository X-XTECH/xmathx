# xmathx

90 days of AI, ML and cyber as a learning engine. One idea on screen at a time. Every symbol read as an English word.

## Run it
```
npm install
npm run dev        # http://localhost:3000
npm run build      # static export to ./out
npm run validate   # checks all 90 day files against the schema and word limits
```

## How it teaches
Every item follows SEE, HEAR, UNDERSTAND, ANSWER, RECALL, APPLY.

- **See.** One idea, large type, nothing else.
- **Hear.** Every card has Listen, Replay, Slower and Auto. Read aloud uses the browser's SpeechSynthesis and reads the human words, never the raw symbols.
- **Understand.** For maths: symbol, fixed English word per symbol, the equation, the literal left-to-right English reading, the meaning, a tiny example.
- **Answer.** Tap one of three. Immediate feedback. Wrong answers explain, then you retry.
- **Recall.** Spaced retrieval. Easy comes back later, hard sooner, wrong tomorrow. Due items from earlier days are woven into today's lesson.
- **Apply.** Two problems, one build, one cyber incident, one research task, one Head-of-AI decision, every day.

## Each day
15 concepts, 5 equations, 2 problems, 1 build, 1 incident, 1 research task, 1 decision. Presented one card at a time, about 55 screens.

## Files
| Path | What it is |
|---|---|
| `data/types.ts` | The curriculum schema and word limits. |
| `data/outline.ts` | The six phases and 90 day titles. Eager, small. |
| `data/days/dayNN.ts` | One file per day. Lazy-loaded as its own chunk. |
| `data/CONTENT-BRIEF.md` | The rules every day file follows. |
| `engine/sequence.ts` | Turns a day into a sequence of screens and weaves in recalls. |
| `engine/scheduler.ts` | Spaced retrieval. Grades, intervals, mastery. |
| `engine/store.ts` | Progress in localStorage. Per item, per symbol, per skill. |
| `engine/speech.ts` | Read aloud. |
| `components/` | App shell, cards, quiz, speaker, day picker. |
| `scripts/validate.mjs` | Schema and word-limit checks for the day files. |
| `scripts/smoke.mjs` | Walks a whole day on iPhone-sized viewports and fails on any overflow. |

## Constraints
Mobile first. No page scrolling. No animation beyond a 120 ms fade. Plain React and Next.js, no other runtime dependencies. Progress stays on the device.
