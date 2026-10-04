/**
 * Fills the database with the ROPS Innovation Library and demo activity:
 * data/rops-library.json → innovations (+ embeddings), data/demo.json →
 * demo accounts, pilots, reviews and triaged submissions.
 *
 * Run with `pnpm data:import`. Idempotent: innovations are upserted by slug,
 * submissions by case number, pilots by (innovation, account). Embeddings
 * are only computed for rows whose text changed or that have none yet.
 * Submission dates are relative to now, so re-running keeps them within the
 * last 12 weeks.
 *
 * Needs NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY and AI_GATEWAY_API_KEY
 * in .env.local. Scope: SPL-30. Pipeline: SPL-9. Triage columns: SPL-12.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { embedMany } from "ai";
import { EMBEDDING_MODEL, TEXT_MODEL } from "@/lib/ai/models";
import type { ChallengeCategory, TargetGroup } from "@/lib/innovations/classify";
import { innovationEmbeddingText } from "@/lib/innovations/embedding-text";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Enums, TablesInsert } from "@/lib/supabase/database.types";

const DATA_DIR = path.join(process.cwd(), "data");

/** The fictional innovations from the old seed.sql, replaced by the real library (SPL-18). */
const LEGACY_SEED_SLUGS = ["wiejski-bus-na-telefon", "sasiedzcy-kierowcy", "cyfrowy-wolontariusz"];

const EMBED_BATCH = 50;
const DAY_MS = 24 * 60 * 60 * 1000;

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
  stage: Enums<"innovation_stage">;
  source_url: string;
  video_url: string | null;
  folder_pdf_url: string | null;
  materials_url: string | null;
  source_project: string | null;
  categories: ChallengeCategory[];
  easy_read_description: string;
};

type Demo = {
  accounts: {
    key: string;
    email: string;
    display_name: string | null;
    organization: string | null;
    municipality: string | null;
  }[];
  pilot_slots: Record<string, number>;
  pilots: {
    innovation: string;
    account: string;
    organization_type: Enums<"organization_type">;
    municipality: string;
    plan: string;
    contact_email: string;
    status: Enums<"pilot_status">;
    review?: { rating: number; feedback: string; improvement: string; attribution: string };
  }[];
  submissions: {
    case_number: string;
    author: string;
    kind: Enums<"submission_kind">;
    body: string;
    municipality: string;
    county: string;
    category: ChallengeCategory;
    priority: Enums<"priority">;
    status: Enums<"submission_status">;
    weeks_ago: number;
    ai_summary: string;
    ai_suggested_slugs: string[];
    ai_needs_expert: boolean;
    duplicate_of?: string;
  }[];
};

const supabase = createAdminClient();

/** Throws on a Supabase error; otherwise returns the data (null for writes without select). */
function check<R extends { data: unknown; error: { message: string } | null }>(
  result: R,
  what: string,
): NonNullable<R["data"]> {
  if (result.error) throw new Error(`${what}: ${result.error.message}`);
  return result.data as NonNullable<R["data"]>;
}

async function readJson<T>(file: string): Promise<T> {
  return JSON.parse(await readFile(path.join(DATA_DIR, file), "utf8"));
}

/** Embeds texts in batches; returns them as pgvector literals. */
async function embedAll(texts: string[]): Promise<string[]> {
  const vectors: string[] = [];
  for (let i = 0; i < texts.length; i += EMBED_BATCH) {
    const { embeddings } = await embedMany({ model: EMBEDDING_MODEL, values: texts.slice(i, i + EMBED_BATCH) });
    vectors.push(...embeddings.map((embedding) => JSON.stringify(embedding)));
  }
  return vectors;
}

function validate(library: LibraryItem[], demo: Demo) {
  const slugs = new Set(library.map((item) => item.slug));
  const accounts = new Set(demo.accounts.map((account) => account.key));
  const cases = new Set(demo.submissions.map((submission) => submission.case_number));
  const problems: string[] = [];

  for (const item of library) {
    if (!item.categories?.length || !item.easy_read_description) {
      problems.push(`${item.slug} is not enriched (run pnpm data:enrich)`);
    }
  }
  for (const slug of Object.keys(demo.pilot_slots)) {
    if (!slugs.has(slug)) problems.push(`pilot_slots: unknown slug ${slug}`);
  }
  for (const pilot of demo.pilots) {
    if (!slugs.has(pilot.innovation)) problems.push(`pilot: unknown slug ${pilot.innovation}`);
    if (!accounts.has(pilot.account)) problems.push(`pilot: unknown account ${pilot.account}`);
  }
  for (const submission of demo.submissions) {
    if (!accounts.has(submission.author)) problems.push(`${submission.case_number}: unknown author`);
    for (const slug of submission.ai_suggested_slugs) {
      if (!slugs.has(slug)) problems.push(`${submission.case_number}: unknown slug ${slug}`);
    }
    if (submission.duplicate_of && !cases.has(submission.duplicate_of)) {
      problems.push(`${submission.case_number}: unknown duplicate ${submission.duplicate_of}`);
    }
  }
  if (problems.length > 0) throw new Error(`Invalid data:\n${problems.join("\n")}`);
}

async function importInnovations(library: LibraryItem[]) {
  check(await supabase.from("innovations").delete().in("slug", LEGACY_SEED_SLUGS), "delete legacy seed");

  // Rows that already have an embedding, with the text it was computed from.
  const embedded = check(
    await supabase
      .from("innovations")
      .select("slug, title, lead, solution, problem, audience")
      .not("embedding", "is", null),
    "read innovations",
  );
  const embeddedText = new Map(embedded.map((row) => [row.slug, innovationEmbeddingText(row)]));

  const rows: TablesInsert<"innovations">[] = library.map((item) => ({
    slug: item.slug,
    title: item.title,
    lead: item.lead,
    solution: item.solution,
    problem: item.problem,
    audience: item.audience,
    adopters: item.adopters,
    evidence: item.evidence,
    target_groups: [item.target_group],
    stage: item.stage,
    categories: item.categories,
    easy_read_description: item.easy_read_description,
    source_url: item.source_url,
    video_url: item.video_url,
    folder_pdf_url: item.folder_pdf_url,
    materials_url: item.materials_url,
    source_project: item.source_project,
    published: true,
  }));

  const stale = library.filter((item) => embeddedText.get(item.slug) !== innovationEmbeddingText(item));
  const staleSlugs = new Set(stale.map((item) => item.slug));
  const vectors = await embedAll(stale.map(innovationEmbeddingText));
  const embeddings = new Map(stale.map((item, i) => [item.slug, vectors[i]]));

  // Two upserts: a missing key in a mixed batch would null out existing embeddings.
  const fresh = rows.filter((row) => !staleSlugs.has(row.slug));
  const changed = rows
    .filter((row) => staleSlugs.has(row.slug))
    .map((row) => ({ ...row, embedding: embeddings.get(row.slug) }));
  for (const batch of [fresh, changed]) {
    if (batch.length > 0) {
      check(await supabase.from("innovations").upsert(batch, { onConflict: "slug" }), "upsert innovations");
    }
  }
  console.log(`Innovations: ${rows.length} upserted, ${stale.length} embedded.`);

  const ids = check(await supabase.from("innovations").select("id, slug"), "read innovation ids");
  return new Map(ids.map((row) => [row.slug, row.id]));
}

async function ensureAccounts(demo: Demo) {
  const existing = new Map<string, string>();
  for (let page = 1; ; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(`list users: ${error.message}`);
    for (const user of data.users) if (user.email) existing.set(user.email, user.id);
    if (data.users.length < 1000) break;
  }

  const ids = new Map<string, string>();
  let created = 0;
  for (const account of demo.accounts) {
    let id = existing.get(account.email);
    if (!id) {
      const { data, error } = await supabase.auth.admin.createUser({
        email: account.email,
        email_confirm: true,
        user_metadata: { demo: true },
      });
      if (error) throw new Error(`create ${account.email}: ${error.message}`);
      id = data.user.id;
      created++;
    }
    check(
      await supabase
        .from("profiles")
        .update({
          display_name: account.display_name,
          organization: account.organization,
          municipality: account.municipality,
        })
        .eq("id", id),
      `profile ${account.key}`,
    );
    ids.set(account.key, id);
  }
  console.log(`Demo accounts: ${ids.size} (${created} new).`);
  return ids;
}

async function importPilots(demo: Demo, innovationIds: Map<string, string>, accountIds: Map<string, string>) {
  for (const [slug, slots] of Object.entries(demo.pilot_slots)) {
    check(await supabase.from("innovations").update({ pilot_slots: slots }).eq("slug", slug), `pilot_slots ${slug}`);
  }

  let reviews = 0;
  for (const pilot of demo.pilots) {
    const row = check(
      await supabase
        .from("pilots")
        .upsert(
          {
            innovation_id: innovationIds.get(pilot.innovation)!,
            user_id: accountIds.get(pilot.account)!,
            organization_type: pilot.organization_type,
            municipality: pilot.municipality,
            plan: pilot.plan,
            contact_email: pilot.contact_email,
            status: pilot.status,
          },
          { onConflict: "innovation_id,user_id" },
        )
        .select("id")
        .single(),
      `pilot ${pilot.innovation}/${pilot.account}`,
    );
    if (pilot.review) {
      check(
        await supabase
          .from("pilot_reviews")
          .upsert({ pilot_id: row.id, ...pilot.review, is_public: true, approved: true }, { onConflict: "pilot_id" }),
        `review ${pilot.innovation}/${pilot.account}`,
      );
      reviews++;
    }
  }
  console.log(`Pilots: ${demo.pilots.length}, approved reviews: ${reviews}.`);
}

async function importSubmissions(demo: Demo, accountIds: Map<string, string>) {
  const cases = demo.submissions.map((submission) => submission.case_number);
  const embedded = check(
    await supabase.from("submissions").select("case_number, body").in("case_number", cases).not("embedding", "is", null),
    "read submissions",
  );
  const embeddedBody = new Map(embedded.map((row) => [row.case_number, row.body]));
  const stale = demo.submissions.filter((submission) => embeddedBody.get(submission.case_number) !== submission.body);
  const vectors = await embedAll(stale.map((submission) => submission.body));
  const embeddings = new Map(stale.map((submission, i) => [submission.case_number, vectors[i]]));

  const now = Date.now();
  const rows = demo.submissions.map((submission, i) => {
    // Spread within the week by index, so the timeline is not one spike per week.
    const createdAt = new Date(now - submission.weeks_ago * 7 * DAY_MS - (i % 5) * DAY_MS - 3 * 60 * 60 * 1000);
    const row: TablesInsert<"submissions"> = {
      case_number: submission.case_number,
      author_id: accountIds.get(submission.author)!,
      kind: submission.kind,
      body: submission.body,
      municipality: submission.municipality,
      county: submission.county,
      category: submission.category,
      priority: submission.priority,
      status: submission.status,
      created_at: createdAt.toISOString(),
      ai_summary: submission.ai_summary,
      ai_suggested_slugs: submission.ai_suggested_slugs,
      ai_needs_expert: submission.ai_needs_expert,
      ai_model: TEXT_MODEL,
      ai_triaged_at: new Date(createdAt.getTime() + 2 * 60 * 1000).toISOString(),
    };
    const embedding = embeddings.get(submission.case_number);
    return embedding ? { ...row, embedding } : row;
  });

  // Same split as innovations: keep existing embeddings out of mixed batches.
  for (const batch of [rows.filter((row) => !row.embedding), rows.filter((row) => row.embedding)]) {
    if (batch.length > 0) {
      check(await supabase.from("submissions").upsert(batch, { onConflict: "case_number" }), "upsert submissions");
    }
  }

  const ids = check(
    await supabase.from("submissions").select("id, case_number").in("case_number", cases),
    "read submission ids",
  );
  const idByCase = new Map(ids.map((row) => [row.case_number, row.id]));
  for (const submission of demo.submissions) {
    if (!submission.duplicate_of) continue;
    check(
      await supabase
        .from("submissions")
        .update({ possible_duplicate_id: idByCase.get(submission.duplicate_of)! })
        .eq("case_number", submission.case_number),
      `duplicate ${submission.case_number}`,
    );
  }
  console.log(`Submissions: ${rows.length} upserted and triaged, ${stale.length} embedded.`);
}

async function main() {
  const library = await readJson<LibraryItem[]>("rops-library.json");
  const demo = await readJson<Demo>("demo.json");
  validate(library, demo);

  const innovationIds = await importInnovations(library);
  const accountIds = await ensureAccounts(demo);
  await importPilots(demo, innovationIds, accountIds);
  await importSubmissions(demo, accountIds);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
