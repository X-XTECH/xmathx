// Turns ./out into a Vercel Build Output (v3) at .vercel/output with strict security headers.
// The Content Security Policy allows scripts only from this origin plus the exact hashes of the
// inline scripts Next.js emitted for this build. No 'unsafe-inline' anywhere. Fails the build if
// any HTML contains an inline style attribute, an inline event handler, or a <style> element.
import { createHash } from 'node:crypto';
import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'out');
const dst = join(root, '.vercel', 'output');

function walk(dir, acc = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p, acc); else acc.push(p);
  }
  return acc;
}

const htmlFiles = walk(src).filter((f) => f.endsWith('.html'));
if (!htmlFiles.length) { console.error('no HTML in out/. Run next build first.'); process.exit(1); }

const hashes = new Set();
let problems = 0;
for (const f of htmlFiles) {
  const html = readFileSync(f, 'utf8');
  const rel = f.slice(src.length);
  for (const m of html.matchAll(/<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/g)) {
    if (m[1].length) hashes.add("'sha256-" + createHash('sha256').update(m[1]).digest('base64') + "'");
  }
  if (/<style[\s>]/.test(html)) { problems++; console.error(`${rel}: inline <style> element found`); }
  const styleAttrs = html.match(/\sstyle="[^"]*"/g);
  if (styleAttrs) { problems++; console.error(`${rel}: inline style attribute found: ${styleAttrs[0].trim()}`); }
  const handlers = html.match(/\son[a-z]+="/g);
  if (handlers) { problems++; console.error(`${rel}: inline event handler found: ${handlers[0].trim()}`); }
}
if (problems) process.exit(1);

const csp = [
  "default-src 'none'",
  `script-src 'self' ${[...hashes].join(' ')}`.trim(),
  "style-src 'self'",
  "img-src 'self'",
  "font-src 'self'",
  "connect-src 'self'",
  "manifest-src 'self'",
  "worker-src 'none'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'none'",
  'upgrade-insecure-requests',
].join('; ');

const security = {
  'content-security-policy': csp,
  'strict-transport-security': 'max-age=63072000; includeSubDomains; preload',
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'referrer-policy': 'no-referrer',
  'permissions-policy': 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=(), interest-cohort=()',
  'cross-origin-opener-policy': 'same-origin',
  'cross-origin-resource-policy': 'same-origin',
  'cross-origin-embedder-policy': 'require-corp',
  'x-permitted-cross-domain-policies': 'none',
};

const config = {
  version: 3,
  routes: [
    { src: '/_next/static/(.*)', headers: { 'cache-control': 'public, max-age=31536000, immutable' }, continue: true },
    { src: '/(.*)', headers: { ...security, 'cache-control': 'public, max-age=0, must-revalidate' }, continue: true },
    { handle: 'filesystem' },
    { src: '/(.*)', status: 404, dest: '/404.html' },
  ],
};

rmSync(dst, { recursive: true, force: true });
mkdirSync(dst, { recursive: true });
cpSync(src, join(dst, 'static'), { recursive: true });
writeFileSync(join(dst, 'config.json'), JSON.stringify(config, null, 2));
console.log(`build output written: ${htmlFiles.length} page(s), ${hashes.size} inline script hash(es), no inline allowances.`);
