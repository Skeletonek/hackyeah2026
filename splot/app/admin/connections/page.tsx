import type { Metadata } from "next";
import { RouteStub } from "@/components/route-stub";

const TITLE = "Prośby o połączenie";

export const metadata: Metadata = { title: TITLE };

export default function Page() {
  return <RouteStub title={TITLE} layout="admin" />;
}
