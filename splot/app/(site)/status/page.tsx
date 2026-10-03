import type { Metadata } from "next";
import { RouteStub } from "@/components/route-stub";

const TITLE = "Sprawdź status zgłoszenia";

export const metadata: Metadata = { title: TITLE };

export default function Page() {
  return <RouteStub title={TITLE} />;
}
