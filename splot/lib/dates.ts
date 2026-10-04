/**
 * Dates in the house style: „czw., 9 października”. Numbers and weekday come
 * from `Intl`, so the text is Polish without a hand-written month table.
 *
 * Always Polish time: the server renders in UTC, and a client component must
 * hydrate with the same text the server sent.
 */

const TIME_ZONE = "Europe/Warsaw";

const DAY_MONTH = new Intl.DateTimeFormat("pl-PL", {
  timeZone: TIME_ZONE,
  weekday: "short",
  day: "numeric",
  month: "long",
});

const DAY_MONTH_YEAR = new Intl.DateTimeFormat("pl-PL", {
  timeZone: TIME_ZONE,
  day: "numeric",
  month: "long",
  year: "numeric",
});

const TIME = new Intl.DateTimeFormat("pl-PL", { timeZone: TIME_ZONE, hour: "2-digit", minute: "2-digit" });

export function formatDate(iso: string): string {
  return DAY_MONTH.format(new Date(iso));
}

/** With the year, for places where „w zeszłym roku” would be ambiguous. */
export function formatDateWithYear(iso: string): string {
  return DAY_MONTH_YEAR.format(new Date(iso));
}

export function formatTime(iso: string): string {
  return TIME.format(new Date(iso));
}

/** „9 października 2026, 14:05”, for messages and status changes. */
export function formatDateTime(iso: string): string {
  return `${formatDateWithYear(iso)}, ${formatTime(iso)}`;
}
