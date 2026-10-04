import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { InnovationForm } from "../_components/innovation-form";

const TITLE = "Nowa innowacja";

export const metadata: Metadata = { title: TITLE };

export default function NewInnovationPage() {
  return (
    <main id="main-content" className="flex max-w-4xl flex-col gap-6 p-4 sm:p-8">
      <Link
        href="/admin/library"
        className="inline-flex min-h-11 w-fit items-center gap-2 font-bold text-primary underline underline-offset-4"
      >
        <ArrowLeft aria-hidden className="size-5" strokeWidth={2} />
        Wróć do listy
      </Link>
      <h1 className="text-h1">{TITLE}</h1>
      <p className="max-w-[68ch] text-muted-foreground">
        Wystarczy tytuł i jedno wyzwanie. Nowa innowacja zostaje szkicem, dopóki nie zaznaczysz „Opublikowana”.
      </p>
      <InnovationForm innovation={null} />
    </main>
  );
}
