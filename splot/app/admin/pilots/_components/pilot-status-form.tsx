"use client";

import { useActionState } from "react";
import { updatePilotStatus, type PilotActionState } from "@/app/admin/pilots/actions";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { PILOT_STATUS_LABELS, type PilotStatus } from "@/lib/labels";
import { Constants } from "@/lib/supabase/database.types";
import { ActionResult } from "./action-result";

/**
 * The status of one application. Saved with a button, never on change, so
 * moving through the options with the keyboard does not send anything.
 */
export function PilotStatusForm({
  id,
  status,
  label,
}: {
  id: string;
  status: PilotStatus;
  /** Which application this is, for screen readers: the innovation and the place. */
  label: string;
}) {
  const [state, formAction, pending] = useActionState<PilotActionState, FormData>(
    updatePilotStatus,
    null,
  );

  return (
    <form action={formAction} className="flex min-w-48 flex-col gap-2">
      <input type="hidden" name="id" value={id} />
      {/* The column header already says „Status”; the label names the row for screen readers. */}
      <Field
        label={<span className="sr-only">Status: {label}</span>}
        className="gap-1"
        error={state?.ok === false ? (state.fieldErrors?.status?.[0] ?? state.error) : undefined}
      >
        <Select name="status" defaultValue={status}>
          {Constants.public.Enums.pilot_status.map((value) => (
            <option key={value} value={value}>
              {PILOT_STATUS_LABELS[value]}
            </option>
          ))}
        </Select>
      </Field>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="sm" variant="outline" loading={pending}>
          {pending ? "Zapisuję…" : "Zapisz"}
          <span className="sr-only">: {label}</span>
        </Button>
        <ActionResult state={state} done="Zapisano." showError={false} />
      </div>
    </form>
  );
}
