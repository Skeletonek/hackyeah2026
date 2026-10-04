import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { getInnovationForEdit } from "@/lib/admin/library";
import { InnovationForm } from "../_components/innovation-form";

export async function generateMetadata({ params }: PageProps<"/admin/library/[slug]">): Promise<Metadata> {
  const innovation = await getInnovationForEdit((await params).slug);
  return { title: innovation ? `Edycja: ${innovation.title}` : "Edycja innowacji" };
}

const SAVED_MESSAGES: Record<string, string> = {
  new: "Innowacja dodana.",
  moved: "Zmiany zapisane. Innowacja ma nowy adres.",
};

export default async function EditInnovationPage({ params, searchParams }: PageProps<"/admin/library/[slug]">) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const innovation = await getInnovationForEdit(slug);
  if (!innovation) notFound();
  const saved = typeof query.saved === "string" ? SAVED_MESSAGES[query.saved] : undefined;

  return (
    <main id="main-content" className="flex max-w-4xl flex-col gap-6 p-4 sm:p-8">
      <Link
        href="/admin/library"
        className="inline-flex min-h-11 w-fit items-center gap-2 font-bold text-primary underline underline-offset-4"
      >
        <ArrowLeft aria-hidden className="size-5" strokeWidth={2} />
        Wróć do listy
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-h1">Edycja innowacji</h1>
        {innovation.published && (
          <Button asChild variant="outline" size="sm">
            <Link href={`/library/${innovation.slug}`}>
              <ExternalLink aria-hidden strokeWidth={2} />
              Zobacz w Bibliotece
            </Link>
          </Button>
        )}
      </div>
      {saved && (
        <Alert tone="success" title={saved}>
          {innovation.published
            ? "Jest widoczna w Bibliotece."
            : "To szkic: zaznacz „Opublikowana”, aby pokazać ją w Bibliotece."}
        </Alert>
      )}
      <InnovationForm key={innovation.id} innovation={innovation} />
    </main>
  );
}
