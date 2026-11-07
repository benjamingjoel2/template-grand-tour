/*
 * Grand Tour build: reads site.config.mjs and writes a static site to dist/.
 * No dependencies; needs Node 18 or newer.
 */
import { cp, mkdir, rm, writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const configPath = process.env.SITE_CONFIG ? resolve(process.env.SITE_CONFIG) : join(root, 'site.config.mjs');
const out = join(root, process.env.OUT_DIR || 'dist');

const raw = (await import(pathToFileURL(configPath).href)).default;

/* ---------- helpers ---------- */
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const strip = (s) => String(s ?? '').replace(/<[^>]*>/g, '');
const attr = (s) => esc(strip(s));
const pad = (n) => String(n).padStart(2, '0');
const slug = (s) => strip(s).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const fail = (msg) => { console.error(`site.config.mjs: ${msg}`); process.exit(1); };

// Swap {brand}, {destination} and {email} in every string of the config.
const tokens = {
  brand: raw.brand?.name,
  destination: raw.destination?.name,
  email: raw.contact?.email,
};
const fill = (v) => {
  if (typeof v === 'string') return v.replace(/\{(brand|destination|email)\}/g, (_, k) => tokens[k] ?? '');
  if (Array.isArray(v)) return v.map(fill);
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, fill(x)]));
  return v;
};
const c = fill(raw);

/* ---------- validation ---------- */
if (!c.brand?.name) fail('brand.name is required.');
if (!c.contact?.email) fail('contact.email is required.');
for (const k of ['accent', 'warm', 'deep', 'cool', 'paper', 'ink']) {
  if (!c.colours?.[k]?.bg || !c.colours?.[k]?.on) fail(`colours.${k} needs both "bg" and "on".`);
}
if (!c.hero?.photo?.src) fail('hero.photo.src is required.');
if ((c.collage?.photos || []).length !== 4) fail('collage.photos must hold exactly four photos.');
if (!(c.regions?.items || []).length) fail('regions.items needs at least one region.');
if (!(c.journeys?.items || []).length) fail('journeys.items needs at least one journey.');

const brand = c.brand.name;
const year = new Date().getFullYear();
const siteUrl = (c.site?.url || '/').replace(/\/?$/, '/');
const abs = (path) => siteUrl.replace(/\/$/, '') + path;
const col = (k) => c.colours[k] || fail(`unknown colour "${k}".`);
const ARROW = '<svg viewBox="0 0 14 14" aria-hidden="true" focusable="false"><path d="M1 7h11M8 3l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>';
const cta = (label, href, cls = '') => `<a class="cta ${cls}" href="${esc(href)}"><span>${esc(label)}</span>${ARROW}</a>`;

/* ---------- images ---------- */
const isUnsplash = (src) => /^https:\/\/images\.unsplash\.com\//.test(src);
const crop = (src, w, h) => isUnsplash(src) ? esc(`${src.split('?')[0]}?w=${w}&h=${h}&fit=crop&auto=format&q=70`) : esc(src);
const set = (src, sizes) => isUnsplash(src) ? sizes.map(([w, h]) => `${crop(src, w, h)} ${w}w`).join(', ') : '';
const RATIOS = { 'r-45': 5 / 4, 'r-32': 2 / 3, 'r-34': 4 / 3, 'r-57': 7 / 5 };
const WIDTHS = [480, 800, 1200, 1600];
// One responsive image in the site's reveal frame.
const pic = (p, ratio, sizes, { lazy = true } = {}) => {
  if (!p?.src) fail('a photo is missing its "src".');
  const k = RATIOS[ratio];
  const dims = WIDTHS.map((w) => [w, Math.round(w * k)]);
  const ss = set(p.src, dims);
  return `<figure class="" style="margin:0"><div class="img ${ratio}" data-reveal><img src="${crop(p.src, 800, Math.round(800 * k))}"${ss ? ` srcset="${ss}" sizes="${sizes}"` : ''} width="800" height="${Math.round(800 * k)}" alt="${attr(p.alt)}"${lazy ? ' loading="lazy"' : ''} decoding="async"></div></figure>`;
};
const HERO_MOBILE = [[800, 1200], [1200, 1800]];
const HERO_WIDE = [[1200, 744], [1800, 1116], [2400, 1488]];
const heroPicture = (p, extra = '') => {
  const mobile = set(p.src, HERO_MOBILE);
  const wide = set(p.src, HERO_WIDE);
  return `<picture${extra}>${mobile ? `<source media="(max-width: 699px)" srcset="${mobile}" sizes="100vw">` : ''}<img src="${crop(p.src, 1800, 1116)}"${wide ? ` srcset="${wide}" sizes="100vw"` : ''} width="1800" height="1116" alt="${attr(p.alt)}" fetchpriority="high" decoding="async"></picture>`;
};
const heroPreload = (p) => isUnsplash(p.src)
  ? `<link rel="preconnect" href="https://images.unsplash.com">\n<link rel="preload" as="image" media="(max-width: 699px)" imagesrcset="${set(p.src, HERO_MOBILE)}" imagesizes="100vw" fetchpriority="high"><link rel="preload" as="image" media="(min-width: 700px)" imagesrcset="${set(p.src, HERO_WIDE)}" imagesizes="100vw" fetchpriority="high">`
  : `<link rel="preload" as="image" href="${esc(p.src)}" fetchpriority="high">`;

/* ---------- wordmark ----------
 * The giant hero wordmark is SVG text stretched to the full width with
 * textLength. Its size scales with the number of characters so any brand name
 * fills the width without letters colliding (nine characters → 150 units).
 */
const wordmark = () => {
  const text = strip(c.brand.wordmark || brand).trim().toUpperCase();
  const n = Math.max([...text].length, 1);
  const size = Math.min(Math.round(1350 / n), 300);
  const h = Math.round(size * 0.74);
  return `<svg class="wordmark " viewBox="0 0 1000 ${h}" role="img" aria-label="${attr(brand)}"><text x="0" y="${h}" font-size="${size}" textLength="1000" lengthAdjust="spacing">${esc(text)}</text></svg>`;
};

/* ---------- fonts and colour tokens ---------- */
const RANGES = {
  latin: 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
  'latin-ext': 'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF',
};
const fonts = c.fonts || {};
const fontFaces = (fonts.faces || []).map((f) => `@font-face {font-family: '${f.family}';font-style: ${f.style || 'normal'};font-weight: ${f.weight || '400'};${f.stretch ? `font-stretch: ${f.stretch};` : ''}font-display: swap;src: url(${f.file}) format('woff2');${f.range ? `unicode-range: ${RANGES[f.range] || f.range};` : ''}}`).join('');
const fontHead = [
  ...(fonts.preload || []).map((h) => `<link rel="preload" href="${esc(h)}" as="font" type="font/woff2" crossorigin>`),
  fonts.stylesheet ? `<link rel="stylesheet" href="${esc(fonts.stylesheet)}">` : '',
  fontFaces ? `<style>${fontFaces}</style>` : '',
].join('');
const NAMES = ['accent', 'warm', 'deep', 'cool', 'paper', 'ink'];
const tokensCss = `:root {${NAMES.map((k) => `--${k}: ${c.colours[k].bg};--on-${k}: ${c.colours[k].on};`).join('')}--serif: '${fonts.serif?.family}', ${fonts.serif?.fallback};--sans: '${fonts.sans?.family}', ${fonts.sans?.fallback};}`
  + NAMES.map((k) => `.c-${k} { --bg: var(--${k}); --fg: var(--on-${k}); background-color: var(--${k}); color: var(--on-${k}); }`).join('');

/* ---------- shared chrome ---------- */
const logo = c.brand.logo || '';
const brandMark = (tag, extra = '') => `<${tag} class="hdr__brand"${extra}>${logo}<span>${esc(brand)}</span></${tag}>`;
const langs = (cls) => (c.site?.languages || []).length
  ? `<nav class="langs ${cls}" aria-label="Language" data-i18n-skip>${c.site.languages.map((l, i) => `${i ? '<span aria-hidden="true">·</span>' : ''}<a href="${esc(l.href)}" hreflang="${esc(l.lang)}" lang="${esc(l.lang)}" data-lang-link${(l.lang || '').slice(0, 2) === (c.site.lang || 'en').slice(0, 2) ? ' aria-current="true"' : ''}>${esc(l.code)}</a>`).join('')}</nav>`
  : '';
const menuItems = [{ label: 'Home', href: '/' }, ...(c.nav || []), { label: c.enquireLabel || 'Enquire', href: '/enquire/' }];

const page = ({ path, title, description, bodyClass = '', preload = '', main }) => {
  const canonical = abs(path);
  const desc = strip(description || c.brand.description);
  const ld = { '@context': 'https://schema.org', '@type': 'TravelAgency', name: brand, description: strip(c.brand.description), url: siteUrl, email: c.contact.email };
  if (c.contact.phone) ld.telephone = c.contact.phone;
  const a = c.contact.address || {};
  if (a.street || a.city) ld.address = { '@type': 'PostalAddress', streetAddress: a.street, postalCode: a.postcode, addressLocality: a.city, addressCountry: a.country };
  const alternates = (c.site?.languages || []).length
    ? c.site.languages.map((l) => `<link rel="alternate" hreflang="${esc(l.lang)}" href="${esc(abs(l.href))}">`).join('') + `<link rel="alternate" hreflang="x-default" href="${esc(siteUrl)}">`
    : '';
  return `<!doctype html>
<html lang="${esc(c.site?.lang || 'en')}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${attr(desc)}">
<link rel="canonical" href="${esc(canonical)}">
<meta property="og:title" content="${attr(title)}">
<meta property="og:description" content="${attr(desc)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:site_name" content="${attr(brand)}">
<meta property="og:image" content="${crop(c.hero.photo.src, 1200, 630)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="${esc(c.colours.paper.bg)}">
<meta name="view-transition" content="same-origin">
<link rel="icon" href="${esc(c.brand.favicon || '/assets/favicon.svg')}" type="image/svg+xml">
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>
${preload}
${fontHead}
<style>${tokensCss}</style>
<link rel="stylesheet" href="/assets/styles.css?v=${hashes.css}">
<script>document.documentElement.classList.add('js');if(!matchMedia('(prefers-reduced-motion: reduce)').matches&&'IntersectionObserver' in window)document.documentElement.classList.add('motion')</script>
<script src="/assets/main.js?v=${hashes.js}" defer></script>
${alternates}</head>
<body class="${bodyClass}">
<a class="skip" href="#main">Skip to content</a>
<header class="hdr">
  ${brandMark('a', ' href="/"')}
  <nav class="hdr__nav" aria-label="Main"><ul>${(c.nav || []).map((n) => `<li><a href="${esc(n.href)}">${esc(n.label)}</a></li>`).join('')}</ul></nav>
  ${langs('hdr__langs')}
  <a class="pill" href="/enquire/">${esc(c.enquireLabel || 'Enquire')}</a>
  <a class="hdr__menu" href="#footer-nav" aria-controls="menu" aria-expanded="false" role="button"><span></span><b class="sr">Menu</b></a>
</header>
<div class="menu" id="menu" role="dialog" aria-modal="true" aria-label="Menu" aria-hidden="true">
  <div class="menu__top">${brandMark('span')}<button class="menu__close" type="button"><span class="sr">Close menu</span></button></div>
  <nav aria-label="Menu"><ol>${menuItems.map((n, i) => `<li><a href="${esc(n.href)}"${n.href === path ? ' aria-current="page"' : ''}><span>${pad(i + 1)}</span>${esc(n.label)}</a></li>`).join('')}</ol></nav>
  ${langs('menu__langs')}
  <div class="menu__foot"><a href="mailto:${esc(c.contact.email)}">${esc(c.contact.email)}</a></div>
</div>
<main id="main" tabindex="-1">
${main}
</main>
<footer class="ftr">
  <div class="grid ftr__cols">
    <div class="g-1-5 ftr__brand">
      ${brandMark('p')}
      <p class="ftr__line">${c.brand.tagline}</p>
      <ul><li><a href="mailto:${esc(c.contact.email)}">${esc(c.contact.email)}</a></li>${c.contact.phone ? `<li><a href="tel:${esc(c.contact.phone.replace(/[^+\d]/g, ''))}">${esc(c.contact.phone)}</a></li>` : ''}${c.contact.address?.line ? `<li>${esc(c.contact.address.line)}</li>` : ''}${c.contact.hours ? `<li>${esc(c.contact.hours)}</li>` : ''}</ul>
    </div>
    <nav class="g-6-13 ftr__nav" aria-label="Footer" id="footer-nav">
      ${(c.footer?.columns || []).map((colm) => `<div><h2>${esc(colm.heading)}</h2><ul>${colm.links.map((l) => `<li><a href="${esc(l.href)}">${esc(l.label)}</a></li>`).join('')}</ul></div>`).join('')}
    </nav>
  </div>
  <div class="ftr__legal"><span>© ${year} ${esc(brand)}</span></div>
</footer>
<button class="totop" type="button"><span class="sr">Back to top</span>${ARROW}</button>
</body>
</html>
`;
};

/* ---------- home ---------- */
const regionItems = c.regions.items.map((r, i) => ({ ...r, id: `r-${slug(r.name) || i + 1}`, key: slug(r.name), n: pad(i + 1), colour: r.colour || ['accent', 'warm', 'deep', 'cool', 'ink'][i % 5] }));
const regionHref = (name) => {
  const r = regionItems.find((x) => x.name === name);
  return r ? `/enquire/?region=${encodeURIComponent(r.key)}` : '/enquire/';
};

const home = () => {
  const h = c.hero, i = c.intro, s = c.swaps, j = c.journeys, f = c.features, b = c.band;
  return `<section class="hero" aria-labelledby="home-title">
  <div class="hero__media">${heroPicture(h.photo)}</div>
  <div class="hero__body">
    <div class="hero__row">
      <p class="hero__tag">${c.brand.tagline}</p>
      <a class="down" href="#intro">${esc(h.scrollLabel || 'Discover')} ${ARROW}</a>
    </div>
    <h1 id="home-title">${wordmark()}</h1>
  </div>
</section>

<div id="intro"><section class="sec" aria-labelledby="intro-h">
  <div class="grid split">
    <div class="split__text g-1-6" data-reveal>
      <span class="label">${esc(i.label)}</span>
      <h2 class="h2" id="intro-h">${i.heading}</h2>
      <p class="lead">${esc(i.lead)}</p>${i.body ? `<p>${esc(i.body)}</p>` : ''}
      ${i.cta ? cta(i.cta.label, i.cta.href) : ''}
    </div>
    <div class="split__media g-7-13">${pic(i.photo, 'r-45', '(min-width: 900px) 45vw, 100vw')}</div>
  </div>
</section></div>

<div class="collage" aria-label="${attr(c.collage.label || 'Places we love')}">
  ${[['r-45', '30vw'], ['r-32', '40vw'], ['r-32', '30vw'], ['r-45', '40vw']].map(([r, vw], k) => pic(c.collage.photos[k], r, `(min-width: 900px) ${vw}, 60vw`)).join('\n  ')}
</div>

<section class="stick" data-stick id="regions" aria-labelledby="regions-h">
  <div class="stick__inner">
    <div class="stick__aside">
      <span class="label">${esc(c.regions.label)} 01–${pad(regionItems.length)}</span>
      <h2 class="h2" id="regions-h">${c.regions.heading}</h2>
      <p>${esc(c.regions.body)}</p>
      <nav class="stick__list" aria-label="${attr(c.regions.label)}"><ol class="rows">${regionItems.map((r) => `<li><a href="#${r.id}"><b>${r.n}</b>${esc(r.name)}</a></li>`).join('')}</ol></nav>
      <div class="stick__foot">${cta(c.regions.ctaLabel || 'Plan a journey', '/enquire/')}</div>
    </div>
    <div class="stick__media">${regionItems.map((r) => `<div class="stick__item" id="${r.id}" data-bg="${esc(col(r.colour).bg)}" data-fg="${esc(col(r.colour).on)}"><a href="${regionHref(r.name)}" style="text-decoration:none;display:block">${pic(r.photo, 'r-32', '(min-width: 1000px) 48vw, 100vw')}<span class="cap"><span>${r.n} · ${esc(r.name)}</span><span class="small">${esc(r.blurb)}</span></span></a></div>`).join('\n')}</div>
  </div>
</section>

<section class="sec" id="instead-of" aria-labelledby="instead-h">
  <div class="grid">
    <div class="g-1-6"><span class="label">${esc(s.label)}</span><h2 class="h2" id="instead-h">${s.heading}</h2></div>
    <p class="g-7-12 lead" style="margin:0">${esc(s.lead)}</p>
  </div>
</section>
<div class="stack" data-stack style="--n:${s.items.length}"><div class="stack__pin">${s.items.map((x, k) => {
    const cc = col(x.colour || ['paper', 'deep', 'cool', 'ink'][k % 4]);
    const region = regionItems.find((r) => r.name === x.region);
    return `<article class="panel c-${esc(x.colour || ['paper', 'deep', 'cool', 'ink'][k % 4])}" style="--i:${k};--bg:${esc(cc.bg)};--fg:${esc(cc.on)}" aria-labelledby="swap-${k}">
  <div class="panel__strip" aria-hidden="true"><span>${pad(k + 1)}</span>${esc(x.icon)} → ${esc(x.instead)}</div>
  <div class="panel__body">
    <div class="panel__text">
      <span class="label">${esc(s.label)} ${esc(x.icon)}</span>
      <h3 class="h2" id="swap-${k}"><em>${esc(x.instead)}</em></h3>
      <p class="where small">${esc(x.where)}</p>
      <p class="feeling">${esc(x.feeling)}</p>
      <dl><dt>Why it works</dt><dd>${esc(x.why)}</dd><dt>The trade-off</dt><dd>${esc(x.tradeoff)}</dd>${x.alsoTry ? `<dt>Also try</dt><dd>${esc(x.alsoTry)}</dd>` : ''}</dl>
      ${cta(region ? region.name : (c.enquireLabel || 'Enquire'), regionHref(x.region))}
    </div>
    <div class="panel__pair">
      <figure style="margin:0">${pic(x.iconPhoto, 'r-34', '(min-width: 1000px) 20vw, 40vw')}<figcaption>The icon: ${esc(x.icon)}</figcaption></figure>
      <figure style="margin:0">${pic(x.insteadPhoto, 'r-34', '(min-width: 1000px) 30vw, 60vw')}<figcaption>Go instead: ${esc(x.instead)}</figcaption></figure>
    </div>
  </div>
</article>`;
  }).join('\n')}</div></div>

<section class="car c-ink" data-car id="journeys" aria-labelledby="journeys-h" style="--bg:${esc(c.colours.ink.bg)}">
  <div class="car__head grid">
    <div class="g-1-6"><span class="label">${esc(j.label)}</span><h2 class="h2" id="journeys-h">${j.heading}</h2></div>
    <p class="g-7-12" style="margin:0">${esc(j.body)}</p>
  </div>
  <div class="car__bar" aria-hidden="true"><i></i></div>
  <div class="car__track" role="list">${j.items.map((x) => `<div role="listitem" style="display:contents"><a class="card" href="${esc(x.href || `/enquire/?journey=${encodeURIComponent(strip(x.title))}`)}">
  ${pic(x.photo, 'r-57', '(min-width: 900px) 28vw, 80vw')}
  <span class="card__tag">${esc(x.nights)} ${esc(j.tagSuffix || 'nights')}</span>
  <div class="card__body"><h3 class="h3">${x.title}</h3><span class="cta " aria-hidden="true"><span>${esc(x.ctaLabel || 'Explore')}</span>${ARROW}</span></div>
</a></div>`).join('')}</div>
  <div class="car__nav" hidden><button type="button" data-prev>${ARROW}<span class="sr">Previous journeys</span></button><button type="button" data-next>${ARROW}<span class="sr">Next journeys</span></button><span style="margin-left:auto">${cta(j.allLabel || 'Plan your own', '/enquire/')}</span></div>
</section>

<section class="sec" id="plan" aria-labelledby="features-h">
  <div class="grid" style="margin-bottom:clamp(48px,6vw,96px)">
    <div class="g-1-6"><span class="label">${esc(f.label)}</span><h2 class="h2" id="features-h">${f.heading}</h2></div>
  </div>
  <ol class="nums nums--3">${f.items.slice(0, 3).map((x, k) => `<li class="num-item" data-reveal>
  <span class="num-item__n" aria-hidden="true">${k + 1}</span>
  <h3 class="h3">${esc(x.title)}</h3>
  <p>${esc(x.body)}</p>
  ${x.cta ? cta(x.cta.label, x.cta.href) : ''}
  ${x.photo ? pic(x.photo, 'r-45', '(min-width: 900px) 30vw, 90vw') : ''}
</li>`).join('')}</ol>
</section>

<section class="band c-deep" style="--bg:${esc(c.colours.deep.bg)}">
  <div class="grid band__row">
    <h2 class="h2 g-1-7">${b.heading}</h2>
    <div class="g-8-13"><p>${esc(b.body)}</p><a class="pill pill--lg" href="${esc(b.cta?.href || '/enquire/')}">${esc(b.cta?.label || 'Start an enquiry')}</a></div>
  </div>
</section>`;
};

/* ---------- enquiry ---------- */
const enquire = () => {
  const e = c.enquire || {};
  const mail = esc(c.contact.email);
  const checks = (name, items) => items.map((x) => `<label><input type="checkbox" name="${name}" value="${esc(x.value)}"> ${esc(x.label)}</label>`).join('');
  return `<div class="enq">
  <div class="enq__media" style="position:relative">${heroPicture(e.photo || c.hero.photo, ' class="img" style="display:block;height:100%"')}</div>
  <section class="enq__panel c-deep" style="--bg:${esc(c.colours.deep.bg)}" aria-labelledby="enq-h">
    <span class="label">${esc(e.label || 'Enquire')}</span>
    <h1 class="title" id="enq-h" style="font-size:clamp(48px,6.5vw,104px);margin-bottom:28px">${e.heading}</h1>
    <p class="lead" style="max-width:30em;margin-bottom:48px">${esc(c.contact.reply)}</p>
    <form class="form" data-enquiry data-mode="mailto" data-email="${mail}"
      action="mailto:${mail}" method="post" enctype="text/plain">
      <p class="small" style="margin:0">Fields marked “required” must be filled in. Everything else is optional.</p>
      <div class="row2"><div class="field"><label for="f-name">Your name (required)</label><input type="text" id="f-name" name="name" autocomplete="name" required></div>
      <div class="field"><label for="f-email">Email (required)</label><input type="email" id="f-email" name="email" autocomplete="email" required></div></div>
      <div class="row2"><div class="field"><label for="f-phone">Phone</label><input type="tel" id="f-phone" name="phone" autocomplete="tel"></div>
      <div class="field"><label for="f-when">When would you like to travel?</label><input type="text" id="f-when" name="when" aria-describedby="f-when-hint"><p class="hint" id="f-when-hint">A month or season is fine, e.g. “late September ${year + 1}”.</p></div></div>
      <div class="row2"><div class="field"><label for="f-nights">Nights</label><input type="number" id="f-nights" name="nights" min="1" max="60" inputmode="numeric"></div>
      <div class="field"><label for="f-people">Travellers</label><input type="number" id="f-people" name="travellers" min="1" max="30" inputmode="numeric"></div></div>
      <fieldset class="field"><legend>Regions you’re drawn to</legend><div class="checks">${checks('regions', [...regionItems.map((r) => ({ value: r.key, label: `${r.n} ${r.name}` })), { value: 'not-sure', label: 'Not sure yet' }])}</div></fieldset>
      ${(e.interests || []).length ? `<fieldset class="field"><legend>What matters most</legend><div class="checks">${checks('interests', e.interests.map((x) => ({ value: x, label: x })))}</div></fieldset>` : ''}
      ${(e.budgets || []).length ? `<div class="field"><label for="f-budget">${esc(e.budgetLabel || 'Budget per person')}</label>
        <select id="f-budget" name="budget"><option value="">Prefer to discuss</option>${e.budgets.map((x) => `<option>${esc(x)}</option>`).join('')}</select></div>` : ''}
      <div class="field"><label for="f-message">Anything else?</label><textarea id="f-message" name="message" aria-describedby="f-message-hint"></textarea><p class="hint" id="f-message-hint">Places you’ve been, a dish you want to find, how you like to travel.</p></div>
      <div style="position:absolute;left:-9999px" aria-hidden="true"><label for="f-gotcha">Leave this empty</label><input type="text" id="f-gotcha" name="_gotcha" tabindex="-1" autocomplete="off"></div>
      <div class="field"><div class="consent"><input type="checkbox" id="f-consent" name="consent" value="yes" required data-error="Tick this box so we can reply to you."><label for="f-consent">I agree to ${esc(brand)} contacting me about this enquiry (required)</label></div></div>
      <p style="margin:0"><button class="pill pill--lg" type="submit">Send enquiry</button></p>
      <div class="form-status" id="form-status" tabindex="-1" role="status" hidden>
        <p style="margin:0"><b>Your email app should now open with your enquiry filled in.</b> Press send there to reach us. If nothing opened, email us at <a href="mailto:${mail}">${mail}</a>.</p>
      </div>
    </form>
    <div style="margin-top:64px"><ul class="rlist facts"><li><b>Email</b><span><a href="mailto:${mail}">${mail}</a></span></li>${c.contact.phone ? `<li><b>Phone</b><span>${esc(c.contact.phone)}</span></li>` : ''}${c.contact.hours ? `<li><b>Hours</b><span>${esc(c.contact.hours)}</span></li>` : ''}${c.contact.address?.line ? `<li><b>Studio</b><span>${esc(c.contact.address.line)}</span></li>` : ''}</ul><p class="small" style="margin-top:20px">We use your details only to reply to this enquiry.</p></div>
  </section>
</div>`;
};

/* ---------- legal ---------- */
const legal = (l) => {
  const d = new Date(`${l.updated}T00:00:00Z`);
  const date = isNaN(d) ? '' : d.toLocaleDateString(c.site?.lang || 'en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  return `
<header class="phead phead--plain">
  <div class="phead__text grid">
    <div class="g-all"><span class="label">Legal</span><h1 class="title">${esc(l.title)}</h1></div>
    <p class="lead g-1-7" data-reveal>${esc(l.intro)}${date ? `<br><span class="small">Last updated <time datetime="${esc(l.updated)}">${date}</time>.</span>` : ''}</p>
  </div>
</header>
<section class="sec sec--t0" aria-label="${attr(l.title)}">
  <div class="grid"><div class="g-1-7 prose">${l.body}</div></div>
</section>`;
};

/* ---------- favicon ---------- */
const favicon = () => {
  const letter = esc([...strip(brand).trim()][0]?.toUpperCase() || '·');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="${esc(c.colours.paper.bg)}"/><text x="16" y="23.5" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="22" font-weight="600" fill="${esc(c.colours.accent.bg)}">${letter}</text></svg>\n`;
};

/* ---------- write ---------- */
const css = await readFile(join(root, 'src/assets/styles.css'), 'utf8');
const js = await readFile(join(root, 'src/assets/main.js'), 'utf8');
const hash = (s) => createHash('sha1').update(s).digest('hex').slice(0, 10);
const hashes = { css: hash(css), js: hash(js) };

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
await cp(join(root, 'src/assets'), join(out, 'assets'), { recursive: true });
if (!c.brand.favicon) await writeFile(join(out, 'assets/favicon.svg'), favicon());

const tagline = strip(c.brand.tagline);
const pages = [
  { path: '/', title: `${brand}: ${tagline}`, bodyClass: 'has-hero', preload: heroPreload(c.hero.photo), main: home() },
  { path: '/enquire/', title: `${strip(c.enquire?.label || 'Enquire')} · ${brand}`, description: `Start planning a tailor-made journey in ${strip(c.destination?.name)} with ${brand}.`, bodyClass: 'has-hero', preload: heroPreload(c.enquire?.photo || c.hero.photo), main: enquire() },
  ...(c.legal || []).map((l) => ({ path: `/${l.slug}/`, title: `${l.title} · ${brand}`, description: l.intro, main: legal(l) })),
];
for (const p of pages) {
  const dir = join(out, p.path);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, 'index.html'), page(p));
}
await writeFile(join(out, '404.html'), page({
  path: '/404.html', title: `Page not found · ${brand}`,
  main: `<header class="phead phead--plain"><div class="phead__text grid"><div class="g-all"><span class="label">404</span><h1 class="title">Page <em>not found</em></h1></div><p class="lead g-1-7">That page has moved or never existed.</p><div class="g-all">${cta('Back to the home page', '/')}</div></div></header>`,
}));
await writeFile(join(out, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${abs('/sitemap.xml')}\n`);
await writeFile(join(out, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map((p) => `  <url><loc>${esc(abs(p.path))}</loc></url>`).join('\n')}\n</urlset>\n`);

console.log(`Built ${pages.length + 1} pages for "${brand}" into ${out.replace(root + '/', '')}/`);
