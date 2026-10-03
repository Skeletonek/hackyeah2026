import "server-only";
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  isStepCount,
  isToolUIPart,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai";
import { z } from "zod";
import { ensureSession } from "@/lib/auth";
import type { Json } from "@/lib/supabase/database.types";
import { dismissPendingToolCalls } from "./client-tools";
import type { Skill } from "./skill";

const DEFAULT_MODEL = "anthropic/claude-sonnet-5.5";
const MAX_STEPS = 6;
/** Only the tail goes to the model; the full history stays in the database. */
const MODEL_WINDOW = 30;

/** What `useSkillChat` sends: the new message only, never the history. */
const requestSchema = z.object({
  id: z.uuid(),
  trigger: z.enum(["submit-message", "regenerate-message"]).default("submit-message"),
  message: z
    .object({
      id: z.string().min(1).max(100),
      role: z.literal("user"),
      parts: z
        .array(z.object({ type: z.literal("text"), text: z.string().min(1).max(8000) }))
        .min(1)
        .max(8),
      // `auto`: a hidden turn the page sends itself; ChatSurface does not render it.
      metadata: z.object({ auto: z.boolean().optional() }).optional(),
    })
    .optional(),
  /** Outputs of client tools (clicks) since the last request. */
  toolOutputs: z.array(z.object({ toolCallId: z.string().min(1).max(200), output: z.json() })).max(20).default([]),
  context: z.unknown().optional(),
});

function problem(status: number, error: string) {
  return Response.json({ error }, { status });
}

/** Fills in client tool outputs, but only for calls the stored history is still waiting on. */
function applyToolOutputs(
  message: UIMessage,
  outputs: z.infer<typeof requestSchema>["toolOutputs"],
): { message: UIMessage; applied: number } {
  let applied = 0;
  const parts = message.parts.map((part) => {
    if (!isToolUIPart(part) || part.state !== "input-available") return part;
    const match = outputs.find((output) => output.toolCallId === part.toolCallId);
    if (!match) return part;
    applied += 1;
    return { ...part, state: "output-available" as const, output: match.output };
  });
  return { message: { ...message, parts } as UIMessage, applied };
}

/** The last ~30 messages, starting at a user turn so no tool result is orphaned. */
function modelWindow(messages: UIMessage[]) {
  const tail = messages.slice(-MODEL_WINDOW);
  const firstUser = tail.findIndex((message) => message.role === "user");
  return firstUser > 0 ? tail.slice(firstUser) : tail;
}

/**
 * POST handler of a Skill route: `export const POST = createSkillHandler(skill)`.
 * The conversation is owned by the visitor's session (anonymous or not) and
 * every read, write and tool runs as that visitor under RLS.
 */
export function createSkillHandler<CONTEXT>(skill: Skill<CONTEXT>) {
  return async function POST(request: Request): Promise<Response> {
    const body = requestSchema.safeParse(await request.json().catch(() => null));
    if (!body.success) return problem(400, "invalid_request");
    const { id, trigger, message, toolOutputs } = body.data;

    let context = undefined as CONTEXT;
    if (skill.context) {
      const parsed = skill.context.safeParse(body.data.context);
      if (!parsed.success) return problem(400, "invalid_context");
      context = parsed.data;
    }

    // Before streaming: the session cookie cannot be set once the response starts.
    let supabase: Awaited<ReturnType<typeof ensureSession>>;
    try {
      supabase = await ensureSession();
    } catch (error) {
      console.error("skill session failed", skill.name, error);
      return problem(503, "session_failed");
    }

    const { data: existing, error: loadError } = await supabase
      .from("conversations")
      .select("skill, messages")
      .eq("id", id)
      .maybeSingle();
    if (loadError) return problem(500, "load_failed");
    if (existing && existing.skill !== skill.name) return problem(409, "wrong_skill");

    if (!existing) {
      if (!message) return problem(400, "empty_conversation");
      const { error } = await supabase.from("conversations").insert({ id, skill: skill.name });
      // The id belongs to someone else's conversation, hidden from us by RLS.
      if (error) return problem(error.code === "23505" ? 404 : 500, "create_failed");
    }

    let messages = (existing?.messages ?? []) as unknown as UIMessage[];

    if (trigger === "regenerate-message") {
      const lastUser = messages.findLastIndex((stored) => stored.role === "user");
      if (lastUser === -1) return problem(400, "nothing_to_regenerate");
      messages = messages.slice(0, lastUser + 1);
    } else {
      const last = messages.at(-1);
      let changed = false;
      if (last?.role === "assistant") {
        const answered = applyToolOutputs(last, toolOutputs);
        changed = answered.applied > 0;
        // The person typed instead of answering: close what is still open.
        messages = [...messages.slice(0, -1), message ? dismissPendingToolCalls(answered.message) : answered.message];
      }
      if (message) messages = [...messages, message];
      else if (!changed) return problem(400, "nothing_to_send");
    }

    const save = async (next: UIMessage[]) => {
      const { error } = await supabase
        .from("conversations")
        .update({ messages: next as unknown as Json })
        .eq("id", id);
      if (error) console.error("conversation save failed", skill.name, id, error.message);
      return !error;
    };
    // Saved before the model runs, so a failed stream can be retried from here.
    if (!(await save(messages))) return problem(500, "save_failed");

    const tools =
      typeof skill.tools === "function"
        ? skill.tools({ supabase, conversationId: id, messages, context })
        : skill.tools;

    const result = streamText({
      model: skill.model ?? DEFAULT_MODEL,
      instructions: typeof skill.system === "function" ? skill.system(context) : skill.system,
      messages: await convertToModelMessages(modelWindow(messages), {
        tools,
        ignoreIncompleteToolCalls: true,
      }),
      tools,
      stopWhen: isStepCount(MAX_STEPS),
      onError: ({ error }) => console.error("skill stream failed", skill.name, id, error),
    });
    // Finish and save even if the visitor closes the tab mid-answer.
    result.consumeStream();

    return createUIMessageStreamResponse({
      stream: toUIMessageStream({
        stream: result.stream,
        originalMessages: messages,
        generateMessageId: () => crypto.randomUUID(),
        onEnd: async ({ messages: finished }) => {
          await save(finished);
        },
        // Never leak provider errors; ChatSurface shows its own retry message.
        onError: () => "stream_failed",
      }),
    });
  };
}
