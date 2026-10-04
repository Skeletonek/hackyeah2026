import type { Metadata } from "next";
import { EmptyState } from "@/components/empty-state";
import { Pagination } from "@/components/pagination";
import { listPendingConnectionRequests } from "@/lib/admin/connections";
import { pageHref, parsePage } from "@/lib/pagination";
import { ConnectionCard } from "./_components/connection-card";

const TITLE = "Prośby o połączenie";

export const metadata: Metadata = { title: TITLE };

export default async function AdminConnectionsPage({ searchParams }: PageProps<"/admin/connections">) {
  const requests = await listPendingConnectionRequests(parsePage(await searchParams));

  return (
    <main id="main-content" className="flex flex-col gap-6 p-4 sm:p-8">
      <h1 className="text-h1">{TITLE}</h1>

      {requests.total === 0 ? (
        <EmptyState title="Brak oczekujących próśb">
          Gdy ktoś użyje „Połącz się” w dopasowaniu, pojawi się tu propozycja połączenia dwóch
          zgłoszeń.
        </EmptyState>
      ) : (
        <>
          <ul className="flex flex-col gap-4">
            {requests.items.map((request) => (
              <ConnectionCard key={request.id} request={request} />
            ))}
          </ul>
          <Pagination
            page={requests}
            href={(n) => pageHref("/admin/connections", {}, n)}
            label="Strony próśb o połączenie"
          />
        </>
      )}
    </main>
  );
}
