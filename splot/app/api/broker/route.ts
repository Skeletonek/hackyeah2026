import { streamObject } from "ai";
import { TEXT_MODEL } from "@/lib/ai/models";
import { getInnovation } from "@/lib/ai/tools/get-innovation";
import { buildBrokerPrompt } from "@/lib/broker/prompt";
import { brokerRequestSchema, serviceCardSchema } from "@/lib/broker/schema";
import { createClient } from "@/lib/supabase/server";
import libraryFallback from "@/data/rops-library.json";

type FallbackItem = {
  slug: string;
  title: string;
  lead?: string | null;
  solution?: string | null;
  problem?: string | null;
  audience?: string | null;
  adopters?: string | null;
  evidence?: string | null;
  stage?: string;
};

/**
 * One published innovation for the prompt: the same `getInnovation(slug)` the
 * agent tools use, with the committed library JSON as the demo fallback (the
 * import pipeline lands after this ticket).
 */
async function loadInnovation(slug: string) {
  try {
    const supabase = await createClient();
    const innovation = await getInnovation(supabase, { slug });
    if (innovation) return innovation;
  } catch (error) {
    // Expected until the Data contract migration is pushed; the JSON below answers instead.
    console.warn("broker innovation lookup failed", slug, error);
  }

  return (libraryFallback as FallbackItem[]).find((item) => item.slug === slug) ?? null;
}

/**
 * One-shot broker: form → service card. No Skill, no conversation row,
 * no writes. Anonymous allowed.
 *
 * TODO: rate-limit per IP before launch; every anonymous call is a paid model call.
 */
export async function POST(request: Request) {
  // On Vercel the gateway authenticates through OIDC; locally it needs the key.
  if (!process.env.AI_GATEWAY_API_KEY && !process.env.VERCEL) {
    return Response.json(
      { error: "Usługa jest chwilowo niedostępna. Spróbuj ponownie." },
      { status: 503 },
    );
  }

  const parsed = brokerRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Uzupełnij formularz." }, { status: 400 });
  }

  const innovation = await loadInnovation(parsed.data.slug);
  if (!innovation) {
    return Response.json({ error: "Wybierz innowację z listy." }, { status: 404 });
  }

  const { system, prompt } = buildBrokerPrompt(innovation, parsed.data.context);

  // streamObject does not throw here: model errors arrive through onError and end the stream.
  const result = streamObject({
    model: TEXT_MODEL,
    schema: serviceCardSchema,
    system,
    prompt,
    onError: ({ error }) => console.error("broker stream failed", parsed.data.slug, error),
  });
  return result.toTextStreamResponse();
}
