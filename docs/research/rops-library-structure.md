# ROPS Social Innovation Library: structure for scraping

Research for [SPL-6](https://linear.app/splot-hackyeah/issue/SPL-6). All facts below come from live requests to `rops.krakow.pl` on 2026-10-03: the index page, all 9 category pages and all 115 detail pages, fetched with `curl`/`urllib` at 1 request per second. Nothing comes from secondary write-ups.

## TL;DR

- **Small, static, server-rendered site.** 1 index page, 9 category pages and **115 innovations**. There is no pagination, no JSON API, no sitemap and no RSS. One run takes about 125 HTML requests.
- **Use `fetch` + `cheerio`.** You do not need a headless browser: all content is in the initial HTML, and JS only drives the menu, the cookie banner and site search.
- **Each detail page has a fixed template.** It has an `h2.page-title` title, an icon table with links (PDF folder, YouTube, ZIP, licence, QR code), and six numbered `<h4>` sections (solution, problem, target group, who can use it, does it work, authors).
- **The short lead appears only on the category listing** (`.news-list__desc`), not on the detail page. The scraper has to read both pages.
- **Do not import:** section 6 "Autorzy/Autorka/…" (authors' personal names) and any e-mail or phone in the body. `docs/criteria.md` §9 forbids real personal data.
- **ROPS categories group by target group** (seniors, children, disability types and so on), **not by challenge**. Only `dla-seniorow → aging` maps 1:1. The other 6 enum values have to be inferred from the item text, for example by an LLM pass over sections 1–3, using a per-category default as a fallback.
- **No robots.txt (404) and no site terms for reuse.** 100 items are CC BY 4.0. 15 items fall under the "Małopolski Inkubator Innowacji Społecznych" rules, which require a licence agreement before anyone uses the *materials*. Link to the ZIPs and PDFs and do not mirror them, because a single ZIP can be up to 693 MB.

## 1. Navigation and URL patterns

| Level | URL pattern | Count | Notes |
|---|---|---|---|
| Index | `/innowacje-spoleczne/biblioteka-innowacji-spolecznych/kategorie` | 1 | Hand-made HTML `<table>` of icon tiles inside `.text-content`. Also lists the categories in the side menu: `a.side-menu__subsubnav-link[href^="/innowacje-spoleczne/biblioteka-innowacji-spolecznych/dla-"]` |
| Category list | `/innowacje-spoleczne/biblioteka-innowacji-spolecznych/{category-slug}` | 9 | Every item on one page, with no pagination. `?page=2` and `?p=2` return the identical page, `,2` returns 404 and `/2` returned 503 |
| Detail | `/innowacje-spoleczne/biblioteka-innowacji-spolecznych/{category-slug},{item-slug}` | 115 | A comma separates the category from the item. The item slug is unique across the library |

The 9 category slugs and their item counts, as listed on 2026-10-03:

| Slug | Label (PL) | Items |
|---|---|---|
| `dla-seniorow` | Dla seniorów | 20 |
| `dla-dzieci-mlodziezy-i-rodziny` | Dla dzieci, młodzieży i rodziny | 21 |
| `dla-osob-o-ograniczonej-mobilnosci` | Dla osób o ograniczonej mobilności | 18 |
| `dla-osob-z-niepelnosprawnoscia-sensoryczna` | Dla osób z niepełnosprawnością sensoryczną | 20 |
| `dla-osob-z-niepelnosprawnoscia-intelektualna` | Dla osób z niepełnosprawnością intelektualną | 14 |
| `dla-zdrowia-i-medycyny` | Dla zdrowia i medycyny | 9 |
| `dla-cudzoziemcow` | Dla cudzoziemców | 6 |
| `dla-rynku-pracy` | Dla rynku pracy | 5 |
| `dla-osob-w-kryzysie-bezdomnosci` | Dla osób w kryzysie bezdomności | 2 |
| **Total** | | **115** |

- **Each item belongs to exactly one category.** No item slug appears in two categories.
- The brief's "almost 200 innovations" (`docs/criteria.md` §1) is the wider ROPS portfolio. The public library holds 115.
- Every library page carries the banner "STRONA JEST W PRZEBUDOWIE. NIEKTÓRE LINKI POZOSTAJĄ NIEAKTYWNE…" ("the page is being rebuilt; some links are inactive"). Expect the structure to change. Today it is consistent, but the scraper should fail loudly when the selectors find nothing.

### Rendering, APIs and feeds

- **Rendering:** the content is in the initial HTML (UTF-8, LiteSpeed server). The page loads only `runtime.js`, `vendor.js` and `main.js` from `/themes/page/js/`, for the menu, cookie banner and search. The server sets a `session` cookie, but you do not need it.
- **API:** `/ajax/get-search?q=…` returns JSON (`{"error":0,"searchword":…,"found":N,"results":[{"clean","title","desc"}…]}`). It searches the **whole site**, has no category or library filter, and returns paged results. It is no better than the category pages.
- **Feeds:** `/sitemap.xml`, `/sitemap_index.xml`, `/rss`, `/rss.xml` and `/feed` all return 404. The page `<head>` has no `<link rel="alternate">`.

## 2. Selectors

### Category list page (`/…/{category-slug}`)

| Field | Selector | Notes |
|---|---|---|
| Category label | `h2.page-title` | e.g. "Dla seniorów" |
| Item container | `.news-list .news-list__item` | One per innovation |
| Title + detail URL | `a.news-list__title` (text, `href`) | `href` is relative: `/innowacje-spoleczne/…/{cat},{slug}` |
| **Lead** | first `<p>` inside `.news-list__desc` | One sentence, e.g. "BaWita - tablica manipulacyjno terapeutyczna dla seniorów i osób z chorobami dementywnymi". **Not on the detail page.** Missing for 1 of 115 items ("Puzzle's Ramp") |
| Project banner (optional) | `.news-list__desc strong` whose text starts with `INNOWACJA WYBRANA DO UPOWSZECHNIANIA W RAMACH PROJEKTU` | Also on the detail page |

The listing also repeats the icon table from the detail page. Prefer to read the table from the detail page.

### Detail page (`/…/{category-slug},{item-slug}`)

All content is inside `.content__main .text-content`. The breadcrumb `ol.breadcrumb li` holds the category label (4th item) and the title (last item).

| Field | Where | Coverage (of 115) |
|---|---|---|
| Title | `.content__main h2.page-title` | 115 |
| Project banner | first `p > strong` with "INNOWACJA WYBRANA DO UPOWSZECHNIANIA W RAMACH PROJEKTU \"…\"" | 27. Projects: "Inkubator Dostępności" (9), "Inkubator Włączenia Społecznego" (9), "Małopolski Inkubator Innowacji Społecznych" (8), "Małopolskiego Inkubatora Włączenia Społecznego" (1) |
| Icon table | first `<table>` in `.text-content`. Each `<td>` holds an `<img src="/mpliki/IS/iKONY_na_www/{icon}">`, optionally wrapped in `<a href>`. The second row holds the captions. Identify each cell by its **icon file name**, not by column position | 115 |
| → Category icon | `img[src*="iKONY_na_www/a_dla_"]` (and similar, such as `dla_bezdomnych.png`, `niepelnosprawnosc_intelektualna.png`) | 115. Decorative |
| → "dowiedz się więcej" (PDF folder) | `a:has(img[src$="lupa.png"])` → `/mpliki/IS/BIBLIOTEKA_INNOWACJI_SPOECZNYCH/*.pdf` | **27** (missing on 88) |
| → "zobacz film" (video) | `a:has(img[src$="play_black.png"])` → `https://www.youtube.com/watch?v=…` (25) or `https://youtu.be/…` (1) | **26**. Plain links, **no `<iframe>` embeds, no Vimeo** |
| → "pobierz materiały" (ZIP) | `a:has(img[src$="read2.png"])` → `https://rops.krakow.pl/pliki/IS/bibloteka/{name}.zip` (note the typo "bibloteka" in the path) | 115. Checked a sample of 6: all 200 `application/zip`, from 8 MB to 693 MB |
| → Licence | `a:has(img[src$="CC_BY.png"])` → `https://creativecommons.org/licenses/by/4.0/deed.pl`, **or** `a:has(img[src*="symbol-c-w-kolku"])` → `/mpliki/IS/BIBLIOTEKA_INNOWACJI_SPOECZNYCH/Zasady_wykorzystania_innowacji_MIIS.pdf` | CC BY 4.0: 100. MIIS rules: 15 |
| → "otwórz w telefonie" | `img[src^="/mpliki/IS/BIBLIOTEKA_INNOWACJI_SPOECZNYCH/"][src$=".png"]` (85×85) | 115. **This is a QR code, not a photo** (checked `bawita.png`, 1980×1980 QR) |
| Sections | `.text-content h4` followed by `<p>` siblings up to the next `h4` | see below |

**There are no product photos or galleries for an innovation.** The `/media/galleries/…` and `/media/publications/…` images on the page belong to the site-wide "Publikacje" and "Multimedia" sidebar modules, which sit below `.content__main`. Ignore them.

### Detail sections (`h4`)

Match on the **number plus a keyword**, not on the exact text. The wording varies, and some headings contain `&nbsp;` or a nested `<span>`.

| # | Heading text (canonical) | Seen on | Maps to |
|---|---|---|---|
| 1 | "Na czym polega rozwiązanie?" | 114 (1 page has an empty `<h4>&nbsp;</h4>` with the heading text placed elsewhere: Teleasystent) | `description` (main part) |
| 2 | "Jakich problemów dotyczy innowacja?" | 115 | `description`, and the main input for category inference |
| 3 | "Grupa docelowa" | 114 (missing on `osa-i-eco-puzzle`) | `description` / target group |
| 4 | "Kto może skorzystać z innowacji?" (once "…z rozwiązania?") | 115 | `description` / who can adopt it |
| 5 | "Czy to działa?" | 111 (missing on 4 senior items, where "5." is the authors section) | `description` / evidence. A hint for `stage` |
| 6 | "Autorzy" / "Autorka" / "Autor" / "Autorki" / "Autorzy innowacji" / "Autorz" (typo), sometimes numbered "5." | 115 | **DROP: personal data** |

There are no structured fields for stage, organisation, municipality, dates or tags. The **organisation and author exist only as personal names in section 6**, and we must not import them.

Some items have extra paragraphs inside the sections. One of them, `komix-zyciowy`, contains a ROPS staff e-mail (`uw@rops.krakow.pl`) inside section 5. Strip e-mail addresses and phone numbers from all imported text.

## 3. Example detail pages

1. **BaWita**: <https://rops.krakow.pl/innowacje-spoleczne/biblioteka-innowacji-spolecznych/dla-seniorow,bawita>
   - `h2.page-title` = "BaWita". Listing lead = "BaWita - tablica manipulacyjno terapeutyczna dla seniorów i osób z chorobami dementywnymi"
   - Banner: "…PROJEKTU "INKUBATOR WŁĄCZENIA SPOŁECZNEGO""
   - `lupa` → `/mpliki/IS/BIBLIOTEKA_INNOWACJI_SPOECZNYCH/ROPS_Folder_IN_BaWita_v15_www.pdf`. `play_black` → `https://www.youtube.com/watch?v=o7UhDlebLJo`. `read2` → `https://rops.krakow.pl/pliki/IS/bibloteka/bawita.zip`. Licence: CC BY 4.0. QR: `/mpliki/IS/BIBLIOTEKA_INNOWACJI_SPOECZNYCH/bawita.png`
   - `h4` 1–6 present. Section 6 "Autorzy" lists two people's names (drop).
2. **Teleasystent**: <https://rops.krakow.pl/innowacje-spoleczne/biblioteka-innowacji-spolecznych/dla-osob-z-niepelnosprawnoscia-sensoryczna,teleasystent>
   - Listing lead = "Aplikacja umożliwiająca zdalną asystę dla osób niewidzących i słabowidzących."
   - `lupa` → `/mpliki/IS/BIBLIOTEKA_INNOWACJI_SPOECZNYCH/08_model_Teleasystent.pdf`. `play_black` → `https://www.youtube.com/watch?v=8xUBVF_5CWU`. `read2` → `…/bibloteka/teleasystent.zip`. Licence: **MIIS rules PDF** (licence agreement required)
   - Edge case: the first heading is `<h4>&nbsp;</h4>`, followed by `h4` 2–6.
3. **Czas na aktywność!**: <https://rops.krakow.pl/innowacje-spoleczne/biblioteka-innowacji-spolecznych/dla-dzieci-mlodziezy-i-rodziny,czas-na-aktywnosc>
   - Listing lead = "Platforma internetowa dla osób z niepełnosprawnością intelektualną". Banner: "…"MAŁOPOLSKI INKUBATOR INNOWACJI SPOŁECZNYCH""
   - `lupa` → `/mpliki/IS/BIBLIOTEKA_INNOWACJI_SPOECZNYCH/03_CzasNaAktywnosc.pdf`. `play_black` → `https://www.youtube.com/watch?v=QgkpdYndqNU`. `read2` → `…/bibloteka/czasnaaktywnosc.zip`. Licence: MIIS rules PDF
   - The text describes an online platform for people with intellectual disability, but ROPS files it under children/youth/family. This shows why the ROPS category is a poor proxy for our challenge categories.

**Data-quality gotcha:** two items in `dla-cudzoziemcow` share the title "Dialog ponad kulturami". The one at `,dialog-ponad-kulturami-1` is actually a different innovation, an app for communicating with Afghan refugees. Use the **slug** as the key, not the title. Consider fixing that title manually.

## 4. Mapping ROPS categories to `challenge_category`

Our enum (`splot/supabase/migrations/20261003120100_domain.sql`) lists **challenges**: `aging, mental_health, loneliness, digital_exclusion, service_access, coordination, depopulation`. ROPS lists **target groups**. Only one maps 1:1. The table below gives a suggested *default* for each ROPS category. The item text then has to add or override categories, because `innovations.categories` is an array.

| ROPS category | Default `challenge_category` | Typical extra categories seen in the texts |
|---|---|---|
| `dla-seniorow` | `aging` | `mental_health`, `loneliness`, `digital_exclusion` |
| `dla-dzieci-mlodziezy-i-rodziny` | (none; infer from text) | `mental_health` (e.g. "Bez presji z depresji"), `service_access` |
| `dla-osob-o-ograniczonej-mobilnosci` | `service_access` | `aging` |
| `dla-osob-z-niepelnosprawnoscia-sensoryczna` | `service_access` | `digital_exclusion` (many are apps or devices) |
| `dla-osob-z-niepelnosprawnoscia-intelektualna` | `service_access` | `digital_exclusion` (VR/AR, apps), `mental_health` |
| `dla-zdrowia-i-medycyny` | `service_access` | `mental_health`, `digital_exclusion` |
| `dla-cudzoziemcow` | `service_access` | `coordination`, `loneliness` |
| `dla-rynku-pracy` | `service_access` | `coordination` |
| `dla-osob-w-kryzysie-bezdomnosci` | `service_access` | `coordination`, `depopulation` (one item is a rural programme: "Wiejski program pomocy… Ścieżka Feniksa") |

I ran a rough Polish keyword scan over sections 1–4 of all 115 items to gauge the signal. These counts are items with at least one hit, are indicative only, and the scan was not reviewed by hand: `service_access` 78, `digital_exclusion` 37, `aging` 29, `mental_health` 28, `depopulation` 12, `coordination` 12, `loneliness` 10, no hit 11. Keyword matching is too noisy to use as is. For example, "wsi" or "sieć" matches unrelated text.

**Recommendation:** run an LLM classification pass at import time over title + lead + sections 1–3. Use a closed label set (the 7 enum values, 1–3 per item) and fall back to the default in the table above. Store the raw ROPS category separately (e.g. `source_category text`) so the target-group facet is not lost. This is the main open design decision for the import ticket.

### `stage` (`innovation_stage`: idea / pilot / deployed)

ROPS does not publish a stage field. Every item comes from an ROPS incubator and was tested: 111 items have "Czy to działa?" describing test results. A defensible heuristic:

- `deployed` if the "INNOWACJA WYBRANA DO UPOWSZECHNIANIA" banner is present (27 items, selected for dissemination)
- otherwise `pilot`

This is a product decision, not a fact from the source.

## 5. Field mapping to `public.innovations`

| Column | Source |
|---|---|
| `slug` | detail URL item slug (after the comma). Unique across all 115 |
| `title` | `h2.page-title` |
| `lead` | first `<p>` of `.news-list__desc` on the category page |
| `description` | sections 1–5 as Markdown/HTML, keeping the Polish headings, with e-mails and phones stripped and section 6 dropped |
| `easy_read_description` | not on the source. Generate it later |
| `categories` | see §4 |
| `stage` | see §4 |
| `author_id` | `null` (there are no Splot profiles for ROPS authors, and their names are personal data) |
| `published` | `true` after review |

The current schema has **no columns** for the source URL, video, PDF folder, materials ZIP, licence or project. The import ticket should add them, for example `source_url`, `video_url`, `folder_pdf_url`, `materials_url`, `license` (`cc_by_4_0` | `miis_agreement`) and `source_project`, or a single `source jsonb`. The brief explicitly wants the library "e.g. with videos" (`docs/criteria.md` §2.2).

## 6. robots.txt, terms, politeness

- `https://rops.krakow.pl/robots.txt` returns **404**, so the site declares no crawl rules. Pages do not carry a `<meta name="robots">` or an `X-Robots-Tag` header.
- **Site terms:** I found no terms-of-use or copyright notice in the page chrome. The footer links only to the cookies and privacy policy.
- **Content licences on the items:**
  - 100 items link to **CC BY 4.0**. Republishing the text with attribution ("Źródło: ROPS Kraków, Biblioteka Innowacji Społecznych", plus a link to the source URL) is fine.
  - 15 items link to `Zasady_wykorzystania_innowacji_MIIS.pdf`. It says that using the **innovation materials** requires a free, non-exclusive, non-transferable **licence agreement** with Województwo Małopolskie / ROPS (contact: Dział Innowacji Społecznych ROPS Kraków). For these, show the description, link to the source, and do not re-host the ZIP or PDF. Mark them in the UI as "licence agreement required".
- **Personal data:** do not import section 6 (authors) or any contact data. The ROPS mailboxes in the body text (e.g. `uw@rops.krakow.pl`, `iws@rops.krakow.pl` in the rebuild banner) are not personal, but they are noise. Strip them.
- **Politeness:**
  - About 125 HTML pages in total. Use 1 request/s with a descriptive `User-Agent`. The full crawl of the 115 detail pages took about 2 minutes, and every page returned 200. The only 503 came from a nonsense URL (`/…/dla-seniorow/2`).
  - **Do not download the ZIPs.** Six sampled ZIPs total about 0.8 GB, the largest 693 MB. Store their URLs only.
  - Cache the raw HTML to disk so re-runs do not hit the server again.

## 7. Recommended approach for `splot/scripts/`

A one-off Node/TypeScript script, `splot/scripts/import-rops-library.ts`:

1. **Fetch:** use native `fetch` (Node 20+) and `cheerio`, which is not yet in `splot/package.json` and has to be added as a devDependency. You do not need Playwright or Puppeteer.
2. **Crawl:** take the 9 category slugs from the side menu on `/kategorie`. For each category page, collect `{slug, title, lead, banner, detailUrl}` from `.news-list__item`. Then fetch each detail page sequentially, with a 1 s delay, and cache it under a git-ignored folder.
3. **Parse each detail page:**
   - Read `h2.page-title`.
   - Find the icon-table links by icon file name (`lupa.png`, `play_black.png`, `read2.png`, `CC_BY.png`, `symbol-c-w-kolku*`).
   - Split `.text-content` into sections on `h4`, matching each heading by leading number + keyword with a regex such as `/^\s*(\d)\.\s*(Na czym|Jakich problem|Grupa docelowa|Kto może|Czy to działa|Autor)/i`.
   - Drop the `Autor*` section.
   - Strip e-mails and phones.
   - Resolve relative URLs against `https://rops.krakow.pl`.
4. **Validate:** assert 115 items, unique slugs, and non-empty title and description. Warn when a page has fewer than 4 sections, and log the known edge cases (the `&nbsp;` heading, missing sections, the duplicate title).
5. **Output:** write a reviewed JSON or `seed.sql` (idempotent `insert … on conflict (slug) do update`). Write through the server-side admin client or `supabase/seed.sql`, never from the browser. Run the category classification (§4) as a separate step so it can be reviewed.

## Sources

- `https://rops.krakow.pl/innowacje-spoleczne/biblioteka-innowacji-spolecznych/kategorie` (index, fetched 2026-10-03)
- The 9 category pages `https://rops.krakow.pl/innowacje-spoleczne/biblioteka-innowacji-spolecznych/{dla-…}` (fetched 2026-10-03)
- All 115 detail pages `…/{category},{slug}` (fetched 2026-10-03; statistics above computed over the full set)
- `https://rops.krakow.pl/robots.txt` (404), `/sitemap.xml` (404), `/rss` (404), `/ajax/get-search?q=senior` (site-wide JSON search)
- `https://rops.krakow.pl/mpliki/IS/BIBLIOTEKA_INNOWACJI_SPOECZNYCH/Zasady_wykorzystania_innowacji_MIIS.pdf` (MIIS licence rules)
- `https://creativecommons.org/licenses/by/4.0/deed.pl` (linked licence)
- `splot/supabase/migrations/20261003120100_domain.sql` (target schema), `docs/criteria.md` §1, §2, §9
