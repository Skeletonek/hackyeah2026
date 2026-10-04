import { z } from "zod";
import data from "@/data/materials.json";
import { Constants } from "@/lib/supabase/database.types";

/**
 * Educational materials for /resources (SPL-20): ROPS reports, innovation
 * guides, the Social Innovation Canvas and the library's innovation videos.
 * Parsed at import, so a broken data/materials.json fails the build.
 */

export const MATERIAL_KINDS = ["report", "guide", "canvas", "video"] as const;

export const areaKey = z.enum([
  "family_foster_care",
  "homelessness",
  "disability",
  "poverty",
  "foreigners",
  "health",
  "mental_health",
  "seniors",
]);

export const challengeCategoryEnum = z.enum(Constants.public.Enums.challenge_category);

const material = z.object({
  kind: z.enum(MATERIAL_KINDS),
  title: z.string().min(1),
  year: z.number().int().optional(),
  publisher: z.string().min(1),
  url: z.url(),
  description: z.string().min(1),
  /** Mapa Wyzwań Społecznych area keys (data/challenge-map.json). */
  areas: z.array(areaKey),
  categories: z.array(challengeCategoryEnum),
  /** Videos only: the innovation the film is about. */
  innovation_slug: z.string().optional(),
  /** Set when the material is not in Polish. */
  language: z.string().optional(),
});

const materialsSchema = z.object({
  source: z.object({ title: z.string(), pages: z.array(z.url()), note: z.string() }),
  materials: z.array(material).min(1),
});

export type Material = z.infer<typeof material>;
export type MaterialKind = Material["kind"];

export const materials: Material[] = materialsSchema.parse(data).materials;

/** UI group labels, in display order. */
export const MATERIAL_KIND_LABELS: Record<MaterialKind, string> = {
  report: "Raporty",
  guide: "Przewodniki",
  canvas: "Kanwy",
  video: "Wideo",
};

export function materialsByKind(kind: MaterialKind): Material[] {
  return materials
    .filter((item) => item.kind === kind)
    .sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
}
