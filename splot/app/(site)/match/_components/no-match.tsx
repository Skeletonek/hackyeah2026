"use client";

import { useState } from "react";
import Link from "next/link";
import { Lightbulb, Send } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import type { SavedSubmission } from "../actions";
import { SaveDialog } from "./save-dialog";

/** Keeps the prefill link a sane length; the idea builder lets the person edit it anyway. */
const MAX_PREFILL_LENGTH = 1000;

/**
 * MM7: matchmaking found nothing that fits. The problem may be a gap, so the
 * person can report it as a challenge (saves a submission) or propose an idea
 * (no submission, just the idea builder with the description prefilled).
 */
export function NoMatch({
  conversationId,
  description,
  municipality,
  onSaved,
}: {
  conversationId: string;
  /** The person's description of the problem, from `problemDescription()`. */
  description: string;
  municipality?: string;
  onSaved: (saved: SavedSubmission) => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const prefill = description.slice(0, MAX_PREFILL_LENGTH);

  return (
    <>
      <EmptyState
        title="Nie znaleźliśmy gotowego rozwiązania. To może być luka."
        action={
          <>
            <Button size="lg" className="w-full sm:w-auto" onClick={() => setDialogOpen(true)}>
              <Send aria-hidden strokeWidth={2} />
              Zgłoś jako wyzwanie
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
              <Link href={`/ideas/new?prefill=${encodeURIComponent(prefill)}`}>
                <Lightbulb aria-hidden strokeWidth={2} />
                Zaproponuj pomysł
              </Link>
            </Button>
          </>
        }
      >
        <p>
          W Bibliotece ROPS nie ma jeszcze innowacji, która odpowiada na Twój problem. Zgłoś go jako
          wyzwanie, żeby ROPS wiedział, czego brakuje w Małopolsce. Masz pomysł, jak to rozwiązać?
          Opisz go w Kreatorze pomysłów.
        </p>
      </EmptyState>
      <SaveDialog
        conversationId={conversationId}
        municipality={municipality}
        intent="challenge"
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSaved={onSaved}
      />
    </>
  );
}
