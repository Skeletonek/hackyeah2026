import Link from "next/link";
import { MessageSquare, MailOpen } from "lucide-react";
import { formatDateTime } from "@/lib/dates";
import type { InboxThread } from "@/lib/threads/queries";

const PARTNERSHIP_PREFIX = "Partnerstwo:";

function threadHref(thread: InboxThread): string {
  if (!thread.submissionId) return "#";
  const isPartnership = thread.subject.startsWith(PARTNERSHIP_PREFIX);
  return isPartnership
    ? `/account/submissions/${thread.submissionId}?thread=${thread.id}`
    : `/account/submissions/${thread.submissionId}`;
}

export function ThreadList({ threads }: { threads: InboxThread[] }) {
  return (
    <ul className="flex flex-col gap-4">
      {threads.map((thread) => {
        const hasReplyFromRops = thread.lastMessage ? !thread.lastMessage.isOwn : false;
        return (
          <li key={thread.id}>
            <Link
              href={threadHref(thread)}
              className="group flex flex-col gap-2 rounded-lg border-2 border-border bg-card p-5 transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <h2 className="text-lg font-bold leading-tight group-hover:underline group-hover:underline-offset-4">
                    {thread.subject}
                  </h2>
                  {thread.caseNumber && (
                    <p className="font-mono text-sm text-muted-foreground">{thread.caseNumber}</p>
                  )}
                </div>
                {hasReplyFromRops && (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-sm font-bold text-primary">
                    <MailOpen aria-hidden className="size-4" strokeWidth={2} />
                    Nowa odpowiedź od ROPS
                  </span>
                )}
              </div>

              {thread.lastMessage ? (
                <div className="flex items-start gap-3 text-muted-foreground">
                  <MessageSquare aria-hidden className="mt-0.5 size-4 shrink-0" strokeWidth={2} />
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <p className="line-clamp-2 text-sm">{thread.lastMessage.body}</p>
                    <p className="text-xs">
                      <time dateTime={thread.lastMessage.createdAt}>
                        {formatDateTime(thread.lastMessage.createdAt)}
                      </time>
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Brak wiadomości w tym wątku.</p>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
