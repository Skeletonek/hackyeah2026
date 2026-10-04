"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { CircleCheck, CircleDashed, RotateCcw, Save, Send, Sparkles } from "lucide-react";
import { AiBadge } from "@/components/ai/ai-badge";
import { AiHint } from "@/components/ai/ai-hint";
import { AiThinking } from "@/components/ai/ai-thinking";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  isAuthorOnly,
  sectionMax,
  type ApplicationContent,
  type ApplicationInput,
  type CallCriterion,
  type CallSection,
} from "@/lib/ideas/application";
import { cn } from "@/lib/utils";
import { PrintButton } from "../../../_components/print-button";
import {
  checkApplication,
  prepareApplication,
  saveApplication,
  submitApplication,
  type ApplicationResult,
} from "../actions";
import styles from "./application.module.css";

type FillState = { status: "pending" | "done" } | { status: "failed"; error: string };
type Busy = "save" | "check" | "submit";

function fieldValues(sections: CallSection[], content: ApplicationContent) {
  return Object.fromEntries(sections.map(({ key }) => [key, content.fields[key]?.value ?? ""]));
}

function criteriaTicks(criteria: CallCriterion[], content: ApplicationContent) {
  return Object.fromEntries(criteria.map(({ key }) => [key, content.criteria[key]?.met ?? false]));
}

/**
 * KRE6: the grant application. The fields come from the call's sections and
 * are drafted by AI on the first open; the call's criteria are judged by the
 * assistant and ticked by the author, who sends the application once all are ticked.
 */
export function ApplicationForm({
  ideaId,
  callId,
  sections,
  criteria,
  initial,
  editable,
  fillOnOpen,
}: {
  ideaId: string;
  callId: string;
  sections: CallSection[];
  criteria: CallCriterion[];
  initial: ApplicationContent;
  /** Only the author changes a draft; a sent application is read-only. */
  editable: boolean;
  /** Nobody prepared this application yet: ask AI for the first draft. */
  fillOnOpen: boolean;
}) {
  // What the server has: it tells which values are still the AI's draft.
  const [content, setContent] = useState(initial);
  const [values, setValues] = useState(() => fieldValues(sections, initial));
  const [ticks, setTicks] = useState(() => criteriaTicks(criteria, initial));
  const [fill, setFill] = useState<FillState>({ status: fillOnOpen ? "pending" : "done" });
  const [busy, setBusy] = useState<Busy | null>(null);
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [notice, setNotice] = useState("");
  const fillStarted = useRef(false);
  const focusInvalid = useRef(false);
  const id = useId();
  const sendNoteId = `${id}-send-note`;

  const adopt = (next: ApplicationContent) => {
    setContent(next);
    setValues(fieldValues(sections, next));
    setTicks(criteriaTicks(criteria, next));
  };

  const runFill = async () => {
    const result = await prepareApplication(ideaId, callId);
    if ("error" in result) {
      setFill({ status: "failed", error: result.error });
      return;
    }
    adopt(result.content);
    setFill({ status: "done" });
    setNotice("Wniosek jest przygotowany. Sprawdź propozycje AI i uzupełnij puste pola.");
  };

  useEffect(() => {
    // The ref keeps a re-run of the effect from asking the model twice.
    if (!fillOnOpen || fillStarted.current) return;
    fillStarted.current = true;
    void runFill();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once, on the first open
  }, []);

  // After a failed save the focus goes to the first field to correct.
  useEffect(() => {
    if (!focusInvalid.current) return;
    focusInvalid.current = false;
    const first = sections.find(({ key }) => fieldErrors[key]);
    if (first) document.getElementById(`${id}-${first.key}`)?.focus();
  }, [fieldErrors, sections, id]);

  const filling = fill.status === "pending";
  const locked = !editable || filling || busy !== null;
  const tickedCount = criteria.filter(({ key }) => ticks[key]).length;
  const allTicked = tickedCount === criteria.length;
  const judged = criteria.filter(({ key }) => content.criteria[key]?.note);

  const run = (kind: Busy, action: (input: ApplicationInput) => Promise<ApplicationResult>, done: string) => {
    setBusy(kind);
    setError(undefined);
    setNotice("");
    startTransition(async () => {
      const result = await action({ fields: values, criteria: ticks });
      setBusy(null);
      if ("error" in result) {
        setError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
        focusInvalid.current = Boolean(result.fieldErrors);
        return;
      }
      setFieldErrors({});
      adopt(result.content);
      setNotice(done);
    });
  };

  return (
    <>
      <div className={cn("flex flex-col gap-6", styles.noPrint)}>
        {filling && <AiThinking label="Przygotowuję wniosek z Twojej fiszki…" />}
        {fill.status === "failed" && (
          <Alert
            tone="error"
            title="Nie udało się przygotować wniosku"
            action={
              <Button
                variant="outline"
                onClick={() => {
                  setFill({ status: "pending" });
                  void runFill();
                }}
              >
                <RotateCcw aria-hidden strokeWidth={2} />
                Spróbuj ponownie
              </Button>
            }
          >
            <p>{fill.error}</p>
          </Alert>
        )}

        <form
          noValidate
          className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] simple:grid-cols-1"
          onSubmit={(event) => {
            event.preventDefault();
            if (!locked) run("save", saveApplication.bind(null, ideaId, callId), "Zapisaliśmy szkic wniosku.");
          }}
        >
          <section
            aria-labelledby={`${id}-fields`}
            className="flex min-w-0 flex-col gap-6 rounded-lg border border-border bg-card p-6 text-card-foreground shadow-sm kontrast:border-2 simple:p-8"
          >
            <h2 id={`${id}-fields`} className="text-h3 simple:text-simple-h3">
              Treść wniosku
            </h2>
            {sections.map((section) => {
              const value = values[section.key] ?? "";
              const stored = content.fields[section.key];
              const fromAi = stored?.source === "ai" && value !== "" && stored.value === value;
              const max = sectionMax(section);
              const change = (next: string) => setValues((current) => ({ ...current, [section.key]: next }));
              const shared = { name: section.key, value, readOnly: locked, required: true };

              return (
                <div key={section.key} className="flex flex-col gap-2">
                  <Field
                    id={`${id}-${section.key}`}
                    label={section.label}
                    hint={
                      isAuthorOnly(section)
                        ? [section.hint, "To pole wypełniasz samodzielnie. AI go nie uzupełnia."].filter(Boolean).join(" ")
                        : section.hint
                    }
                    error={fieldErrors[section.key]?.[0]}
                  >
                    {section.type === "textarea" ? (
                      <Textarea {...shared} maxLength={max} onChange={(event) => change(event.target.value)} />
                    ) : section.type === "select" ? (
                      <Select
                        name={section.key}
                        value={value}
                        disabled={locked}
                        required
                        onChange={(event) => change(event.target.value)}
                      >
                        <option value="">Wybierz</option>
                        {section.options?.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </Select>
                    ) : section.type === "number" ? (
                      <Input
                        {...shared}
                        inputMode="numeric"
                        autoComplete="off"
                        maxLength={max}
                        className="max-w-[16rem]"
                        // Digits only: an amount has no spaces, commas or currency.
                        onChange={(event) => change(event.target.value.replace(/\D/g, ""))}
                      />
                    ) : (
                      <Input {...shared} maxLength={max} onChange={(event) => change(event.target.value)} />
                    )}
                  </Field>
                  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                    {fromAi ? <AiBadge>Propozycja AI</AiBadge> : <span />}
                    {(section.type === "text" || section.type === "textarea") && (
                      <p className="text-sm text-muted-foreground simple:text-simple-sm">
                        <span className="sr-only">Liczba znaków: </span>
                        {value.length} z {max}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </section>

          <aside
            aria-labelledby={`${id}-criteria`}
            className="flex min-w-0 flex-col gap-4 rounded-lg border border-border bg-card p-6 text-card-foreground shadow-sm kontrast:border-2 simple:p-8"
          >
            <h2 id={`${id}-criteria`} className="text-h3 simple:text-simple-h3">
              Kryteria naboru
            </h2>
            <p className="text-muted-foreground">
              Zaznacz kryterium, gdy Twój wniosek je spełnia. Wniosek wyślesz, gdy zaznaczysz wszystkie.
            </p>
            <fieldset className="flex flex-col">
              <legend className="font-bold">
                Zaznaczone: {tickedCount} z {criteria.length}
              </legend>
              {criteria.map(({ key, label }) => (
                <Checkbox
                  key={key}
                  label={label}
                  checked={ticks[key] ?? false}
                  disabled={locked}
                  onChange={(event) => setTicks((current) => ({ ...current, [key]: event.target.checked }))}
                />
              ))}
            </fieldset>

            {busy === "check" && <AiThinking label="Sprawdzam wniosek z kryteriami…" className="w-full" />}
            {judged.length > 0 && busy !== "check" && (
              <AiHint targetType="application_check" targetId={`${ideaId}:${callId}`}>
                <h3 className="font-bold">Ocena asystenta</h3>
                <ul className="mt-2 flex flex-col gap-3">
                  {judged.map(({ key, label }) => {
                    const { met, note } = content.criteria[key];
                    const Icon = met ? CircleCheck : CircleDashed;
                    return (
                      <li key={key} className="grid grid-cols-[auto_1fr] gap-x-2">
                        <Icon aria-hidden className="mt-0.5 size-6 shrink-0" strokeWidth={2} />
                        <p className="break-words">
                          <strong>
                            {met ? "Spełnione" : "Do poprawy"}: {label}.
                          </strong>{" "}
                          {note}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              </AiHint>
            )}
            {editable && (
              <Button
                variant="outline"
                disabled={filling || (busy !== null && busy !== "check")}
                loading={busy === "check"}
                onClick={() =>
                  run("check", checkApplication.bind(null, ideaId, callId), "Asystent sprawdził wniosek. Zobacz ocenę kryteriów.")
                }
              >
                {busy !== "check" && <Sparkles aria-hidden strokeWidth={2} />}
                Sprawdź wniosek z asystentem
              </Button>
            )}
          </aside>

          <div className="flex flex-col gap-4 lg:col-span-2 simple:col-span-1">
            {error && (
              <Alert tone="error" title={error}>
                {Object.keys(fieldErrors).length > 0 && (
                  <ul className="list-disc pl-5">
                    {sections
                      .filter(({ key }) => fieldErrors[key])
                      .map(({ key, label }) => (
                        <li key={key}>
                          <a
                            href={`#${id}-${key}`}
                            className="underline underline-offset-[0.2em]"
                            onClick={(event) => {
                              event.preventDefault();
                              document.getElementById(`${id}-${key}`)?.focus();
                            }}
                          >
                            {label}: {fieldErrors[key][0]}
                          </a>
                        </li>
                      ))}
                  </ul>
                )}
              </Alert>
            )}
            <p role="status" className="font-bold text-success empty:hidden">
              {notice}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {editable && (
                <>
                  <Button
                    size="lg"
                    aria-disabled={!allTicked || filling || (busy !== null && busy !== "submit") || undefined}
                    aria-describedby={sendNoteId}
                    loading={busy === "submit"}
                    onClick={() => {
                      if (allTicked && !locked) run("submit", submitApplication.bind(null, ideaId, callId), "");
                    }}
                  >
                    {busy !== "submit" && <Send aria-hidden strokeWidth={2} />}
                    {busy === "submit" ? "Wysyłam…" : "Wyślij wniosek"}
                  </Button>
                  <Button
                    type="submit"
                    size="lg"
                    variant="outline"
                    disabled={filling || (busy !== null && busy !== "save")}
                    loading={busy === "save"}
                  >
                    {busy !== "save" && <Save aria-hidden strokeWidth={2} />}
                    Zapisz szkic
                  </Button>
                </>
              )}
              <PrintButton variant={editable ? "outline" : "default"} />
            </div>
            {editable && (
              <p id={sendNoteId} className="text-sm text-muted-foreground simple:text-simple-sm">
                {allTicked
                  ? "Wszystkie kryteria są zaznaczone. Wniosek trafi do ROPS jako zgłoszenie, a odpowiedź dostaniesz w tym zgłoszeniu."
                  : `Zaznaczone kryteria: ${tickedCount} z ${criteria.length}. Wniosek wyślesz, gdy zaznaczysz wszystkie.`}
              </p>
            )}
          </div>
        </form>
      </div>

      {/* The same content as plain text: form controls cut long answers on paper. */}
      <div className={styles.printOnly}>
        {sections.map(({ key, label }) => (
          <section key={key} className={cn("mt-4", styles.printSection)}>
            <h2 className="font-bold">{label}</h2>
            <p className="break-words whitespace-pre-line">{values[key] || "Do uzupełnienia"}</p>
          </section>
        ))}
        <section className={cn("mt-4", styles.printSection)}>
          <h2 className="font-bold">Kryteria naboru</h2>
          <ul>
            {criteria.map(({ key, label }) => (
              <li key={key}>
                {ticks[key] ? "Tak" : "Nie"}: {label}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
