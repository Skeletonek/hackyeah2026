"use client";

import { startTransition, useActionState, useEffect, useRef } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { COUNTIES } from "@/lib/labels";
import {
  saveMatchSubmission,
  type SavedSubmission,
  type SaveMatchSubmissionResult,
} from "../actions";

/** Which button opened the dialog. */
export type SaveIntent = "save" | "email" | "challenge";

const COPY: Record<
  SaveIntent,
  { title: string; description: string; submit: string; pending: string }
> = {
  save: {
    title: "Zapisz wyniki",
    description:
      "Zapiszemy opis problemu i znalezione rozwiązania. Dostaniesz numer zgłoszenia i link, pod którym je znajdziesz.",
    submit: "Zapisz wyniki",
    pending: "Zapisuję…",
  },
  email: {
    title: "Wyślij wyniki na e-mail",
    description: "Wyślemy na ten adres numer zgłoszenia i link do wyników.",
    submit: "Wyślij",
    pending: "Wysyłam…",
  },
  challenge: {
    title: "Zgłoś problem jako wyzwanie",
    description:
      "ROPS zobaczy Twój opis i sprawdzi, jak można pomóc. Dostaniesz numer zgłoszenia i link do śledzenia odpowiedzi.",
    submit: "Zgłoś wyzwanie",
    pending: "Zgłaszam…",
  },
};

type FormState = SaveMatchSubmissionResult | null;

const field = (formData: FormData, name: string) => String(formData.get(name) ?? "");

function SaveForm({
  conversationId,
  municipality,
  intent,
  onSaved,
}: {
  conversationId: string;
  municipality?: string;
  intent: SaveIntent;
  onSaved: (saved: SavedSubmission) => void;
}) {
  const copy = COPY[intent];
  const askLocation = intent !== "email";
  const formRef = useRef<HTMLFormElement>(null);

  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    async (_previous, formData) => {
      const contactEmail = field(formData, "contactEmail").trim();
      if (intent === "email" && !contactEmail) {
        return {
          ok: false,
          error: "Popraw zaznaczone pola.",
          fieldErrors: { contactEmail: ["Wpisz adres e-mail, np. jan@poczta.pl."] },
        };
      }
      const result = await saveMatchSubmission({
        conversationId,
        // „Wyślij mi na e-mail” has no location fields, so it keeps what was given earlier.
        municipality: askLocation ? field(formData, "municipality") : municipality,
        county: field(formData, "county"),
        contactEmail,
      });
      if (result.ok) onSaved(result);
      return result;
    },
    null,
  );

  const failed = state && !state.ok ? state : undefined;
  const fieldErrors = failed?.fieldErrors;

  // After a failed send, focus goes to the first field with an error.
  useEffect(() => {
    formRef.current?.querySelector<HTMLElement>("[aria-invalid='true']")?.focus();
  }, [state]);

  return (
    <form
      ref={formRef}
      noValidate
      className="grid gap-6"
      // Dispatched by hand: a form `action` would clear the fields after an error.
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(() => formAction(formData));
      }}
    >
      {failed && !fieldErrors && <Alert tone="error" title={failed.error} />}
      {askLocation && (
        <>
          <Field
            label="Gmina"
            optional
            hint="Pomoże ROPS zobaczyć, gdzie występuje problem."
            error={fieldErrors?.municipality?.[0]}
          >
            <Input
              name="municipality"
              autoComplete="address-level2"
              defaultValue={municipality}
              placeholder="np. Myślenice"
            />
          </Field>
          <Field label="Powiat" optional error={fieldErrors?.county?.[0]}>
            <Select name="county" defaultValue="">
              <option value="">Nie wybieram</option>
              {COUNTIES.map((county) => (
                <option key={county.code} value={county.code}>
                  {county.name}
                </option>
              ))}
            </Select>
          </Field>
        </>
      )}
      <Field
        label="Twój adres e-mail"
        optional={intent !== "email"}
        hint={
          intent === "email"
            ? "Nie wyślemy na niego nic poza sprawami tego zgłoszenia."
            : "Wyślemy na niego potwierdzenie i powiadomimy o odpowiedzi ROPS."
        }
        error={fieldErrors?.contactEmail?.[0]}
      >
        <Input
          name="contactEmail"
          type="email"
          autoComplete="email"
          required={intent === "email"}
          placeholder="np. jan@poczta.pl"
        />
      </Field>
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline">Anuluj</Button>
        </DialogClose>
        <Button type="submit" loading={isPending}>
          {isPending ? copy.pending : copy.submit}
        </Button>
      </DialogFooter>
    </form>
  );
}

/**
 * The small form before a matchmaking conversation becomes a submission:
 * optional municipality and county, and the e-mail address („Wyślij mi na
 * e-mail” requires it). Saving twice returns the same submission.
 */
export function SaveDialog({
  conversationId,
  municipality,
  intent,
  open,
  onOpenChange,
  onSaved,
}: {
  conversationId: string;
  /** Given on the entry screen (`/municipalities`); prefills the field. */
  municipality?: string;
  intent: SaveIntent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (saved: SavedSubmission) => void;
}) {
  const copy = COPY[intent];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>
        {/* Mounted only while open, so every opening starts with a clean form. */}
        <SaveForm
          conversationId={conversationId}
          municipality={municipality}
          intent={intent}
          onSaved={(saved) => {
            onOpenChange(false);
            onSaved(saved);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
