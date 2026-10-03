"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { sendMagicLink, type LoginState } from "./actions";

const INITIAL_STATE: LoginState = { status: "idle" };

export function LoginForm({ nextPath }: { nextPath: string }) {
  const [state, formAction, isPending] = useActionState(sendMagicLink, INITIAL_STATE);

  if (state.status === "sent") {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-h1">Sprawdź swoją pocztę</h1>
        <Alert tone="success" title={`Wysłaliśmy link na adres ${state.email}`}>
          <p>Otwórz wiadomość od Splotu i kliknij przycisk „Zaloguj się”. Link działa 15 minut.</p>
        </Alert>
        <form action={formAction}>
          <input type="hidden" name="email" value={state.email} />
          <input type="hidden" name="next" value={nextPath} />
          <Button type="submit" variant="outline" loading={isPending}>
            Wyślij link jeszcze raz
          </Button>
        </form>
      </div>
    );
  }

  const error = state.status === "error" ? state.error : undefined;

  return (
    <form action={formAction} noValidate className="flex flex-col gap-6">
      <div>
        <h1 className="text-h1">Zaloguj się bez hasła</h1>
        <p className="mt-3 text-muted-foreground">
          Wpisz swój e-mail. Wyślemy Ci link, który zaloguje Cię jednym kliknięciem.
        </p>
      </div>
      <input type="hidden" name="next" value={nextPath} />
      <Field label="Twój adres e-mail" hint="Na ten adres wyślemy link do logowania." error={error}>
        <Input
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state.email}
          placeholder="np. jan@poczta.pl"
        />
      </Field>
      <Button type="submit" size="lg" loading={isPending}>
        {isPending ? "Wysyłam link…" : "Wyślij link do logowania"}
      </Button>
      <p className="text-sm text-muted-foreground">
        Link działa 15 minut. Nie widzisz wiadomości? Sprawdź folder „Spam”.
      </p>
    </form>
  );
}
