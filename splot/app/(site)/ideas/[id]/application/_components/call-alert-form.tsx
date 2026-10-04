"use client";

import { useActionState, useState } from "react";
import { Bell } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { requestCallAlert, type CallAlertState } from "../actions";

/** „Powiadom mnie”: leaves an e-mail for the day ROPS opens a grant call. */
export function CallAlertForm({
  ideaId,
  defaultEmail,
  subscribed,
}: {
  ideaId: string;
  /** The account's address; empty for an anonymous session. */
  defaultEmail: string;
  /** This person already asked for the alert. */
  subscribed: boolean;
}) {
  const [state, action, pending] = useActionState<CallAlertState, FormData>(requestCallAlert.bind(null, ideaId), null);
  // Controlled, so the address stays in the field when the action reports an error.
  const [email, setEmail] = useState(defaultEmail);

  if (subscribed || (state && "ok" in state)) {
    return (
      <Alert tone="success" title="Damy Ci znać o nowym naborze" className="w-full text-left">
        <p>Napiszemy na podany adres, gdy ROPS ogłosi nabór. Fiszka poczeka na Ciebie w tym miejscu.</p>
      </Alert>
    );
  }

  const error = state && "error" in state ? state : null;

  return (
    <form action={action} noValidate className="flex w-full max-w-[32rem] flex-col gap-3 text-left text-foreground">
      <Field
        label="Twój e-mail"
        hint="Napiszemy tylko wtedy, gdy ROPS ogłosi nowy nabór."
        error={error?.fieldErrors?.email?.[0] ?? (error && !error.fieldErrors ? error.error : undefined)}
      >
        <Input
          type="email"
          name="email"
          autoComplete="email"
          value={email}
          maxLength={254}
          required
          onChange={(event) => setEmail(event.target.value)}
        />
      </Field>
      <Button type="submit" loading={pending} className="self-start simple:w-full">
        {!pending && <Bell aria-hidden strokeWidth={2} />}
        Powiadom mnie
      </Button>
    </form>
  );
}
