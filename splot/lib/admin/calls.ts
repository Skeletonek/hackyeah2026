import "server-only";

import { redirect } from "next/navigation";
import type { CallStatus } from "@/lib/admin/call-fields";
import { pageCount, pageHref, pageRange, PAGE_SIZE, type Page } from "@/lib/pagination";
import { createClient } from "@/lib/supabase/server";

/** The grant call configurator (/admin/calls): the list and one call to edit. */

/** The list order: open calls first, then planned, then closed. */
const STATUS_ORDER = ["open", "planned", "closed"] as const satisfies readonly CallStatus[];

const LIST_COLUMNS = "id, title, opens_at, closes_at, category, sections, criteria";

export const callsHref = (page: number) => pageHref("/admin/calls", {}, page);

type Supabase = Awaited<ReturnType<typeof createClient>>;

/** Calls in one status at `now`, the same split as `callStatus`. */
function callsIn(supabase: Supabase, status: CallStatus, now: string, head = false) {
  // One select for both, so the builder keeps one type; `head` reads no rows.
  const query = supabase.from("grant_calls").select(LIST_COLUMNS, head ? { count: "exact", head } : {});
  if (status === "planned") return query.gt("opens_at", now);
  if (status === "closed") return query.lte("opens_at", now).lt("closes_at", now);
  return query.lte("opens_at", now).gte("closes_at", now);
}

/**
 * One page in the list order; the latest deadline first within each status.
 * The status depends on today's date, so the order cannot be a column: each
 * status is counted, and the page reads only the slices of each that fall on it.
 */
export async function listCallsAdmin(page: number) {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const counts = await Promise.all(STATUS_ORDER.map((status) => callsIn(supabase, status, now, true)));
  const failed = counts.find((result) => result.error);
  if (failed?.error) throw new Error(`admin calls count failed: ${failed.error.message}`);

  const sizes = counts.map((result) => result.count ?? 0);
  const total = sizes.reduce((sum, size) => sum + size, 0);
  const pages = pageCount(total);
  if (page > pages) redirect(callsHref(pages));

  const [from, to] = pageRange(page);
  let start = 0;
  const slices = STATUS_ORDER.flatMap((status, index) => {
    const segment = { status, from: Math.max(from, start) - start, to: Math.min(to, start + sizes[index] - 1) - start };
    start += sizes[index];
    return segment.from <= segment.to ? [segment] : [];
  });

  const results = await Promise.all(
    slices.map(async ({ status, from: sliceFrom, to: sliceTo }) => {
      const { data, error } = await callsIn(supabase, status, now)
        .order("closes_at", { ascending: false })
        .order("id")
        .range(sliceFrom, sliceTo);
      if (error) throw new Error(`admin calls list failed: ${error.message}`);
      return data.map((call) => ({ ...call, status }));
    }),
  );

  return { items: results.flat(), page, pageSize: PAGE_SIZE, total, pageCount: pages } satisfies Page<unknown>;
}

export type CallAdminRow = Awaited<ReturnType<typeof listCallsAdmin>>["items"][number];

export async function getCallForEdit(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("grant_calls")
    .select("id, title, description, opens_at, closes_at, category, sections, criteria")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`admin call ${id} failed: ${error.message}`);
  return data;
}

export type EditableCall = NonNullable<Awaited<ReturnType<typeof getCallForEdit>>>;
