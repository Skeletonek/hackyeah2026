"use server";

import { z } from "zod";
import { requireUser } from "@/lib/auth";
import {
  applyForPilot,
  savePilotReview,
  type PilotApplicationValues,
  type PilotReviewValues,
} from "@/lib/library/pilots";
import { PILOT_STATUS_LABELS } from "@/lib/labels";

/**
 * Server actions for /library/[slug]/pilot (SPL-38).
 * Forms use useActionState; the returned state keeps submitted values on errors.
 * The schema grants pilot writes only to authenticated users, so both actions
 * require a signed-in account.
 */

const applicationSchema = z.object({
  organizationType: z.enum(["municipality", "ngo", "community_group", "other"] as const),
  municipality: z.string().min(1, "Podaj gminę lub instytucję."),
  plan: z.string().optional(),
  contactEmail: z.string().min(1, "Podaj adres e-mail.").email("Podaj prawidłowy adres e-mail."),
});

const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  feedback: z.string().optional(),
  improvement: z.string().optional(),
  attribution: z.string().min(1, "Podaj podpis organizacji."),
});

export type ApplicationState =
  | { status: "idle" }
  | { status: "success"; message: string; statusLabel: string }
  | {
      status: "error";
      error?: string;
      fieldErrors?: Partial<Record<keyof PilotApplicationValues, string[]>>;
      values?: Partial<PilotApplicationValues>;
    };

export async function submitApplication(
  innovationId: string,
  _previous: ApplicationState,
  formData: FormData,
): Promise<ApplicationState> {
  await requireUser(`/library/${innovationId}/pilot`);

  const parsed = applicationSchema.safeParse({
    organizationType: formData.get("organizationType"),
    municipality: formData.get("municipality"),
    plan: formData.get("plan"),
    contactEmail: formData.get("contactEmail"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      fieldErrors: parsed.error.flatten().fieldErrors,
      values: {
        organizationType: formData.get("organizationType") as PilotApplicationValues["organizationType"],
        municipality: String(formData.get("municipality") ?? ""),
        plan: String(formData.get("plan") ?? ""),
        contactEmail: String(formData.get("contactEmail") ?? ""),
      },
    };
  }

  const result = await applyForPilot(innovationId, parsed.data);

  if (!result.ok) {
    return {
      status: "error",
      error: result.error,
      values: parsed.data,
    };
  }

  return {
    status: "success",
    message: "Zgłoszenie zostało przyjęte. ROPS skontaktuje się z Tobą w sprawie pilotażu.",
    statusLabel: PILOT_STATUS_LABELS[result.pilot.status],
  };
}

export type ReviewState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | {
      status: "error";
      error?: string;
      fieldErrors?: Partial<Record<keyof PilotReviewValues, string[]>>;
      values?: Partial<PilotReviewValues>;
    };

export async function submitReview(
  pilotId: string,
  _previous: ReviewState,
  formData: FormData,
): Promise<ReviewState> {
  await requireUser("/library");

  const parsed = reviewSchema.safeParse({
    rating: formData.get("rating"),
    feedback: formData.get("feedback"),
    improvement: formData.get("improvement"),
    attribution: formData.get("attribution"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      fieldErrors: parsed.error.flatten().fieldErrors,
      values: {
        rating: Number(formData.get("rating")) || undefined,
        feedback: String(formData.get("feedback") ?? ""),
        improvement: String(formData.get("improvement") ?? ""),
        attribution: String(formData.get("attribution") ?? ""),
      },
    };
  }

  await savePilotReview(pilotId, parsed.data);

  return {
    status: "success",
    message: "Dziękujemy! Opinia pojawi się po sprawdzeniu przez ROPS.",
  };
}
