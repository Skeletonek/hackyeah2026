import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Secret-key client: BYPASSES RLS. Only for system tasks (AI triage, sending
 * emails, seeding). Never use it to read data on behalf of a signed-in
 * person; use lib/supabase/server.ts for that.
 */
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
