"use client";

import { useActionState } from "react";
import { Check, EyeOff } from "lucide-react";
import { moderateReview, type PilotActionState } from "@/app/admin/pilots/actions";
import { Button } from "@/components/ui/button";
import type { ReviewState } from "@/lib/admin/pilots";
import { ActionResult } from "./action-result";

/** „Zatwierdź” and „Ukryj”; a moderated review keeps the opposite one to undo it. */
export function ReviewDecision({
  id,
  state: reviewState,
  label,
}: {
  id: string;
  state: ReviewState;
  /** Which review this is, for screen readers. */
  label: string;
}) {
  const [state, formAction, pending] = useActionState<PilotActionState, FormData>(
    moderateReview,
    null,
  );

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="id" value={id} />
      {reviewState !== "published" && (
        <Button type="submit" name="decision" value="approve" size="sm" disabled={pending}>
          <Check aria-hidden strokeWidth={2} />
          Zatwierdź<span className="sr-only">: {label}</span>
        </Button>
      )}
      {reviewState !== "hidden" && (
        <Button type="submit" name="decision" value="hide" size="sm" variant="outline" disabled={pending}>
          <EyeOff aria-hidden strokeWidth={2} />
          Ukryj<span className="sr-only">: {label}</span>
        </Button>
      )}
      <ActionResult state={state} done="Zapisano." />
    </form>
  );
}
