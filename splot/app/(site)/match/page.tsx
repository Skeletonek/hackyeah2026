import type { Metadata } from "next";
import { MATCH_COPY } from "@/lib/matchmaking/copy";
import { MatchScreen } from "./_components/match-screen";

export const metadata: Metadata = { title: MATCH_COPY.resident.title };

export default function Page({ searchParams }: PageProps<"/match">) {
  return <MatchScreen role="resident" searchParams={searchParams} />;
}
