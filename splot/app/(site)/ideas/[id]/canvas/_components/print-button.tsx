"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

/** The browser's print dialog makes the PDF; the print stylesheet lays out the A4 page. */
export function PrintButton() {
  return (
    <Button size="lg" onClick={() => window.print()}>
      <Printer aria-hidden strokeWidth={2} />
      Pobierz PDF / wydrukuj
    </Button>
  );
}
