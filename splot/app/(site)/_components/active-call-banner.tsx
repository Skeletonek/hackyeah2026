import Link from "next/link";
import { Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/dates";

export function ActiveCallBanner({
  id,
  title,
  closesAt,
}: {
  id: string;
  title: string;
  closesAt: string;
}) {
  return (
    <aside
      aria-labelledby="active-call-heading"
      className="rounded-lg bg-accent p-5 text-accent-foreground kontrast:border-2 kontrast:border-accent-foreground"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Megaphone aria-hidden className="mt-0.5 size-6 shrink-0" />
          <div>
            <p id="active-call-heading" className="font-bold text-h4 simple:text-simple-h4">
              Trwa nabór: {title}
            </p>
            <p className="text-sm simple:text-simple-sm">Zgłoszenia do {formatDate(closesAt)}</p>
          </div>
        </div>
        <Button
          asChild
          variant="outline"
          className="border-accent-foreground text-accent-foreground hover:bg-accent-foreground hover:text-accent simple:w-full"
        >
          <Link href={`/ideas/new?call=${id}`}>Złóż wniosek</Link>
        </Button>
      </div>
    </aside>
  );
}
