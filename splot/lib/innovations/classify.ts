import "server-only";
import { generateText, NoObjectGeneratedError, Output } from "ai";
import { z } from "zod";
import { TEXT_MODEL } from "@/lib/ai/models";
import { Constants, type Enums } from "@/lib/supabase/database.types";

export type ChallengeCategory = Enums<"challenge_category">;

/** ROPS library category (by audience), `target_group` enum from the D1 migration. */
export type TargetGroup =
  | "seniors"
  | "children_family"
  | "limited_mobility"
  | "sensory_disability"
  | "intellectual_disability"
  | "health"
  | "foreigners"
  | "labour_market"
  | "homelessness";

export type ClassifyInput = {
  title: string;
  lead: string | null;
  solution: string | null;
  problem: string | null;
  audience: string | null;
  target_groups?: TargetGroup[];
};

const CATEGORIES = Constants.public.Enums.challenge_category;
const MAX_CATEGORIES = 3;

const CATEGORY_DEFINITIONS: Record<ChallengeCategory, string> = {
  aging: "starzenie się społeczeństwa: seniorzy, opieka nad osobami starszymi, aktywność w starszym wieku",
  mental_health: "kryzys zdrowia psychicznego: depresja, kryzys, wsparcie psychologiczne, terapia, uzależnienia",
  loneliness: "samotność i izolacja społeczna: brak relacji, budowanie więzi, integracja społeczności",
  digital_exclusion:
    "wykluczenie cyfrowe: kompetencje cyfrowe, a także aplikacje, urządzenia i technologie, które dają dostęp osobom wykluczonym",
  service_access:
    "ograniczony dostęp do usług społecznych: bariery w dostępie do opieki, rehabilitacji, edukacji, pracy, informacji",
  coordination:
    "koordynacja usług publicznych i współpraca międzysektorowa: łączenie instytucji, NGO, samorządów, modele współpracy",
  depopulation: "zmiany demograficzne: wyludnianie się wsi i małych gmin, obszary wiejskie, migracje",
};

/**
 * Used when the model returns no category. Only `seniors` → `aging` is
 * certain; the rest is the SPL-6 research default (`service_access`), which
 * `children_family` borrows too because it has no default of its own.
 */
const FALLBACK: Record<TargetGroup, ChallengeCategory> = {
  seniors: "aging",
  children_family: "service_access",
  limited_mobility: "service_access",
  sensory_disability: "service_access",
  intellectual_disability: "service_access",
  health: "service_access",
  foreigners: "service_access",
  labour_market: "service_access",
  homelessness: "service_access",
};

const SYSTEM = `Klasyfikujesz innowacje społeczne z Biblioteki Innowacji Społecznych ROPS Kraków według wyzwań społecznych Małopolski.

Wyzwania (kod: opis):
${CATEGORIES.map((category) => `- ${category}: ${CATEGORY_DEFINITIONS[category]}`).join("\n")}

Wybierz od 1 do ${MAX_CATEGORIES} wyzwań, na które innowacja odpowiada najbardziej bezpośrednio, od najważniejszego. Nie dodawaj wyzwania tylko dlatego, że pasuje luźno. Grupa odbiorców nie jest wyzwaniem: innowacja dla dzieci nie jest automatycznie o dostępie do usług.`;

const schema = z.object({
  categories: z.array(z.enum(CATEGORIES)).describe("1–3 kody wyzwań, od najważniejszego"),
});

/** Assigns 1–3 challenge categories to an innovation. */
export async function classifyChallenges(input: ClassifyInput): Promise<ChallengeCategory[]> {
  let categories: ChallengeCategory[] = [];
  try {
    const { output } = await generateText({
      model: TEXT_MODEL,
      system: SYSTEM,
      prompt: formatInnovation(input),
      output: Output.object({ schema }),
    });
    categories = [...new Set(output.categories)].slice(0, MAX_CATEGORIES);
  } catch (error) {
    if (!NoObjectGeneratedError.isInstance(error)) throw error;
  }
  return categories.length > 0 ? categories : fallbackCategories(input.target_groups);
}

function fallbackCategories(targetGroups: TargetGroup[] = []): ChallengeCategory[] {
  const categories = [...new Set(targetGroups.map((group) => FALLBACK[group]))];
  return categories.length > 0 ? categories.slice(0, MAX_CATEGORIES) : ["service_access"];
}

function formatInnovation({ title, lead, solution, problem, audience }: ClassifyInput) {
  return [
    `Tytuł: ${title}`,
    lead && `Zajawka: ${lead}`,
    solution && `Na czym polega: ${solution}`,
    problem && `Jaki problem rozwiązuje: ${problem}`,
    audience && `Grupa docelowa: ${audience}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}
