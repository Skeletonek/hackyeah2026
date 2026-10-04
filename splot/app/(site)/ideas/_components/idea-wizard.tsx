"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Save } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldHint } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import {
  IDEA_ASSETS,
  IDEA_STAGE_DESCRIPTIONS,
  IDEA_STAGES,
  type IdeaCardValues,
  type IdeaFormStep,
} from "@/lib/ideas/card";
import { IDEA_LIMITS } from "@/lib/ideas/schema";
import { IDEA_ASSET_LABELS, IDEA_STAGE_LABELS, TARGET_GROUP_LABELS, type TargetGroup } from "@/lib/labels";
import { saveIdeaStep, type IdeaStepState } from "../actions";

type Intent = "next" | "back" | "draft";

const TARGET_GROUPS = Object.keys(TARGET_GROUP_LABELS) as TargetGroup[];

/**
 * One step of the idea card form (KRE1–KRE3). Nothing is saved while typing:
 * „Dalej”, „Wstecz” and „Zapisz szkic” each send the step to `saveIdeaStep`.
 */
export function IdeaWizard({
  step,
  id,
  call,
  initial,
  justSaved = false,
}: {
  step: IdeaFormStep;
  /** Missing on /ideas/new: the first save creates the card. */
  id?: string;
  call?: string;
  initial: IdeaCardValues;
  /** The draft was created a moment ago by „Zapisz szkic”. */
  justSaved?: boolean;
}) {
  const [state, formAction, isPending] = useActionState<IdeaStepState, FormData>(saveIdeaStep, {
    status: justSaved ? "saved" : "idle",
  });
  const [intent, setIntent] = useState<Intent>("next");
  const formRef = useRef<HTMLFormElement>(null);

  const values = { ...initial, ...state.values };
  const errors = state.fieldErrors ?? {};
  const error = (field: keyof IdeaCardValues) => errors[field]?.[0];

  // After a failed save the focus goes to the first field to fix.
  useEffect(() => {
    if (state.status !== "error") return;
    const form = formRef.current;
    const invalid =
      form?.querySelector<HTMLElement>('[aria-invalid="true"]') ??
      (state.fieldErrors?.stage ? form?.querySelector<HTMLElement>('input[name="stage"]') : null);
    invalid?.focus();
  }, [state]);

  const busy = (button: Intent) => isPending && intent === button;

  return (
    <form ref={formRef} action={formAction} noValidate className="flex flex-col gap-6">
      {id && <input type="hidden" name="id" value={id} />}
      {call && <input type="hidden" name="call" value={call} />}
      <input type="hidden" name="step" value={step} />

      {state.status === "error" && state.error && <Alert tone="error" title={state.error} />}

      {step === 1 && (
        <>
          <Field label="Nazwa pomysłu" hint="Krótko, tak jak mówisz o nim znajomym." error={error("title")}>
            <Input
              name="title"
              defaultValue={values.title}
              maxLength={IDEA_LIMITS.title}
              required
              placeholder="np. Sąsiedzka wypożyczalnia sprzętu"
            />
          </Field>
          <Field
            label="Na czym polega"
            hint="Opisz w 2–3 zdaniach, co dokładnie chcesz zrobić."
            error={error("solution")}
          >
            <Textarea name="solution" defaultValue={values.solution} maxLength={IDEA_LIMITS.solution} required />
          </Field>
          <Field
            label="Jaki problem rozwiązuje"
            hint="Co dziś nie działa i komu to przeszkadza?"
            error={error("problem")}
          >
            <Textarea name="problem" defaultValue={values.problem} maxLength={IDEA_LIMITS.problem} required />
          </Field>
        </>
      )}

      {step === 2 && (
        <>
          <CheckboxGroup
            legend="Kto skorzysta"
            hint="Zaznacz wszystkie grupy, które pasują."
            error={error("target_groups")}
          >
            <div className="grid gap-x-6 sm:grid-cols-2 simple:grid-cols-1">
              {TARGET_GROUPS.map((group) => (
                <Checkbox
                  key={group}
                  name="target_groups"
                  value={group}
                  label={TARGET_GROUP_LABELS[group]}
                  defaultChecked={values.target_groups.includes(group)}
                  aria-invalid={error("target_groups") ? true : undefined}
                />
              ))}
            </div>
          </CheckboxGroup>
          <Field
            label="Odbiorcy"
            optional
            hint="Opisz ich własnymi słowami, np. „seniorzy mieszkający sami w naszej wsi”."
            error={error("audience")}
          >
            <Textarea
              name="audience"
              defaultValue={values.audience}
              maxLength={IDEA_LIMITS.audience}
              className="min-h-24"
            />
          </Field>
          <Field label="Gdzie" hint="Miejscowość, gmina albo powiat." error={error("location")}>
            <Input
              name="location"
              defaultValue={values.location}
              maxLength={IDEA_LIMITS.location}
              required
              placeholder="np. Gmina Limanowa"
            />
          </Field>
          <Field
            label="Ile osób skorzysta w pierwszym roku"
            optional
            hint="Wystarczy przybliżona liczba."
            error={error("reach")}
          >
            <Input name="reach" defaultValue={values.reach} maxLength={IDEA_LIMITS.reach} placeholder="np. około 40" />
          </Field>
        </>
      )}

      {step === 3 && (
        <>
          <RadioGroup
            legend="Etap"
            name="stage"
            variant="cards"
            required
            defaultValue={values.stage}
            error={error("stage")}
            options={IDEA_STAGES.map((stage) => ({
              value: stage,
              label: IDEA_STAGE_LABELS[stage],
              description: IDEA_STAGE_DESCRIPTIONS[stage],
            }))}
          />
          <CheckboxGroup legend="Co już masz" hint="Zaznacz to, co jest gotowe. Możesz nie zaznaczać nic.">
            {IDEA_ASSETS.map((asset) => (
              <Checkbox
                key={asset}
                name="assets"
                value={asset}
                label={IDEA_ASSET_LABELS[asset]}
                defaultChecked={values.assets.includes(asset)}
              />
            ))}
          </CheckboxGroup>
        </>
      )}

      {state.status === "saved" && (
        <Alert key={state.savedAt} tone="success" title="Zapisaliśmy szkic">
          <p>Możesz wrócić do niego później w tej samej przeglądarce.</p>
        </Alert>
      )}

      {/* „Dalej” is first in the DOM, so Enter in a field means „Dalej”. */}
      <div className="flex flex-col gap-3 sm:flex-row-reverse sm:flex-wrap sm:justify-between">
        <Button
          type="submit"
          name="intent"
          value="next"
          size="lg"
          loading={busy("next")}
          onClick={() => setIntent("next")}
        >
          Dalej
          <ArrowRight aria-hidden strokeWidth={2} />
        </Button>
        <div className="flex flex-col gap-3 sm:flex-row-reverse">
          <Button
            type="submit"
            name="intent"
            value="draft"
            size="lg"
            variant="ghost"
            loading={busy("draft")}
            onClick={() => setIntent("draft")}
          >
            <Save aria-hidden strokeWidth={2} />
            Zapisz szkic
          </Button>
          {step > 1 && (
            <Button
              type="submit"
              name="intent"
              value="back"
              size="lg"
              variant="outline"
              loading={busy("back")}
              onClick={() => setIntent("back")}
            >
              <ArrowLeft aria-hidden strokeWidth={2} />
              Wstecz
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}

/** Checkboxes answering one question: a `<fieldset>` with the question as its legend. */
function CheckboxGroup({
  legend,
  hint,
  error,
  children,
}: {
  legend: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  const groupId = useId();
  const hintId = hint ? `${groupId}-hint` : undefined;
  const errorId = error ? `${groupId}-error` : undefined;

  return (
    <fieldset
      aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
      className="grid min-w-0 gap-2"
    >
      <legend className="mb-2 p-0 text-base font-bold simple:text-simple-base">{legend}</legend>
      {hint && <FieldHint id={hintId}>{hint}</FieldHint>}
      {children}
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </fieldset>
  );
}
