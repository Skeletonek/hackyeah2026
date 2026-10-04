import type { PilotActionState } from "@/app/admin/pilots/actions";

/** The line beside a moderation button: saved, or what went wrong. */
export function ActionResult({
  state,
  done,
  showError = true,
}: {
  state: PilotActionState;
  done: string;
  /** Off when the field already shows the error. */
  showError?: boolean;
}) {
  return (
    <p aria-live="polite" className="text-sm font-bold">
      {state?.ok === true && <span className="text-success">{done}</span>}
      {showError && state?.ok === false && <span className="text-destructive">{state.error}</span>}
    </p>
  );
}
