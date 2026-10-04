import { Download, ExternalLink, FileText, type LucideIcon } from "lucide-react";

/**
 * The fixed attribution in place of „Kontakt do autora”: the library is
 * ROPS content (CC BY), so we link to the source and never mirror the files.
 */
export function InnovationSources({
  sourceUrl,
  folderPdfUrl,
  materialsUrl,
}: {
  sourceUrl: string | null;
  folderPdfUrl: string | null;
  materialsUrl: string | null;
}) {
  return (
    <section
      aria-labelledby="sources-heading"
      className="flex flex-col gap-3 rounded-lg border border-border bg-card p-6 kontrast:border-2"
    >
      <h2 id="sources-heading" className="text-h4 simple:text-simple-h4">
        Źródło: ROPS Kraków, Biblioteka Innowacji Społecznych
      </h2>
      <ul className="flex flex-col gap-1">
        {sourceUrl && (
          <SourceLink href={sourceUrl} icon={ExternalLink}>
            Opis na stronie ROPS
          </SourceLink>
        )}
        {folderPdfUrl && (
          <SourceLink href={folderPdfUrl} icon={FileText} className="simple:hidden">
            Folder o innowacji (PDF)
          </SourceLink>
        )}
        {materialsUrl && (
          <SourceLink href={materialsUrl} icon={Download} className="simple:hidden">
            Materiały do pobrania{/\.zip$/i.test(materialsUrl) ? " (ZIP)" : ""}
          </SourceLink>
        )}
      </ul>
    </section>
  );
}

function SourceLink({
  href,
  icon: Icon,
  className,
  children,
}: {
  href: string;
  icon: LucideIcon;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <li className={className}>
      <a
        href={href}
        className="inline-flex min-h-11 items-center gap-2 font-bold text-primary underline underline-offset-[0.2em] hover:decoration-[3px]"
      >
        <Icon aria-hidden className="size-5 shrink-0" strokeWidth={2} />
        {children}
      </a>
    </li>
  );
}
