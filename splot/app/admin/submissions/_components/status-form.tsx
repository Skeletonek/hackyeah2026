"use client";

import { useActionState } from "react";
import { Send } from "lucide-react";
import { updateStatus, type DetailActionState } from "@/app/admin/submissions/actions";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { MANUAL_STATUSES } from "@/lib/admin/statuses";
import { SUBMISSION_STATUS_LABELS, type SubmissionStatus } from "@/lib/labels";
import { FormResult } from "./form-result";

/** Manual status change; the author is notified about every change. */
export function StatusForm({ id, status }: { id: string; status: SubmissionStatus }) {
  const [state, formAction, pending] = useActionState<DetailActionState, FormData>(
    updateStatus,
    null,
  );
  const manual = (MANUAL_STATUSES as readonly SubmissionStatus[]).includes(status);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={id} />
      <Field
        label="Status"
        hint="Autor dostanie powiadomienie o zmianie."
        error={state?.ok === false ? state.fieldErrors?.status?.[0] : undefined}
      >
        <Select name="status" defaultValue={status}>
          {/* `with_expert` is not set by hand, but still shows as the current one. */}
          {!manual && (
            <option value={status} disabled>
              {SUBMISSION_STATUS_LABELS[status]}
            </option>
          )}
          {MANUAL_STATUSES.map((value) => (
            <option key={value} value={value}>
              {SUBMISSION_STATUS_LABELS[value]}
            </option>
          ))}
        </Select>
      </Field>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="outline" loading={pending}>
          {!pending && <Send aria-hidden strokeWidth={2} />}
          {pending ? "Zapisuję…" : "Zmień status"}
        </Button>
        <FormResult state={state} done="Status zmieniony." />
      </div>
    </form>
  );
}
