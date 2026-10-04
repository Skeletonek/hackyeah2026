import Link from "next/link";
import { Button } from "@/components/ui/button";

/** Shown when the idea card does not exist or belongs to someone else. */
export function IdeaNotFound({ loginNext }: { /** Where to come back after signing in. */ loginNext: string }) {
  return (
    <main id="main-content" className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-4 py-10 sm:px-8">
      <div className="flex w-full max-w-[760px] flex-col gap-6">
        <h1 className="text-h1 simple:text-simple-h1">Nie znaleźliśmy tej fiszki</h1>
        <p className="text-lead text-muted-foreground simple:text-simple-lead">
          Szkic otworzy się tylko w przeglądarce, w której powstał, albo po zalogowaniu na konto autora.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/ideas/new">Opisz nowy pomysł</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/login?next=${encodeURIComponent(loginNext)}`}>Zaloguj się</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
