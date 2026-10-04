"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
import { getToolName, isToolUIPart, type UIMessage } from "ai";
import { AiHint } from "@/components/ai/ai-hint";
import { InnovationCard } from "@/components/innovation-card";
import { ReadAloudButton } from "@/components/read-aloud-button";
import { Button } from "@/components/ui/button";
import type { InnovationMatch } from "@/lib/ai/tools/search-innovations";
import type { ShowMatchesInput } from "@/lib/matchmaking/show-matches";
import type { MatchmakingContext } from "@/lib/matchmaking/skill";
import type { SavedSubmission } from "../actions";
import { ResultsExpert } from "./results-expert";
import { ResultsSimilar } from "./results-similar";
import { SaveResultsActions } from "./save-results-actions";

/** Simple mode („Prościej”) shows only the best matches. */
const SIMPLE_MODE_MATCHES = 3;

/** What a results card shows besides the model's reasons. */
export type MatchedInnovation = Pick<InnovationMatch, "slug" | "title" | "lead" | "categories" | "stage">;

/**
 * Card data for the slugs in `showMatches`, read from what `searchInnovations`
 * and `getInnovation` returned earlier in the conversation, so the results
 * screen needs no extra request.
 */
export function matchedInnovations(messages: UIMessage[]) {
  const bySlug = new Map<string, MatchedInnovation>();

  for (const message of messages) {
    for (const part of message.parts) {
      if (!isToolUIPart(part) || part.state !== "output-available") continue;
      const name = getToolName(part);
      if (name === "searchInnovations") {
        for (const match of (part.output as MatchedInnovation[] | null) ?? []) bySlug.set(match.slug, match);
      } else if (name === "getInnovation") {
        const details = part.output as MatchedInnovation | null;
        if (details) bySlug.set(details.slug, details);
      }
    }
  }

  return bySlug;
}

/**
 * MM5 + MM6: up to 5 innovations with grounded reasons, similar submissions
 * from other municipalities and the ways to act. In simple mode: 3 cards, each
 * with „Przeczytaj na głos”, and no similar submissions. A municipality
 * official also gets „Dostosuj do mojej gminy” (the broker) on every card.
 */
export function Results({
  conversationId,
  items,
  innovations,
  latest,
  focusOnMount,
  hasAccount,
  role,
  municipality,
  onSaved,
}: {
  conversationId: string;
  items: ShowMatchesInput["items"];
  innovations: Map<string, MatchedInnovation>;
  /** Only the newest results of a conversation offer the next steps. */
  latest: boolean;
  /** True when the results arrived in this visit, not with a reloaded conversation. */
  focusOnMount: boolean;
  hasAccount: boolean;
  role: MatchmakingContext["role"];
  /** Given on the entry screen; prefills the submission. */
  municipality?: string;
  onSaved: (saved: SavedSubmission) => void;
}) {
  const headingId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  // Decided once: results of an earlier turn must not take focus later.
  const [takesFocus] = useState(focusOnMount);

  useEffect(() => {
    if (takesFocus) headingRef.current?.focus();
  }, [takesFocus]);

  const cards = items.flatMap((item) => {
    const innovation = innovations.get(item.slug);
    return innovation ? [{ ...item, innovation }] : [];
  });
  if (cards.length === 0) return null;

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-6 simple:gap-8">
      <h2
        ref={headingRef}
        id={headingId}
        tabIndex={-1}
        // Focused by script for screen readers; it is not a control, so no ring.
        className="font-display text-h2 font-bold focus-visible:shadow-none simple:text-simple-h2"
      >
        Rozwiązania, które mogą pomóc
      </h2>

      <ol className="flex flex-col gap-4 simple:gap-6">
        {cards.map(({ slug, why, quote, innovation }, index) => (
          <li key={slug} className={index >= SIMPLE_MODE_MATCHES ? "simple:hidden" : undefined}>
            <InnovationCard
              slug={slug}
              title={innovation.title}
              lead={innovation.lead}
              categories={innovation.categories}
              stage={innovation.stage}
              why={
                <AiHint
                  framed={false}
                  targetType="match_reason"
                  targetId={`${conversationId}:${slug}`.slice(0, 200)}
                  className="mt-2"
                >
                  <p>{why}</p>
                  <blockquote className="mt-2 border-l-4 border-current/40 pl-3 italic">„{quote}”</blockquote>
                </AiHint>
              }
              actions={
                <>
                  {role === "municipality" && (
                    <Button asChild className="simple:hidden">
                      <Link href={`/broker?innovation=${encodeURIComponent(slug)}`}>
                        <SlidersHorizontal aria-hidden strokeWidth={2} />
                        Dostosuj do mojej gminy
                        <span className="sr-only">: {innovation.title}</span>
                      </Link>
                    </Button>
                  )}
                  <ReadAloudButton
                    text={[innovation.title, innovation.lead].filter(Boolean).join(". ")}
                    className="hidden w-full simple:inline-flex"
                  />
                </>
              }
            />
          </li>
        ))}
      </ol>

      {latest && (
        <>
          <ResultsSimilar conversationId={conversationId} municipality={municipality} />
          <ResultsExpert conversationId={conversationId} municipality={municipality} hasAccount={hasAccount} />
          <SaveResultsActions conversationId={conversationId} municipality={municipality} onSaved={onSaved} />
        </>
      )}
    </section>
  );
}
