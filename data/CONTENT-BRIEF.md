# Curriculum content brief

One file per day: `data/days/dayNN.ts` (two-digit, e.g. `day07.ts`). Copy the shape of `data/days/day01.ts` exactly. The schema and word limits are in `data/types.ts`. The day topic comes from `data/outline.ts`.

## Non-negotiable
1. British English, formal, plain. No em dashes. No colons or semicolons inside sentences. Commas and full stops.
2. Real content for the day's topic. No placeholders, no "Concept 1", no sentence reused from another day. Fifteen distinct concepts that build in order, from the simplest to the most advanced, for that specific topic.
3. Every card must fit a phone screen. Respect every word limit in `data/types.ts`. The validator enforces them.
4. Never leave notation unexplained. In `equations`, every symbol in `symbol` appears in `tokens` with one fixed English word. `literal` reads the equation left to right using only those words, with no raw symbols, e.g. "settings next is settings now minus learning-speed times wrongness-direction". Use Unicode for the notation itself, e.g. `θₜ₊₁ = θₜ − η∇L`.
5. Fixed English words for common symbols. Use these everywhere: θ settings, η learning-speed, ∇L wrongness-direction, L wrongness, ŷ guess, y truth, x input, w weight, b offset, σ squash, Σ add-up, P probability, | given, E expected, μ average, σ² spread, ≈ is approximately, ∝ grows with, ∈ belongs to, ∂ tiny change in, → becomes, · times, ∥ length of.
6. Non-maths days still get five real equations that matter for the topic. Linux: file permissions as octal. Networks: bandwidth times delay. Databases: rows after a join. Cyber: entropy of a password, probability of collision. Leadership: cost per request, expected value of a decision.
7. Checks must be unambiguous. One clearly correct option and two plausible but wrong ones. Vary `answer` across 0, 1 and 2 roughly evenly across the day. Never make the correct option the longest one every time.
8. The `incident` is a defensive diagnostic scenario. Observed signal, one clue, three causes or actions, one correct. No exploit code, no attack instructions.
9. The `build` is a small, real thing a learner can make in under an hour with Python or a shell. Steps are concrete.
10. The `research` question is genuinely open or testable. The `decision` is a real Head of AI trade-off with a defensible best choice.
11. Ids are `dNN-cNN` for concepts 01 to 15, `dNN-eNN` for equations 01 to 05, `dNN-pNN` for problems 01 and 02, `dNN-b01`, `dNN-i01`, `dNN-r01`, `dNN-l01`.
12. Read aloud text is generated from `plain`, `why`, `literal`, `meaning`. Write them so they sound right when spoken. Say "minus" not "-", "times" not "*".

## Verify
Run `node scripts/validate.mjs NN` for each day you write. Fix until it reports 0 problems. Do not commit. Do not edit any file outside `data/days/`.
