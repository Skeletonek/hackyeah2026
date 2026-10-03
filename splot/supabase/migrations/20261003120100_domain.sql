-- Splot domain: innovations, submissions, innovation pilots, threads with ROPS.
-- Rule: every table has RLS. System writes (AI triage, assistant messages)
-- go through the server with the secret key (lib/supabase/admin.ts).

create type public.challenge_category as enum (
  'aging', 'mental_health', 'loneliness', 'digital_exclusion',
  'service_access', 'coordination', 'depopulation'
);
create type public.innovation_stage as enum ('idea', 'pilot', 'deployed');
create type public.submission_kind as enum ('problem', 'idea');
create type public.submission_status as enum ('received', 'in_review', 'with_expert', 'answered', 'closed');
create type public.priority as enum ('low', 'medium', 'high');
create type public.pilot_status as enum ('applied', 'accepted', 'in_progress', 'completed', 'rejected');
create type public.organization_type as enum ('municipality', 'ngo', 'community_group', 'other');

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── Innovations (Library, module II) ────────────────────────────────────
create table public.innovations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  lead text,
  description text,
  easy_read_description text,
  categories public.challenge_category[] not null default '{}',
  stage public.innovation_stage not null default 'idea',
  author_id uuid references public.profiles (id) on delete set null,
  pilot_slots integer not null default 0 check (pilot_slots >= 0),
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on public.innovations (author_id);
create trigger set_updated_at before update on public.innovations
  for each row execute function public.set_updated_at();
alter table public.innovations enable row level security;

create policy "innovations: published are public" on public.innovations
  for select to anon, authenticated
  using (published);

create policy "innovations: authors read own drafts" on public.innovations
  for select to authenticated
  using (author_id = (select auth.uid()));

create policy "innovations: admin manages" on public.innovations
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- ── Submissions (Matchmaking I, Idea builder III, admin inbox VI) ───────
create sequence public.submissions_case_number_seq;

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  case_number text not null unique
    default 'SPL-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.submissions_case_number_seq')::text, 4, '0'),
  -- Tracking without an account: link with the case number plus this token
  -- (case numbers alone are guessable).
  tracking_token uuid not null default gen_random_uuid(),
  author_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind public.submission_kind not null default 'problem',
  body text not null check (char_length(body) between 3 and 5000),
  municipality text,
  county text,
  contact_email text,
  -- Triage fields: set by AI or an admin.
  category public.challenge_category,
  priority public.priority,
  possible_duplicate_id uuid references public.submissions (id) on delete set null,
  status public.submission_status not null default 'received',
  expert_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on public.submissions (author_id);
create index on public.submissions (expert_id);
create index on public.submissions (status, created_at desc);
create trigger set_updated_at before update on public.submissions
  for each row execute function public.set_updated_at();
alter table public.submissions enable row level security;

-- Authors (anonymous sessions too) provide only the content; the case
-- number, token and triage fields come from the database or an admin.
revoke insert on public.submissions from anon, authenticated;
grant insert (kind, body, municipality, county, contact_email) on public.submissions to authenticated;

create policy "submissions: authors create own" on public.submissions
  for insert to authenticated
  with check (author_id = (select auth.uid()));

create policy "submissions: author and assigned expert read" on public.submissions
  for select to authenticated
  using (author_id = (select auth.uid()) or expert_id = (select auth.uid()));

create policy "submissions: admin reads all" on public.submissions
  for select to authenticated
  using ((select public.is_admin()));

create policy "submissions: admin updates" on public.submissions
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "submissions: admin deletes" on public.submissions
  for delete to authenticated
  using ((select public.is_admin()));

-- Status tracker without an account (Task 7): case number + token from the link.
create function public.track_submission(p_case_number text, p_token uuid)
returns table (
  case_number text,
  kind public.submission_kind,
  status public.submission_status,
  created_at timestamptz,
  updated_at timestamptz
)
language sql stable security definer set search_path = ''
as $$
  select s.case_number, s.kind, s.status, s.created_at, s.updated_at
  from public.submissions s
  where s.case_number = p_case_number and s.tracking_token = p_token
$$;

grant execute on function public.track_submission to anon, authenticated;

-- ── Innovation pilots ("Tester innowacji", module IV) ───────────────────
-- Piloting is participation in testing one innovation, not an account role.
create table public.pilots (
  id uuid primary key default gen_random_uuid(),
  innovation_id uuid not null references public.innovations (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  organization_type public.organization_type not null,
  municipality text not null,
  plan text,
  contact_email text not null,
  status public.pilot_status not null default 'applied',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (innovation_id, user_id)
);

create index on public.pilots (user_id);
create trigger set_updated_at before update on public.pilots
  for each row execute function public.set_updated_at();
alter table public.pilots enable row level security;

revoke insert on public.pilots from anon, authenticated;
grant insert (innovation_id, organization_type, municipality, plan, contact_email) on public.pilots to authenticated;

create policy "pilots: apply" on public.pilots
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "pilots: read own" on public.pilots
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "pilots: admin manages" on public.pilots
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create table public.pilot_reviews (
  id uuid primary key default gen_random_uuid(),
  pilot_id uuid not null unique references public.pilots (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  feedback text,
  improvement text,
  -- Shown under the review on the innovation page, e.g. "Urząd Gminy Ropa" (no personal names).
  attribution text not null,
  is_public boolean not null default true,
  approved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on public.pilot_reviews
  for each row execute function public.set_updated_at();
alter table public.pilot_reviews enable row level security;

create function public.owns_active_pilot(p_pilot_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.pilots p
    where p.id = p_pilot_id
      and p.user_id = (select auth.uid())
      and p.status in ('in_progress', 'completed')
  )
$$;

create policy "pilot_reviews: pilot reviews after testing" on public.pilot_reviews
  for insert to authenticated
  with check (public.owns_active_pilot(pilot_id) and not approved);

-- "Save and finish later": the pilot can edit the review until it is moderated.
create policy "pilot_reviews: pilot edits before moderation" on public.pilot_reviews
  for update to authenticated
  using (public.owns_active_pilot(pilot_id) and not approved)
  with check (public.owns_active_pilot(pilot_id) and not approved);

create policy "pilot_reviews: pilot reads own" on public.pilot_reviews
  for select to authenticated
  using (public.owns_active_pilot(pilot_id));

create policy "pilot_reviews: public after ROPS moderation" on public.pilot_reviews
  for select to anon, authenticated
  using (is_public and approved);

create policy "pilot_reviews: admin moderates" on public.pilot_reviews
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- ── Threads with ROPS and experts (module V) ────────────────────────────
create table public.threads (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid references public.submissions (id) on delete cascade,
  subject text not null,
  created_at timestamptz not null default now()
);

create index on public.threads (submission_id);
alter table public.threads enable row level security;

create table public.thread_participants (
  thread_id uuid not null references public.threads (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (thread_id, user_id)
);

create index on public.thread_participants (user_id);
alter table public.thread_participants enable row level security;

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.threads (id) on delete cascade,
  author_id uuid default auth.uid() references auth.users (id) on delete set null,
  -- AI assistant hint ("ai" chat bubble); only the server inserts these.
  from_assistant boolean not null default false,
  body text not null check (char_length(body) between 1 and 10000),
  created_at timestamptz not null default now()
);

create index on public.messages (thread_id, created_at);
alter table public.messages enable row level security;

create function public.is_thread_participant(p_thread_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.thread_participants tp
    where tp.thread_id = p_thread_id and tp.user_id = (select auth.uid())
  )
$$;

-- Names of the other people in a thread (e.g. "Anna Nowak, ROPS") are visible.
create function public.shares_thread_with(p_user_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.thread_participants me
    join public.thread_participants other on other.thread_id = me.thread_id
    where me.user_id = (select auth.uid()) and other.user_id = p_user_id
  )
$$;

create policy "profiles: thread participants read each other" on public.profiles
  for select to authenticated
  using (public.shares_thread_with(id));

create policy "threads: participants read" on public.threads
  for select to authenticated
  using (public.is_thread_participant(id));

create policy "threads: admin manages" on public.threads
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "thread_participants: read own threads' members" on public.thread_participants
  for select to authenticated
  using (public.is_thread_participant(thread_id));

-- "Assign an expert" = an admin adds the expert to the thread.
create policy "thread_participants: admin manages" on public.thread_participants
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "messages: participants read" on public.messages
  for select to authenticated
  using (public.is_thread_participant(thread_id) or (select public.is_admin()));

create policy "messages: participants write as themselves" on public.messages
  for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and not from_assistant
    and (public.is_thread_participant(thread_id) or (select public.is_admin()))
  );

-- Every submission starts with a thread that includes its author.
create function public.create_submission_thread()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_thread_id uuid;
begin
  insert into public.threads (submission_id, subject)
  values (new.id, left(new.body, 80))
  returning id into v_thread_id;

  insert into public.thread_participants (thread_id, user_id)
  values (v_thread_id, new.author_id);

  return new;
end;
$$;

create trigger on_submission_created
  after insert on public.submissions
  for each row execute function public.create_submission_thread();

-- ── Thread attachments (Storage) ────────────────────────────────────────
-- Object path: {thread_id}/{file name}.
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', false);

create policy "attachments: thread participants read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'attachments'
    and (public.is_thread_participant(((storage.foldername(name))[1])::uuid) or (select public.is_admin()))
  );

create policy "attachments: thread participants upload" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'attachments'
    and (public.is_thread_participant(((storage.foldername(name))[1])::uuid) or (select public.is_admin()))
  );

-- ── Realtime: admin inbox toast and thread chat ─────────────────────────
-- Realtime respects RLS, so only admins receive new submissions.
alter publication supabase_realtime add table public.submissions, public.messages;
