/**
 * One-off scraper: ROPS Social Innovation Library → data/rops-library.json.
 *
 * Run with `pnpm data:scrape`. Raw HTML is cached in data/.cache/, so re-runs
 * do not hit rops.krakow.pl and produce the same file. Delete the cache to
 * fetch fresh pages.
 *
 * Selectors and edge cases: docs/research/rops-library-structure.md (SPL-6).
 * Scope and field mapping: SPL-9, SPL-19.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import * as cheerio from "cheerio";

const ORIGIN = "https://rops.krakow.pl";
const LIBRARY_PATH = "/innowacje-spoleczne/biblioteka-innowacji-spolecznych";
const USER_AGENT =
  "SplotBot/0.1 (HackYeah 2026; one-off import of the ROPS Social Innovation Library)";
const REQUEST_DELAY_MS = 1000;

const ROOT = process.cwd();
const CACHE_DIR = path.join(ROOT, "data", ".cache");
const OUTPUT_FILE = path.join(ROOT, "data", "rops-library.json");

const EXPECTED_ITEMS = 100;

/** ROPS category slug → `target_group` enum value. */
const TARGET_GROUPS = {
  "dla-seniorow": "seniors",
  "dla-dzieci-mlodziezy-i-rodziny": "children_family",
  "dla-osob-o-ograniczonej-mobilnosci": "limited_mobility",
  "dla-osob-z-niepelnosprawnoscia-sensoryczna": "sensory_disability",
  "dla-osob-z-niepelnosprawnoscia-intelektualna": "intellectual_disability",
  "dla-zdrowia-i-medycyny": "health",
  "dla-cudzoziemcow": "foreigners",
  "dla-rynku-pracy": "labour_market",
  "dla-osob-w-kryzysie-bezdomnosci": "homelessness",
} as const;

type CategorySlug = keyof typeof TARGET_GROUPS;
type TargetGroup = (typeof TARGET_GROUPS)[CategorySlug];

/**
 * Hand fixes keyed by slug. Two items share the title „Dialog ponad
 * kulturami”; the `-1` one is a different innovation (SPL-6).
 */
const TITLE_OVERRIDES: Record<string, string> = {
  "dialog-ponad-kulturami-1": "Dialog ponad kulturami – aplikacja dla Afgańczyków w Polsce",
};

const SECTION_KEYS = ["solution", "problem", "audience", "adopters", "evidence"] as const;
type SectionKey = (typeof SECTION_KEYS)[number];

/** Heading keyword → section. `null` marks the authors section, which is dropped. */
const SECTION_HEADINGS: [RegExp, SectionKey | null][] = [
  [/na czym polega/i, "solution"],
  [/jakich problem/i, "problem"],
  [/grupa docelowa/i, "audience"],
  [/kto mo[żz]e skorzysta/i, "adopters"],
  [/czy to dzia[łl]a/i, "evidence"],
  [/autor/i, null],
];

const DISSEMINATION_BANNER = /INNOWACJA WYBRANA DO UPOWSZECHNIANIA W RAMACH PROJEKTU/i;

const EMAIL_PATTERN = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g;
// Polish phone numbers: +48 / 9 digits in 3-3-3 or 2-3-2-2 groups, or 9 digits in a row.
const PHONE_PATTERN =
  /(?<![\d/.,])(?:\+48[\s-]?)?(?:\(?\d{2}\)?[\s-]\d{3}[\s-]\d{2}[\s-]\d{2}|\d{3}[\s-]\d{3}[\s-]\d{3}|\d{9})(?![\d/.,]\d)/g;
// Optional label in front of a contact, removed together with it.
const CONTACT_LABEL = /(?:\b(?:tel\.?|telefon|kom\.?|e-?mail|mail)\s*:?\s*)?/;

type Innovation = {
  slug: string;
  title: string;
  lead: string | null;
  solution: string | null;
  problem: string | null;
  audience: string | null;
  adopters: string | null;
  evidence: string | null;
  target_group: TargetGroup;
  stage: "pilot" | "deployed";
  source_url: string;
  video_url: string | null;
  folder_pdf_url: string | null;
  materials_url: string | null;
  source_project: string | null;
};

type ListingEntry = {
  slug: string;
  category: CategorySlug;
  lead: string | null;
  url: string;
};

let lastFetchAt = 0;

async function fetchPage(pagePath: string): Promise<string> {
  const cacheFile = path.join(CACHE_DIR, `${pagePath.replace(/[^\w,.-]+/g, "_")}.html`);
  try {
    return await readFile(cacheFile, "utf8");
  } catch {
    // Not cached yet.
  }

  const wait = lastFetchAt + REQUEST_DELAY_MS - Date.now();
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
  lastFetchAt = Date.now();

  const url = `${ORIGIN}${LIBRARY_PATH}/${pagePath}`;
  console.log(`GET ${url}`);
  const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!response.ok) throw new Error(`${url} returned ${response.status}`);
  const html = await response.text();

  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(cacheFile, html);
  return html;
}

function normalizeText(text: string): string {
  return text.replace(/ /g, " ").replace(/[ \t\r\n]+/g, " ").trim();
}

/** Removes e-mail addresses and phone numbers, with any „tel.:” / „e-mail:” label before them. */
function stripContacts(text: string): string {
  return text
    .replace(new RegExp(CONTACT_LABEL.source + EMAIL_PATTERN.source, "gi"), "")
    .replace(new RegExp(CONTACT_LABEL.source + PHONE_PATTERN.source, "gi"), "")
    .replace(/\(\s*\)/g, "")
    .replace(/ +([,.;:)])/g, "$1")
    .replace(/[ ,;:]+$/g, "")
    .replace(/ {2,}/g, " ")
    .trim();
}

function cleanText(text: string): string {
  return stripContacts(normalizeText(text));
}

function absoluteUrl(href: string | undefined): string | null {
  if (!href) return null;
  return new URL(href.trim(), ORIGIN).toString();
}

/** „INKUBATOR WŁĄCZENIA SPOŁECZNEGO” → „Inkubator Włączenia Społecznego”. */
function titleCaseProject(name: string): string {
  return name
    .toLocaleLowerCase("pl")
    .split(" ")
    .map((word, index) =>
      index > 0 && /^(?:i|w|z|do|na|dla)$/.test(word)
        ? word
        : word.charAt(0).toLocaleUpperCase("pl") + word.slice(1),
    )
    .join(" ");
}

async function readCategorySlugs(): Promise<CategorySlug[]> {
  const $ = cheerio.load(await fetchPage("kategorie"));
  const slugs = new Set<string>();
  $(`a[href^="${LIBRARY_PATH}/dla-"]`).each((_, el) => {
    const slug = $(el).attr("href")!.slice(LIBRARY_PATH.length + 1).split(/[,/?#]/)[0];
    slugs.add(slug);
  });

  const unknown = [...slugs].filter((slug) => !(slug in TARGET_GROUPS));
  const missing = Object.keys(TARGET_GROUPS).filter((slug) => !slugs.has(slug));
  if (unknown.length || missing.length) {
    throw new Error(
      `Category list changed. Unknown: ${unknown.join(", ") || "-"}; missing: ${missing.join(", ") || "-"}`,
    );
  }
  return Object.keys(TARGET_GROUPS) as CategorySlug[];
}

async function readListing(category: CategorySlug): Promise<ListingEntry[]> {
  const $ = cheerio.load(await fetchPage(category));
  const entries: ListingEntry[] = [];
  $(".news-list .news-list__item").each((_, item) => {
    const href = $(item).find("a.news-list__title").attr("href");
    if (!href) throw new Error(`Item without a link on ${category}`);
    const slug = href.split(",").pop()!;
    // The listing nests <p> in `p.news-list__desc`, so the parser closes it empty and
    // the lead becomes a sibling: take the first paragraph that is not a link or banner.
    let lead = "";
    $(item)
      .find("p")
      .each((_, p) => {
        const node = $(p);
        if (node.find("a, table").length > 0) return;
        const text = cleanText(node.text());
        if (!text || DISSEMINATION_BANNER.test(text)) return;
        lead = text;
        return false;
      });
    entries.push({ slug, category, lead: lead || null, url: absoluteUrl(href)! });
  });
  if (entries.length === 0) throw new Error(`No items found on ${category}`);
  return entries;
}

function sectionFor(heading: string): SectionKey | null | undefined {
  const match = SECTION_HEADINGS.find(([pattern]) => pattern.test(heading));
  return match ? match[1] : undefined;
}

/** A short paragraph like „1. Na czym polega…” that stands in for a missing `<h4>`. */
function looksLikeHeading(text: string): boolean {
  return text.length < 80 && /^\d\.\s/.test(text) && sectionFor(text) !== undefined;
}

async function readDetail(entry: ListingEntry): Promise<Innovation | null> {
  const $ = cheerio.load(await fetchPage(`${entry.category},${entry.slug}`));
  const main = $(".content__main").first();
  const content = main.find(".text-content").first();
  const title = normalizeText(main.find("h2.page-title").first().text());
  if (!title || content.length === 0) throw new Error(`Unexpected page layout: ${entry.url}`);

  const linkFor = (icon: string) =>
    absoluteUrl(content.find(`a:has(img[src*="${icon}"])`).first().attr("href"));

  const isCcBy = content.find('img[src*="CC_BY"]').length > 0;
  const isMiis = content.find('img[src*="symbol-c-w-kolku"]').length > 0;
  if (!isCcBy && !isMiis) throw new Error(`No licence icon on ${entry.url}`);
  if (!isCcBy) return null;

  let source_project: string | null = null;
  content.find("strong").each((_, el) => {
    const text = normalizeText($(el).text());
    if (DISSEMINATION_BANNER.test(text)) {
      const quoted = text.match(/["„”“]([^"„”“]+)["„”“]/);
      source_project = quoted ? titleCaseProject(quoted[1].trim()) : null;
      return false;
    }
  });

  const sections: Record<SectionKey, string[]> = {
    solution: [],
    problem: [],
    audience: [],
    adopters: [],
    evidence: [],
  };
  // `undefined` = before the first heading (banner, icon table); `null` = authors.
  let current: SectionKey | null | undefined;
  content.find("h4, p, li").each((_, el) => {
    const node = $(el);
    if (el.tagName !== "h4" && node.parents("li").length > 0) return;
    const text = normalizeText(node.text());

    if (el.tagName === "h4" || looksLikeHeading(text)) {
      if (!text) return;
      const section = sectionFor(text);
      if (section === undefined) {
        console.warn(`  ${entry.slug}: unknown heading „${text}”, kept in the previous section`);
        if (current) sections[current].push(cleanText(text));
        return;
      }
      current = section;
      return;
    }

    if (!current || !text) return;
    const cleaned = cleanText(text);
    if (cleaned) sections[current].push(el.tagName === "li" ? `- ${cleaned}` : cleaned);
  });

  const joined = Object.fromEntries(
    SECTION_KEYS.map((key) => [key, sections[key].join("\n\n") || null]),
  ) as Record<SectionKey, string | null>;
  const missingSections = SECTION_KEYS.filter((key) => !joined[key]);
  if (missingSections.length) {
    console.warn(`  ${entry.slug}: no ${missingSections.join(", ")}`);
  }

  return {
    slug: entry.slug,
    title: TITLE_OVERRIDES[entry.slug] ?? title,
    lead: entry.lead,
    ...joined,
    target_group: TARGET_GROUPS[entry.category],
    stage: source_project ? "deployed" : "pilot",
    source_url: entry.url,
    video_url: linkFor("play_black.png"),
    folder_pdf_url: linkFor("lupa.png"),
    materials_url: linkFor("read2.png"),
    source_project,
  };
}

function validate(items: Innovation[]): void {
  const errors: string[] = [];
  if (items.length !== EXPECTED_ITEMS) {
    errors.push(`expected ${EXPECTED_ITEMS} items, got ${items.length}`);
  }

  const slugs = new Set<string>();
  const titles = new Set<string>();
  for (const item of items) {
    if (slugs.has(item.slug)) errors.push(`duplicate slug ${item.slug}`);
    slugs.add(item.slug);
    if (titles.has(item.title)) errors.push(`duplicate title „${item.title}”`);
    titles.add(item.title);
    if (!item.source_url) errors.push(`${item.slug}: no source_url`);
    if (!item.solution && !item.problem) errors.push(`${item.slug}: no description sections`);

    for (const [field, value] of Object.entries(item)) {
      if (typeof value !== "string" || field.endsWith("_url")) continue;
      if (value.match(EMAIL_PATTERN)) errors.push(`${item.slug}.${field}: e-mail left in text`);
      if (value.match(PHONE_PATTERN)) errors.push(`${item.slug}.${field}: phone left in text`);
    }
  }

  if (errors.length) {
    throw new Error(`Validation failed:\n- ${errors.join("\n- ")}`);
  }
}

async function main() {
  const categories = await readCategorySlugs();

  const listing: ListingEntry[] = [];
  for (const category of categories) listing.push(...(await readListing(category)));
  console.log(`Found ${listing.length} innovations in ${categories.length} categories.`);

  const items: Innovation[] = [];
  let skipped = 0;
  for (const entry of listing) {
    const item = await readDetail(entry);
    if (item) items.push(item);
    else skipped++;
  }
  console.log(`Kept ${items.length} CC BY 4.0 items, skipped ${skipped} MIIS items.`);

  items.sort((a, b) => a.slug.localeCompare(b.slug));
  validate(items);

  await writeFile(OUTPUT_FILE, `${JSON.stringify(items, null, 2)}\n`);
  console.log(`Wrote ${path.relative(ROOT, OUTPUT_FILE)}.`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? (error.cause ?? error.message) : error);
  process.exit(1);
});
