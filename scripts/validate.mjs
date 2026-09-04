// Validates every data/days/dayNN.ts file against the schema and word limits.
// Usage: node scripts/validate.mjs [dayNumber ...]
import { readFileSync, readdirSync, existsSync, writeFileSync, unlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const daysDir = join(root, 'data', 'days');
const only = process.argv.slice(2).map(Number).filter(Boolean);

function words(s) { return String(s).trim().split(/\s+/).filter(Boolean).length; }

const LIMITS = {
  'check.q': 18, 'check.option': 9, 'check.explain': 25,
  'concept.term': 4, 'concept.plain': 20, 'concept.why': 35, 'concept.example': 25,
  'equation.name': 4, 'equation.literal': 22, 'equation.meaning': 30, 'equation.example': 25,
  'problem.prompt': 30, 'problem.hint': 15, 'problem.option': 9, 'problem.worked': 35,
  'build.title': 6, 'build.goal': 22, 'build.step': 14, 'build.done': 18,
  'incident.title': 8, 'incident.signal': 30, 'incident.clue': 20, 'incident.option': 12, 'incident.explain': 35,
  'research.question': 18, 'research.hypothesis': 20, 'research.method': 30,
  'decision.situation': 35, 'decision.option': 12, 'decision.reasoning': 40,
  'day.title': 4, 'day.goal': 16,
};

// Symbols that count as notation and must appear in tokens when used in `symbol`.
const NOTATION = /[θηαβγδελμσπΣ∑∏∇∂∫√∞≈≠≤≥∈∉⊂∪∩→←↔⇒∀∃ᵀ⁻¹ˣʸ²³ₜ₊₁ᵢⱼₖₙ|·×÷±]/u;

let problems = 0;
function fail(day, msg) { problems++; console.log(`day${String(day).padStart(2, '0')}: ${msg}`); }

function lim(day, key, value, label) {
  const n = words(value);
  if (n > LIMITS[key]) fail(day, `${label} too long (${n} words, limit ${LIMITS[key]}): "${String(value).slice(0, 60)}"`);
}
function nonEmpty(day, value, label) {
  if (typeof value !== 'string' || !value.trim()) fail(day, `${label} is empty`);
}
function checkCheck(day, c, label, prefix = 'check') {
  if (!c) return fail(day, `${label} missing`);
  nonEmpty(day, c.q, `${label}.q`); lim(day, `${prefix}.q`, c.q, `${label}.q`);
  if (!Array.isArray(c.options) || c.options.length !== 3) fail(day, `${label}.options must have 3 entries`);
  else c.options.forEach((o, i) => { nonEmpty(day, o, `${label}.options[${i}]`); lim(day, `${prefix}.option`, o, `${label}.options[${i}]`); });
  if (![0, 1, 2].includes(c.answer)) fail(day, `${label}.answer must be 0, 1 or 2`);
  if (Array.isArray(c.options) && new Set(c.options.map((o) => String(o).toLowerCase())).size !== 3) fail(day, `${label}.options must be distinct`);
  nonEmpty(day, c.explain, `${label}.explain`); lim(day, `${prefix}.explain`, c.explain, `${label}.explain`);
}

function validate(day, d) {
  if (d.day !== day) fail(day, `day field is ${d.day}`);
  nonEmpty(day, d.title, 'title'); lim(day, 'day.title', d.title, 'title');
  nonEmpty(day, d.goal, 'goal'); lim(day, 'day.goal', d.goal, 'goal');
  const ids = new Set();
  const seeId = (id, label) => { if (!id || typeof id !== 'string') fail(day, `${label}.id missing`); else if (ids.has(id)) fail(day, `duplicate id ${id}`); else ids.add(id); };

  if (!Array.isArray(d.concepts) || d.concepts.length !== 15) fail(day, `concepts must be 15, got ${d.concepts?.length}`);
  (d.concepts || []).forEach((c, i) => {
    const L = `concepts[${i}]`; seeId(c.id, L);
    nonEmpty(day, c.term, `${L}.term`); lim(day, 'concept.term', c.term, `${L}.term`);
    nonEmpty(day, c.plain, `${L}.plain`); lim(day, 'concept.plain', c.plain, `${L}.plain`);
    nonEmpty(day, c.why, `${L}.why`); lim(day, 'concept.why', c.why, `${L}.why`);
    nonEmpty(day, c.example, `${L}.example`); lim(day, 'concept.example', c.example, `${L}.example`);
    checkCheck(day, c.check, `${L}.check`);
  });
  if (!Array.isArray(d.equations) || d.equations.length !== 5) fail(day, `equations must be 5, got ${d.equations?.length}`);
  (d.equations || []).forEach((e, i) => {
    const L = `equations[${i}]`; seeId(e.id, L);
    nonEmpty(day, e.name, `${L}.name`); lim(day, 'equation.name', e.name, `${L}.name`);
    nonEmpty(day, e.symbol, `${L}.symbol`);
    if (!Array.isArray(e.tokens) || e.tokens.length < 2 || e.tokens.length > 7) fail(day, `${L}.tokens must have 2 to 7 entries`);
    else e.tokens.forEach((t, j) => { nonEmpty(day, t.sym, `${L}.tokens[${j}].sym`); nonEmpty(day, t.word, `${L}.tokens[${j}].word`); if (words(t.word) > 4) fail(day, `${L}.tokens[${j}].word must be at most 4 words`); if (!String(e.symbol).includes(t.sym)) fail(day, `${L}.tokens[${j}].sym "${t.sym}" not found in symbol "${e.symbol}"`); });
    nonEmpty(day, e.literal, `${L}.literal`); lim(day, 'equation.literal', e.literal, `${L}.literal`);
    if (NOTATION.test(e.literal)) fail(day, `${L}.literal contains raw notation: "${e.literal}"`);
    nonEmpty(day, e.meaning, `${L}.meaning`); lim(day, 'equation.meaning', e.meaning, `${L}.meaning`);
    nonEmpty(day, e.example, `${L}.example`); lim(day, 'equation.example', e.example, `${L}.example`);
    checkCheck(day, e.check, `${L}.check`);
  });
  if (!Array.isArray(d.problems) || d.problems.length !== 2) fail(day, `problems must be 2, got ${d.problems?.length}`);
  (d.problems || []).forEach((p, i) => {
    const L = `problems[${i}]`; seeId(p.id, L);
    nonEmpty(day, p.prompt, `${L}.prompt`); lim(day, 'problem.prompt', p.prompt, `${L}.prompt`);
    nonEmpty(day, p.hint, `${L}.hint`); lim(day, 'problem.hint', p.hint, `${L}.hint`);
    checkCheck(day, { q: p.prompt, options: p.options, answer: p.answer, explain: p.worked }, L, 'problem');
    if (p.worked) lim(day, 'problem.worked', p.worked, `${L}.worked`);
  });
  const b = d.build; if (!b) fail(day, 'build missing'); else {
    seeId(b.id, 'build'); nonEmpty(day, b.title, 'build.title'); lim(day, 'build.title', b.title, 'build.title');
    nonEmpty(day, b.goal, 'build.goal'); lim(day, 'build.goal', b.goal, 'build.goal');
    if (!Array.isArray(b.steps) || b.steps.length < 3 || b.steps.length > 4) fail(day, 'build.steps must have 3 or 4 entries');
    else b.steps.forEach((s, i) => { nonEmpty(day, s, `build.steps[${i}]`); lim(day, 'build.step', s, `build.steps[${i}]`); });
    nonEmpty(day, b.done, 'build.done'); lim(day, 'build.done', b.done, 'build.done');
    checkCheck(day, b.check, 'build.check');
  }
  const inc = d.incident; if (!inc) fail(day, 'incident missing'); else {
    seeId(inc.id, 'incident'); nonEmpty(day, inc.title, 'incident.title'); lim(day, 'incident.title', inc.title, 'incident.title');
    nonEmpty(day, inc.signal, 'incident.signal'); lim(day, 'incident.signal', inc.signal, 'incident.signal');
    nonEmpty(day, inc.clue, 'incident.clue'); lim(day, 'incident.clue', inc.clue, 'incident.clue');
    checkCheck(day, { q: inc.signal, options: inc.options, answer: inc.answer, explain: inc.explain }, 'incident', 'incident');
  }
  const r = d.research; if (!r) fail(day, 'research missing'); else {
    seeId(r.id, 'research'); nonEmpty(day, r.question, 'research.question'); lim(day, 'research.question', r.question, 'research.question');
    nonEmpty(day, r.hypothesis, 'research.hypothesis'); lim(day, 'research.hypothesis', r.hypothesis, 'research.hypothesis');
    nonEmpty(day, r.method, 'research.method'); lim(day, 'research.method', r.method, 'research.method');
    checkCheck(day, r.check, 'research.check');
  }
  const dec = d.decision; if (!dec) fail(day, 'decision missing'); else {
    seeId(dec.id, 'decision'); nonEmpty(day, dec.situation, 'decision.situation'); lim(day, 'decision.situation', dec.situation, 'decision.situation');
    checkCheck(day, { q: dec.situation, options: dec.options, answer: dec.answer, explain: dec.reasoning }, 'decision', 'decision');
  }
  const prefix = `d${String(day).padStart(2, '0')}-`;
  for (const id of ids) if (!id.startsWith(prefix)) fail(day, `id ${id} must start with ${prefix}`);
}

// Transpile each TS file to JS with a light regex strip (files are plain object literals).
function loadDay(file) {
  let src = readFileSync(file, 'utf8');
  src = src.replace(/^import[^\n]*\n/gm, '');
  src = src.replace(/const\s+day\s*:\s*Day\s*=/, 'const day =');
  src = src.replace(/export\s+default\s+day\s*;?/, 'export default day;');
  const tmp = file.replace(/\.ts$/, '.validate.tmp.mjs');
  writeFileSync(tmp, src);
  return import(`${tmp}?t=${Date.now()}`).then((m) => { unlinkSync(tmp); return m.default; }).catch((e) => { try { unlinkSync(tmp); } catch {} throw e; });
}

const files = existsSync(daysDir) ? readdirSync(daysDir).filter((f) => /^day\d\d\.ts$/.test(f)).sort() : [];
let count = 0;
for (const f of files) {
  const day = Number(f.slice(3, 5));
  if (only.length && !only.includes(day)) continue;
  count++;
  try { validate(day, await loadDay(join(daysDir, f))); } catch (e) { fail(day, `failed to load: ${e.message.split('\n')[0]}`); }
}
const missing = [];
if (!only.length) for (let d = 1; d <= 90; d++) if (!files.includes(`day${String(d).padStart(2, '0')}.ts`)) missing.push(d);
if (missing.length) { problems++; console.log(`missing days: ${missing.join(', ')}`); }
console.log(`${count} day file(s) checked, ${problems} problem(s).`);
process.exit(problems ? 1 : 0);
