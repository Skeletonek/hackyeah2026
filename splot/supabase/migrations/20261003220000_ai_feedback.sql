-- 👍/👎 and „Zgłoś błąd” on every AI hint (AiHint). Append-only: a changed
-- vote is a new row, so the latest row per user and target is the current one.
create table public.ai_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- What was rated, e.g. 'conversation_message', 'match_reason', 'easy_read', 'submission_triage'.
  target_type text not null check (char_length(target_type) between 1 and 64),
  target_id text not null check (char_length(target_id) between 1 and 200),
  rating smallint not null check (rating in (-1, 1)),
  comment text check (char_length(comment) <= 2000),
  created_at timestamptz not null default now()
);

create index ai_feedback_target_idx on public.ai_feedback (target_type, target_id);

alter table public.ai_feedback enable row level security;

-- Anonymous sessions are `authenticated` too, so visitors without an account can rate.
create policy "ai_feedback: owner inserts" on public.ai_feedback
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "ai_feedback: admin reads" on public.ai_feedback
  for select to authenticated
  using ((select public.is_admin()));

grant select, insert, update, delete on public.ai_feedback to service_role;
grant select on public.ai_feedback to authenticated;
grant insert (target_type, target_id, rating, comment) on public.ai_feedback to authenticated;
