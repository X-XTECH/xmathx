// Cross-day content checks: em dashes, sentences reused across days, answer skew, placeholder text.
// Usage: node scripts/lint-content.mjs
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = join(root, 'data', 'days');
const files = readdirSync(dir).filter((f) => /^day\d\d\.ts$/.test(f)).sort();
let problems = 0;
const sentences = new Map(); // sentence -> first day

function strings(src) {
  // Every single-quoted string literal in the file.
  const out = [];
  const re = /'((?:[^'\\]|\\.)*)'/g;
  let m;
  while ((m = re.exec(src))) out.push(m[1].replace(/\\'/g, "'"));
  return out;
}

for (const f of files) {
  const day = Number(f.slice(3, 5));
  const src = readFileSync(join(dir, f), 'utf8');
  let reused = 0;
  if (/—/.test(src)) { problems++; console.log(`day${f.slice(3, 5)}: em dash found`); }
  if (/\b(Concept|Equation|Problem) \d+\b|placeholder text|lorem ipsum|TODO/.test(src)) { problems++; console.log(`day${f.slice(3, 5)}: placeholder text found`); }
  const answers = [...src.matchAll(/answer: ([012])/g)].map((m) => Number(m[1]));
  const counts = [0, 0, 0]; for (const a of answers) counts[a]++;
  const max = Math.max(...counts);
  if (answers.length && max / answers.length > 0.6) { problems++; console.log(`day${f.slice(3, 5)}: answer index skew ${counts.join('/')}`); }
  for (const s of strings(src)) {
    if (s.length < 40 || /^d\d\d-/.test(s)) continue;
    const key = s.toLowerCase().replace(/\s+/g, ' ').trim();
    const seen = sentences.get(key);
    if (seen !== undefined && seen !== day) { reused++; if (reused <= 3) console.log(`note day${f.slice(3, 5)}: text also on day ${seen}: "${s.slice(0, 70)}"`); }
    else if (seen === undefined) sentences.set(key, day);
  }
  if (reused > 4) { problems++; console.log(`day${f.slice(3, 5)}: ${reused} strings reused from earlier days`); }
}
console.log(`${files.length} file(s) linted, ${problems} problem(s).`);
process.exit(problems ? 1 : 0);
