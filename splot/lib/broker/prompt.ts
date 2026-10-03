import "server-only";
import type { BrokerContext } from "./schema";

export type BrokerInnovation = {
  slug: string;
  title: string;
  lead?: string | null;
  solution?: string | null;
  problem?: string | null;
  audience?: string | null;
  adopters?: string | null;
  evidence?: string | null;
  stage?: string | null;
};

const POPULATION_LABEL: Record<BrokerContext["population"], string> = {
  "do-5-tys": "do 5 tys. mieszkańców",
  "5-20-tys": "5–20 tys. mieszkańców",
  "20-50-tys": "20–50 tys. mieszkańców",
  "pow-50-tys": "powyżej 50 tys. mieszkańców",
};

const BUDGET_LABEL: Record<BrokerContext["budget"], string> = {
  "do-10-tys": "do 10 tys. zł",
  "10-50-tys": "10–50 tys. zł",
  "50-200-tys": "50–200 tys. zł",
  "pow-200-tys": "powyżej 200 tys. zł",
};

const MUNICIPALITY_LABEL: Record<BrokerContext["municipalityType"], string> = {
  wiejska: "gmina wiejska",
  "miejsko-wiejska": "gmina miejsko-wiejska",
  miejska: "gmina miejska",
};

/**
 * One-shot prompt: turn one innovation into a service plan for one
 * municipality. The model must not invent facts about the innovation and
 * must mark every estimate as an estimate.
 */
export function buildBrokerPrompt(innovation: BrokerInnovation, context: BrokerContext) {
  const system =
    "Jesteś doradcą ROPS Kraków. Piszesz po polsku, prosto i konkretnie. " +
    "Zdania mają do 15 słów. Odpowiadasz tylko danymi ze schematu karty usługi.";

  const facts = [
    `Tytuł: ${innovation.title}`,
    innovation.lead ? `Opis: ${innovation.lead}` : null,
    innovation.solution ? `Rozwiązanie: ${innovation.solution}` : null,
    innovation.problem ? `Problem: ${innovation.problem}` : null,
    innovation.audience ? `Odbiorcy: ${innovation.audience}` : null,
    innovation.adopters ? `Wdrażający: ${innovation.adopters}` : null,
    innovation.evidence ? `Dowody: ${innovation.evidence}` : null,
    innovation.stage ? `Etap: ${innovation.stage}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const place = [
    `Rodzaj: ${MUNICIPALITY_LABEL[context.municipalityType]}`,
    `Mieszkańcy: ${POPULATION_LABEL[context.population]}`,
    `Budżet: ${BUDGET_LABEL[context.budget]}`,
    `Kadra: ${context.staff}`,
    context.partners ? `Partnerzy: ${context.partners}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const prompt =
    `Na podstawie tej innowacji ułóż plan usługi dla gminy.\n\n` +
    `INNOWACJA (używaj tylko tych faktów, niczego nie dopowiadaj):\n${facts}\n\n` +
    `GMINA:\n${place}\n\n` +
    `Zasady:\n` +
    `- Kroki dopasuj do kadry i budżetu gminy.\n` +
    `- Koszt to szacunek: w polu note napisz, że to orientacyjna ocena.\n` +
    `- Ryzyka dotyczą tej gminy, a sposoby ich ograniczenia są konkretne.\n` +
    `- Wskaźniki można policzyć w 6 miesięcy.`;

  return { system, prompt };
}
