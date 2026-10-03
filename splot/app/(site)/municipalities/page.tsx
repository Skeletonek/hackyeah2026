import type { Metadata } from "next";
import { RouteStub } from "@/components/route-stub";

const TITLE = "Rozwiązania dla gmin";

export const metadata: Metadata = { title: TITLE };

export default function Page() {
  return <RouteStub title={TITLE} />;
}
