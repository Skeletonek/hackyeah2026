"use client";

import { useActionState } from "react";
import { RefreshCw } from "lucide-react";
import { retryTriage, type RetryTriageState } from "@/app/admin/submissions/actions";
import { Button } from "@/components/ui/button";

const INITIAL: RetryTriageState = { status: "idle" };

/**
 * „Uruchom ponownie" for a submission triage never finished. It re-runs the
 * action from A1 and reports what came back.
 */
export function RetryTriageButton({ id }: { id: string }) {
  const [state, formAction, pending] = useActionState(retryTriage, INITIAL);

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant="outline" size="sm" loading={pending}>
        {!pending && <RefreshCw aria-hidden strokeWidth={2} />}
        {pending ? "Uruchamiam…" : "Uruchom ponownie"}
      </Button>
      <p aria-live="polite" className="text-sm font-bold text-destructive">
        {state.status === "error" ? state.error : null}
      </p>
      {state.status === "done" && (
        <p className="text-sm font-bold text-success">Triage gotowe.</p>
      )}
    </form>
  );
}