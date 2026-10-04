"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { submitReview, type ReviewState } from "../actions";
import type { PilotReview } from "@/lib/library/pilots";

const RATING_LABELS: Record<string, string> = {
  "1": "1 — Nie działa",
  "2": "2 — Działa słabo",
  "3": "3 — Działa średnio",
  "4": "4 — Działa dobrze",
  "5": "5 — Bardzo dobrze",
};

const RATING_OPTIONS = ["1", "2", "3", "4", "5"].map((value) => ({
  value,
  label: RATING_LABELS[value],
}));

export function ReviewForm({
  pilotId,
  defaultAttribution,
  existingReview,
}: {
  pilotId: string;
  defaultAttribution: string;
  existingReview?: PilotReview | null;
}) {
  const [state, dispatch, pending] = useActionState<ReviewState, FormData>(
    (_prev, formData) => submitReview(pilotId, _prev, formData),
    { status: "idle" },
  );

  if (state.status === "success") {
    return <Alert tone="success" title={state.message} />;
  }

  const values =
    state.status === "error"
      ? state.values
      : {
          rating: existingReview?.rating,
          feedback: existingReview?.feedback ?? undefined,
          improvement: existingReview?.improvement ?? undefined,
          attribution: existingReview?.attribution ?? defaultAttribution,
        };

  return (
    <form action={dispatch} className="flex flex-col gap-6">
      {state.status === "error" && state.error && (
        <Alert tone="error" title="Nie udało się zapisać opinii">
          {state.error}
        </Alert>
      )}

      <RadioGroup
        legend="Jak oceniasz działanie innowacji?"
        name="rating"
        options={RATING_OPTIONS}
        defaultValue={values?.rating ? String(values.rating) : undefined}
        required
        error={state.status === "error" ? state.fieldErrors?.rating?.[0] : undefined}
      />

      <Field
        label="Opinia"
        optional
        hint="Co działa dobrze, a co wymaga poprawy?"
        error={state.status === "error" ? state.fieldErrors?.feedback?.[0] : undefined}
      >
        <Textarea name="feedback" defaultValue={values?.feedback} />
      </Field>

      <Field
        label="Proponowane usprawnienie"
        optional
        hint="Co mogłoby usprawnić wdrożenie innowacji?"
        error={state.status === "error" ? state.fieldErrors?.improvement?.[0] : undefined}
      >
        <Textarea name="improvement" defaultValue={values?.improvement} />
      </Field>

      <Field
        label="Podpis"
        hint="Np. „Urząd Gminy Ropa”. Nie podawaj imienia i nazwiska."
        error={state.status === "error" ? state.fieldErrors?.attribution?.[0] : undefined}
      >
        <Input name="attribution" defaultValue={values?.attribution ?? defaultAttribution} required />
      </Field>

      <Button type="submit" size="lg" loading={pending} className="self-start">
        Zapisz opinię
      </Button>
    </form>
  );
}
