import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Pagination } from "@/components/pagination";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { parsePage } from "@/lib/pagination";
import { listParticipantThreads, participantThreadsHref } from "@/lib/threads/queries";
import { ThreadList } from "./_components/thread-list";

const TITLE = "Wiadomości";

export const metadata: Metadata = { title: TITLE };

/** KOM3: all threads the user participates in, sorted by the last message. */
export default async function MessagesPage({ searchParams }: PageProps<"/account/messages">) {
  const user = await requireUser("/account/messages");
  const threads = await listParticipantThreads(user.id, parsePage(await searchParams));

  return (
    <main id="main-content" className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-4 py-10 sm:px-8">
      <h1 className="text-h1">{TITLE}</h1>

      {threads.total === 0 ? (
        <EmptyState
          title="Nie masz jeszcze wiadomości"
          action={
            <Button asChild>
              <Link href="/match">
                Opisz problem
                <ArrowRight aria-hidden className="size-5" strokeWidth={2} />
              </Link>
            </Button>
          }
        >
          Gdy ROPS odpowie na Twoje zgłoszenie lub połączy Cię z innym autorem, pojawi się tu
          rozmowa.
        </EmptyState>
      ) : (
        <>
          <ThreadList threads={threads.items} />
          <Pagination page={threads} href={participantThreadsHref} label="Strony wiadomości" />
        </>
      )}
    </main>
  );
}
