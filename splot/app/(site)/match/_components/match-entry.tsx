"use client";

import { useId, useRef, useState } from "react";
import { Search } from "lucide-react";
import { MicButton } from "@/components/mic-button";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { MatchCopy, MatchExample } from "@/lib/matchmaking/copy";

/** Same cap as one message part in the Skill handler would allow, kept short on purpose. */
const MAX_LENGTH = 2000;

/**
 * MM1 + MM2: one field for the problem, dictation and example descriptions.
 * The only screen with a `MicButton`. A municipality official is asked for
 * the municipality here, before the conversation starts.
 */
export function MatchEntry({
  copy,
  askMunicipality,
  onSubmit,
}: {
  copy: MatchCopy;
  askMunicipality: boolean;
  onSubmit: (text: string, municipality?: string) => void;
}) {
  const fieldId = useId();
  const examplesId = useId();
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState("");
  const [municipality, setMunicipality] = useState("");
  const [error, setError] = useState<string>();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const problem = text.trim();
    if (!problem) {
      setError("Opisz problem w co najmniej jednym zdaniu.");
      fieldRef.current?.focus();
      return;
    }
    onSubmit(problem, municipality.trim() || undefined);
  };

  const fill = (example: MatchExample) => {
    setText(example.text);
    setError(undefined);
    fieldRef.current?.focus();
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {askMunicipality && (
        <Field label="Gmina" optional hint="Dopasujemy podpowiedzi do Twojej gminy.">
          <Input
            name="municipality"
            autoComplete="address-level2"
            value={municipality}
            maxLength={100}
            onChange={(event) => setMunicipality(event.target.value)}
            placeholder="np. Myślenice"
          />
        </Field>
      )}

      <Field id={fieldId} label={copy.fieldLabel} hint={copy.fieldHint} error={error}>
        <Textarea
          ref={fieldRef}
          name="problem"
          rows={5}
          value={text}
          maxLength={MAX_LENGTH}
          onChange={(event) => {
            setText(event.target.value);
            setError(undefined);
          }}
          className="min-h-40 simple:min-h-56"
        />
      </Field>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <MicButton targetId={fieldId} withLabel />
        <Button type="submit" size="lg" className="w-full sm:w-auto">
          <Search aria-hidden strokeWidth={2} />
          Szukaj rozwiązań
        </Button>
      </div>

      {/* Simple mode keeps one task on the screen. */}
      <section aria-labelledby={examplesId} className="flex flex-col gap-3 simple:hidden">
        <h2 id={examplesId} className="text-h4">
          Nie wiesz, jak zacząć? Wybierz przykład
        </h2>
        <ul className="flex flex-col gap-3">
          {copy.examples.map((example) => (
            <li key={example.label}>
              <Button
                variant="outline"
                onClick={() => fill(example)}
                className="w-full justify-start text-left font-normal whitespace-normal"
              >
                {example.label}
              </Button>
            </li>
          ))}
        </ul>
      </section>
    </form>
  );
}
