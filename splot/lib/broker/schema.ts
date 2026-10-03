import { z } from "zod";

/** One ready service plan. Shared by `POST /api/broker` and the UI. */
export const serviceCardSchema = z.object({
  title: z.string().min(8).max(120),
  description: z.string().min(40).max(800),
  steps: z
    .array(
      z.object({
        title: z.string().min(4).max(80),
        when: z.string().min(4).max(80),
        detail: z.string().min(20).max(500),
      }),
    )
    .min(3)
    .max(7),
  resources: z.array(z.string().min(2).max(120)).min(2).max(8),
  costEstimate: z.object({
    range: z.string().min(2).max(80),
    note: z.string().min(10).max(300),
  }),
  risks: z
    .array(
      z.object({
        risk: z.string().min(4).max(200),
        mitigation: z.string().min(4).max(300),
      }),
    )
    .min(1)
    .max(4),
  indicators: z.array(z.string().min(4).max(140)).min(2).max(6),
});

export type ServiceCard = z.infer<typeof serviceCardSchema>;

export const municipalityTypeSchema = z.enum(["wiejska", "miejsko-wiejska", "miejska"]);

export const populationSchema = z.enum(["do-5-tys", "5-20-tys", "20-50-tys", "pow-50-tys"]);

export const budgetSchema = z.enum(["do-10-tys", "10-50-tys", "50-200-tys", "pow-200-tys"]);

/** ≤5 pól: rodzaj gminy, liczba mieszkańców, budżet, kadra, partnerzy. */
export const brokerContextSchema = z.object({
  municipalityType: municipalityTypeSchema,
  population: populationSchema,
  budget: budgetSchema,
  staff: z.string().trim().min(2).max(200),
  partners: z.string().trim().max(300).optional().default(""),
});

export type BrokerContext = z.infer<typeof brokerContextSchema>;

export const brokerRequestSchema = z.object({
  slug: z.string().trim().min(1).max(200),
  context: brokerContextSchema,
});

export type BrokerRequest = z.infer<typeof brokerRequestSchema>;

export const MUNICIPALITY_TYPE_OPTIONS = [
  { value: "wiejska", label: "Wiejska" },
  { value: "miejsko-wiejska", label: "Miejsko-wiejska" },
  { value: "miejska", label: "Miejska" },
] as const;

export const POPULATION_OPTIONS = [
  { value: "do-5-tys", label: "Do 5 tys. mieszkańców" },
  { value: "5-20-tys", label: "5–20 tys. mieszkańców" },
  { value: "20-50-tys", label: "20–50 tys. mieszkańców" },
  { value: "pow-50-tys", label: "Powyżej 50 tys." },
] as const;

export const BUDGET_OPTIONS = [
  { value: "do-10-tys", label: "Do 10 tys. zł" },
  { value: "10-50-tys", label: "10–50 tys. zł" },
  { value: "50-200-tys", label: "50–200 tys. zł" },
  { value: "pow-200-tys", label: "Powyżej 200 tys. zł" },
] as const;
