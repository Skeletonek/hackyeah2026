-- Idea builder (III): idea cards, grant applications and the link from a
-- submission back to the card it was made from.

create type public.idea_stage as enum ('concept', 'first_trial', 'running', 'scaling');

-- ── ideas: an author's idea card, kept as a draft ───────────────────────
-- Column names follow public.innovations, so matching and rendering code
-- works on both.
create table public.ideas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  solution text check (char_length(solution) <= 2000),
  problem text check (char_length(problem) <= 2000),
  target_groups public.target_group[] not null default '{}',
  audience text check (char_length(audience) <= 500),
  location text check (char_length(location) <= 120),
  reach text check (char_length(reach) <= 120),
  stage public.idea_stage,
  assets text[] not null default '{}'
    check (assets <@ array['place', 'people', 'partner', 'money']),
  -- Social Innovation Canvas: { [field]: { text, source: 'ai' | 'author' } }.
  canvas jsonb not null default '{}' check (jsonb_typeof(canvas) = 'object'),
  -- The idea assistant's conversation, so a resumed draft gets the same one.
  conversation_id uuid references public.conversations (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on public.ideas (user_id);
create index on public.ideas (conversation_id);
create trigger set_updated_at before update on public.ideas
  for each row execute function public.set_updated_at();
alter table public.ideas enable row level security;

-- Owners (anonymous sessions too) write the content; the owner never changes.
grant select on public.ideas to authenticated;
grant insert (title, solution, problem, target_groups, audience, location, reach, stage, assets, canvas, conversation_id)
  on public.ideas to authenticated;
grant update (title, solution, problem, target_groups, audience, location, reach, stage, assets, canvas, conversation_id)
  on public.ideas to authenticated;
grant select, insert, update, delete on public.ideas to service_role;

create policy "ideas: owner reads" on public.ideas
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "ideas: owner creates" on public.ideas
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "ideas: owner updates" on public.ideas
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "ideas: admin reads all" on public.ideas
  for select to authenticated
  using ((select public.is_admin()));

-- ── grant_applications: an idea card turned into one call's application ──
create table public.grant_applications (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.ideas (id) on delete cascade,
  call_id uuid not null references public.grant_calls (id) on delete cascade,
  -- { [section key]: { value, source: 'ai' | 'author' } }
  fields jsonb not null default '{}' check (jsonb_typeof(fields) = 'object'),
  -- { [criterion key]: { met, note } }
  criteria jsonb not null default '{}' check (jsonb_typeof(criteria) = 'object'),
  status text not null default 'draft' check (status in ('draft', 'submitted')),
  submission_id uuid references public.submissions (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (idea_id, call_id)
);

create index on public.grant_applications (call_id);
create index on public.grant_applications (submission_id);
create trigger set_updated_at before update on public.grant_applications
  for each row execute function public.set_updated_at();
alter table public.grant_applications enable row level security;

grant select on public.grant_applications to authenticated;
grant insert (idea_id, call_id, fields, criteria) on public.grant_applications to authenticated;
grant update (fields, criteria, status, submission_id) on public.grant_applications to authenticated;
grant select, insert, update, delete on public.grant_applications to service_role;

-- The subqueries run under the ideas RLS, which shows authors only their own cards.
create policy "grant_applications: idea owner reads" on public.grant_applications
  for select to authenticated
  using (exists (select 1 from public.ideas i where i.id = idea_id and i.user_id = (select auth.uid())));

create policy "grant_applications: idea owner creates" on public.grant_applications
  for insert to authenticated
  with check (exists (select 1 from public.ideas i where i.id = idea_id and i.user_id = (select auth.uid())));

create policy "grant_applications: idea owner updates" on public.grant_applications
  for update to authenticated
  using (exists (select 1 from public.ideas i where i.id = idea_id and i.user_id = (select auth.uid())))
  with check (exists (select 1 from public.ideas i where i.id = idea_id and i.user_id = (select auth.uid())));

create policy "grant_applications: admin reads all" on public.grant_applications
  for select to authenticated
  using ((select public.is_admin()));

-- ── submissions.idea_id: the card behind an idea or application submission ──
alter table public.submissions
  add column idea_id uuid references public.ideas (id) on delete set null;

create index on public.submissions (idea_id);
grant insert (idea_id) on public.submissions to authenticated;

-- A foreign key is not checked under RLS, so without this an author could
-- attach someone else's card.
create policy "submissions: idea belongs to the author" on public.submissions
  as restrictive for insert to authenticated
  with check (
    idea_id is null
    or exists (select 1 from public.ideas i where i.id = idea_id and i.user_id = (select auth.uid()))
  );

-- ── grant_calls: signed-in people read calls too ────────────────────────
-- The data contract granted select only to anon, so anyone with a session
-- (also an anonymous one, which every draft author has) got permission denied.
grant select on public.grant_calls to authenticated;
