import assert from "node:assert/strict";
import test from "node:test";
import type { UIMessage } from "ai";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { hasEnteredIdeaStep, stepEntryText } from "./assistant-history";
import { linkIdeaConversation } from "./conversation";
import { ideaAssistantContext, ideaAssistantSystem } from "./skill";

test("the model sees unsaved card values and selected target groups", () => {
  const card = {
    title: "Sąsiedzki ogród",
    solution: "Niezapisany opis: wspólna uprawa warzyw.",
    problem: "Samotność mieszkańców",
    target_groups: ["seniors"],
    location: "Limanowa",
    assets: ["place"],
  };
  const context = ideaAssistantContext.parse({ step: 2, card });
  assert.deepEqual(context.card.target_groups, card.target_groups);
  const prompt = ideaAssistantSystem(context);
  for (const value of [card.title, card.solution, card.problem, card.location, "seniors", "place"]) {
    assert.ok(prompt.includes(value), `Missing card value: ${value}`);
  }
});

test("each step is independent, and restored hidden turns prevent revisits", () => {
  const messages: UIMessage[] = [{ id: "typed", role: "user", parts: [{ type: "text", text: stepEntryText(2) }] }];
  for (const step of [1, 2, 3, 4] as const) {
    assert.equal(hasEnteredIdeaStep(messages, step), false);
    messages.push({
      id: `auto-${step}`,
      role: "user",
      metadata: { auto: true },
      parts: [{ type: "text", text: stepEntryText(step) }],
    });
    assert.equal(hasEnteredIdeaStep(messages, step), true);
  }
  const restored: UIMessage[] = JSON.parse(JSON.stringify(messages));
  for (const step of [1, 2, 3, 4] as const) assert.equal(hasEnteredIdeaStep(restored, step), true);
});

/** Database double enforces the FK and ownership filters without external services. */
function database({ owner = "author", skill = "idea-assistant", failCreate = false, existing = false } = {}) {
  let conversation: { id: string; user_id: string; skill: string; messages: string[] } | null =
    existing ? { id: "chat", user_id: owner, skill, messages: ["saved history"] } : null;
  let linked: string | null = null;
  const client = {
    from(table: string) {
      const filters = new Map<string, string>();
      let update: { conversation_id: string } | null = null;
      const query = {
        select() { return query; },
        eq(field: string, value: string) { filters.set(field, value); return query; },
        update(value: { conversation_id: string }) { update = value; return query; },
        async upsert(value: { id: string; skill: string }, options: { ignoreDuplicates: boolean }) {
          if (failCreate) return { error: { message: "unavailable" } };
          assert.equal(options.ignoreDuplicates, true);
          conversation ??= { ...value, user_id: "author", messages: [] };
          return { error: null };
        },
        async maybeSingle() {
          if (table === "conversations") {
            const matches = conversation && [...filters].every(([field, value]) => conversation![field as "id" | "user_id" | "skill"] === value);
            return { data: matches ? { id: conversation!.id } : null, error: null };
          }
          assert.equal(table, "ideas");
          assert.ok(conversation, "FK: conversation must exist before linking");
          assert.equal(update?.conversation_id, conversation.id);
          assert.equal(filters.get("user_id"), "author");
          linked = update!.conversation_id;
          return { data: { id: "idea" }, error: null };
        },
      };
      return query;
    },
  } as unknown as SupabaseClient<Database>;
  return { client, linked: () => linked, conversation: () => conversation };
}

test("conversation exists before linking and repeated linking preserves history", async () => {
  const fresh = database();
  await linkIdeaConversation(fresh.client, "author", "idea", "chat");
  assert.equal(fresh.linked(), "chat");
  const resumed = database({ existing: true });
  await linkIdeaConversation(resumed.client, "author", "idea", "chat");
  await linkIdeaConversation(resumed.client, "author", "idea", "chat");
  assert.deepEqual(resumed.conversation()?.messages, ["saved history"]);
});

test("failed creation, foreign conversations and other skills cannot be linked", async () => {
  for (const options of [
    { failCreate: true },
    { existing: true, owner: "someone-else" },
    { existing: true, skill: "matchmaking" },
  ]) {
    const db = database(options);
    await assert.rejects(linkIdeaConversation(db.client, "author", "idea", "chat"));
    assert.equal(db.linked(), null);
  }
});
