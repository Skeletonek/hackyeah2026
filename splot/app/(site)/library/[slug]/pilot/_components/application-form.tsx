"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { ORGANIZATION_TYPE_LABELS } from "@/lib/labels";
import { submitApplication, type ApplicationState } from "../actions";

const ORGANIZATION_OPTIONS = (
  ["municipality", "ngo", "community_group", "other"] as const
).map((value) => ({
  value,
  label: ORGANIZATION_TYPE_LABELS[value],
}));

export function ApplicationForm({
  innovationId,
}: {
  innovationId: string;
}) {
  const [state, dispatch, pending] = useActionState<ApplicationState, FormData>(
    (_prev, formData) => submitApplication(innovationId, _prev, formData),
    { status: "idle" },
  );

  if (state.status === "success") {
    return (
      <Alert tone="success" title={state.message}>
        Status zgłoszenia: {state.statusLabel}.
      </Alert>
    );
  }

  const values = state.status === "error" ? state.values : undefined;

  return (
    <form action={dispatch} className="flex flex-col gap-6">
      {state.status === "error" && state.error && (
        <Alert tone="error" title="Nie udało się zapisać zgłoszenia">
          {state.error}
        </Alert>
      )}

      <RadioGroup
        legend="Typ organizacji"
        name="organizationType"
        variant="cards"
        options={ORGANIZATION_OPTIONS}
        defaultValue={values?.organizationType}
        required
        error={state.status === "error" ? state.fieldErrors?.organizationType?.[0] : undefined}
      />

      <Field
        label="Gmina lub instytucja"
        hint="Np. „Gmina Ropa” lub „Stowarzyszenie Przyjaciół Krakowa”"
        error={state.status === "error" ? state.fieldErrors?.municipality?.[0] : undefined}
      >
        <Input
          name="municipality"
          defaultValue={values?.municipality}
          required
          autoComplete="organization"
        />
      </Field>

      <Field
        label="Plan wdrożenia"
        optional
        hint="Krótki opis, jak chcesz przetestować innowację (nieobowiązkowe)."
        error={state.status === "error" ? state.fieldErrors?.plan?.[0] : undefined}
      >
        <Textarea name="plan" defaultValue={values?.plan} />
      </Field>

      <Field
        label="E-mail kontaktowy"
        error={state.status === "error" ? state.fieldErrors?.contactEmail?.[0] : undefined}
      >
        <Input
          name="contactEmail"
          type="email"
          defaultValue={values?.contactEmail}
          required
          autoComplete="email"
        />
      </Field>

      <Button type="submit" size="lg" loading={pending} className="self-start">
        Wyślij zgłoszenie
      </Button>
    </form>
  );
}
