import type { Metadata } from "next";
import { RouteStub } from "@/components/route-stub";

const TITLE = "Innowacja";

export const metadata: Metadata = { title: TITLE };

export default function Page() {
  return <RouteStub title={TITLE} />;
}
