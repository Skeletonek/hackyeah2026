/**
 * AI enrichment of data/rops-library.json: adds `categories` (1–3 challenge
 * categories) and `easy_read_description` to every item, for review by hand
 * before `pnpm data:import`.
 *
 * Run with `pnpm data:enrich`. Items that already have both fields are
 * skipped; `--force` redoes all of them. Needs AI_GATEWAY_API_KEY in
 * .env.local. The file is saved after every item, so an interrupted run can
 * be resumed.
 *
 * Scope: SPL-27. Category fallback per target group: SPL-6.
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { classifyChallenges, type ChallengeCategory, type TargetGroup } from "@/lib/innovations/classify";
import { countWords, easyReadSummary } from "@/lib/innovations/easy-read";

const DATA_FILE = path.join(process.cwd(), "data", "rops-library.json");
const CONCURRENCY = 4;

type LibraryItem = {
  slug: string;
  title: string;
  lead: string | null;
  solution: string | null;
  problem: string | null;
  audience: string | null;
  adopters: string | null;
  evidence: string | null;
  target_group: TargetGroup;
  categories?: ChallengeCategory[];
  easy_read_description?: string;
  [key: string]: unknown;
};

async function enrich(item: LibraryItem, force: boolean): Promise<LibraryItem> {
  const [categories, easyRead] = await Promise.all([
    force || !item.categories?.length
      ? classifyChallenges({ ...item, target_groups: [item.target_group] })
      : item.categories,
    force || !item.easy_read_description ? easyReadSummary(item) : item.easy_read_description,
  ]);
  return { ...item, categories, easy_read_description: easyRead };
}

async function main() {
  const force = process.argv.includes("--force");
  const items: LibraryItem[] = JSON.parse(await readFile(DATA_FILE, "utf8"));
  const todo = items.filter(
    (item) => force || !item.categories?.length || !item.easy_read_description,
  );
  console.log(`${todo.length} of ${items.length} items to enrich.`);

  let saving = Promise.resolve();
  const save = () => {
    saving = saving.then(() => writeFile(DATA_FILE, `${JSON.stringify(items, null, 2)}\n`));
    return saving;
  };

  let done = 0;
  const failed: string[] = [];
  const queue = [...todo];
  const worker = async () => {
    for (let item = queue.shift(); item; item = queue.shift()) {
      try {
        const enriched = await enrich(item, force);
        items[items.indexOf(item)] = enriched;
        await save();
        done++;
        console.log(
          `[${done}/${todo.length}] ${item.slug}: ${enriched.categories?.join(", ")}; ` +
            `${countWords(enriched.easy_read_description ?? "")} words`,
        );
      } catch (error) {
        failed.push(item.slug);
        console.error(`${item.slug} failed:`, error instanceof Error ? error.message : error);
      }
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  console.log(`Enriched ${done} items in ${path.relative(process.cwd(), DATA_FILE)}.`);
  if (failed.length > 0) {
    console.error(`${failed.length} failed (re-run to retry): ${failed.join(", ")}`);
    process.exit(1);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? (error.cause ?? error.message) : error);
  process.exit(1);
});
