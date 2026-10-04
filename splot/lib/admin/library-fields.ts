import { z } from "zod";
import { Constants } from "@/lib/supabase/database.types";

/** The library editor form: fields, labels and the zod schema. Shared by the form and its actions. */

/** The five description sections, in the order of the public innovation page. */
export const SECTION_FIELDS = [
  { name: "solution", label: "Na czym polega" },
  { name: "problem", label: "Jaki problem rozwiązuje" },
  { name: "audience", label: "Odbiorcy" },
  { name: "adopters", label: "Kto może skorzystać" },
  { name: "evidence", label: "Czy to działa?" },
] as const;

export const URL_FIELDS = [
  { name: "video_url", label: "Film", hint: "Link do YouTube albo innego serwisu z filmem." },
  { name: "folder_pdf_url", label: "Folder PDF", hint: "Link do pliku PDF z opisem innowacji." },
  { name: "materials_url", label: "Materiały", hint: "Link do materiałów do pobrania." },
  { name: "source_url", label: "Strona źródłowa", hint: "Strona innowacji w Bibliotece ROPS." },
] as const;

export const MAX_CATEGORIES = 3;
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** „Łatwa ścieżka do pracy” → „latwa-sciezka-do-pracy”. */
export function slugify(title: string) {
  return title
    .toLowerCase()
    .replace(/ł/g, "l")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/, "");
}

/** Empty field → null, so cleared text is stored as „no value”, not "". */
const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label}: skróć do ${max} znaków.`)
    .transform((value) => value || null);

const optionalUrl = z
  .string()
  .trim()
  .transform((value) => value || null)
  .pipe(
    z
      .url({ protocol: /^https?$/, error: "Wpisz pełny adres, który zaczyna się od https://." })
      .max(500, "Adres jest za długi.")
      .nullable(),
  );

export const innovationInput = z
  .object({
    id: z.union([z.uuid(), z.literal("")]).transform((value) => value || null),
    title: z.string().trim().min(3, "Wpisz tytuł, co najmniej 3 znaki.").max(200, "Skróć tytuł do 200 znaków."),
    slug: z.string().trim().toLowerCase().max(80, "Skróć adres do 80 znaków."),
    lead: optionalText(500, "Zajawka"),
    solution: optionalText(5000, "Na czym polega"),
    problem: optionalText(5000, "Jaki problem rozwiązuje"),
    audience: optionalText(5000, "Odbiorcy"),
    adopters: optionalText(5000, "Kto może skorzystać"),
    evidence: optionalText(5000, "Czy to działa?"),
    easy_read_description: optionalText(2000, "Wersja łatwa"),
    target_groups: z.array(z.enum(Constants.public.Enums.target_group, "Wybierz grupę z listy.")),
    categories: z
      .array(z.enum(Constants.public.Enums.challenge_category, "Wybierz wyzwanie z listy."))
      .min(1, "Zaznacz co najmniej jedno wyzwanie.")
      .max(MAX_CATEGORIES, `Zaznacz najwyżej ${MAX_CATEGORIES} wyzwania.`),
    stage: z.enum(Constants.public.Enums.innovation_stage, "Wybierz etap z listy."),
    video_url: optionalUrl,
    folder_pdf_url: optionalUrl,
    materials_url: optionalUrl,
    source_url: optionalUrl,
    pilot_slots: z.coerce
      .number("Wpisz liczbę.")
      .int("Wpisz liczbę całkowitą.")
      .min(0, "Liczba miejsc nie może być ujemna.")
      .max(1000, "Wpisz najwyżej 1000."),
    published: z.boolean(),
  })
  // An empty address is made from the title, so a new innovation needs only a title.
  .transform((data) => ({ ...data, slug: data.slug || slugify(data.title) }))
  .refine((data) => SLUG_PATTERN.test(data.slug), {
    path: ["slug"],
    message: "Użyj tylko małych liter bez polskich znaków, cyfr i myślników, np. srebrna-siec.",
  });

export type InnovationInput = z.output<typeof innovationInput>;

/** FormData → the shape `innovationInput` expects (checkbox groups are repeated keys). */
export function innovationFormValues(formData: FormData) {
  const text = (name: string) => {
    const value = formData.get(name);
    return typeof value === "string" ? value : "";
  };
  return {
    id: text("id"),
    title: text("title"),
    slug: text("slug"),
    lead: text("lead"),
    solution: text("solution"),
    problem: text("problem"),
    audience: text("audience"),
    adopters: text("adopters"),
    evidence: text("evidence"),
    easy_read_description: text("easy_read_description"),
    target_groups: formData.getAll("target_groups"),
    categories: formData.getAll("categories"),
    stage: text("stage"),
    video_url: text("video_url"),
    folder_pdf_url: text("folder_pdf_url"),
    materials_url: text("materials_url"),
    source_url: text("source_url"),
    pilot_slots: text("pilot_slots") || "0",
    published: formData.get("published") === "on",
  };
}
