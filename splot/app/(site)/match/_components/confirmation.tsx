"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Check, CircleCheck, Copy } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import type { SavedSubmission } from "../actions";

const noSubscription = () => () => {};

/** The page origin, read after hydration so server and client render the same first. */
function useOrigin() {
  return useSyncExternalStore(
    noSubscription,
    () => window.location.origin,
    () => "",
  );
}

/**
 * MM8: the submission is saved. Shows the case number and the tracking link,
 * which lets the person follow the status and the thread without an account.
 */
export function Confirmation({ saved }: { saved: SavedSubmission }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [copied, setCopied] = useState(false);
  const trackingUrl = `${useOrigin()}${saved.trackingUrl}`;

  // The screen replaces what was there, so focus moves to its heading.
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(trackingUrl);
      setCopied(true);
      toast({ tone: "success", title: "Skopiowano link do zgłoszenia" });
    } catch {
      toast({
        tone: "error",
        title: "Nie udało się skopiować linku",
        description: "Zaznacz link w polu i skopiuj go ręcznie.",
      });
    }
  }

  return (
    <section aria-labelledby="confirmation-heading" className="flex flex-col gap-6">
      <div className="flex items-start gap-4">
        <CircleCheck aria-hidden className="mt-1 size-10 shrink-0 text-success" strokeWidth={2} />
        <div className="grid gap-2">
          <h2
            ref={headingRef}
            id="confirmation-heading"
            tabIndex={-1}
            // Focused by script for screen readers; it is not a control, so no ring.
            className="font-display text-h2 font-bold focus-visible:shadow-none simple:text-simple-h2"
          >
            Przyjęliśmy Twoje zgłoszenie
          </h2>
          <p className="text-lead simple:text-simple-lead">
            Numer zgłoszenia:{" "}
            <strong className="font-mono whitespace-nowrap">{saved.caseNumber}</strong>
          </p>
        </div>
      </div>

      {saved.contactEmail && (
        <p>
          Potwierdzenie wyślemy na adres <strong className="break-words">{saved.contactEmail}</strong>.
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <Field
          label="Link do śledzenia zgłoszenia"
          hint="Pod tym linkiem sprawdzisz status i przeczytasz odpowiedź ROPS bez zakładania konta."
          className="flex-1"
        >
          <Input
            readOnly
            value={trackingUrl}
            className="font-mono"
            onFocus={(event) => event.currentTarget.select()}
          />
        </Field>
        <Button variant="outline" onClick={copyLink}>
          {copied ? <Check aria-hidden strokeWidth={2} /> : <Copy aria-hidden strokeWidth={2} />}
          {copied ? "Skopiowano" : "Kopiuj link"}
        </Button>
      </div>

      <Alert tone="warning" title="Zapisz ten link albo numer zgłoszenia">
        <p>Bez konta tylko ten link prowadzi do Twojego zgłoszenia. Dodaj go do zakładek albo zapisz.</p>
      </Alert>

      <div className="flex flex-wrap gap-3">
        <Button asChild size="lg">
          <Link href={saved.trackingUrl}>Zobacz status</Link>
        </Button>
      </div>
    </section>
  );
}
