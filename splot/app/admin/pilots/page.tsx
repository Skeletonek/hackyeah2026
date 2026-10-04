import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import {
  countPilotWork,
  listPilots,
  listReviews,
  parsePilotFilters,
  type ReviewState,
} from "@/lib/admin/pilots";
import { PILOT_STATUS_LABELS, type PilotStatus } from "@/lib/labels";
import { Constants } from "@/lib/supabase/database.types";
import { PilotTabs } from "./_components/pilot-tabs";
import { PilotsTable } from "./_components/pilots-table";
import { ReviewList } from "./_components/review-list";

const TITLE = "Pilotaże";

export const metadata: Metadata = { title: TITLE };

const REVIEW_STATE_LABELS: Record<ReviewState, string> = {
  pending: "Do akceptacji",
  published: "Zatwierdzone",
  hidden: "Ukryte",
};

const filterFormClassName =
  "grid items-end gap-4 rounded-lg border-2 border-border bg-card p-5 sm:grid-cols-[minmax(0,1fr)_auto]";

export default async function AdminPilotsPage({ searchParams }: PageProps<"/admin/pilots">) {
  const filters = parsePilotFilters(await searchParams);
  const counts = await countPilotWork();

  return (
    <main id="main-content" className="flex flex-col gap-6 p-4 sm:p-8">
      <h1 className="text-h1">{TITLE}</h1>

      <PilotTabs tab={filters.tab} counts={{ applications: counts.applied, reviews: counts.pending }} />

      {filters.tab === "applications" ? (
        <Applications status={filters.status} />
      ) : (
        <Reviews state={filters.review} />
      )}
    </main>
  );
}

async function Applications({ status }: { status: PilotStatus | undefined }) {
  const rows = await listPilots(status);

  return (
    <>
      {/* Plain GET form: works without JavaScript and the URL can be shared. */}
      <form method="get" aria-label="Filtruj zgłoszenia do testów" className={filterFormClassName}>
        <Field label="Status">
          <Select name="status" defaultValue={status ?? ""}>
            <option value="">Wszystkie</option>
            {Constants.public.Enums.pilot_status.map((value) => (
              <option key={value} value={value}>
                {PILOT_STATUS_LABELS[value]}
              </option>
            ))}
          </Select>
        </Field>
        <div className="flex flex-wrap gap-3">
          <Button type="submit">Filtruj</Button>
          {status && (
            <Button asChild variant="secondary">
              <Link href="/admin/pilots">Wyczyść</Link>
            </Button>
          )}
        </div>
      </form>

      <section aria-labelledby="pilots-heading" className="flex flex-col gap-3">
        <h2 id="pilots-heading" className="text-h3">
          {status ? `Zgłoszenia: ${PILOT_STATUS_LABELS[status]}` : "Wszystkie zgłoszenia do testów"}
          <span className="font-normal text-muted-foreground"> ({rows.length})</span>
        </h2>
        {rows.length === 0 ? (
          <EmptyState title="Brak zgłoszeń do testów">
            {status
              ? "Żadne zgłoszenie nie ma tego statusu. Wyczyść filtr, aby zobaczyć wszystkie."
              : "Zgłoszenia pojawią się tutaj, gdy organizacja kliknie „Chcę testować” na stronie innowacji."}
          </EmptyState>
        ) : (
          <PilotsTable rows={rows} />
        )}
      </section>
    </>
  );
}

async function Reviews({ state }: { state: ReviewState }) {
  const rows = await listReviews(state);

  return (
    <>
      <form method="get" aria-label="Filtruj opinie" className={filterFormClassName}>
        <input type="hidden" name="tab" value="reviews" />
        <Field label="Pokaż opinie">
          <Select name="review" defaultValue={state}>
            {Object.entries(REVIEW_STATE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <Button type="submit">Pokaż</Button>
      </form>

      <section aria-labelledby="reviews-heading" className="flex flex-col gap-3">
        <h2 id="reviews-heading" className="text-h3">
          Opinie: {REVIEW_STATE_LABELS[state].toLowerCase()}
          <span className="font-normal text-muted-foreground"> ({rows.length})</span>
        </h2>
        {state === "pending" && rows.length > 0 && (
          <p className="max-w-[68ch] text-muted-foreground">
            Zatwierdzona opinia od razu pojawi się na stronie innowacji. Ukryta zostanie tylko tutaj.
          </p>
        )}
        {rows.length === 0 ? (
          <EmptyState title="Brak opinii">
            {state === "pending"
              ? "Wszystkie opinie są sprawdzone. Nowe pojawią się tutaj, gdy testujący je wyślą."
              : "Na tej liście nie ma jeszcze żadnej opinii."}
          </EmptyState>
        ) : (
          <ReviewList rows={rows} state={state} />
        )}
      </section>
    </>
  );
}
