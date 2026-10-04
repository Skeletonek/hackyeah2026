import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Eye } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { cardCellTexts, isCanvasEmpty, parseCanvas } from "@/lib/ideas/canvas";
import { ideaCanvasHref, ideaStepHref } from "@/lib/ideas/card";
import { getIdea, getIdeaSubmission } from "@/lib/ideas/queries";
import { submissionHref } from "@/lib/submissions/on-created";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { IdeaNotFound } from "../../_components/idea-not-found";
import { PrintButton } from "../../_components/print-button";
import { SendIdeaButton } from "../../_components/send-idea-button";
import { sendIdeaToRops } from "../../actions";
import { CanvasBoard } from "./_components/canvas-board";
import styles from "./_components/canvas.module.css";

const TITLE = "Kanwa Innowacji Społecznych";

export const metadata: Metadata = {
  title: TITLE,
  // A private draft: nothing here is for search engines.
  robots: { index: false, follow: false },
};

export default async function Page({ params }: PageProps<"/ideas/[id]/canvas">) {
  const { id } = await params;
  const idea = await getIdea(id);
  if (!idea) return <IdeaNotFound loginNext={ideaCanvasHref(id)} />;

  const [sent, user] = await Promise.all([getIdeaSubmission(await createClient(), idea.id), getCurrentUser()]);
  // RLS also shows admins other people's cards; only the author changes the canvas.
  const isAuthor = user?.id === idea.user_id;
  const canvas = parseCanvas(idea.canvas);

  return (
    <main
      id="main-content"
      className={cn("mx-auto flex w-full max-w-[1376px] flex-col gap-6 px-4 py-8 sm:px-8", styles.page)}
    >
      <Button asChild variant="link" className={cn("self-start", styles.noPrint)}>
        <Link href={ideaStepHref(idea.id, 4)}>
          <ArrowLeft aria-hidden strokeWidth={2} />
          Wróć do fiszki
        </Link>
      </Button>

      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="min-w-0 flex-[1_1_32rem]">
          <h1 className="flex flex-col gap-1">
            <span className="text-base font-bold text-primary simple:text-simple-base">{TITLE}</span>
            <span className="text-h1 simple:text-simple-h1">{idea.title}</span>
          </h1>
          <p className={cn("mt-2 max-w-[64ch] text-muted-foreground", styles.noPrint)}>
            Kanwę wypełniliśmy z Twojej fiszki. Pola od AI to propozycje: sprawdź je i popraw.
          </p>
        </div>
        <div className={cn("flex flex-col gap-3 sm:flex-row sm:flex-wrap", styles.noPrint)}>
          <PrintButton />
          {sent ? (
            <Button asChild size="lg" variant="outline">
              <Link href={submissionHref(sent, user?.isAnonymous ?? true)}>
                <Eye aria-hidden strokeWidth={2} />
                Zobacz zgłoszenie
              </Link>
            </Button>
          ) : (
            isAuthor && (
              <form action={sendIdeaToRops.bind(null, idea.id)} className="contents">
                <SendIdeaButton variant="outline" />
              </form>
            )
          )}
        </div>
      </div>

      {!isAuthor && (
        <Alert tone="info" title="Oglądasz kanwę autora" className={styles.noPrint}>
          <p>Pola kanwy zmienia tylko autor pomysłu.</p>
        </Alert>
      )}

      <CanvasBoard
        ideaId={idea.id}
        cardTexts={cardCellTexts(idea)}
        initialCanvas={canvas}
        editable={isAuthor}
        fillOnOpen={isAuthor && isCanvasEmpty(canvas)}
      />
    </main>
  );
}
