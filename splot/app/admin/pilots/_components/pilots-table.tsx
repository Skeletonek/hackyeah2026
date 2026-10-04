import Link from "next/link";
import { formatDateWithYear } from "@/lib/dates";
import type { PilotRow } from "@/lib/admin/pilots";
import { ORGANIZATION_TYPE_LABELS } from "@/lib/labels";
import { PilotStatusForm } from "./pilot-status-form";

const th = "px-4 py-3 text-left align-bottom font-bold";
const td = "px-4 py-3 align-top";

/**
 * Applications to test an innovation. A real table: the columns are compared
 * across rows. On narrow screens it scrolls inside its own focusable region.
 */
export function PilotsTable({ rows }: { rows: PilotRow[] }) {
  return (
    <div
      role="region"
      aria-labelledby="pilots-heading"
      tabIndex={0}
      className="overflow-x-auto rounded-lg border-2 border-border bg-card"
    >
      <table className="w-full min-w-[1040px] border-collapse">
        <thead className="border-b-2 border-border bg-muted">
          <tr>
            <th scope="col" className={th}>Innowacja</th>
            <th scope="col" className={th}>Organizacja</th>
            <th scope="col" className={th}>Gmina</th>
            <th scope="col" className={th}>Plan testów</th>
            <th scope="col" className={th}>Zgłoszono</th>
            <th scope="col" className={th}>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b-2 border-border last:border-b-0">
              <th scope="row" className={`${td} text-left font-normal`}>
                <Link
                  href={`/library/${row.innovation.slug}`}
                  className="font-bold text-primary underline underline-offset-4 hover:decoration-[3px]"
                >
                  {row.innovation.title}
                </Link>
                <a
                  href={`mailto:${row.contact_email}`}
                  className="mt-1 block text-sm break-all underline underline-offset-4"
                >
                  {row.contact_email}
                </a>
              </th>
              <td className={td}>{ORGANIZATION_TYPE_LABELS[row.organization_type]}</td>
              <td className={td}>{row.municipality}</td>
              <td className={td}>
                {/* Table cells ignore min-width, so the width sits on a wrapper. */}
                <div className="w-[32ch] whitespace-pre-line">
                  {row.plan?.trim() || <span className="text-muted-foreground">Nie opisano</span>}
                </div>
              </td>
              <td className={`${td} whitespace-nowrap`}>{formatDateWithYear(row.created_at)}</td>
              <td className={td}>
                <PilotStatusForm
                  id={row.id}
                  status={row.status}
                  label={`${row.innovation.title}, ${row.municipality}`}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
