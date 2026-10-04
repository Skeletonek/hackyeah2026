import type { Metadata } from "next";
import { callParam, EMPTY_IDEA_VALUES } from "@/lib/ideas/card";
import { IDEA_LIMITS } from "@/lib/ideas/schema";
import { IdeaWizard } from "../_components/idea-wizard";
import { IdeaWizardShell } from "../_components/idea-wizard-shell";

const TITLE = "Mam pomysł";

export const metadata: Metadata = { title: TITLE };

export default async function Page({ searchParams }: PageProps<"/ideas/new">) {
  const params = await searchParams;
  const call = callParam(params.call);
  // Matchmaking found nothing (MM7): the description of the problem comes along.
  const prefill = typeof params.prefill === "string" ? params.prefill.trim().slice(0, IDEA_LIMITS.problem) : "";

  return (
    <IdeaWizardShell title={TITLE} step={1} call={call}>
      <IdeaWizard step={1} call={call} initial={{ ...EMPTY_IDEA_VALUES, problem: prefill }} />
    </IdeaWizardShell>
  );
}
