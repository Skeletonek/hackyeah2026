import type { DetailActionState } from "@/app/admin/submissions/actions";

/** The line beside a detail form's button: saved, or what went wrong. */
export function FormResult({ state, done }: { state: DetailActionState; done: string }) {
  return (
    <p aria-live="polite" className="text-sm font-bold">
      {state?.ok === true && <span className="text-success">{done}</span>}
      {state?.ok === false && <span className="text-destructive">{state.error}</span>}
    </p>
  );
}
