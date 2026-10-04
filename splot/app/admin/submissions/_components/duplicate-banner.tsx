"use client";

import { useActionState } from "react";
import Link from "next/link";
import { dismissDuplicate, type DetailActionState } from "@/app/admin/submissions/actions";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormResult } from "./form-result";

const caseLinkClassName =
  "inline-flex min-h-11 items-center font-mono font-bold underline underline-offset-4";

type CaseRef = { id: string; case_number: string };

/** AI flagged a possible duplicate; ROPS leaves the flag or dismisses it. */
export function DuplicateBanner({ submission, duplicate }: { submission: CaseRef; duplicate: CaseRef }) {
  const [state, formAction, pending] = useActionState<DetailActionState, FormData>(
    dismissDuplicate,
    null,
  );

  return (
    <Alert
      tone="warning"
      title="Możliwy duplikat"
      action={
        <form action={formAction} className="flex flex-wrap items-center gap-3">
          <input type="hidden" name="id" value={submission.id} />
          <Button type="submit" variant="outline" size="sm" loading={pending}>
            {pending ? "Odrzucam…" : "Odrzuć"}
          </Button>
          <FormResult state={state} done="Oznaczenie usunięte." />
        </form>
      }
    >
      <p>
        Zgłoszenia{" "}
        <Link href={`/admin/submissions/${submission.id}`} className={caseLinkClassName}>
          {submission.case_number}
        </Link>{" "}
        i{" "}
        <Link href={`/admin/submissions/${duplicate.id}`} className={caseLinkClassName}>
          {duplicate.case_number}
        </Link>{" "}
        mogą opisywać ten sam problem. Wybierz „Odrzuć”, jeśli to różne sprawy.
      </p>
    </Alert>
  );
}
