"use client";

import { useActionState, useCallback, useEffect, useId, useRef, useState, useTransition } from "react";
import { Sparkles } from "lucide-react";
import { fillFromSource, type InnovationFillState } from "@/app/admin/library/actions";
import { AiHint } from "@/components/ai/ai-hint";
import { AiThinking } from "@/components/ai/ai-thinking";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { InnovationFill } from "@/lib/admin/innovation-fill";
import { InnovationForm } from "../../_components/innovation-form";

/**
 * The new-innovation editor with „Wypełnij pola z AI” above it. A fill
 * remounts the form with the proposal as its starting values; nothing is
 * saved until the admin clicks „Dodaj innowację”.
 */
export function NewInnovationEditor() {
  const [fill, setFill] = useState<{ fill: InnovationFill; version: number } | null>(null);
  const onFill = useCallback(
    (next: InnovationFill) => setFill((current) => ({ fill: next, version: (current?.version ?? 0) + 1 })),
    [],
  );

  return (
    <>
      <AiFill onFill={onFill} />
      <InnovationForm key={fill?.version ?? 0} innovation={null} prefill={fill?.fill} />
    </>
  );
}

function AiFill({ onFill }: { onFill: (fill: InnovationFill) => void }) {
  const [state, formAction, pending] = useActionState<InnovationFillState, FormData>(fillFromSource, null);
  const [, startFill] = useTransition();
  const headingId = useId();
  const resultRef = useRef<HTMLDivElement>(null);
  const errors = state?.ok === false ? state.fieldErrors : undefined;

  // Submitted by hand (not `<form action>`), so a failed fill keeps the link typed.
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startFill(() => formAction(formData));
  }

  // Hand the proposal to the form once per answer, then move focus to the summary.
  useEffect(() => {
    if (!state) return;
    if (state.ok) onFill(state.fill);
    resultRef.current?.focus();
  }, [state, onFill]);

  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-col gap-5 rounded-lg border-2 border-border bg-card p-5 sm:p-6"
    >
      <div className="flex flex-col gap-2">
        <h2 id={headingId} className="text-h3">
          Wypełnij z PDF lub linku
        </h2>
        <p className="max-w-[68ch] text-muted-foreground">
          Wklej link do strony z opisem innowacji albo dodaj jej folder PDF. AI wypełni tytuł, opis, kategorie i
          etap. Pola wypełnione przez AI mają znak „AI”. Sprawdź je i popraw. Nic nie zapiszemy, dopóki nie
          klikniesz „Dodaj innowację”.
        </p>
      </div>

      <form onSubmit={submit} noValidate className="flex flex-col gap-5">
        <Field
          label="Link do strony lub pliku PDF"
          optional
          hint="Na przykład strona innowacji w Bibliotece ROPS."
          error={errors?.url?.[0]}
        >
          <Input
            type="url"
            name="url"
            inputMode="url"
            autoComplete="url"
            placeholder="https://"
          />
        </Field>
        <Field
          label="Albo plik PDF z komputera"
          optional
          hint="Do 8 MB. Plik czytamy tylko raz i nie zapisujemy go. Jeśli dodasz plik, link pominiemy."
          error={errors?.file?.[0]}
        >
          <Input
            type="file"
            name="file"
            accept="application/pdf,.pdf"
            className="cursor-pointer file:mr-4 file:min-h-9 file:cursor-pointer file:rounded-md file:border-2 file:border-input file:bg-muted file:px-3 file:font-bold file:text-foreground"
          />
        </Field>
        <div>
          <Button type="submit" variant="outline" loading={pending}>
            {!pending && <Sparkles aria-hidden strokeWidth={2} />}
            Wypełnij pola z AI
          </Button>
        </div>
      </form>

      {pending && <AiThinking label="Czytam materiał i wypełniam pola…" />}

      {!pending && state && (
        <div ref={resultRef} tabIndex={-1} className="rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring">
          {state.ok ? (
            <AiHint targetType="innovation_fill" targetId="new">
              <p role="status">
                Wypełniono pola z „{state.source}”. Pola ze znakiem „AI” sprawdź i popraw. Znak znika, gdy zmienisz
                pole. Adres e-mail i numery telefonów pominęliśmy.
              </p>
            </AiHint>
          ) : (
            <Alert tone="error" title={state.error} />
          )}
        </div>
      )}
    </section>
  );
}
