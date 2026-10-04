import type { Enums } from "@/lib/supabase/database.types";

/**
 * Polish UI labels for every enum, in one place. Streams import from here and
 * never hard-code a label next to a value.
 */

export type ChallengeCategory = Enums<"challenge_category">;
export type TargetGroup = Enums<"target_group">;
export type InnovationStage = Enums<"innovation_stage">;
export type SubmissionKind = Enums<"submission_kind">;
export type SubmissionStatus = Enums<"submission_status">;
export type Priority = Enums<"priority">;
export type PilotStatus = Enums<"pilot_status">;
export type OrganizationType = Enums<"organization_type">;

export type IdeaStage = Enums<"idea_stage">;
/** Values of `ideas.assets` (a checked `text[]`, not an enum). */
export type IdeaAsset = "place" | "people" | "partner" | "money";

export const CHALLENGE_CATEGORY_LABELS: Record<ChallengeCategory, string> = {
  aging: "Starzenie się",
  mental_health: "Zdrowie psychiczne",
  loneliness: "Samotność",
  digital_exclusion: "Wykluczenie cyfrowe",
  service_access: "Dostęp do usług",
  coordination: "Koordynacja",
  depopulation: "Depopulacja",
};

export const TARGET_GROUP_LABELS: Record<TargetGroup, string> = {
  seniors: "Seniorzy",
  children_family: "Dzieci, młodzież i rodzina",
  limited_mobility: "Osoby o ograniczonej mobilności",
  sensory_disability: "Osoby z niepełnosprawnością sensoryczną",
  intellectual_disability: "Osoby z niepełnosprawnością intelektualną",
  health: "Zdrowie i medycyna",
  foreigners: "Cudzoziemcy",
  labour_market: "Rynek pracy",
  homelessness: "Osoby w kryzysie bezdomności",
};

export const INNOVATION_STAGE_LABELS: Record<InnovationStage, string> = {
  idea: "Pomysł",
  pilot: "Pilotaż",
  deployed: "Wdrożona",
};

export const SUBMISSION_KIND_LABELS: Record<SubmissionKind, string> = {
  problem: "Problem",
  idea: "Pomysł",
  application: "Wniosek",
};

export const SUBMISSION_STATUS_LABELS: Record<SubmissionStatus, string> = {
  received: "Przyjęte",
  in_review: "W ocenie",
  with_expert: "U eksperta",
  answered: "Odpowiedź",
  closed: "Zakończone",
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: "Niski",
  medium: "Średni",
  high: "Wysoki",
};

export const PILOT_STATUS_LABELS: Record<PilotStatus, string> = {
  applied: "Zgłoszony",
  accepted: "Przyjęty",
  in_progress: "W trakcie",
  completed: "Zakończony",
  rejected: "Odrzucony",
};

export const ORGANIZATION_TYPE_LABELS: Record<OrganizationType, string> = {
  municipality: "Samorząd",
  ngo: "Organizacja pozarządowa",
  community_group: "Grupa nieformalna",
  other: "Inna",
};

export const IDEA_STAGE_LABELS: Record<IdeaStage, string> = {
  concept: "Dopiero pomysł",
  first_trial: "Pierwsza próba",
  running: "Działa na co dzień",
  scaling: "Rozszerzamy na kolejne miejsca",
};

export const IDEA_ASSET_LABELS: Record<IdeaAsset, string> = {
  place: "Miejsce",
  people: "Ludzie",
  partner: "Partner",
  money: "Pieniądze",
};

export type County = {
  /** ASCII slug, the same value as `submissions.county` and data/county-indicators.json. */
  code: string;
  name: string;
};

/** The 22 counties of Małopolska: 19 land counties and 3 cities with county rights. */
export const COUNTIES: readonly County[] = [
  { code: "bochenski", name: "powiat bocheński" },
  { code: "brzeski", name: "powiat brzeski" },
  { code: "chrzanowski", name: "powiat chrzanowski" },
  { code: "dabrowski", name: "powiat dąbrowski" },
  { code: "gorlicki", name: "powiat gorlicki" },
  { code: "krakowski", name: "powiat krakowski" },
  { code: "limanowski", name: "powiat limanowski" },
  { code: "krakow", name: "powiat m. Kraków" },
  { code: "nowy-sacz", name: "powiat m. Nowy Sącz" },
  { code: "tarnow", name: "powiat m. Tarnów" },
  { code: "miechowski", name: "powiat miechowski" },
  { code: "myslenicki", name: "powiat myślenicki" },
  { code: "nowosadecki", name: "powiat nowosądecki" },
  { code: "nowotarski", name: "powiat nowotarski" },
  { code: "olkuski", name: "powiat olkuski" },
  { code: "oswiecimski", name: "powiat oświęcimski" },
  { code: "proszowicki", name: "powiat proszowicki" },
  { code: "suski", name: "powiat suski" },
  { code: "tarnowski", name: "powiat tarnowski" },
  { code: "tatrzanski", name: "powiat tatrzański" },
  { code: "wadowicki", name: "powiat wadowicki" },
  { code: "wielicki", name: "powiat wielicki" },
];

export function countyName(code: string): string | undefined {
  return COUNTIES.find((county) => county.code === code)?.name;
}
