import type { Metadata } from "next";
import Link from "next/link";
import { EyeOff, Globe, Plus } from "lucide-react";
import { CategoryBadge } from "@/components/category-badge";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatDateWithYear } from "@/lib/dates";
import {
  hasLibraryAdminFilters,
  listLibraryAdmin,
  parseLibraryAdminFilters,
  type LibraryAdminRow,
} from "@/lib/admin/library";
import { INNOVATION_STAGE_LABELS } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { setPublished } from "./actions";

const TITLE = "Biblioteka";

export const metadata: Metadata = { title: TITLE };

export default async function AdminLibraryPage({ searchParams }: PageProps<"/admin/library">) {
  const filters = parseLibraryAdminFilters(await searchParams);
  const rows = await listLibraryAdmin(filters);
  const filtered = hasLibraryAdminFilters(filters);

  return (
    <main id="main-content" className="flex flex-col gap-6 p-4 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-h1">{TITLE}</h1>
        <Button asChild>
          <Link href="/admin/library/new">
            <Plus aria-hidden strokeWidth={2} />
            Dodaj innowację
          </Link>
        </Button>
      </div>

      {/* Plain GET form: works without JavaScript and the URL can be shared. */}
      <form
        method="get"
        aria-label="Filtruj innowacje"
        className="grid items-end gap-4 rounded-lg border-2 border-border bg-card p-5 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto]"
      >
        <Field label="Szukaj">
          <Input type="search" name="q" defaultValue={filters.q ?? ""} placeholder="Tytuł albo adres" />
        </Field>
        <Field label="Widoczność">
          <Select name="visibility" defaultValue={filters.visibility ?? ""}>
            <option value="">Wszystkie</option>
            <option value="published">Opublikowane</option>
            <option value="draft">Szkice</option>
          </Select>
        </Field>
        <div className="flex flex-wrap gap-3">
          <Button type="submit">Filtruj</Button>
          {filtered && (
            <Button asChild variant="secondary">
              <Link href="/admin/library">Wyczyść</Link>
            </Button>
          )}
        </div>
      </form>

      <section aria-labelledby="library-list-heading" className="flex flex-col gap-3">
        <h2 id="library-list-heading" className="text-h3">
          {filtered ? "Wyniki" : "Wszystkie innowacje"}
          <span className="font-normal text-muted-foreground"> ({rows.length})</span>
        </h2>

        {rows.length === 0 ? (
          <EmptyState
            title="Brak innowacji"
            action={
              <Button asChild variant="outline">
                <Link href="/admin/library/new">Dodaj innowację</Link>
              </Button>
            }
          >
            {filtered
              ? "Żadna innowacja nie pasuje do tych filtrów. Wyczyść je, aby zobaczyć wszystkie."
              : "Biblioteka jest pusta. Dodaj pierwszą innowację."}
          </EmptyState>
        ) : (
          <ul className="flex flex-col gap-2">
            {rows.map((row) => (
              <LibraryRow key={row.id} row={row} />
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function LibraryRow({ row }: { row: LibraryAdminRow }) {
  return (
    <li className="flex flex-wrap items-center gap-4 rounded-lg border-2 border-border bg-card p-4">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <Link
          href={`/admin/library/${row.slug}`}
          className="w-fit text-lg font-bold text-primary underline underline-offset-4 hover:decoration-[3px]"
        >
          {row.title}
          <span className="sr-only"> — edytuj</span>
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <PublishedChip published={row.published} />
          <span className="text-sm font-bold">{INNOVATION_STAGE_LABELS[row.stage]}</span>
          {row.categories.map((category) => (
            <CategoryBadge key={category} category={category} />
          ))}
          <span className="text-sm text-muted-foreground">
            Zmieniono {formatDateWithYear(row.updated_at)}
          </span>
        </div>
      </div>
      <form action={setPublished} className="shrink-0">
        <input type="hidden" name="id" value={row.id} />
        <input type="hidden" name="published" value={row.published ? "false" : "true"} />
        <Button type="submit" size="sm" variant={row.published ? "outline" : "secondary"}>
          {row.published ? "Ukryj" : "Opublikuj"}
          <span className="sr-only">: {row.title}</span>
        </Button>
      </form>
    </li>
  );
}

/** Published or draft as icon + word, so colour is never the only carrier. */
function PublishedChip({ published }: { published: boolean }) {
  const Icon = published ? Globe : EyeOff;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-sm font-bold kontrast:border-current",
        published ? "border-success bg-success-soft text-success" : "border-border bg-muted text-muted-foreground",
      )}
    >
      <Icon aria-hidden className="size-5 shrink-0" strokeWidth={2} />
      {published ? "Opublikowana" : "Szkic"}
    </span>
  );
}
