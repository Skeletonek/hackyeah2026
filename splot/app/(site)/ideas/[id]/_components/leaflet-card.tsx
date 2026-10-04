"use client";

import { useState } from "react";
import { CalendarDays, Check, MapPin, RotateCcw, Users } from "lucide-react";
import { AiHint } from "@/components/ai/ai-hint";
import { Button } from "@/components/ui/button";
import type { ShowLeafletInput, ShowLeafletOutput } from "@/lib/ideas/assistant-tools";

/**
 * „Tak może wyglądać ulotka”: the idea as an HTML card, never an image.
 * „Zostaw” keeps it, „Spróbuj inaczej” asks the assistant for a new version
 * (the turn continues on its own).
 */
export function LeafletCard({
  input,
  conversationId,
  onAnswer,
}: {
  input: ShowLeafletInput;
  conversationId: string;
  onAnswer: (output: ShowLeafletOutput) => void;
}) {
  const [decision, setDecision] = useState<ShowLeafletOutput["decision"] | null>(null);

  const answer = (next: ShowLeafletOutput["decision"]) => {
    setDecision(next);
    onAnswer({ decision: next });
  };

  const facts = [
    input.when && { icon: CalendarDays, label: "Kiedy", value: input.when },
    input.where && { icon: MapPin, label: "Gdzie", value: input.where },
    input.who && { icon: Users, label: "Dla kogo", value: input.who },
  ].filter(Boolean) as { icon: typeof MapPin; label: string; value: string }[];

  return (
    <AiHint
      targetType="idea_leaflet"
      targetId={`idea-assistant:${conversationId}`.slice(0, 200)}
      framed={false}
    >
      <div className="flex flex-col gap-3 rounded-lg border-2 border-saffron bg-card p-5 text-card-foreground">
        <p className="text-sm font-bold text-muted-foreground simple:text-simple-sm">Tak może wyglądać ulotka</p>
        <p className="font-display text-h3 font-bold text-balance simple:text-simple-h3">{input.title}</p>
        <p className="max-w-[68ch]">{input.tagline}</p>
        {facts.length > 0 && (
          <dl className="flex flex-col gap-2">
            {facts.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-2">
                <dt className="inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground simple:text-simple-sm">
                  <Icon aria-hidden className="size-5 shrink-0" strokeWidth={2} />
                  {label}:
                </dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        )}
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={decision !== null}
            onClick={() => answer("kept")}
          >
            <Check aria-hidden strokeWidth={2} />
            Zostaw
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={decision !== null}
            onClick={() => answer("retry")}
          >
            <RotateCcw aria-hidden strokeWidth={2} />
            Spróbuj inaczej
          </Button>
        </div>
        {decision === "kept" && (
          <p className="text-sm font-bold text-success simple:text-simple-sm">Zostawione. Ulotka czeka w podsumowaniu.</p>
        )}
      </div>
    </AiHint>
  );
}