"use server";

import { z } from "zod";
import { searchBrokerInnovations, type BrokerInnovationResults } from "@/lib/broker/innovations";

/** The innovation picker's search: published titles only, so no sign-in needed. */
export async function findBrokerInnovations(query: string): Promise<BrokerInnovationResults> {
  const parsed = z.string().max(200).safeParse(query);
  return searchBrokerInnovations(parsed.success ? parsed.data : "");
}
