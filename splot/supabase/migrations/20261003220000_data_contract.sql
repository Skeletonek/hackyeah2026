-- D1 Schema contract migration: shared tables, columns and RPCs.
-- This migration is intentionally broad: it establishes the contracts
-- every other stream builds against. Push it first.

-- ── Extensions ──────────────────────────────────────────────────────────
create extension if not exists vector with schema extensions;
create extension if not exists unaccent with schema extensions;

-- unaccent() is only stable (it reads the dictionary through search_path), so
-- generated columns and indexes cannot call it. This wrapper pins the
-- dictionary and is safe to mark immutable.
create function public.immutable_unaccent(text)
returns text
language sql immutable parallel safe strict set search_path = ''
as $$
  select extensions.unaccent('extensions.unaccent'::regdictionary, $1)
$$;

-- ── New enums ───────────────────────────────────────────────────────────
create type public.target_group as enum (
  'seniors',
  'children_family',
  'limited_mobility',
  'sensory_disability',
  'intellectual_disability',
  'health',
  'foreigners',
  'labour_market',
  'homelessness'
);

-- ── Innovations: richer data model for the library ──────────────────────
alter table public.innovations
  drop column if exists description,
  add column if not exists solution text,
  add column if not exists problem text,
  add column if not exists audience text,
  add column if not exists adopters text,
  add column if not exists evidence text,
  add column if not exists target_groups public.target_group[] not null default '{}',
  add column if not exists source_url text,
  add column if not exists video_url text,
  add column if not exists folder_pdf_url text,
  add column if not exists materials_url text,
  add column if not exists source_project text,
  add column if not exists embedding extensions.vector(1536),
  add column if not exists fts tsvector generated always as (
    setweight(to_tsvector('simple', public.immutable_unaccent(coalesce(title, ''))), 'A') ||
    setweight(to_tsvector('simple', public.immutable_unaccent(coalesce(lead, ''))), 'B') ||
    setweight(to_tsvector('simple', public.immutable_unaccent(coalesce(solution, ''))), 'B') ||
    setweight(to_tsvector('simple', public.immutable_unaccent(coalesce(problem, ''))), 'B') ||
    setweight(to_tsvector('simple', public.immutable_unaccent(coalesce(audience, ''))), 'C') ||
    setweight(to_tsvector('simple', public.immutable_unaccent(coalesce(adopters, ''))), 'C') ||
    setweight(to_tsvector('simple', public.immutable_unaccent(coalesce(evidence, ''))), 'C')
  ) stored;

create index if not exists innovations_embedding_idx on public.innovations using hnsw (embedding extensions.vector_cosine_ops);
create index if not exists innovations_fts_idx on public.innovations using gin (fts);

-- ── Submissions: AI triage columns ──────────────────────────────────────
alter table public.submissions
  add column if not exists ai_summary text,
  add column if not exists ai_suggested_slugs text[],
  add column if not exists ai_needs_expert boolean,
  add column if not exists ai_model text,
  add column if not exists ai_triaged_at timestamptz,
  add column if not exists embedding extensions.vector(1536);

create index if not exists submissions_embedding_idx on public.submissions using hnsw (embedding extensions.vector_cosine_ops);

-- ── submission_kind: application ────────────────────────────────────────
alter type public.submission_kind add value if not exists 'application';

-- ── grant_calls ─────────────────────────────────────────────────────────
create table public.grant_calls (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  opens_at timestamptz not null,
  closes_at timestamptz not null,
  category public.challenge_category,
  sections jsonb not null default '[]'::jsonb,
  criteria jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on public.grant_calls
  for each row execute function public.set_updated_at();

alter table public.grant_calls enable row level security;

-- ── call_alerts ─────────────────────────────────────────────────────────
create table public.call_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  email text not null,
  idea_id uuid,
  call_id uuid references public.grant_calls (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index on public.call_alerts (user_id);
create index on public.call_alerts (call_id);

alter table public.call_alerts enable row level security;

-- ── connection_requests ─────────────────────────────────────────────────
create table public.connection_requests (
  id uuid primary key default gen_random_uuid(),
  from_submission_id uuid not null references public.submissions (id) on delete cascade,
  to_submission_id uuid not null references public.submissions (id) on delete cascade,
  requested_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'dismissed')),
  thread_id uuid references public.threads (id) on delete set null,
  created_at timestamptz not null default now(),
  check (from_submission_id <> to_submission_id)
);

create index on public.connection_requests (from_submission_id);
create index on public.connection_requests (to_submission_id);
create index on public.connection_requests (thread_id);

alter table public.connection_requests enable row level security;

-- ── match_innovations: hybrid vector + full-text search ─────────────────
create function public.match_innovations(
  query_text text,
  query_embedding extensions.vector(1536),
  match_count int default 5,
  filter_categories public.challenge_category[] default null
)
returns table (
  id uuid,
  slug text,
  title text,
  lead text,
  categories public.challenge_category[],
  stage public.innovation_stage,
  score double precision
)
language sql stable set search_path = extensions, public, pg_temp
as $$
  with text_ranks as (
    select
      i.id,
      row_number() over (order by ts_rank_cd(i.fts, plainto_tsquery('simple', public.immutable_unaccent(query_text))) desc) as rank
    from public.innovations i
    where query_text is not null and query_text <> ''
      and i.fts @@ plainto_tsquery('simple', public.immutable_unaccent(query_text))
      and i.published
      and (filter_categories is null or i.categories && filter_categories)
  ),
  vector_ranks as (
    select
      i.id,
      row_number() over (order by i.embedding <=> query_embedding) as rank
    from public.innovations i
    where i.published
      and (filter_categories is null or i.categories && filter_categories)
  ),
  combined as (
    select
      i.id,
      i.slug,
      i.title,
      i.lead,
      i.categories,
      i.stage,
      coalesce(sum(1.0 / (60 + t.rank)), 0.0) * 0.5 +
      coalesce(sum(1.0 / (60 + v.rank)), 0.0) * 0.5 as score
    from public.innovations i
    left join text_ranks t on t.id = i.id
    left join vector_ranks v on v.id = i.id
    where i.published
      and (filter_categories is null or i.categories && filter_categories)
      and (t.id is not null or v.id is not null)
    group by i.id, i.slug, i.title, i.lead, i.categories, i.stage
  )
  select * from combined
  order by score desc
  limit match_count;
$$;

grant execute on function public.match_innovations to anon, authenticated;

-- ── similar_submissions: find similar cases without exposing body ───────
create function public.similar_submissions(
  query_embedding extensions.vector(1536),
  match_count int default 3,
  exclude_id uuid default null
)
returns table (
  id uuid,
  municipality text,
  county text,
  category public.challenge_category,
  ai_summary text,
  similarity double precision
)
language sql stable security definer set search_path = ''
as $$
  select
    s.id,
    s.municipality,
    s.county,
    s.category,
    s.ai_summary,
    1 - (s.embedding operator(extensions.<=>) query_embedding) as similarity
  from public.submissions s
  where s.ai_triaged_at is not null
    and (exclude_id is null or s.id <> exclude_id)
  order by s.embedding operator(extensions.<=>) query_embedding
  limit match_count;
$$;

grant execute on function public.similar_submissions to anon, authenticated;

-- ── RLS policies for new tables ─────────────────────────────────────────
-- grant_calls: everyone reads, admin writes
create policy "grant_calls: public read" on public.grant_calls
  for select to anon, authenticated using (true);

create policy "grant_calls: admin manages" on public.grant_calls
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- call_alerts: owner inserts/reads, admin reads
create policy "call_alerts: owner read" on public.call_alerts
  for select to authenticated using (user_id = (select auth.uid()));

create policy "call_alerts: owner insert" on public.call_alerts
  for insert to authenticated with check (user_id = (select auth.uid()));

create policy "call_alerts: admin read" on public.call_alerts
  for select to authenticated using ((select public.is_admin()));

-- connection_requests: author of from_submission inserts, involved read, admin manages
create policy "connection_requests: from author insert" on public.connection_requests
  for insert to authenticated
  with check (
    requested_by = (select auth.uid())
    and exists (
      select 1 from public.submissions s
      where s.id = from_submission_id and s.author_id = (select auth.uid())
    )
  );

create policy "connection_requests: involved read" on public.connection_requests
  for select to authenticated
  using (
    exists (
      select 1 from public.submissions s
      where s.id = from_submission_id and s.author_id = (select auth.uid())
    )
    or (select public.is_admin())
  );

create policy "connection_requests: admin manage" on public.connection_requests
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- ── Seed: one active grant call ─────────────────────────────────────────
insert into public.grant_calls (title, description, opens_at, closes_at, category, sections, criteria)
values (
  'Inkubator innowacji społecznych 2026',
  'Nabór pomysłów na innowacje społeczne w Małopolsce. Zgłoś swój pomysł, a ROPS pomoże go rozwinąć i przetestować.',
  '2026-10-01T00:00:00+02:00',
  '2026-10-31T23:59:59+01:00',
  'coordination',
  '[
    {"key": "problem", "label": "Problem społeczny", "type": "textarea", "hint": "Opisz problem, który chcesz rozwiązać.", "max": 1000},
    {"key": "solution", "label": "Rozwiązanie", "type": "textarea", "hint": "Jak działa Twoja innowacja?", "max": 1500},
    {"key": "audience", "label": "Odbiorcy", "type": "textarea", "hint": "Kto skorzysta z rozwiązania?", "max": 800},
    {"key": "resources", "label": "Zasoby i partnerzy", "type": "textarea", "hint": "Jakich zasobów i partnerów potrzebujesz?", "max": 1000},
    {"key": "budget", "label": "Szacunek budżetowy", "type": "number", "hint": "Orientacyjny koszt realizacji (PLN)."}
  ]'::jsonb,
  '[
    {"key": "social_challenge", "label": "Innowacja odpowiada na realne wyzwanie społeczne w Małopolsce"},
    {"key": "target_group", "label": "Grupa docelowa jest wyraźnie określona"},
    {"key": "feasibility", "label": "Plan realizacji jest wykonalny"},
    {"key": "scalability", "label": "Rozwiązanie można przenieść do innych gmin"},
    {"key": "budget", "label": "Budżet jest uzasadniony"}
  ]'::jsonb
);

-- ── API grants ──────────────────────────────────────────────────────────
grant select, insert, update, delete on public.grant_calls, public.call_alerts, public.connection_requests to service_role;
grant select on public.grant_calls to anon;
grant select, insert, delete on public.call_alerts to authenticated;
grant select, insert, update, delete on public.connection_requests to authenticated;
