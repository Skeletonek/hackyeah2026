import type { Metadata } from "next";
import { EmptyState } from "@/components/empty-state";
import { listPendingConnectionRequests } from "@/lib/admin/connections";
import { ConnectionCard } from "./_components/connection-card";

const TITLE = "Prośby o połączenie";

export const metadata: Metadata = { title: TITLE };

export default async function AdminConnectionsPage() {
  const requests = await listPendingConnectionRequests();

  return (
    <main id="main-content" className="flex flex-col gap-6 p-4 sm:p-8">
      <h1 className="text-h1">{TITLE}</h1>

      {requests.length === 0 ? (
        <EmptyState title="Brak oczekujących próśb">
          Gdy ktoś użyje „Połącz się” w dopasowaniu, pojawi się tu propozycja połączenia dwóch
          zgłoszeń.
        </EmptyState>
      ) : (
        <ul className="flex flex-col gap-4">
          {requests.map((request) => (
            <ConnectionCard key={request.id} request={request} />
          ))}
        </ul>
      )}
    </main>
  );
}
