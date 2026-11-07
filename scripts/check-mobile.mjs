/* Phone check: loads every built page at common phone widths, scrolls to the
 * bottom (so lazy images and sticky sections settle) and fails if the page is
 * wider than the screen, i.e. if it would scroll sideways.
 * Needs Playwright with Chromium (`npm i -D playwright && npx playwright install chromium`). */
import { readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve } from './serve.mjs';

let chromium;
try { ({ chromium } = await import('playwright')); } catch {
  try { const { createRequire } = await import('node:module'); ({ chromium } = createRequire(import.meta.url)('playwright')); } catch {
    console.error('Playwright is not installed. Run: npm i -D playwright && npx playwright install chromium');
    process.exit(1);
  }
}

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const walk = async (dir) => (await Promise.all((await readdir(dir, { withFileTypes: true })).map((d) => d.isDirectory() ? walk(join(dir, d.name)) : [join(dir, d.name)]))).flat();
const pages = (await walk(dist)).filter((f) => f.endsWith('index.html')).map((f) => '/' + relative(dist, f).replace(/index\.html$/, ''));
const widths = [320, 360, 375, 390, 414, 768];

const server = await serve(0);
const base = `http://localhost:${server.address().port}`;
const browser = await chromium.launch();
const problems = [];
for (const width of widths) {
  const ctx = await browser.newContext({ viewport: { width, height: 800 }, isMobile: width < 768, hasTouch: width < 768 });
  const page = await ctx.newPage();
  for (const path of pages) {
    await page.goto(base + path, { waitUntil: 'load' });
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 30)); }
      window.scrollTo(0, 0);
    });
    const r = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      const sw = document.documentElement.scrollWidth;
      const wide = [...document.querySelectorAll('body *')].filter((el) => {
        const b = el.getBoundingClientRect();
        if (!b.width || b.right <= vw + 1) return false;
        for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
          const s = getComputedStyle(p);
          if (s.overflowX !== 'visible' || s.position === 'fixed' || s.clipPath !== 'none') return false;
        }
        return getComputedStyle(el).position !== 'fixed';
      }).slice(0, 3).map((el) => `${el.tagName.toLowerCase()}.${[...el.classList].join('.')}`);
      // fixed bars never cause scrolling, so check that the header fits on its own
      const hdr = [...document.querySelectorAll('.hdr > *')].filter((el) => el.getBoundingClientRect().width && el.getBoundingClientRect().right > vw + 1).map((el) => el.className);
      return { vw, sw, wide, hdr };
    });
    if (r.hdr.length) problems.push(`${path} @${width}px: header item off screen (${r.hdr.join(', ')})`);
    if (r.sw > r.vw) problems.push(`${path} @${width}px: page is ${r.sw}px wide (${r.wide.join(', ') || 'unknown element'})`);
  }
  await ctx.close();
}
await browser.close();
server.close();
if (problems.length) { console.error('Sideways scroll found:\n  ' + problems.join('\n  ')); process.exit(1); }
console.log(`No sideways scroll on ${pages.length} pages at ${widths.join(', ')}px.`);
