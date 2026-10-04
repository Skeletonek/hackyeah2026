import type { Metadata } from "next";
import { getBrokerInnovation, searchBrokerInnovations } from "@/lib/broker/innovations";
import { BrokerForm } from "./_components/form";

const TITLE = "Dopasuj innowację do swojej instytucji";

export const metadata: Metadata = { title: TITLE };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const requested = Array.isArray(params.innovation) ? params.innovation[0] : params.innovation;
  const [initialResults, initialInnovation] = await Promise.all([
    searchBrokerInnovations(""),
    requested ? getBrokerInnovation(requested) : null,
  ]);

  return (
    <main id="main-content" className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-4 py-10 sm:px-8">
      <div className="flex max-w-[68ch] flex-col gap-3">
        <h1 className="text-h1 simple:text-simple-h1">{TITLE}</h1>
        <p className="text-lead text-muted-foreground simple:text-simple-lead">
          Wybierz innowację i opisz gminę w 5 polach. Przygotujemy plan usługi.
        </p>
      </div>
      <BrokerForm initialResults={initialResults} initialInnovation={initialInnovation} />
    </main>
  );
}
