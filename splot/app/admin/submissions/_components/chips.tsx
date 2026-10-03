import {
  CircleCheck,
  Copy,
  Eye,
  Hourglass,
  Inbox,
  MessageSquare,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";
import {
  PRIORITY_LABELS,
  SUBMISSION_KIND_LABELS,
  SUBMISSION_STATUS_LABELS,
  type Priority,
  type SubmissionKind,
  type SubmissionStatus,
} from "@/lib/labels";
import { cn } from "@/lib/utils";

const chipClassName =
  "inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-sm font-bold kontrast:border-current";

const STATUS: Record<SubmissionStatus, { icon: LucideIcon; className: string }> = {
  received: { icon: Inbox, className: "border-info bg-info-soft text-info" },
  in_review: { icon: Eye, className: "border-secondary bg-secondary text-secondary-foreground" },
  with_expert: { icon: Stethoscope, className: "border-warning bg-warning-soft text-warning" },
  answered: { icon: MessageSquare, className: "border-success bg-success-soft text-success" },
  closed: { icon: CircleCheck, className: "border-border bg-muted text-muted-foreground" },
};

/** Status as icon + word, so the colour is never the only carrier. */
export function StatusChip({ status }: { status: SubmissionStatus }) {
  const { icon: Icon, className } = STATUS[status];
  return (
    <span className={cn(chipClassName, className)}>
      <Icon aria-hidden className="size-5 shrink-0 simple:size-6" strokeWidth={2} />
      {SUBMISSION_STATUS_LABELS[status]}
    </span>
  );
}

const PRIORITY_TONE: Record<Priority, string> = {
  high: "border-error bg-error-soft text-error",
  medium: "border-warning bg-warning-soft text-warning",
  low: "border-border bg-muted text-muted-foreground",
};

export function PriorityChip({ priority }: { priority: Priority }) {
  return (
    <span className={cn(chipClassName, PRIORITY_TONE[priority])}>
      {PRIORITY_LABELS[priority]} priorytet
    </span>
  );
}

export function KindChip({ kind }: { kind: SubmissionKind }) {
  return (
    <span className={cn(chipClassName, "border-border bg-card text-foreground")}>
      {SUBMISSION_KIND_LABELS[kind]}
    </span>
  );
}

/** Only when triage has not run yet: the inbox says so instead of showing nothing. */
export function PendingTriageChip() {
  return (
    <span className={cn(chipClassName, "border-warning bg-warning-soft text-warning")}>
      <Hourglass aria-hidden className="size-5 shrink-0 simple:size-6" strokeWidth={2} />
      Oczekuje na triage
    </span>
  );
}

/** A flag only: ROPS decides whether it really is the same case. */
export function DuplicateChip() {
  return (
    <span className={cn(chipClassName, "border-error bg-error-soft text-error")}>
      <Copy aria-hidden className="size-5 shrink-0 simple:size-6" strokeWidth={2} />
      Możliwy duplikat
    </span>
  );
}