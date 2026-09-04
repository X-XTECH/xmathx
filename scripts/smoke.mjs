// Walks through a day on iPhone-sized viewports and reports any overflow.
// Usage: PW=/path/to/node_modules node scripts/smoke.mjs [day] [maxSteps]
// Requires a static build in ./out (npm run build) and a Chromium at CHROME (default /opt/pw-browsers/chromium).
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(process.env.PW ? join(process.env.PW, 'x.js') : import.meta.url);
const { chromium } = require('playwright');
const day = Number(process.argv[2] || 1);
const maxSteps = Number(process.argv[3] || 400);
const port = 8765 + Math.floor(Math.random() * 1000);
const shots = join(root, 'scripts', 'shots');
mkdirSync(shots, { recursive: true });

const server = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1', '--directory', join(root, 'out')], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 800));

const viewports = [{ name: 'iphone-se', width: 375, height: 667 }, { name: 'iphone-15', width: 393, height: 852 }];
let failures = 0;
try {
  const browser = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  for (const vp of viewports) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    let page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    // Storage is written by an init script so it lands before the app loads and before any flush on page hide.
    const seed = { v: 1, currentDay: day, days: {}, items: {}, symbols: {}, skills: {}, settings: { autoRead: false, rate: 1 } };
    await ctx.addInitScript((v) => { if (v) localStorage.setItem('xmathx.progress.v1', v); }, JSON.stringify(seed));
    await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'networkidle' });
    await ctx.addInitScript(() => {}, null);
    await page.waitForSelector('.card', { timeout: 15000 });

    const seen = new Set();
    let steps = 0, quizzes = 0, shot = 0;
    for (; steps < maxSteps; steps++) {
      const info = await page.evaluate(() => {
        const de = document.documentElement;
        const body = document.querySelector('.card .body');
        const card = document.querySelector('.card');
        const chip = document.querySelector('.card .chip')?.textContent ?? '';
        const note = document.querySelector('.card .chip-note')?.textContent ?? '';
        return {
          pageOverflowY: de.scrollHeight > de.clientHeight + 1 || document.body.scrollHeight > window.innerHeight + 1,
          pageOverflowX: de.scrollWidth > de.clientWidth + 1,
          bodyOverflow: body ? body.scrollHeight > body.clientHeight + 1 : false,
          cardOverflow: card ? card.scrollHeight > card.clientHeight + 1 : false,
          bodyH: body?.clientHeight, bodySH: body?.scrollHeight,
          chip, note,
          isQuiz: !!document.querySelector('.card .opts'),
          done: /Complete/i.test(chip),
        };
      });
      const label = `${vp.name} step ${steps} [${info.chip}${info.note ? ' · ' + info.note : ''}]`;
      if (info.pageOverflowY || info.pageOverflowX || info.bodyOverflow || info.cardOverflow) {
        failures++;
        console.log(`OVERFLOW ${label} page:${info.pageOverflowY}/${info.pageOverflowX} body:${info.bodyOverflow} (${info.bodySH}>${info.bodyH}) card:${info.cardOverflow}`);
        await page.screenshot({ path: join(shots, `${vp.name}-overflow-${steps}.png`) });
      }
      if (!seen.has(info.chip) && shot < 12) { seen.add(info.chip); await page.screenshot({ path: join(shots, `${vp.name}-${String(shot++).padStart(2, '0')}-${info.chip.replace(/\W+/g, '')}.png`) }); }
      if (info.done) break;
      if (info.isQuiz) {
        quizzes++;
        // Tap options until the correct one is found; the first wrong tap exercises the retry path.
        for (let i = 0; i < 3; i++) {
          await page.click(`.opt:nth-child(${i + 1})`);
          const ok = await page.evaluate(() => !!document.querySelector('.feedback.good'));
          if (ok) break;
          const wrongOverflow = await page.evaluate(() => { const b = document.querySelector('.card .body'); return b ? b.scrollHeight > b.clientHeight + 1 : false; });
          if (wrongOverflow) { failures++; console.log(`OVERFLOW after wrong answer ${label}`); await page.screenshot({ path: join(shots, `${vp.name}-overflow-wrong-${steps}.png`) }); }
        }
        const overflowAfter = await page.evaluate(() => { const b = document.querySelector('.card .body'); return b ? b.scrollHeight > b.clientHeight + 1 : false; });
        if (overflowAfter) { failures++; console.log(`OVERFLOW after answer ${label}`); await page.screenshot({ path: join(shots, `${vp.name}-overflow-answered-${steps}.png`) }); }
        if (steps === 3) await page.screenshot({ path: join(shots, `${vp.name}-answered.png`) });
        const btn = await page.$('.foot .next:not([disabled])');
        if (!btn) { failures++; console.log(`NO NEXT after answering ${label}`); break; }
        await btn.click();
      } else {
        const btn = await page.$('.foot .next:not([disabled])');
        if (!btn) { failures++; console.log(`NO NEXT ${label}`); break; }
        await btn.click();
      }
      await page.waitForTimeout(30);
    }
    await page.waitForTimeout(400);
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('xmathx.progress.v1') || '{}'));
    const dayState = stored.days?.[day];
    console.log(`${vp.name}: ${steps + 1} screens, ${quizzes} quizzes, stored core=${dayState?.core} done=${dayState?.done} items=${Object.keys(stored.items || {}).length} symbols=${Object.keys(stored.symbols || {}).length}`);
    if (!dayState?.done) { failures++; console.log(`${vp.name}: day ${day} not marked done`); }
    if (errors.length) { failures++; console.log(`${vp.name}: page errors:\n  ` + errors.slice(0, 5).join('\n  ')); }

    // Recall. Make every answered item overdue, open the next day, and expect recall cards woven in.
    if (day < 90 && vp === viewports[0]) {
      const overdue = JSON.parse(JSON.stringify(stored));
      const today = Math.floor(Date.now() / 86400000);
      for (const k of Object.keys(overdue.items || {})) overdue.items[k].due = today - 1;
      overdue.currentDay = day + 1;
      const p2 = await ctx.newPage();
      await page.close();
      await ctx.addInitScript((v) => { localStorage.setItem('xmathx.progress.v1', v); }, JSON.stringify(overdue));
      await p2.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'networkidle' });
      page = p2;
      await page.waitForSelector('.card', { timeout: 15000 });
      let recalls = 0;
      for (let i = 0; i < 40; i++) {
        const chip = await page.evaluate(() => document.querySelector('.card .chip')?.textContent ?? '');
        if (chip === 'Recall') {
          recalls++;
          const ok = await page.evaluate(() => { const b = document.querySelector('.card .body'); return b ? b.scrollHeight <= b.clientHeight + 1 : true; });
          if (!ok) { failures++; console.log(`OVERFLOW recall card ${i} on day ${day + 1}`); await page.screenshot({ path: join(shots, `recall-overflow-${i}.png`) }); }
          if (recalls === 1) await page.screenshot({ path: join(shots, `${vp.name}-recall.png`) });
        }
        const isQuiz = await page.evaluate(() => !!document.querySelector('.card .opts'));
        if (isQuiz) { for (let k = 0; k < 3; k++) { await page.click(`.opt:nth-child(${k + 1})`); if (await page.evaluate(() => !!document.querySelector('.feedback.good'))) break; } }
        const btn = await page.$('.foot .next:not([disabled])');
        if (!btn) break;
        await btn.click();
        await page.waitForTimeout(30);
      }
      console.log(`${vp.name}: day ${day + 1} showed ${recalls} recall card(s) in the first 40 screens`);
      if (recalls === 0) { failures++; console.log('no recall cards appeared'); }
    }
    await ctx.close();
  }
  await browser.close();
} finally {
  server.kill();
}
console.log(failures ? `${failures} failure(s)` : 'smoke OK');
process.exit(failures ? 1 : 0);
