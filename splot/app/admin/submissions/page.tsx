import type { Metadata } from "next";
import { EmptyState } from "@/components/empty-state";
import {
  hasFilters,
  getSubmission,
  inboxHref,
  listSubmissions,
  parseFilters,
} from "@/lib/admin/queries";
import { SUBMISSION_KIND_LABELS, SUBMISSION_STATUS_LABELS } from "@/lib/labels";
import { SubmissionFiltersForm } from "./_components/filters";
import { InboxList } from "./_components/inbox-list";
import { NewSubmissionToast } from "./_components/new-submission-toast";
import { PreviewDrawer } from "./_components/preview-drawer";
import { SubmissionPreview } from "./_components/preview";

export const metadata: Metadata = { title: "Zgłoszenia" };

export default async function AdminInboxPage({
  searchParams,
}: PageProps<"/admin/submissions">) {
  const params = await searchParams;
  const filters = parseFilters(params);
  const selected = Array.isArray(params.selected) ? params.selected[0] : params.selected;

  const [rows, selectedRow] = await Promise.all([
    listSubmissions(filters),
    selected ? getSubmission(selected) : Promise.resolve(null),
  ]);

  return (
    <main id="main-content" className="flex flex-col gap-6 p-4 sm:p-8">
      <NewSubmissionToast />

      <h1 className="text-h1">Zgłoszenia</h1>

      <SubmissionFiltersForm filters={filters} />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section aria-labelledby="inbox-heading" className="flex flex-col gap-3">
          <h2 id="inbox-heading" className="text-h3">
            {hasFilters(filters) ? "Wyniki" : "Ostatnie zgłoszenia"}
            <span className="font-normal text-muted-foreground"> ({rows.length})</span>
          </h2>

          {rows.length === 0 ? (
            <EmptyState title="Brak zgłoszeń">
              {hasFilters(filters)
                ? "Żadne zgłoszenie nie pasuje do tych filtrów. Wyczyść je, aby zobaczyć wszystkie."
                : "Zgłoszenia pojawią się tutaj, gdy mieszkaniec, gmina albo organizacja opisze problem."}
            </EmptyState>
          ) : (
            <InboxList rows={rows} filters={filters} selectedId={selected ?? null} />
          )}
        </section>

        <PreviewDrawer
          selected={
            selectedRow
              ? {
                  id: selectedRow.id,
                  title: `Zgłoszenie ${selectedRow.case_number}`,
                  description: `${SUBMISSION_KIND_LABELS[selectedRow.kind]}, status: ${SUBMISSION_STATUS_LABELS[selectedRow.status]}`,
                }
              : null
          }
          closeHref={inboxHref(filters)}
        >
          {selectedRow ? (
            <SubmissionPreview row={selectedRow} />
          ) : (
            <EmptyState headingLevel="h2" title="Wybierz zgłoszenie">
              Kliknij numer zgłoszenia, aby zobaczyć jego opis i podpowiedź AI. Pełny widok ze
              wątkiem znajdziesz po otwarciu zgłoszenia.
            </EmptyState>
          )}
        </PreviewDrawer>
      </div>
    </main>
  );
}