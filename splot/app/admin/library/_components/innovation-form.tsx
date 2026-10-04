"use client";

import { useActionState, useEffect, useId, useRef, useState, useTransition } from "react";
import { Check, Sparkles } from "lucide-react";
import {
  generateEasyRead,
  saveInnovation,
  suggestCategories,
  type InnovationAiInput,
  type InnovationFormState,
} from "@/app/admin/library/actions";
import { AiBadge } from "@/components/ai/ai-badge";
import { AiHint } from "@/components/ai/ai-hint";
import { AiThinking } from "@/components/ai/ai-thinking";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldHint } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { InnovationFill, InnovationFillField } from "@/lib/admin/innovation-fill";
import type { EditableInnovation } from "@/lib/admin/library";
import { MAX_CATEGORIES, SECTION_FIELDS, URL_FIELDS } from "@/lib/admin/library-fields";
import {
  CHALLENGE_CATEGORY_LABELS,
  INNOVATION_STAGE_LABELS,
  TARGET_GROUP_LABELS,
  type ChallengeCategory,
  type TargetGroup,
} from "@/lib/labels";
import { Constants } from "@/lib/supabase/database.types";

type AiStatus = { error?: string };

/** The current form text as input for the AI buttons. */
function aiInputFrom(form: HTMLFormElement): InnovationAiInput {
  const data = new FormData(form);
  const text = (name: string) => {
    const value = data.get(name);
    return typeof value === "string" && value.trim() ? value : null;
  };
  return {
    title: text("title") ?? "",
    lead: text("lead"),
    solution: text("solution"),
    problem: text("problem"),
    audience: text("audience"),
    adopters: text("adopters"),
    evidence: text("evidence"),
    target_groups: data.getAll("target_groups") as TargetGroup[],
  };
}

/** Fields the AI fill actually set: non-empty text, non-empty lists, the stage. */
function filledFields(fill: InnovationFill | null | undefined): Set<InnovationFillField> {
  if (!fill) return new Set();
  return new Set(
    (Object.keys(fill) as InnovationFillField[]).filter((name) => {
      const value = fill[name];
      return Array.isArray(value) ? value.length > 0 : Boolean(value);
    }),
  );
}

/**
 * Create or edit one innovation. Submitted by hand (not `<form action>`), so a
 * failed save keeps everything typed. AI never writes on its own: the
 * easy-read text is a proposal to accept, the categories a pre-fill to check,
 * and `prefill` (a new innovation filled from a PDF or link) marks every field
 * it set with an „AI” badge until the admin edits that field.
 */
export function InnovationForm({
  innovation,
  prefill,
}: {
  innovation: EditableInnovation | null;
  prefill?: InnovationFill | null;
}) {
  const initial = innovation ?? prefill;
  const formRef = useRef<HTMLFormElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const [state, formAction, saving] = useActionState<InnovationFormState, FormData>(saveInnovation, null);
  const [, startSave] = useTransition();
  const errors = state?.ok === false ? state.fieldErrors : undefined;

  const [aiFilled, setAiFilled] = useState(() => filledFields(prefill));
  const aiBadge = (name: InnovationFillField) => aiFilled.has(name) && <AiFilledBadge />;

  const [categories, setCategories] = useState<ChallengeCategory[]>(initial?.categories ?? []);
  const [aiCategories, setAiCategories] = useState<ChallengeCategory[] | null>(null);
  const [categoriesStatus, setCategoriesStatus] = useState<AiStatus>({});
  const [classifying, startClassify] = useTransition();

  const [easyRead, setEasyRead] = useState(innovation?.easy_read_description ?? "");
  const [easyReadProposal, setEasyReadProposal] = useState<string | null>(null);
  const [easyReadStatus, setEasyReadStatus] = useState<AiStatus>({});
  const [generating, startGenerate] = useTransition();
  const easyReadId = useId();

  const ids = { categories: useId(), targetGroups: useId() };

  // A rejected save moves focus to the summary, which lists what to fix.
  useEffect(() => {
    if (state?.ok === false) summaryRef.current?.focus();
  }, [state]);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startSave(() => formAction(formData));
  }

  // Editing a field confirms it: its „AI” badge goes away.
  function markEdited(event: React.FormEvent<HTMLFormElement>) {
    const name = (event.target as HTMLInputElement).name as InnovationFillField;
    if (!aiFilled.has(name)) return;
    setAiFilled((current) => {
      const next = new Set(current);
      next.delete(name);
      return next;
    });
  }

  function toggleCategory(category: ChallengeCategory, checked: boolean) {
    setCategories((current) =>
      checked ? [...current, category] : current.filter((value) => value !== category),
    );
  }

  function classify() {
    if (!formRef.current) return;
    const input = aiInputFrom(formRef.current);
    setCategoriesStatus({});
    startClassify(async () => {
      const result = await suggestCategories(input);
      if (!result.ok) {
        setCategoriesStatus({ error: result.error });
        return;
      }
      setCategories(result.categories);
      setAiCategories(result.categories);
    });
  }

  function generate() {
    if (!formRef.current) return;
    const input = aiInputFrom(formRef.current);
    setEasyReadStatus({});
    setEasyReadProposal(null);
    startGenerate(async () => {
      const result = await generateEasyRead(input);
      if (!result.ok) {
        setEasyReadStatus({ error: result.error });
        return;
      }
      setEasyReadProposal(result.text);
    });
  }

  const fieldErrorEntries = errors
    ? Object.entries(errors).filter((entry): entry is [string, string[]] => Boolean(entry[1]?.length))
    : [];
  const feedbackId = innovation?.id ?? "new";

  return (
    <form ref={formRef} onSubmit={submit} onChange={markEdited} noValidate className="flex flex-col gap-8">
      <input type="hidden" name="id" value={innovation?.id ?? ""} />

      {state?.ok === false && (
        <div ref={summaryRef} tabIndex={-1} className="rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring">
          <Alert tone="error" title={state.error}>
            {fieldErrorEntries.length > 0 && (
              <ul className="list-disc pl-5">
                {fieldErrorEntries.map(([name, messages]) => (
                  <li key={name}>{messages[0]}</li>
                ))}
              </ul>
            )}
          </Alert>
        </div>
      )}

      <Section title="Podstawowe informacje">
        <Field label={<>Tytuł{aiBadge("title")}</>} error={errors?.title?.[0]}>
          <Input name="title" defaultValue={initial?.title ?? ""} required maxLength={200} />
        </Field>
        <Field
          label="Adres w Bibliotece"
          optional={!innovation}
          hint={
            innovation
              ? "Część adresu strony, np. srebrna-siec. Zmiana adresu psuje stare linki do tej innowacji."
              : "Część adresu strony, np. srebrna-siec. Zostaw puste, a utworzymy go z tytułu."
          }
          error={errors?.slug?.[0]}
        >
          <Input
            name="slug"
            defaultValue={innovation?.slug ?? ""}
            required={Boolean(innovation)}
            maxLength={80}
            autoCapitalize="none"
            spellCheck={false}
            className="font-mono"
          />
        </Field>
        <Field
          label={<>Zajawka{aiBadge("lead")}</>}
          optional
          hint="Jedno, dwa zdania na kartę innowacji w wynikach."
          error={errors?.lead?.[0]}
        >
          <Textarea name="lead" defaultValue={initial?.lead ?? ""} maxLength={500} rows={3} />
        </Field>
      </Section>

      <Section title="Opis">
        {SECTION_FIELDS.map((section) => (
          <Field
            key={section.name}
            label={<>{section.label}{aiBadge(section.name)}</>}
            optional
            error={errors?.[section.name]?.[0]}
          >
            <Textarea
              name={section.name}
              defaultValue={initial?.[section.name] ?? ""}
              maxLength={5000}
              rows={5}
            />
          </Field>
        ))}
      </Section>

      <Section title="Wersja łatwa do czytania">
        <Field
          id={easyReadId}
          label="Tekst łatwy do czytania"
          optional
          hint="Krótkie zdania i proste słowa, najwyżej 120 słów. Widać go w trybie „Prościej”."
          error={errors?.easy_read_description?.[0]}
        >
          <Textarea
            name="easy_read_description"
            value={easyRead}
            onChange={(event) => setEasyRead(event.target.value)}
            maxLength={2000}
            rows={6}
          />
        </Field>
        <div className="flex flex-col gap-3">
          <div>
            <Button type="button" variant="outline" onClick={generate} loading={generating}>
              {!generating && <Sparkles aria-hidden strokeWidth={2} />}
              Wygeneruj wersję łatwą
            </Button>
          </div>
          {generating && <AiThinking label="Piszę wersję łatwą do czytania…" />}
          {easyReadStatus.error && <FieldError role="alert">{easyReadStatus.error}</FieldError>}
          {easyReadProposal && (
            <AiHint targetType="easy_read" targetId={feedbackId}>
              <div className="flex flex-col gap-4">
                <p className="font-bold">Propozycja wersji łatwej. Sprawdź ją, zanim wstawisz.</p>
                <p className="whitespace-pre-line">{easyReadProposal}</p>
                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      setEasyRead(easyReadProposal);
                      setEasyReadProposal(null);
                      document.getElementById(easyReadId)?.focus();
                    }}
                  >
                    <Check aria-hidden strokeWidth={2} />
                    Wstaw do pola
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => setEasyReadProposal(null)}>
                    Odrzuć
                  </Button>
                </div>
              </div>
            </AiHint>
          )}
        </div>
      </Section>

      <Section title="Kategorie">
        <fieldset
          aria-describedby={[`${ids.categories}-hint`, errors?.categories && `${ids.categories}-error`]
            .filter(Boolean)
            .join(" ")}
          className="flex flex-col gap-2"
        >
          <legend className="mb-2 text-base font-bold">
            Wyzwania społeczne{aiBadge("categories")}
          </legend>
          <FieldHint id={`${ids.categories}-hint`} className="mt-0">
            Zaznacz od 1 do {MAX_CATEGORIES}, od najważniejszego. Według nich działa dopasowanie.
          </FieldHint>
          <div className="grid gap-x-6 sm:grid-cols-2">
            {Constants.public.Enums.challenge_category.map((category) => (
              <Checkbox
                key={category}
                name="categories"
                value={category}
                label={CHALLENGE_CATEGORY_LABELS[category]}
                checked={categories.includes(category)}
                onChange={(event) => toggleCategory(category, event.target.checked)}
              />
            ))}
          </div>
          {errors?.categories && <FieldError id={`${ids.categories}-error`}>{errors.categories[0]}</FieldError>}
        </fieldset>
        <div className="flex flex-col gap-3">
          <div>
            <Button type="button" variant="outline" onClick={classify} loading={classifying}>
              {!classifying && <Sparkles aria-hidden strokeWidth={2} />}
              Przypisz kategorie z AI
            </Button>
          </div>
          {classifying && <AiThinking label="Dobieram wyzwania do opisu…" />}
          {categoriesStatus.error && <FieldError role="alert">{categoriesStatus.error}</FieldError>}
          {aiCategories && (
            <AiHint targetType="innovation_categories" targetId={feedbackId}>
              <p role="status">
                Zaznaczono:{" "}
                {aiCategories.map((category) => CHALLENGE_CATEGORY_LABELS[category]).join(", ")}. Sprawdź i
                popraw przed zapisaniem.
              </p>
            </AiHint>
          )}
        </div>

        <fieldset
          aria-describedby={errors?.target_groups ? `${ids.targetGroups}-error` : undefined}
          className="flex flex-col gap-2"
        >
          <legend className="mb-2 text-base font-bold">
            Grupy odbiorców{aiBadge("target_groups")}{" "}
            <span className="font-normal text-muted-foreground">(nieobowiązkowe)</span>
          </legend>
          <div className="grid gap-x-6 sm:grid-cols-2">
            {Constants.public.Enums.target_group.map((group) => (
              <Checkbox
                key={group}
                name="target_groups"
                value={group}
                label={TARGET_GROUP_LABELS[group]}
                defaultChecked={initial?.target_groups.includes(group)}
              />
            ))}
          </div>
          {errors?.target_groups && (
            <FieldError id={`${ids.targetGroups}-error`}>{errors.target_groups[0]}</FieldError>
          )}
        </fieldset>

        <Field label={<>Etap{aiBadge("stage")}</>} error={errors?.stage?.[0]} className="sm:max-w-sm">
          <Select name="stage" defaultValue={initial?.stage ?? "idea"} required>
            {Constants.public.Enums.innovation_stage.map((stage) => (
              <option key={stage} value={stage}>
                {INNOVATION_STAGE_LABELS[stage]}
              </option>
            ))}
          </Select>
        </Field>
      </Section>

      <Section title="Linki">
        {URL_FIELDS.map((url) => (
          <Field key={url.name} label={url.label} optional hint={url.hint} error={errors?.[url.name]?.[0]}>
            <Input
              type="url"
              name={url.name}
              defaultValue={innovation?.[url.name] ?? ""}
              inputMode="url"
              autoComplete="url"
              placeholder="https://"
            />
          </Field>
        ))}
      </Section>

      <Section title="Pilotaże i publikacja">
        <Field
          label="Wolne miejsca w pilotażu"
          hint="0 ukrywa przycisk zgłoszenia do testów na stronie innowacji."
          error={errors?.pilot_slots?.[0]}
          className="sm:max-w-sm"
        >
          <Input
            type="number"
            name="pilot_slots"
            defaultValue={innovation?.pilot_slots ?? 0}
            min={0}
            max={1000}
            step={1}
            inputMode="numeric"
          />
        </Field>
        <Checkbox
          name="published"
          label="Opublikowana"
          description="Widoczna w Bibliotece i w wynikach dopasowania. Bez zaznaczenia zostaje szkicem."
          defaultChecked={innovation?.published ?? false}
        />
      </Section>

      <div className="flex flex-wrap items-center gap-4 border-t-2 border-border pt-6">
        <Button type="submit" loading={saving}>
          {!saving && <Check aria-hidden strokeWidth={2} />}
          {saving ? "Zapisuję…" : innovation ? "Zapisz zmiany" : "Dodaj innowację"}
        </Button>
        <p aria-live="polite" className="text-sm font-bold">
          {state?.ok === true && <span className="text-success">Zmiany zapisane.</span>}
        </p>
      </div>
    </form>
  );
}

/** „AI” next to a label; read out as part of the field name, so it is never colour alone. */
function AiFilledBadge() {
  return (
    <AiBadge className="ml-2 px-2 py-0.5 align-middle">
      AI<span className="sr-only">, wypełnione automatycznie, sprawdź</span>
    </AiBadge>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const headingId = useId();
  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-col gap-5 rounded-lg border-2 border-border bg-card p-5 sm:p-6"
    >
      <h2 id={headingId} className="text-h3">
        {title}
      </h2>
      {children}
    </section>
  );
}
