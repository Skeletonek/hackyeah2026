import type { Metadata } from "next";
import Link from "next/link";
import { safePath } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Logowanie" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;

  return (
    <main id="main-content" className="mx-auto flex w-full max-w-[1200px] flex-wrap items-start gap-10 px-4 py-16 sm:px-8">
      <section className="min-w-0 max-w-[640px] flex-[999_1_520px] rounded-lg border bg-card p-6 shadow-sm sm:p-10">
        <LoginForm nextPath={safePath(next)} />
      </section>
      <aside className="min-w-0 flex-[1_1_320px] rounded-lg bg-secondary p-8 text-secondary-foreground">
        <h2 className="text-h3">Nie masz konta? Nie szkodzi.</h2>
        <p className="mt-3">
          Problem albo pomysł możesz zgłosić bez logowania. Dostaniesz numer zgłoszenia, po którym
          sprawdzisz, co się z nim dzieje.
        </p>
        <Link href="/match" className="mt-4 inline-flex min-h-11 items-center font-bold underline underline-offset-4">
          Opisz problem bez logowania
        </Link>
      </aside>
    </main>
  );
}
