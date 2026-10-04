"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Check, Plus, Trash2 } from "lucide-react";
import { saveCall, type CallFormState } from "@/app/admin/calls/actions";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  hasCharLimit,
  SECTION_TYPE_LABELS,
  SECTION_TYPES,
  warsawDay,
  type CriterionRowInput,
  type SectionRowInput,
} from "@/lib/admin/call-fields";
import type { EditableCall } from "@/lib/admin/calls";
import { parseCriteria, parseSections, sectionMax } from "@/lib/ideas/application";
import { CHALLENGE_CATEGORY_LABELS } from "@/lib/labels";
import { Constants } from "@/lib/supabase/database.types";

/** `id` only names the row on this screen; `key` is what gets saved. */
type SectionRow = SectionRowInput & { id: string };
type CriterionRow = CriterionRowInput & { id: string };
type ListName = "sections" | "criteria";

const EMPTY_SECTION: SectionRowInput = { key: "", label: "", type: "textarea", hint: "", options: "", max: "" };
const EMPTY_CRITERION: CriterionRowInput = { key: "", label: "" };

function initialSections(call: EditableCall | null): SectionRow[] {
  if (!call) return [{ ...EMPTY_SECTION, id: "new-0" }];
  return parseSections(call.sections).map((section) => ({
    id: section.key,
    key: section.key,
    label: section.label,
    type: section.type,
    hint: section.hint ?? "",
    options: section.options?.join("\n") ?? "",
    max: section.max ? String(section.max) : "",
  }));
}

function initialCriteria(call: EditableCall | null): CriterionRow[] {
  return call ? parseCriteria(call.criteria).map((criterion) => ({ ...criterion, id: criterion.key })) : [];
}

/** What the hidden field carries: the rows without their screen-only id. */
function serialize<T extends { id: string }>(rows: T[]) {
  return JSON.stringify(rows.map((row) => ({ ...row, id: undefined })));
}

/**
 * Create or edit one grant call. Submitted by hand (not `<form action>`), so a
 * failed save keeps everything typed. The two lists live in state and travel
 * as JSON; rows move with „W górę” / „W dół”, never by dragging alone.
 */
export function CallForm({ call }: { call: EditableCall | null }) {
  const [state, setState] = useState<CallFormState>(null);
  const [saving, startSave] = useTransition();
  const [sections, setSections] = useState(() => initialSections(call));
  const [criteria, setCriteria] = useState(() => initialCriteria(call));
  /** Row ids in the order they were last sent: the server reports errors by position. */
  const [sent, setSent] = useState<Record<ListName, string[]>>({ sections: [], criteria: [] });

  const formId = useId();
  const summaryId = `${formId}-summary`;
  const nextRow = useRef(1);
  const newRowId = () => `new-${nextRow.current++}`;

  // Moving or removing a row re-renders the list; focus follows once the new DOM is there.
  const pendingFocus = useRef<string | null>(null);
  const focusLater = (id: string) => {
    pendingFocus.current = id;
  };
  useEffect(() => {
    if (!pendingFocus.current) return;
    const element = document.getElementById(pendingFocus.current);
    if (!element) return;
    element.focus();
    pendingFocus.current = null;
  });

  const errors = state?.ok === false ? state.fieldErrors : undefined;
  const rows: Record<ListName, { id: string }[]> = { sections, criteria };

  function rowError(list: ListName, rowId: string, field: string) {
    const position = sent[list].indexOf(rowId);
    return position < 0 ? undefined : errors?.[`${list}.${position}.${field}`];
  }

  /** The summary names a row by where it stands now, not where it stood when sent. */
  const summary = Object.entries(errors ?? {}).flatMap(([path, message]) => {
    const match = /^(sections|criteria)\.(\d+)\./.exec(path);
    if (!match) return [message];
    const list = match[1] as ListName;
    const index = rows[list].findIndex((row) => row.id === sent[list][Number(match[2])]);
    return index < 0 ? [] : [`${list === "sections" ? "Pole" : "Kryterium"} ${index + 1}: ${message}`];
  });

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const order = { sections: sections.map((row) => row.id), criteria: criteria.map((row) => row.id) };

    startSave(async () => {
      const result = await saveCall(formData);
      setSent(order);
      setState(result);
      if (result?.ok) {
        // New rows take the keys they were saved under, so a later rename keeps them.
        const withKeys = <T extends { id: string; key: string }>(list: ListName) => (current: T[]) =>
          current.map((row) => {
            const position = order[list].indexOf(row.id);
            return position < 0 ? row : { ...row, key: result.keys[list][position] ?? row.key };
          });
        setSections(withKeys<SectionRow>("sections"));
        setCriteria(withKeys<CriterionRow>("criteria"));
      } else if (result) {
        // A rejected save moves focus to the summary, which lists what to fix.
        focusLater(summaryId);
      }
    });
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-8">
      <input type="hidden" name="id" value={call?.id ?? ""} />
      <input type="hidden" name="sections" value={serialize(sections)} />
      <input type="hidden" name="criteria" value={serialize(criteria)} />

      {state?.ok === false && (
        <div id={summaryId} tabIndex={-1} className="rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring">
          <Alert tone="error" title={state.error}>
            {summary.length > 0 && (
              <ul className="list-disc pl-5">
                {summary.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            )}
          </Alert>
        </div>
      )}

      <Section title="Podstawowe informacje">
        <Field label="Nazwa naboru" error={errors?.title}>
          <Input name="title" defaultValue={call?.title ?? ""} required maxLength={200} />
        </Field>
        <Field
          label="Opis"
          optional
          hint="Dla kogo jest nabór i co można zgłosić. Widzą go autorzy pomysłów."
          error={errors?.description}
        >
          <Textarea name="description" defaultValue={call?.description ?? ""} maxLength={2000} rows={4} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Początek naboru" hint="Nabór zaczyna się o północy tego dnia." error={errors?.opens_at}>
            <Input type="date" name="opens_at" defaultValue={call ? warsawDay(call.opens_at) : ""} required />
          </Field>
          <Field label="Koniec naboru" hint="Nabór trwa do końca tego dnia." error={errors?.closes_at}>
            <Input type="date" name="closes_at" defaultValue={call ? warsawDay(call.closes_at) : ""} required />
          </Field>
        </div>
        <Field label="Wyzwanie społeczne" optional error={errors?.category} className="sm:max-w-sm">
          <Select name="category" defaultValue={call?.category ?? ""}>
            <option value="">Bez kategorii</option>
            {Constants.public.Enums.challenge_category.map((category) => (
              <option key={category} value={category}>
                {CHALLENGE_CATEGORY_LABELS[category]}
              </option>
            ))}
          </Select>
        </Field>
      </Section>

      <Section
        title="Pola wniosku"
        intro="Autor pomysłu wypełnia je po kolei. Asystent AI podpowiada treść pól tekstowych, kwoty wpisuje tylko autor."
      >
        <RowList
          rows={sections}
          onChange={setSections}
          makeRow={() => ({ ...EMPTY_SECTION, id: newRowId() })}
          focusLater={focusLater}
          noun="Pole"
          addLabel="Dodaj pole"
          empty="Wniosek nie ma jeszcze pól."
          error={errors?.sections}
          renderRow={(row, update, labelId) => (
            <>
              <div className="grid gap-5 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                <Field id={labelId} label="Nazwa pola" error={rowError("sections", row.id, "label")}>
                  <Input value={row.label} onChange={(event) => update({ label: event.target.value })} maxLength={120} />
                </Field>
                <Field label="Rodzaj" error={rowError("sections", row.id, "type")}>
                  <Select
                    value={row.type}
                    onChange={(event) => update({ type: event.target.value as SectionRow["type"] })}
                  >
                    {SECTION_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {SECTION_TYPE_LABELS[type]}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
              <Field
                label="Podpowiedź dla autora"
                optional
                hint="Jedno zdanie pod nazwą pola, np. „Opisz problem, który chcesz rozwiązać.”"
                error={rowError("sections", row.id, "hint")}
              >
                <Input value={row.hint} onChange={(event) => update({ hint: event.target.value })} maxLength={300} />
              </Field>
              {row.type === "select" && (
                <Field
                  label="Odpowiedzi do wyboru"
                  hint="Każda odpowiedź w nowej linii. Co najmniej 2."
                  error={rowError("sections", row.id, "options")}
                >
                  <Textarea value={row.options} onChange={(event) => update({ options: event.target.value })} rows={4} />
                </Field>
              )}
              {hasCharLimit(row.type) && (
                <Field
                  label="Limit znaków"
                  optional
                  hint={`Puste pole oznacza ${sectionMax({ key: row.key, label: row.label, type: row.type })} znaków.`}
                  error={rowError("sections", row.id, "max")}
                  className="sm:max-w-xs"
                >
                  <Input
                    type="number"
                    value={row.max}
                    onChange={(event) => update({ max: event.target.value })}
                    min={1}
                    max={10000}
                    step={1}
                    inputMode="numeric"
                  />
                </Field>
              )}
            </>
          )}
        />
      </Section>

      <Section
        title="Kryteria oceny"
        intro="Autor widzi je jako listę do odhaczenia. Asystent AI sprawdza wniosek pod kątem każdego z nich."
      >
        <RowList
          rows={criteria}
          onChange={setCriteria}
          makeRow={() => ({ ...EMPTY_CRITERION, id: newRowId() })}
          focusLater={focusLater}
          noun="Kryterium"
          addLabel="Dodaj kryterium"
          empty="Nabór nie ma jeszcze kryteriów. Możesz go zapisać bez nich."
          error={errors?.criteria}
          renderRow={(row, update, labelId) => (
            <Field
              id={labelId}
              label="Treść kryterium"
              hint="Pełne zdanie, np. „Grupa docelowa jest wyraźnie określona.”"
              error={rowError("criteria", row.id, "label")}
            >
              <Input value={row.label} onChange={(event) => update({ label: event.target.value })} maxLength={300} />
            </Field>
          )}
        />
      </Section>

      <div className="flex flex-wrap items-center gap-4 border-t-2 border-border pt-6">
        <Button type="submit" loading={saving}>
          {!saving && <Check aria-hidden strokeWidth={2} />}
          {saving ? "Zapisuję…" : call ? "Zapisz zmiany" : "Dodaj nabór"}
        </Button>
        <p aria-live="polite" className="text-sm font-bold">
          {state?.ok === true && !saving && <span className="text-success">Zmiany zapisane.</span>}
        </p>
      </div>
    </form>
  );
}

/**
 * An ordered list of rows with add, remove and „W górę” / „W dół”. After each
 * change focus stays on a sensible control and a live region says what moved.
 */
function RowList<T extends { id: string; label: string }>({
  rows,
  onChange,
  makeRow,
  focusLater,
  noun,
  addLabel,
  empty,
  error,
  renderRow,
}: {
  rows: T[];
  onChange: (rows: T[]) => void;
  makeRow: () => T;
  focusLater: (id: string) => void;
  /** „Pole”, „Kryterium”: names a row that has no label yet. */
  noun: string;
  addLabel: string;
  empty: string;
  /** An error about the list as a whole. */
  error?: string;
  renderRow: (row: T, update: (patch: Partial<T>) => void, labelId: string) => React.ReactNode;
}) {
  const listId = useId();
  const [announcement, setAnnouncement] = useState("");
  const addId = `${listId}-add`;
  const controlId = (row: T, control: "label" | "up" | "down") => `${listId}-${row.id}-${control}`;
  const nameOf = (row: T, index: number) => (row.label.trim() ? `„${row.label.trim()}”` : `${noun} ${index + 1}`);

  function add() {
    const row = makeRow();
    onChange([...rows, row]);
    focusLater(controlId(row, "label"));
  }

  function remove(index: number) {
    const next = rows.filter((_, position) => position !== index);
    onChange(next);
    setAnnouncement(`Usunięto: ${nameOf(rows[index], index)}.`);
    const neighbour = next[index] ?? next[index - 1];
    focusLater(neighbour ? controlId(neighbour, "label") : addId);
  }

  function move(index: number, delta: -1 | 1) {
    const target = index + delta;
    if (target < 0 || target >= rows.length) return;
    const next = [...rows];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
    setAnnouncement(`${nameOf(rows[index], index)}: teraz ${target + 1}. z ${rows.length}.`);
    // At the edge the pressed button becomes disabled, so focus takes the other one.
    const pressed = delta < 0 ? "up" : "down";
    const other = delta < 0 ? "down" : "up";
    const atEdge = target === 0 || target === rows.length - 1;
    focusLater(controlId(rows[index], atEdge ? other : pressed));
  }

  return (
    <div className="flex flex-col gap-4">
      {error && <FieldError role="alert">{error}</FieldError>}
      {rows.length === 0 ? (
        <p className="text-muted-foreground">{empty}</p>
      ) : (
        <ol className="flex flex-col gap-4">
          {rows.map((row, index) => {
            const update = (patch: Partial<T>) =>
              onChange(rows.map((current) => (current.id === row.id ? { ...current, ...patch } : current)));
            return (
              <li key={row.id}>
                <fieldset className="flex min-w-0 flex-col gap-5 rounded-lg border-2 border-border bg-background p-4 sm:p-5">
                  <legend className="px-2 text-base font-bold">
                    {noun} {index + 1} z {rows.length}
                  </legend>
                  {renderRow(row, update, controlId(row, "label"))}
                  <div className="flex flex-wrap gap-3">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      id={controlId(row, "up")}
                      disabled={index === 0}
                      onClick={() => move(index, -1)}
                    >
                      <ArrowUp aria-hidden strokeWidth={2} />
                      W górę
                      <span className="sr-only">: {nameOf(row, index)}</span>
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      id={controlId(row, "down")}
                      disabled={index === rows.length - 1}
                      onClick={() => move(index, 1)}
                    >
                      <ArrowDown aria-hidden strokeWidth={2} />
                      W dół
                      <span className="sr-only">: {nameOf(row, index)}</span>
                    </Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => remove(index)}>
                      <Trash2 aria-hidden strokeWidth={2} />
                      Usuń
                      <span className="sr-only">: {nameOf(row, index)}</span>
                    </Button>
                  </div>
                </fieldset>
              </li>
            );
          })}
        </ol>
      )}
      <div>
        <Button type="button" variant="outline" id={addId} onClick={add}>
          <Plus aria-hidden strokeWidth={2} />
          {addLabel}
        </Button>
      </div>
      <p role="status" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}

function Section({ title, intro, children }: { title: string; intro?: string; children: React.ReactNode }) {
  const headingId = useId();
  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-col gap-5 rounded-lg border-2 border-border bg-card p-5 sm:p-6"
    >
      <h2 id={headingId} className="text-h3">
        {title}
      </h2>
      {intro && <p className="max-w-[68ch] text-muted-foreground">{intro}</p>}
      {children}
    </section>
  );
}
