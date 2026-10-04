"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

/** The browser's print dialog makes the PDF; the page's print stylesheet lays out the A4 page. */
export function PrintButton({ variant = "default" }: { variant?: "default" | "outline" }) {
  return (
    <Button size="lg" variant={variant} onClick={() => window.print()}>
      <Printer aria-hidden strokeWidth={2} />
      Pobierz PDF / wydrukuj
    </Button>
  );
}
