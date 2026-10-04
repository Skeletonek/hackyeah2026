"use client";

import { useActionState } from "react";
import { RefreshCw } from "lucide-react";
import { refreshSummary } from "@/app/admin/trends/actions";
import { Button } from "@/components/ui/button";

/** Writes the AI summary again from the current counts. */
export function RefreshSummaryButton() {
  const [, formAction, pending] = useActionState(refreshSummary, undefined);

  return (
    <form action={formAction}>
      <Button type="submit" variant="outline" size="sm" loading={pending}>
        {!pending && <RefreshCw aria-hidden strokeWidth={2} />}
        {pending ? "Piszę podsumowanie…" : "Odśwież podsumowanie"}
      </Button>
    </form>
  );
}
