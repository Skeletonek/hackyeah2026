import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AiHint } from "@/components/ai/ai-hint";
import { CategoryBadge } from "@/components/category-badge";
import { STAGE_ICONS } from "@/components/innovation-card";
import { ReadAloudButton } from "@/components/read-aloud-button";
import { getA11yPrefs } from "@/lib/a11y-prefs";
import { CHALLENGE_CATEGORY_LABELS, INNOVATION_STAGE_LABELS } from "@/lib/labels";
import { getPilotPlaces, getPilotStats, getPublishedInnovation, type Innovation } from "@/lib/library/innovation";
import { EasyReadToggle } from "./_components/easy-read-toggle";
import { InnovationSources } from "./_components/innovation-sources";
import { InnovationVideo } from "./_components/innovation-video";
import { PilotPlaces } from "./_components/pilot-places";
import { TesterAside } from "./_components/tester-aside";

/** Fixed headings of the full description, in reading order. */
const SECTIONS = [
  { key: "solution", heading: "Na czym polega" },
  { key: "problem", heading: "Jaki problem rozwiązuje" },
  { key: "audience", heading: "Odbiorcy" },
  { key: "adopters", heading: "Kto może skorzystać" },
  { key: "evidence", heading: "Czy to działa?" },
] as const satisfies readonly { key: keyof Innovation; heading: string }[];

function paragraphs(text: string) {
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export async function generateMetadata({ params }: PageProps<"/library/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const innovation = await getPublishedInnovation(slug);
  if (!innovation) return { title: "Nie znaleziono innowacji" };
  return { title: innovation.title, description: innovation.lead ?? undefined };
}

export default async function Page({ params, searchParams }: PageProps<"/library/[slug]">) {
  const [{ slug }, query, prefs] = await Promise.all([params, searchParams, getA11yPrefs()]);
  const innovation = await getPublishedInnovation(slug);
  if (!innovation) notFound();

  const [places, stats] = await Promise.all([
    getPilotPlaces(innovation.id),
    getPilotStats(innovation.id),
  ]);

  // Easy-read is the default in simple mode („Prościej”); `?easy=` overrides it either way.
  const easyRead = innovation.easy_read_description;
  const showEasy = easyRead !== null && (query.easy === "1" || (query.easy !== "0" && prefs.simple));

  const sections = SECTIONS.flatMap(({ key, heading }) => {
    const text = innovation[key];
    return text?.trim() ? [{ key, heading, text }] : [];
  });

  // What „Przeczytaj na głos” reads: the title, the lead and the visible version.
  const readAloudText = [
    innovation.title,
    innovation.lead,
    ...(showEasy ? [easyRead] : sections.flatMap(({ heading, text }) => [heading, text])),
  ]
    .filter(Boolean)
    .join("\n");

  const [mainCategory] = innovation.categories;
  const StageIcon = STAGE_ICONS[innovation.stage];

  return (
    <main id="main-content" className="mx-auto flex w-full max-w-[1200px] flex-col gap-8 px-4 py-8 sm:px-8">
      <nav aria-label="Jesteś tutaj">
        <ol className="flex flex-wrap items-center gap-x-2 text-muted-foreground">
          <li>
            <Link href="/library" className="inline-flex min-h-11 items-center underline underline-offset-[0.2em]">
              Biblioteka innowacji
            </Link>
          </li>
          {mainCategory && (
            <>
              <li aria-hidden>/</li>
              <li>
                <Link
                  href={`/library?category=${mainCategory}`}
                  className="inline-flex min-h-11 items-center underline underline-offset-[0.2em]"
                >
                  {CHALLENGE_CATEGORY_LABELS[mainCategory]}
                </Link>
              </li>
            </>
          )}
          <li aria-hidden>/</li>
          <li aria-current="page" className="min-w-0 wrap-break-word">
            {innovation.title}
          </li>
        </ol>
      </nav>

      <div className="flex flex-wrap items-start gap-10">
        <article className="flex min-w-0 flex-[999_1_600px] flex-col gap-10">
          <header className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              {innovation.categories.map((category, index) => (
                <CategoryBadge key={category} category={category} className={index > 0 ? "simple:hidden" : undefined} />
              ))}
              <span className="inline-flex items-center gap-1.5 font-bold text-muted-foreground">
                <StageIcon aria-hidden className="size-5 shrink-0" strokeWidth={2} />
                <span className="sr-only">Etap: </span>
                {INNOVATION_STAGE_LABELS[innovation.stage]}
              </span>
            </div>
            <h1 className="text-h1 text-balance wrap-break-word simple:text-simple-h1">{innovation.title}</h1>
            {innovation.lead && (
              <p className="max-w-[60ch] text-lead simple:text-simple-lead">{innovation.lead}</p>
            )}
            <div className="flex flex-wrap items-center gap-3">
              {easyRead !== null && <EasyReadToggle easy={showEasy} />}
              <ReadAloudButton text={readAloudText} />
            </div>
          </header>

          {showEasy ? (
            <AiHint targetType="easy_read" targetId={innovation.id} className="max-w-[68ch]">
              <section aria-labelledby="easy-heading" className="flex flex-col gap-3">
                <h2 id="easy-heading" className="text-h3 simple:text-simple-h3">
                  W prostych słowach
                </h2>
                {paragraphs(easyRead).map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </section>
            </AiHint>
          ) : (
            sections.map(({ key, heading, text }) => (
              <section key={key} aria-labelledby={`${key}-heading`} className="flex max-w-[68ch] flex-col gap-3">
                <h2 id={`${key}-heading`} className="text-h2 simple:text-simple-h2">
                  {heading}
                </h2>
                {paragraphs(text).map((paragraph, index) => (
                  <p key={index} className="whitespace-pre-line">
                    {paragraph}
                  </p>
                ))}
              </section>
            ))
          )}

          {innovation.video_url && (
            <InnovationVideo videoUrl={innovation.video_url} title={innovation.title} className="simple:hidden" />
          )}

          <PilotPlaces places={places} innovationSlug={innovation.slug} />

          <InnovationSources
            sourceUrl={innovation.source_url}
            folderPdfUrl={innovation.folder_pdf_url}
            materialsUrl={innovation.materials_url}
          />
        </article>

        {/* Slot for the Tester aside (L3, SPL-38): `_components/tester-aside.tsx`. */}
        <TesterAside
          innovationId={innovation.id}
          innovationSlug={innovation.slug}
          pilotSlots={innovation.pilot_slots}
          stats={stats}
        />
      </div>
    </main>
  );
}
