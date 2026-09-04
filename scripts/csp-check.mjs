// Serves .vercel/output/static with the headers from config.json and walks a lesson in Chromium.
// Fails on any Content Security Policy violation or page error.
// Usage: PW=/path/to/node_modules node scripts/csp-check.mjs
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(process.env.PW ? join(process.env.PW, 'x.js') : import.meta.url);
const { chromium } = require('playwright');
const out = join(root, '.vercel', 'output');
const config = JSON.parse(readFileSync(join(out, 'config.json'), 'utf8'));
const headers = Object.assign({}, ...config.routes.filter((r) => r.headers).map((r) => r.headers));
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.txt': 'text/plain' };

const server = createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  let f = join(out, 'static', p);
  if (existsSync(f) && statSync(f).isDirectory()) f = join(f, 'index.html');
  if (!existsSync(f)) { res.writeHead(404, headers); res.end('not found'); return; }
  res.writeHead(200, { ...headers, 'content-type': types[extname(f)] || 'application/octet-stream' });
  res.end(readFileSync(f));
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;

let failures = 0;
let counting = true;
const browser = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 393, height: 852 } });
page.on('console', (m) => { if (!counting) return; if (m.type() === 'error' || /Content Security Policy|Refused to/i.test(m.text())) { failures++; console.log('console:', m.text().slice(0, 200)); } });
page.on('pageerror', (e) => { if (!counting) return; failures++; console.log('pageerror:', String(e).slice(0, 200)); });
await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'networkidle' });
await page.waitForSelector('.card', { timeout: 15000 });
for (let i = 0; i < 12; i++) {
  if (await page.$('.card .opts')) for (let k = 0; k < 3; k++) { await page.click(`.opt:nth-child(${k + 1})`); if (await page.evaluate(() => !!document.querySelector('.feedback.good'))) break; }
  const btn = await page.$('.foot .next:not([disabled])'); if (!btn) break; await btn.click(); await page.waitForTimeout(30);
}
await page.click('.daychip'); await page.waitForSelector('.sheet');
const bar = await page.evaluate(() => getComputedStyle(document.querySelector('.bar > i')).transform);
console.log(`progress bar transform: ${bar}`);
// The 404 page hydrates Next's own not-found markup, whose inline styles the policy blocks. Cosmetic only.
counting = false;
const r404 = await page.goto(`http://127.0.0.1:${port}/nope/`, { waitUntil: 'networkidle' });
console.log(`404 route status ${r404.status()}`);
await browser.close(); server.close();
console.log(failures ? `${failures} failure(s)` : 'CSP check OK');
process.exit(failures ? 1 : 0);
