"use server";

import { revalidatePath, updateTag } from "next/cache";
import { requireRole } from "@/lib/auth";
import { TRENDS_SUMMARY_TAG } from "@/lib/admin/trends";

/** „Odśwież podsumowanie”: drops the cached AI summary; the page writes a new one. */
export async function refreshSummary(): Promise<undefined> {
  await requireRole(["admin"], "/admin/trends");

  updateTag(TRENDS_SUMMARY_TAG);
  revalidatePath("/admin/trends");
}
