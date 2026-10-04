import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  CHALLENGE_CATEGORY_LABELS,
  INNOVATION_STAGE_LABELS,
  TARGET_GROUP_LABELS,
} from "@/lib/labels";
import type { LibraryFilters as Filters } from "@/lib/library/queries";

/** GET form, so a search has its own URL and works without JS. */
export function LibraryFilters({ filters, showClear }: { filters: Filters; showClear: boolean }) {
  return (
    <form action="/library" role="search" aria-label="Szukaj innowacji" className="flex flex-col gap-5">
      <Field
        label="Czego szukasz?"
        hint="Wpisz kilka słów, np. „samotność seniorów na wsi” albo „opieka wytchnieniowa”."
      >
        <Input type="search" name="q" defaultValue={filters.q} maxLength={200} autoComplete="off" />
      </Field>

      <div className="grid gap-5 md:grid-cols-3 simple:md:grid-cols-1">
        <Field label="Wyzwanie">
          <Select name="category" defaultValue={filters.category ?? ""}>
            <option value="">Wszystkie wyzwania</option>
            {Object.entries(CHALLENGE_CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Dla kogo">
          <Select name="target_group" defaultValue={filters.targetGroup ?? ""}>
            <option value="">Wszyscy odbiorcy</option>
            {Object.entries(TARGET_GROUP_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Etap">
          <Select name="stage" defaultValue={filters.stage ?? ""}>
            <option value="">Wszystkie etapy</option>
            {Object.entries(INNOVATION_STAGE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" className="simple:w-full">
          <Search aria-hidden />
          Szukaj
        </Button>
        {showClear && (
          <Button asChild variant="ghost" className="simple:w-full">
            <Link href="/library">Wyczyść filtry</Link>
          </Button>
        )}
      </div>
    </form>
  );
}
