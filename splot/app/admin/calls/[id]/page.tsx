import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { z } from "zod";
import { Alert } from "@/components/ui/alert";
import { getCallForEdit } from "@/lib/admin/calls";
import { CallForm } from "../_components/call-form";

/** `/admin/calls/new` is the same form with nothing to load. */
const NEW = "new";

async function loadCall(id: string) {
  if (id === NEW) return null;
  if (!z.uuid().safeParse(id).success) notFound();
  const call = await getCallForEdit(id);
  if (!call) notFound();
  return call;
}

export async function generateMetadata({ params }: PageProps<"/admin/calls/[id]">): Promise<Metadata> {
  const call = await loadCall((await params).id);
  return { title: call ? `Edycja: ${call.title}` : "Nowy nabór" };
}

export default async function EditCallPage({ params, searchParams }: PageProps<"/admin/calls/[id]">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const call = await loadCall(id);

  return (
    <main id="main-content" className="flex max-w-4xl flex-col gap-6 p-4 sm:p-8">
      <Link
        href="/admin/calls"
        className="inline-flex min-h-11 w-fit items-center gap-2 font-bold text-primary underline underline-offset-4"
      >
        <ArrowLeft aria-hidden className="size-5" strokeWidth={2} />
        Wróć do listy
      </Link>

      <h1 className="text-h1">{call ? "Edycja naboru" : "Nowy nabór"}</h1>
      <p className="max-w-[68ch] text-muted-foreground">
        {call
          ? "Zmiany pól i kryteriów od razu widzą autorzy, którzy piszą wniosek w tym naborze."
          : "Podaj nazwę, daty i pola wniosku. Autorzy pomysłów wypełnią je, gdy nabór się zacznie."}
      </p>

      {query.saved === "new" && <Alert tone="success" title="Nabór dodany." />}

      {/* The key resets the form when the admin moves from one call to another. */}
      <CallForm key={call?.id ?? NEW} call={call} />
    </main>
  );
}
