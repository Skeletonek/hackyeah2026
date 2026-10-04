import type { Metadata } from "next";
import { MATCH_COPY } from "@/lib/matchmaking/copy";
import { MatchScreen } from "../match/_components/match-screen";

export const metadata: Metadata = { title: MATCH_COPY.municipality.title };

export default function Page({ searchParams }: PageProps<"/municipalities">) {
  return <MatchScreen role="municipality" searchParams={searchParams} />;
}
