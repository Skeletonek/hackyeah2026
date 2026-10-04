"use client";

import { useActionState } from "react";
import { Check } from "lucide-react";
import { updateTriage, type DetailActionState } from "@/app/admin/submissions/actions";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import {
  CHALLENGE_CATEGORY_LABELS,
  PRIORITY_LABELS,
  type ChallengeCategory,
  type Priority,
} from "@/lib/labels";
import { FormResult } from "./form-result";

/**
 * Category and priority, pre-filled with the AI values. Saving them confirms
 * the triage; changing them corrects it.
 */
export function TriageForm({
  id,
  category,
  priority,
  aiFilled,
}: {
  id: string;
  category: ChallengeCategory | null;
  priority: Priority | null;
  aiFilled: boolean;
}) {
  const [state, formAction, pending] = useActionState<DetailActionState, FormData>(
    updateTriage,
    null,
  );
  const errors = state?.ok === false ? state.fieldErrors : undefined;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={id} />
      {aiFilled && (
        <p className="text-sm text-muted-foreground">
          Wstępnie wybrane przez AI. Zapisz, aby potwierdzić, albo popraw.
        </p>
      )}
      <Field label="Kategoria" error={errors?.category?.[0]}>
        <Select name="category" defaultValue={category ?? ""} required>
          <option value="" disabled>
            Wybierz kategorię
          </option>
          {Object.entries(CHALLENGE_CATEGORY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Priorytet" error={errors?.priority?.[0]}>
        <Select name="priority" defaultValue={priority ?? ""} required>
          <option value="" disabled>
            Wybierz priorytet
          </option>
          {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </Field>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" loading={pending}>
          {!pending && <Check aria-hidden strokeWidth={2} />}
          {pending ? "Zapisuję…" : "Zatwierdź ocenę"}
        </Button>
        <FormResult state={state} done="Ocena zapisana." />
      </div>
    </form>
  );
}
