/* Post-build checks: every page built, every internal link and anchor resolves,
 * nothing rendered as "undefined", and the wordmark and copyright come from
 * the config. Exits non-zero on any problem. */
import { readFile, readdir } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const dist = join(root, process.env.OUT_DIR || 'dist');
const configPath = process.env.SITE_CONFIG ? resolve(process.env.SITE_CONFIG) : join(root, 'site.config.mjs');
const config = (await import(pathToFileURL(configPath).href)).default;
const problems = [];

const walk = async (dir) => (await Promise.all((await readdir(dir, { withFileTypes: true })).map((d) => d.isDirectory() ? walk(join(dir, d.name)) : [join(dir, d.name)]))).flat();
const files = await walk(dist);
const html = files.filter((f) => f.endsWith('.html'));
const docs = Object.fromEntries(await Promise.all(html.map(async (f) => ['/' + relative(dist, f).replace(/index\.html$/, ''), await readFile(f, 'utf8')])));

for (const p of ['/', '/enquire/']) if (!docs[p]) problems.push(`missing page ${p}`);

const ids = (s) => new Set([...s.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
for (const [path, s] of Object.entries(docs)) {
  for (const bad of ['undefined', '[object Object]', 'NaN']) {
    if (s.replace(/<script[\s\S]*?<\/script>/g, '').includes(bad)) problems.push(`${path}: contains "${bad}"`);
  }
  if (/\{(brand|destination|email)\}/.test(s)) problems.push(`${path}: unreplaced {token}`);
  for (const [, href] of s.matchAll(/\shref="([^"]+)"/g)) {
    if (/^(https?:|mailto:|tel:)/.test(href)) continue;
    const [p, hash] = href.replace(/&amp;/g, '&').split('#');
    const target = p ? p.split('?')[0] : path;
    if (p && !(target in docs) && !files.includes(join(dist, target))) { problems.push(`${path}: broken link ${href}`); continue; }
    if (hash && !ids(docs[target] || '').has(hash)) problems.push(`${path}: missing anchor ${href}`);
  }
}

const home = docs['/'] || '';
const brand = config.brand.name;
const word = (config.brand.wordmark || brand).replace(/<[^>]*>/g, '').trim().toUpperCase();
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
if (!home.includes(`lengthAdjust="spacing">${esc(word)}</text>`)) problems.push('home: hero wordmark does not match brand name');
const copy = `© ${new Date().getFullYear()} ${esc(brand)}</span>`;
for (const [path, s] of Object.entries(docs)) if (!s.includes(copy)) problems.push(`${path}: footer copyright is not "© <year> ${brand}"`);

if (problems.length) {
  console.error(`Check failed (${problems.length}):\n  ` + problems.join('\n  '));
  process.exit(1);
}
console.log(`Checked ${html.length} pages: links, anchors, wordmark and copyright OK.`);
