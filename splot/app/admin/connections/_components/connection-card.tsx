import Link from "next/link";
import { ArrowRight, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CHALLENGE_CATEGORY_LABELS } from "@/lib/labels";
import type { ConnectionRequest } from "@/lib/admin/connections";
import { acceptConnection, dismissConnection } from "../actions";

export function ConnectionCard({ request }: { request: ConnectionRequest }) {
  return (
    <li className="flex flex-col gap-5 rounded-lg border-2 border-border bg-card p-5 kontrast:border-2">
      <div className="grid gap-5 md:grid-cols-2">
        <SubmissionSideCard side={request.from} label="Zgłoszenie źródłowe" />
        <SubmissionSideCard side={request.to} label="Proponowane połączenie" />
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3">
        <form action={dismissConnection}>
          <input type="hidden" name="requestId" value={request.id} />
          <Button type="submit" variant="outline">
            <X aria-hidden className="size-5" strokeWidth={2} />
            Odrzuć
          </Button>
        </form>
        <form action={acceptConnection}>
          <input type="hidden" name="requestId" value={request.id} />
          <Button type="submit">
            <Check aria-hidden className="size-5" strokeWidth={2} />
            Połącz
          </Button>
        </form>
      </div>
    </li>
  );
}

function SubmissionSideCard({
  side,
  label,
}: {
  side: ConnectionRequest["from"];
  label: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-md border border-border bg-background p-4 kontrast:border-2">
      <p className="text-sm font-bold text-muted-foreground">{label}</p>
      <div className="flex flex-col gap-1">
        <Link
          href={`/admin/submissions/${side.id}`}
          className="w-fit text-lg font-bold text-primary underline underline-offset-4 hover:decoration-[3px]"
        >
          {side.caseNumber}
          <ArrowRight aria-hidden className="ml-1 inline size-4" strokeWidth={2} />
        </Link>
        <p className="text-sm text-muted-foreground">
          {side.municipality ?? "—"}
          {side.county ? `, ${side.county}` : null}
        </p>
        {side.category && (
          <p className="text-sm font-bold">{CHALLENGE_CATEGORY_LABELS[side.category]}</p>
        )}
      </div>
      {side.aiSummary && (
        <p className="text-sm text-muted-foreground">
          <span className="font-bold text-foreground">AI:</span> {side.aiSummary}
        </p>
      )}
    </div>
  );
}
