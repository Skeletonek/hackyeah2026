import {
  IDEA_ASSET_LABELS,
  IDEA_STAGE_LABELS,
  TARGET_GROUP_LABELS,
  type IdeaAsset,
  type IdeaStage,
  type TargetGroup,
} from "@/lib/labels";
import type { Tables } from "@/lib/supabase/database.types";

/** Idea card („Fiszka”): the wizard's steps, its form values and its links. */

export type Idea = Tables<"ideas">;

export const IDEA_STEPS = [
  { label: "Na czym polega", heading: "Na czym polega Twój pomysł?" },
  { label: "Dla kogo", heading: "Dla kogo jest ten pomysł?" },
  { label: "Na jakim etapie", heading: "Na jakim etapie jesteś?" },
  { label: "Podsumowanie", heading: "Podsumowanie" },
] as const;

/** Steps with a form; the last one is the summary. */
export type IdeaFormStep = 1 | 2 | 3;
export type IdeaStep = IdeaFormStep | 4;

export const IDEA_STAGES = Object.keys(IDEA_STAGE_LABELS) as [IdeaStage, ...IdeaStage[]];
export const IDEA_ASSETS = Object.keys(IDEA_ASSET_LABELS) as [IdeaAsset, ...IdeaAsset[]];

/** One sentence under each stage in the step 3 cards. */
export const IDEA_STAGE_DESCRIPTIONS: Record<IdeaStage, string> = {
  concept: "Mam pomysł, ale jeszcze go nie sprawdzałem.",
  first_trial: "Zrobiliśmy to raz albo w małej grupie.",
  running: "Pomysł działa regularnie w jednym miejscu.",
  scaling: "Działa i przenosimy go do innych miejsc.",
};

/** The wizard's form values: what the fields show, with "" for an empty one. */
export type IdeaCardValues = {
  title: string;
  solution: string;
  problem: string;
  target_groups: TargetGroup[];
  audience: string;
  location: string;
  reach: string;
  stage: IdeaStage | "";
  assets: IdeaAsset[];
};

export type IdeaField = keyof IdeaCardValues;

export const EMPTY_IDEA_VALUES: IdeaCardValues = {
  title: "",
  solution: "",
  problem: "",
  target_groups: [],
  audience: "",
  location: "",
  reach: "",
  stage: "",
  assets: [],
};

export function ideaValues(idea: Idea): IdeaCardValues {
  return {
    title: idea.title,
    solution: idea.solution ?? "",
    problem: idea.problem ?? "",
    target_groups: idea.target_groups,
    audience: idea.audience ?? "",
    location: idea.location ?? "",
    reach: idea.reach ?? "",
    stage: idea.stage ?? "",
    assets: idea.assets as IdeaAsset[],
  };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID.test(value);
}

/** `?call=<id>` from the home bar: the grant call the person came for. */
export function callParam(value: unknown): string | undefined {
  const single = Array.isArray(value) ? value[0] : value;
  return isUuid(single) ? single : undefined;
}

/** `?step=1..4`; anything else opens the first step. */
export function stepParam(value: unknown): IdeaStep {
  const step = Number(Array.isArray(value) ? value[0] : value);
  return step === 2 || step === 3 || step === 4 ? step : 1;
}

/** Adds `?call=` so the grant call survives every step. */
function withCall(path: string, call: string | undefined, params: Record<string, string> = {}) {
  const query = new URLSearchParams(params);
  if (call) query.set("call", call);
  const search = query.toString();
  return search ? `${path}?${search}` : path;
}

export function ideaStepHref(id: string, step: IdeaStep, call?: string) {
  return withCall(`/ideas/${id}`, call, { step: String(step) });
}

export function ideaCanvasHref(id: string) {
  return `/ideas/${id}/canvas`;
}

export function ideaApplicationHref(id: string, call?: string) {
  return withCall(`/ideas/${id}/application`, call);
}

/** `submissions.body` check: 3–5000 characters. */
const MAX_BODY_LENGTH = 5000;

/**
 * `submissions.body` of an idea sent to ROPS: the card as plain text at the
 * moment of sending. Later edits of the card do not change it.
 */
export function ideaSnapshot(idea: Idea) {
  const assets = (idea.assets as IdeaAsset[]).map((asset) => IDEA_ASSET_LABELS[asset]).join(", ");
  const rows: [string, string | null | undefined][] = [
    ["Na czym polega", idea.solution],
    ["Jaki problem rozwiązuje", idea.problem],
    ["Kto skorzysta", idea.target_groups.map((group) => TARGET_GROUP_LABELS[group]).join(", ")],
    ["Odbiorcy", idea.audience],
    ["Gdzie", idea.location],
    ["Ile osób skorzysta w pierwszym roku", idea.reach],
    ["Etap", idea.stage && IDEA_STAGE_LABELS[idea.stage]],
    ["Co już jest", assets],
  ];

  const body = [
    `Pomysł: ${idea.title}`,
    ...rows.filter(([, value]) => value?.trim()).map(([label, value]) => `${label}:\n${value!.trim()}`),
  ].join("\n\n");
  return body.length > MAX_BODY_LENGTH ? `${body.slice(0, MAX_BODY_LENGTH - 1)}…` : body;
}
