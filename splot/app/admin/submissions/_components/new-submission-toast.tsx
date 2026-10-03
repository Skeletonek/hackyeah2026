"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";

/**
 * ADM2: a toast when a new submission arrives. RLS limits the subscription to
 * admins, so this only fires for people who may read the inbox. The refresh
 * also updates the AdminMenu counter.
 */
export function NewSubmissionToast() {
  const router = useRouter();
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("admin-submissions")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "submissions" },
        (payload) => {
          const row = payload.new as { id?: string; case_number?: string };
          const id = row.id;
          const caseNumber = row.case_number ?? "bez numeru";

          // Sonner is visual; this is what a screen reader hears.
          setAnnouncement(`Nowe zgłoszenie ${caseNumber}`);
          toast({
            tone: "info",
            title: `Nowe zgłoszenie ${caseNumber}`,
            description: "Otwórz, aby je przejrzeć.",
            ...(id
              ? { action: { label: "Otwórz", href: `/admin/submissions?selected=${id}` } }
              : {}),
          });
          router.refresh();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [router]);

  return (
    <p aria-live="polite" role="status" className="sr-only">
      {announcement}
    </p>
  );
}