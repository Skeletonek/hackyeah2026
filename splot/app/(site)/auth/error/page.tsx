import Link from "next/link";

const MESSAGES: Record<string, string> = {
  expired: "Link wygasł. Działa 15 minut i tylko raz.",
  invalid: "Ten link nie działa. Może został już użyty albo jest niepełny.",
};

export default async function AuthErrorPage({ searchParams }: PageProps<"/auth/error">) {
  const { reason } = await searchParams;
  const message = (typeof reason === "string" && MESSAGES[reason]) || MESSAGES.invalid;

  return (
    <main id="main-content" className="mx-auto flex w-full max-w-[640px] flex-col gap-6 px-4 py-16 sm:px-8">
      <h1 className="text-h1">Nie udało się zalogować</h1>
      <div role="alert" className="rounded-lg border-l-4 border-error bg-error-soft p-5">
        <p>{message}</p>
      </div>
      <Link
        href="/login"
        className="inline-flex min-h-16 items-center justify-center rounded-md bg-primary px-6 text-lg font-bold text-primary-foreground hover:bg-primary-hover"
      >
        Wyślij nowy link
      </Link>
    </main>
  );
}
