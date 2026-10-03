"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircleQuestion } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { saveMatchSubmission } from "../actions";

/**
 * „Zapytaj eksperta”: saves the conversation as a submission and opens its
 * thread with ROPS. Without an account the thread is under the tracking link,
 * because `/account` needs a sign-in.
 */
export function ResultsExpert({ conversationId, hasAccount }: { conversationId: string; hasAccount: boolean }) {
  const headingId = useId();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  async function ask() {
    setPending(true);
    setError(undefined);
    try {
      const result = await saveMatchSubmission({ conversationId });
      if (result.ok) {
        router.push(hasAccount ? `/account/submissions/${result.id}` : result.trackingUrl);
        return;
      }
      setError(result.error);
    } catch {
      setError("Nie udało się zapisać zgłoszenia. Spróbuj jeszcze raz za chwilę.");
    }
    setPending(false);
  }

  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-col gap-4 rounded-lg bg-secondary p-6 text-secondary-foreground kontrast:border-2 kontrast:border-secondary-foreground simple:gap-6 simple:p-8"
    >
      <div className="flex flex-col gap-1">
        <h3 id={headingId} className="text-h3 simple:text-simple-h3">
          Nie wiesz, co wybrać?
        </h3>
        <p>Zapiszemy Twój opis jako zgłoszenie i otworzymy rozmowę, w której odpowie pracownik ROPS.</p>
      </div>
      {error && <Alert tone="error" title={error} />}
      <div>
        <Button loading={pending} onClick={ask} className="simple:w-full">
          <MessageCircleQuestion aria-hidden strokeWidth={2} />
          Zapytaj eksperta
        </Button>
      </div>
    </section>
  );
}
