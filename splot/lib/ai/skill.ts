import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { LanguageModel, ToolSet, UIMessage } from "ai";
import type { z } from "zod";
import type { Database } from "@/lib/supabase/database.types";

/** What a Skill's tools may use. The client is the visitor's own (RLS), never the secret key. */
export type SkillToolDeps<CONTEXT = undefined> = {
  supabase: SupabaseClient<Database>;
  conversationId: string;
  /** The stored history including the incoming message, e.g. to offer a tool only once. */
  messages: UIMessage[];
  /** Validated `context` of this request (e.g. the live form state). */
  context: CONTEXT;
};

export type Skill<CONTEXT = undefined> = {
  /** Route segment in `/api/agent/<name>` and the value of `conversations.skill`. */
  name: string;
  system: string | ((context: CONTEXT) => string);
  tools: ToolSet | ((deps: SkillToolDeps<CONTEXT>) => ToolSet);
  /** Schema of the `context` the page sends with every message. */
  context?: z.ZodType<CONTEXT>;
  /** Defaults to Claude Sonnet via AI Gateway. */
  model?: LanguageModel;
};

/**
 * One conversational mode of the Splot agent. A stream writes
 * `lib/<module>/skill.ts` and a one-line route:
 * `export const POST = createSkillHandler(skill)`.
 */
export function defineSkill<CONTEXT = undefined>(skill: Skill<CONTEXT>): Skill<CONTEXT> {
  return skill;
}
