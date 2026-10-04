"use server";

import { generateObject } from "ai";
import { redirect } from "next/navigation";
import { z } from "zod";
import { TEXT_MODEL } from "@/lib/ai/models";
import { getCurrentUser, type CurrentUser } from "@/lib/auth";
import {
  APPLICATION_CHECK_SYSTEM,
  APPLICATION_DRAFT_SYSTEM,
  applicationCheckPrompt,
  applicationCheckSchema,
  applicationDraftPrompt,
  applicationDraftSchema,
  applicationInputSchema,
  criteriaFromDraft,
  fieldsFromDraft,
  isApplicationEmpty,
  mergeCriteria,
  mergeFields,
  parseApplication,
  parseCriteria,
  parseSections,
  renderApplication,
  validateFields,
  type ApplicationContent,
  type ApplicationInput,
  type CallCriterion,
  type CallSection,
  type GrantCall,
} from "@/lib/ideas/application";
import { isUuid, type Idea } from "@/lib/ideas/card";
import { getApplicationCall, getGrantApplication, getIdea } from "@/lib/ideas/queries";
import { onSubmissionCreated, submissionHref } from "@/lib/submissions/on-created";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json, Tables } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export type ApplicationResult =
  | { ok: true; content: ApplicationContent }
  | { error: string; fieldErrors?: Record<string, string[]> };

export type CallAlertState = { ok: true } | { error: string; fieldErrors?: { email?: string[] } } | null;

const NOT_FOUND = "Nie znaleźliśmy tej fiszki. Wniosek zmienia tylko autor pomysłu.";
const CALL_CLOSED = "Ten nabór już nie przyjmuje wniosków.";
const ALREADY_SENT = "Ten wniosek jest już wysłany. Nie można go zmienić.";
const SAVE_FAILED = "Nie udało się zapisać wniosku. Spróbuj jeszcze raz za chwilę.";
const SUBMISSION_COLUMNS = "id, case_number, tracking_token, author_id, contact_email";

type Draft = {
  idea: Idea;
  user: CurrentUser;
  call: GrantCall;
  sections: CallSection[];
  criteria: CallCriterion[];
  /** Null until the first open creates it. */
  application: Tables<"grant_applications"> | null;
};

/** The card, only for its author, with the open call and the application in it. */
async function loadDraft(ideaId: string, callId: string): Promise<Draft | { error: string }> {
  if (!isUuid(callId)) return { error: CALL_CLOSED };

  // RLS also shows admins other people's cards; only the author changes the application.
  const [idea, user, call] = await Promise.all([getIdea(ideaId), getCurrentUser(), getApplicationCall(callId)]);
  if (!idea || !user || idea.user_id !== user.id) return { error: NOT_FOUND };
  if (!call || call.id !== callId) return { error: CALL_CLOSED };

  return {
    idea,
    user,
    call,
    sections: parseSections(call.sections),
    criteria: parseCriteria(call.criteria),
    application: await getGrantApplication(idea.id, call.id),
  };
}

async function saveContent(applicationId: string, content: ApplicationContent) {
  // RLS: only the card owner's application is updated.
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("grant_applications")
    .update({ fields: content.fields as Json, criteria: content.criteria as Json })
    .eq("id", applicationId)
    .eq("status", "draft")
    .select("id");
  if (error) console.error("saveContent failed", error.message);
  return !error && data.length > 0;
}

/**
 * First open of the application: creates the row and, in one model call,
 * drafts the fields from the idea card and the canvas and judges the call's
 * criteria. An application that already has content is returned as it is.
 */
export async function prepareApplication(ideaId: string, callId: string): Promise<ApplicationResult> {
  const draft = await loadDraft(ideaId, callId);
  if ("error" in draft) return draft;
  const { idea, call, sections, criteria } = draft;

  let application = draft.application;
  if (!application) {
    const supabase = await createClient();
    const { error } = await supabase.from("grant_applications").insert({ idea_id: idea.id, call_id: call.id });
    // 23505: a parallel open created the row first.
    if (error && error.code !== "23505") {
      console.error("prepareApplication insert failed", error.message);
      return { error: SAVE_FAILED };
    }
    application = await getGrantApplication(idea.id, call.id);
    if (!application) return { error: SAVE_FAILED };
  }

  const existing = parseApplication(application);
  if (application.status !== "draft" || !isApplicationEmpty(existing)) return { ok: true, content: existing };

  let content: ApplicationContent;
  try {
    const { object } = await generateObject({
      model: TEXT_MODEL,
      schema: applicationDraftSchema(sections, criteria),
      system: APPLICATION_DRAFT_SYSTEM,
      prompt: applicationDraftPrompt(idea, call, criteria),
    });
    content = {
      fields: fieldsFromDraft(sections, object.fields as Record<string, string | null>),
      criteria: criteriaFromDraft(criteria, object.criteria as Record<string, { met: boolean; note: string }>),
    };
  } catch (error) {
    console.error("prepareApplication failed", ideaId, error);
    return { error: "Nie udało się przygotować propozycji. Pola możesz wypełnić samodzielnie." };
  }

  if (!(await saveContent(application.id, content))) return { error: SAVE_FAILED };
  return { ok: true, content };
}

type Saved = { draft: Draft; application: Tables<"grant_applications">; content: ApplicationContent };

/** Checks and stores what is in the form now. Every button of the form starts with it. */
async function persist(
  ideaId: string,
  callId: string,
  input: ApplicationInput,
  mode: "draft" | "complete",
): Promise<Saved | { error: string; fieldErrors?: Record<string, string[]> }> {
  const parsed = applicationInputSchema.safeParse(input);
  if (!parsed.success) return { error: SAVE_FAILED };

  const draft = await loadDraft(ideaId, callId);
  if ("error" in draft) return draft;
  const { application, sections, criteria } = draft;
  if (!application) return { error: SAVE_FAILED };
  if (application.status !== "draft") return { error: ALREADY_SENT };

  const checked = validateFields(sections, parsed.data.fields, mode);
  if (!checked.ok) return { error: "Popraw zaznaczone pola.", fieldErrors: checked.fieldErrors };

  const stored = parseApplication(application);
  const content: ApplicationContent = {
    fields: mergeFields(sections, stored.fields, checked.values),
    criteria: mergeCriteria(criteria, stored.criteria, parsed.data.criteria),
  };
  if (!(await saveContent(application.id, content))) return { error: SAVE_FAILED };
  return { draft, application, content };
}

/** „Zapisz szkic”: stores the fields and the author's ticks. */
export async function saveApplication(ideaId: string, callId: string, input: ApplicationInput): Promise<ApplicationResult> {
  const saved = await persist(ideaId, callId, input, "draft");
  return "error" in saved ? saved : { ok: true, content: saved.content };
}

/** „Sprawdź wniosek z asystentem”: saves the form and re-runs only the criteria judgement. */
export async function checkApplication(ideaId: string, callId: string, input: ApplicationInput): Promise<ApplicationResult> {
  const saved = await persist(ideaId, callId, input, "draft");
  if ("error" in saved) return saved;
  const { call, sections, criteria } = saved.draft;

  let content: ApplicationContent;
  try {
    const { object } = await generateObject({
      model: TEXT_MODEL,
      schema: applicationCheckSchema(criteria),
      system: APPLICATION_CHECK_SYSTEM,
      prompt: applicationCheckPrompt(call, sections, criteria, saved.content.fields),
    });
    content = {
      fields: saved.content.fields,
      criteria: criteriaFromDraft(criteria, object.criteria as Record<string, { met: boolean; note: string }>),
    };
  } catch (error) {
    console.error("checkApplication failed", ideaId, error);
    return { error: "Zapisaliśmy wniosek, ale nie udało się go sprawdzić. Spróbuj jeszcze raz za chwilę." };
  }

  if (!(await saveContent(saved.application.id, content))) return { error: SAVE_FAILED };
  return { ok: true, content };
}

/**
 * „Wyślij wniosek”: saves the form, turns it into a submission of kind
 * application and opens it. Every field has to be filled in and every
 * criterion ticked. The body is a snapshot of the form.
 */
export async function submitApplication(ideaId: string, callId: string, input: ApplicationInput): Promise<ApplicationResult> {
  const saved = await persist(ideaId, callId, input, "complete");
  if ("error" in saved) return saved;
  const { idea, user, call, sections, criteria } = saved.draft;

  if (criteria.some(({ key }) => !saved.content.criteria[key]?.met)) {
    return { error: "Zaznacz wszystkie kryteria naboru. Dopiero wtedy wyślesz wniosek." };
  }

  const supabase = await createClient();
  const { data: sub, error: insertError } = await supabase
    .from("submissions")
    .insert({
      kind: "application",
      idea_id: idea.id,
      body: renderApplication(call, idea, sections, criteria, saved.content.fields),
    })
    .select(SUBMISSION_COLUMNS)
    .single();
  if (insertError || !sub) {
    console.error("submitApplication insert failed", insertError?.message);
    return { error: "Nie udało się wysłać wniosku. Wniosek jest zapisany, spróbuj jeszcze raz za chwilę." };
  }

  const { data: marked, error: markError } = await supabase
    .from("grant_applications")
    .update({ status: "submitted", submission_id: sub.id })
    .eq("id", saved.application.id)
    .eq("status", "draft")
    .select("id");
  if (markError) console.error("submitApplication mark failed", markError.message);

  if (!marked?.length) {
    // A parallel click sent the application first. Authors cannot delete
    // submissions, so the system removes the duplicate.
    await createAdminClient().from("submissions").delete().eq("id", sub.id);
    const current = await getGrantApplication(idea.id, call.id);
    const { data: first } = current?.submission_id
      ? await supabase.from("submissions").select(SUBMISSION_COLUMNS).eq("id", current.submission_id).maybeSingle()
      : { data: null };
    if (first) redirect(submissionHref(first, user.isAnonymous));
    return { error: SAVE_FAILED };
  }

  onSubmissionCreated(sub);
  redirect(submissionHref(sub, user.isAnonymous));
}

const alertSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Wpisz adres e-mail, np. jan@example.com.").max(254)),
});

/** „Powiadom mnie”: remembers the e-mail to write to when ROPS opens a grant call. */
export async function requestCallAlert(ideaId: string, _previous: CallAlertState, formData: FormData): Promise<CallAlertState> {
  const parsed = alertSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: "Popraw adres e-mail.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  // RLS shows the card to its author (and admins), who already have a session.
  const [idea, user] = await Promise.all([getIdea(ideaId), getCurrentUser()]);
  if (!idea || !user) return { error: NOT_FOUND };

  const supabase = await createClient();
  const { error } = await supabase.from("call_alerts").insert({ email: parsed.data.email, idea_id: idea.id });
  if (error) {
    console.error("requestCallAlert failed", error.message);
    return { error: "Nie udało się zapisać adresu. Spróbuj jeszcze raz za chwilę." };
  }
  return { ok: true };
}
