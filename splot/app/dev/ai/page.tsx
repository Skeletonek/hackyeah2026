import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { loadConversationMessages } from "@/lib/ai/conversations";
import { EchoChat } from "./_components/echo-chat";

export const metadata: Metadata = {
  title: "Echo – test lib/ai",
  robots: { index: false },
};

/** Dev-only page for the echo Skill; delete together with `/api/agent/echo`. */
export default async function DevAiPage({ searchParams }: PageProps<"/dev/ai">) {
  if (process.env.NODE_ENV === "production") notFound();

  // The conversation id lives in the URL, so a reload resumes it.
  const { c } = await searchParams;
  const id = z.uuid().safeParse(c);
  if (!id.success) redirect(`/dev/ai?c=${crypto.randomUUID()}`);

  const initialMessages = await loadConversationMessages("echo", id.data);

  return (
    <main id="main-content" className="mx-auto flex w-full max-w-[640px] flex-col gap-6 px-4 py-10 sm:px-8">
      <h1 className="text-h2 font-bold">Echo – test lib/ai</h1>
      <p className="text-muted-foreground">
        Napisz cokolwiek albo poproś: „zadaj mi pytanie”. Odśwież stronę, żeby sprawdzić, czy
        rozmowa wraca.
      </p>
      <EchoChat conversationId={id.data} initialMessages={initialMessages} />
    </main>
  );
}
