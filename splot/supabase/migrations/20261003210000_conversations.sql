-- Conversations: one person's exchange with one Skill (lib/ai). The server
-- keeps the history; the client sends only the new message.

create table public.conversations (
  -- useChat id, generated on the client.
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- Skill name, same as the route segment in /api/agent/<skill>.
  skill text not null check (char_length(skill) between 1 and 64),
  -- Set by the tool that creates a submission, so ROPS sees the transcript.
  submission_id uuid references public.submissions (id) on delete set null,
  -- UIMessage[] (AI SDK).
  messages jsonb not null default '[]' check (jsonb_typeof(messages) = 'array'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on public.conversations (user_id);
create index on public.conversations (submission_id);
create trigger set_updated_at before update on public.conversations
  for each row execute function public.set_updated_at();
alter table public.conversations enable row level security;

-- Owners (anonymous sessions too) create and continue their conversations;
-- the owner and the skill never change.
grant select on public.conversations to authenticated;
grant insert (id, skill, submission_id, messages) on public.conversations to authenticated;
grant update (submission_id, messages) on public.conversations to authenticated;
grant select, insert, update, delete on public.conversations to service_role;

create policy "conversations: owner reads" on public.conversations
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "conversations: owner creates" on public.conversations
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "conversations: owner updates" on public.conversations
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "conversations: admin reads all" on public.conversations
  for select to authenticated
  using ((select public.is_admin()));

-- The subquery runs under the submissions RLS, which already lets the
-- assigned expert read the row.
create policy "conversations: assigned expert reads" on public.conversations
  for select to authenticated
  using (
    exists (
      select 1 from public.submissions s
      where s.id = submission_id and s.expert_id = (select auth.uid())
    )
  );
