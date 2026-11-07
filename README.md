# Grand Tour

A Tourground Launch Pad template for tailor-made travel brands. It has a full-bleed parallax photo hero with a giant full-width wordmark, a sticky region list that changes colour as you scroll, sliding "Instead of" panels, a journeys carousel, an enquiry form and a dark footer.

Everything brand-specific lives in **one file: `site.config.mjs`**. The build turns it into a static site in `dist/`. It has no dependencies; you only need Node 18 or newer.

## Launch a new brand

1. **Copy the template.** Click *Use this template* on GitHub, or clone the repo into a new one.
2. **Edit `site.config.mjs`:**
   - `brand.name`: used in the header, menu, page titles, meta tags and footer. The giant hero wordmark is built from it automatically and scaled to fill the width at any length. Set `brand.wordmark` only if the wordmark should read differently.
   - `brand.tagline` and `brand.description`: the hero line and the meta/social description.
   - `brand.logo`: the small mark beside the name (an inline SVG), or `null` for none. The favicon is generated from the first letter of the name unless you set `brand.favicon`.
   - `destination.name`: replaces `{destination}` everywhere in the copy.
   - `site.url`: your public URL, used for canonical and social tags and the sitemap.
   - `colours`: six colours, each with a readable text colour (`on`).
   - `fonts`: the serif and sans families. The default Newsreader and Archivo files are in `src/assets/fonts/`. To use other fonts, add the `.woff2` files there and list them in `faces`, or point `stylesheet` at a hosted font CSS.
   - `contact`: email, phone, hours and address, shown in the footer, menu and enquiry page. The enquiry form opens a pre-filled email to `contact.email`.
   - Photos, regions, "Instead of" swaps, journeys, features and footer links: each has its own section in the file. A photo is `{ src, alt }`. Unsplash URLs are cropped and sized automatically. For your own photos, put them in `src/assets/photos/` and use `/assets/photos/name.jpg`.
   - `legal`: replace the placeholder privacy, terms and cookie text.

   In any text you can write `{brand}`, `{destination}` or `{email}`. Headings and the tagline accept `<em>…</em>` for the italic accents.
3. **Build and check:**

   ```bash
   npm run build
   ```

   This writes `dist/` and then checks that every page was built, every internal link and anchor resolves, and that the wordmark and the footer line (`© <current year> <brand name>`) come from the config. The year is filled in at build time.
4. **Preview:**

   ```bash
   npm run preview
   ```

   Then open http://localhost:4321.
5. **Check phones (optional, needs Playwright):**

   ```bash
   npm run check:mobile
   ```

   This loads every page at 320–768px widths and fails if anything would make the page scroll sideways.
6. **Deploy** `dist/` to any static host. The build command is `npm run build` and the output directory is `dist`.

## What's in the repo

| Path | What it is |
| --- | --- |
| `site.config.mjs` | The only file you need to edit |
| `src/build.mjs` | Renders the home, enquiry, legal and 404 pages, plus the sitemap and robots.txt |
| `src/assets/styles.css` | Design system: layout, type and motion. Colours and fonts come from the config |
| `src/assets/main.js` | Progressive enhancement: header, menu, parallax, reveals, sticky list, panels, carousel, form |
| `scripts/` | Post-build checks, phone overflow check, preview server |

The fonts (Newsreader and Archivo) are licensed under the SIL Open Font License. The placeholder photos come from Unsplash; replace them with your own before launch.
