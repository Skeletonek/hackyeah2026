import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { callParam, ideaValues, stepParam } from "@/lib/ideas/card";
import { getIdea, getOpenGrantCall } from "@/lib/ideas/queries";
import { IdeaSummary } from "../_components/idea-summary";
import { IdeaWizard } from "../_components/idea-wizard";
import { IdeaWizardShell } from "../_components/idea-wizard-shell";

const TITLE = "Fiszka pomysłu";

export const metadata: Metadata = {
  title: TITLE,
  // A private draft: nothing here is for search engines.
  robots: { index: false, follow: false },
};

export default async function Page({ params, searchParams }: PageProps<"/ideas/[id]">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const idea = await getIdea(id);

  if (!idea) {
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
              <Link href={`/login?next=${encodeURIComponent(`/ideas/${id}`)}`}>Zaloguj się</Link>
            </Button>
          </div>
        </div>
      </main>
    );
  }

  const step = stepParam(query.step);
  const call = callParam(query.call);

  if (step === 4) {
    const openCall = await getOpenGrantCall(call);
    return (
      <IdeaWizardShell title={TITLE} step={step} id={idea.id} call={call}>
        <IdeaSummary idea={idea} call={openCall} />
      </IdeaWizardShell>
    );
  }

  return (
    <IdeaWizardShell title={TITLE} step={step} id={idea.id} call={call}>
      {/* The key gives every step its own form state. */}
      <IdeaWizard
        key={step}
        step={step}
        id={idea.id}
        call={call}
        initial={ideaValues(idea)}
        justSaved={query.saved === "1"}
      />
    </IdeaWizardShell>
  );
}
