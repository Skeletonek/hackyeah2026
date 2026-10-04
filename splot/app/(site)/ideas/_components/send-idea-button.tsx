"use client";

import { useFormStatus } from "react-dom";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Submit button of the „Wyślij do ROPS po radę” form; busy while the action runs. */
export function SendIdeaButton({ variant }: { variant: "default" | "outline" }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="lg" variant={variant} loading={pending}>
      {!pending && <Send aria-hidden strokeWidth={2} />}
      {pending ? "Wysyłam…" : "Wyślij do ROPS po radę"}
    </Button>
  );
}
