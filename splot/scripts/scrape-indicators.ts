/**
 * County indicators from the ROPS „Internetowy Obserwator Statystyk
 * Społecznych” → data/county-indicators.json, the regional layer next to the
 * national „Mapa Wyzwań Społecznych” (data/challenge-map.json).
 *
 * Run with `pnpm data:indicators`. Raw HTML is cached in
 * data/.cache/obserwator/, so re-runs do not hit the site. Delete the cache to
 * fetch fresh pages.
 *
 * Each county gets, per Mapa area and per challenge category, a score from 0
 * (best in the region) to 1 (worst): the average share of the other 21
 * counties that it does worse than, over the group's indicators. Indicators
 * published as counts are divided by population first.
 *
 * Scope: SPL-21 (part 2).
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import * as cheerio from "cheerio";
import type { Enums } from "@/lib/supabase/database.types";

const ORIGIN = "https://obserwator.rops.krakow.pl";
const USER_AGENT = "SplotBot/0.1 (HackYeah 2026; one-off import of county indicators)";
const REQUEST_DELAY_MS = 1000;

const ROOT = process.cwd();
const CACHE_DIR = path.join(ROOT, "data", ".cache", "obserwator");
const OUTPUT_FILE = path.join(ROOT, "data", "county-indicators.json");

const EXPECTED_COUNTIES = 22;
const POPULATION_ID = 186;

type ChallengeCategory = Enums<"challenge_category">;
/** Keys of data/challenge-map.json areas. */
type AreaKey =
  | "family_foster_care"
  | "homelessness"
  | "disability"
  | "poverty"
  | "foreigners"
  | "health"
  | "mental_health"
  | "seniors";

type IndicatorConfig = {
  id: number;
  key: string;
  unit: string;
  direction: "higher_worse" | "lower_worse";
  area: AreaKey | null;
  category: ChallengeCategory | null;
  /** Divide by population and multiply by this, for indicators published as counts. */
  per_population?: number;
  note?: string;
};

/**
 * Only indicators with county-level data: ids 136, 143 and 174 from the
 * original plan redirect to the trend view (no county breakdown). There is no
 * county data for foreigners, digital exclusion or coordination.
 */
const INDICATORS: IndicatorConfig[] = [
  { id: 285, key: "share_65_plus", unit: "% ludności", direction: "higher_worse", area: "seniors", category: "aging" },
  { id: 268, key: "care_potential", unit: "kobiet 45–64 lata na 100 osób 80+", direction: "lower_worse", area: "seniors", category: "aging" },
  {
    id: 274,
    key: "oldest_old_support",
    unit: "osób 85+ na 100 osób 50–64 lata",
    direction: "higher_worse",
    area: "seniors",
    category: "loneliness",
    note: "Przybliżenie: więcej najstarszych osób na potencjalnych opiekunów.",
  },
  { id: 91, key: "natural_increase", unit: "na 1000 ludności", direction: "lower_worse", area: null, category: "depopulation" },
  { id: 98, key: "net_migration", unit: "na 1000 ludności", direction: "lower_worse", area: null, category: "depopulation", per_population: 1000 },
  {
    id: 123,
    key: "external_cause_deaths",
    unit: "% zgonów ogółem",
    direction: "higher_worse",
    area: "mental_health",
    category: "mental_health",
    note: "Przybliżenie: obejmuje m.in. samobójstwa.",
  },
  { id: 242, key: "care_homes", unit: "placówek na 100 tys. ludności", direction: "lower_worse", area: null, category: "service_access", per_population: 100_000 },
  { id: 97, key: "welfare_spending", unit: "zł na mieszkańca", direction: "lower_worse", area: null, category: "service_access" },
  { id: 31, key: "poverty_clients", unit: "% klientów pomocy społecznej", direction: "higher_worse", area: "poverty", category: null },
  { id: 175, key: "meal_support", unit: "osób na 1000 mieszkańców", direction: "higher_worse", area: "poverty", category: null },
  { id: 25, key: "unemployment", unit: "%", direction: "higher_worse", area: "poverty", category: null },
  { id: 34, key: "homelessness_clients", unit: "% klientów pomocy społecznej", direction: "higher_worse", area: "homelessness", category: null },
  { id: 215, key: "disability_share", unit: "% ludności", direction: "higher_worse", area: "disability", category: null },
  { id: 37, key: "disability_clients", unit: "% klientów pomocy społecznej", direction: "higher_worse", area: "disability", category: null },
  { id: 259, key: "foster_care_intensity", unit: "dzieci w pieczy na 1000 dzieci", direction: "higher_worse", area: "family_foster_care", category: null },
  { id: 129, key: "deaths", unit: "na 1000 mieszkańców", direction: "higher_worse", area: "health", category: null },
  { id: 90, key: "circulatory_disease", unit: "na 1000 osób 19+", direction: "higher_worse", area: "health", category: null },
];

type Page = { label: string; source: string; description: string; year: number; values: Map<string, number> };

let lastFetchAt = 0;

async function fetchPage(id: number): Promise<string> {
  const cacheFile = path.join(CACHE_DIR, `${id}.html`);
  try {
    return await readFile(cacheFile, "utf8");
  } catch {
    // Not cached yet.
  }

  const wait = lastFetchAt + REQUEST_DELAY_MS - Date.now();
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
  lastFetchAt = Date.now();

  const url = sourceUrl(id);
  console.log(`GET ${url}`);
  const response = await fetch(url, { headers: { "User-Agent": USER_AGENT }, redirect: "manual" });
  if (response.status !== 200) throw new Error(`${url} returned ${response.status} (no county breakdown?)`);
  const html = await response.text();

  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(cacheFile, html);
  return html;
}

function sourceUrl(id: number) {
  return `${ORIGIN}/differenceanalysis/${id}`;
}

function parsePage(id: number, html: string): Page {
  const $ = cheerio.load(html);
  const content = $(".analysisContent");
  const after = (heading: string) =>
    content.find("h2, h3").filter((_, el) => $(el).text().trim() === heading).first().next("p").text().trim();

  const table = $(".analysisTable table").first();
  const yearMatch = table.find("thead th").last().text().match(/\d{4}/);
  if (!yearMatch) throw new Error(`${id}: no year in the table header`);

  const values = new Map<string, number>();
  table.children("tbody").children("tr").each((_, row) => {
    const cells = $(row).children("td");
    const name = cells.eq(0).text().trim();
    const raw = cells.eq(1).text().trim().replace("%", "").replace(/\s/g, "").replace(",", ".");
    if (name.startsWith("powiat") && raw !== "") values.set(name, Number(raw));
  });

  return {
    label: after("Nazwa wskaźnika"),
    source: after("Źródło").replace(/\.$/, ""),
    description: after("Opis"),
    year: Number(yearMatch[0]),
    values,
  };
}

/** „powiat nowosądecki” → nowosadecki, „powiat m. Nowy Sącz” → nowy-sacz. */
function countyCode(name: string) {
  return name
    .replace(/^powiat (m\. )?/, "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ł/g, "l")
    .toLowerCase()
    .replace(/\s+/g, "-");
}

/** Share of the other counties this value is worse than: 0 = best, 1 = worst. */
function worseShare(value: number, all: number[], direction: IndicatorConfig["direction"]) {
  const others = all.length - 1;
  const better = all.filter((other) => (direction === "higher_worse" ? other < value : other > value)).length;
  return others > 0 ? better / others : 0;
}

function round(value: number, digits = 2) {
  return Math.round(value * 10 ** digits) / 10 ** digits;
}

function topKeys(scores: Record<string, number>, count: number) {
  return Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, count)
    .map(([key]) => key);
}

async function main() {
  const population = parsePage(POPULATION_ID, await fetchPage(POPULATION_ID));
  const pages = new Map<number, Page>();
  for (const indicator of INDICATORS) pages.set(indicator.id, parsePage(indicator.id, await fetchPage(indicator.id)));

  const names = [...population.values.keys()].sort((a, b) => a.localeCompare(b, "pl"));
  if (names.length !== EXPECTED_COUNTIES) throw new Error(`Expected ${EXPECTED_COUNTIES} counties, got ${names.length}`);

  const values = new Map<string, Record<string, number>>(names.map((name) => [name, {}]));
  for (const indicator of INDICATORS) {
    const page = pages.get(indicator.id)!;
    for (const name of names) {
      const raw = page.values.get(name);
      if (raw === undefined || Number.isNaN(raw)) throw new Error(`${indicator.key}: no value for ${name}`);
      const value = indicator.per_population ? (raw / population.values.get(name)!) * indicator.per_population : raw;
      values.get(name)![indicator.key] = round(value);
    }
  }

  const counties = names.map((name) => {
    const own = values.get(name)!;
    const share = (indicator: IndicatorConfig) =>
      worseShare(own[indicator.key], names.map((other) => values.get(other)![indicator.key]), indicator.direction);
    const groupScores = (group: "area" | "category") => {
      const scores: Record<string, number> = {};
      const keys = new Set(INDICATORS.map((indicator) => indicator[group]).filter((key) => key !== null));
      for (const key of keys) {
        const members = INDICATORS.filter((indicator) => indicator[group] === key);
        scores[key!] = round(members.reduce((sum, indicator) => sum + share(indicator), 0) / members.length);
      }
      return scores;
    };
    const areaScores = groupScores("area");
    const categoryScores = groupScores("category");
    return {
      code: countyCode(name),
      name,
      population: population.values.get(name)!,
      values: own,
      area_scores: areaScores,
      category_scores: categoryScores,
      top_areas: topKeys(areaScores, 3),
      top_challenges: topKeys(categoryScores, 3),
    };
  });

  const output = {
    source: {
      title: "Internetowy Obserwator Statystyk Społecznych (ROPS Kraków)",
      url: ORIGIN,
      note: "Dane dla 22 powiatów województwa małopolskiego, ostatni dostępny rok każdego wskaźnika. Brak danych powiatowych dla obszarów: integracja cudzoziemców, wykluczenie cyfrowe, koordynacja usług.",
      fetched_at: new Date().toISOString().slice(0, 10),
    },
    method:
      "Wynik obszaru (0–1) to średnia z jego wskaźników: jaką część pozostałych 21 powiatów dany powiat wyprzedza w złą stronę. 1 = najtrudniejsza sytuacja w regionie. Wskaźniki podawane w liczbach bezwzględnych przeliczono na liczbę mieszkańców.",
    indicators: INDICATORS.map((indicator) => {
      const page = pages.get(indicator.id)!;
      return {
        key: indicator.key,
        id: indicator.id,
        label: page.label,
        description: page.description,
        source: page.source,
        source_url: sourceUrl(indicator.id),
        year: page.year,
        unit: indicator.unit,
        direction: indicator.direction,
        area: indicator.area,
        category: indicator.category,
        ...(indicator.per_population ? { derived: `wartość / ludność × ${indicator.per_population}` } : {}),
        ...(indicator.note ? { note: indicator.note } : {}),
      };
    }),
    counties,
  };

  await writeFile(OUTPUT_FILE, `${JSON.stringify(output, null, 2)}\n`);
  console.log(`Wrote ${path.relative(ROOT, OUTPUT_FILE)}: ${INDICATORS.length} indicators, ${counties.length} counties.`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
