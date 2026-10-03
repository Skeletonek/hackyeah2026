"use client";

import { useActionState } from "react";
import { sendMagicLink, type LoginState } from "./actions";

const INITIAL_STATE: LoginState = { status: "idle" };

export function LoginForm({ nextPath }: { nextPath: string }) {
  const [state, formAction, isPending] = useActionState(sendMagicLink, INITIAL_STATE);

  if (state.status === "sent") {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-h1">Sprawdź swoją pocztę</h1>
        <div role="status" className="rounded-lg border-l-4 border-success bg-success-soft p-5">
          <p className="font-bold">Wysłaliśmy link na adres {state.email}</p>
          <p>Otwórz wiadomość od Splotu i kliknij przycisk „Zaloguj się”. Link działa 15 minut.</p>
        </div>
        <form action={formAction}>
          <input type="hidden" name="email" value={state.email} />
          <input type="hidden" name="next" value={nextPath} />
          <button
            type="submit"
            disabled={isPending}
            className="min-h-[52px] rounded-md border-2 border-primary px-5 font-bold text-primary hover:bg-secondary disabled:opacity-60"
          >
            Wyślij link jeszcze raz
          </button>
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
      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="font-bold">
          Twój adres e-mail
        </label>
        <p id="email-hint" className="text-sm text-muted-foreground">
          Na ten adres wyślemy link do logowania.
        </p>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state.email}
          placeholder="np. jan@poczta.pl"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "email-hint email-error" : "email-hint"}
          className="min-h-[52px] rounded-md border-2 border-input bg-card px-4 aria-invalid:border-error"
        />
        {error && (
          <p id="email-error" className="font-bold text-error">
            {error}
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="min-h-16 rounded-md bg-primary px-6 text-lg font-bold text-primary-foreground hover:bg-primary-hover disabled:opacity-60"
      >
        {isPending ? "Wysyłam link…" : "Wyślij link do logowania"}
      </button>
      <p className="text-sm text-muted-foreground">
        Link działa 15 minut. Nie widzisz wiadomości? Sprawdź folder „Spam”.
      </p>
    </form>
  );
}
