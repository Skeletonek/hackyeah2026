import Link from "next/link";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  CHALLENGE_CATEGORY_LABELS,
  PRIORITY_LABELS,
  SUBMISSION_KIND_LABELS,
  SUBMISSION_STATUS_LABELS,
} from "@/lib/labels";
import { hasFilters, type SubmissionFilters } from "@/lib/admin/queries";
import { Constants } from "@/lib/supabase/database.types";

/**
 * Filters as a plain GET form: it works without JavaScript, and the filtered
 * URL can be shared or bookmarked. Applying filters clears the preview.
 */
export function SubmissionFiltersForm({ filters }: { filters: SubmissionFilters }) {
  return (
    <form
      method="get"
      className="grid gap-4 rounded-lg border-2 border-border bg-card p-5 sm:grid-cols-2 xl:grid-cols-4"
      aria-label="Filtruj zgłoszenia"
    >
      <Field label="Status">
        <Select name="status" defaultValue={filters.status ?? ""}>
          <option value="">Wszystkie</option>
          {Constants.public.Enums.submission_status.map((value) => (
            <option key={value} value={value}>
              {SUBMISSION_STATUS_LABELS[value]}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Rodzaj">
        <Select name="kind" defaultValue={filters.kind ?? ""}>
          <option value="">Wszystkie</option>
          {Constants.public.Enums.submission_kind.map((value) => (
            <option key={value} value={value}>
              {SUBMISSION_KIND_LABELS[value]}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Kategoria">
        <Select name="category" defaultValue={filters.category ?? ""}>
          <option value="">Wszystkie</option>
          {Constants.public.Enums.challenge_category.map((value) => (
            <option key={value} value={value}>
              {CHALLENGE_CATEGORY_LABELS[value]}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Priorytet">
        <Select name="priority" defaultValue={filters.priority ?? ""}>
          <option value="">Wszystkie</option>
          {Constants.public.Enums.priority.map((value) => (
            <option key={value} value={value}>
              {PRIORITY_LABELS[value]}
            </option>
          ))}
        </Select>
      </Field>

      <div className="flex flex-wrap gap-3 sm:col-span-2 xl:col-span-4">
        <Button type="submit">Filtruj</Button>
        {hasFilters(filters) && (
          <Button asChild variant="secondary">
            <Link href="/admin/submissions">Wyczyść filtry</Link>
          </Button>
        )}
      </div>
    </form>
  );
}