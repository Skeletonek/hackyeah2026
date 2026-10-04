import type { Metadata } from "next";
import { loadConversationMessages } from "@/lib/ai/conversations";
import { callParam, ideaValues, stepParam } from "@/lib/ideas/card";
import { getCurrentUser } from "@/lib/auth";
import { getIdea, getIdeaSubmission, getOpenGrantCall } from "@/lib/ideas/queries";
import { submissionHref } from "@/lib/submissions/on-created";
import { createClient } from "@/lib/supabase/server";
import { IdeaNotFound } from "../_components/idea-not-found";
import { IdeaSummary } from "../_components/idea-summary";
import { IdeaWizard } from "../_components/idea-wizard";
import { IdeaWizardShell } from "../_components/idea-wizard-shell";
import { AssistantPanel } from "./_components/assistant-panel";

const TITLE = "Fiszka pomysłu";

export const metadata: Metadata = {
  title: TITLE,
  // A private draft: nothing here is for search engines.
  robots: { index: false, follow: false },
};

export default async function Page({ params, searchParams }: PageProps<"/ideas/[id]">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const idea = await getIdea(id);

  if (!idea) return <IdeaNotFound loginNext={`/ideas/${id}`} />;

  const step = stepParam(query.step);
  const call = callParam(query.call);

  const assistant = (
    <AssistantPanel
      ideaId={idea.id}
      step={step}
      snapshot={ideaValues(idea)}
      conversationId={idea.conversation_id}
      initialMessages={
        idea.conversation_id ? await loadConversationMessages("idea-assistant", idea.conversation_id) : []
      }
    />
  );

  if (step === 4) {
    const [openCall, sent, user] = await Promise.all([
      getOpenGrantCall(call),
      getIdeaSubmission(await createClient(), idea.id),
      getCurrentUser(),
    ]);
    return (
      <IdeaWizardShell title={TITLE} step={step} id={idea.id} call={call} assistant={assistant}>
        <IdeaSummary
          idea={idea}
          call={openCall}
          submission={
            sent && { caseNumber: sent.case_number, href: submissionHref(sent, user?.isAnonymous ?? true) }
          }
          sendFailed={query.send === "failed"}
        />
      </IdeaWizardShell>
    );
  }

  return (
    <IdeaWizardShell title={TITLE} step={step} id={idea.id} call={call} assistant={assistant}>
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
