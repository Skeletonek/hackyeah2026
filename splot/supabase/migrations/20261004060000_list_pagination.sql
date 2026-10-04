-- SPL-77: every list reads one page at a time (`?page=N`, `.range()` + count).
-- What a page needs from the database:
--   1. threads keep their last activity, so the message inboxes can sort and
--      page in SQL instead of reading every message into the app;
--   2. match_innovations filters by stage and target group and skips rows, so
--      library search pages over the whole ranked set, not over the top 24;
--   3. indexes behind each list's sort order.

-- ── 1. Thread activity ──────────────────────────────────────────────────
alter table public.threads
  add column last_message_at timestamptz,
  -- The submission's author wrote last, so ROPS owes a reply.
  add column awaiting_reply boolean not null default false;

update public.threads t
set
  last_message_at = coalesce(last.created_at, t.created_at),
  awaiting_reply = coalesce(last.author_id = s.author_id, false)
from public.threads src
left join public.submissions s on s.id = src.submission_id
left join lateral (
  select m.created_at, m.author_id
  from public.messages m
  where m.thread_id = src.id and not m.from_assistant
  order by m.created_at desc
  limit 1
) last on true
where src.id = t.id;

alter table public.threads
  alter column last_message_at set default now(),
  alter column last_message_at set not null;

create index on public.threads (last_message_at desc, id);
create index on public.threads (awaiting_reply) where awaiting_reply;

-- Participants cannot update threads under RLS, hence security definer.
create function public.touch_thread_on_message()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  update public.threads t
  set
    last_message_at = new.created_at,
    awaiting_reply = coalesce(
      new.author_id = (select s.author_id from public.submissions s where s.id = t.submission_id),
      false
    )
  where t.id = new.thread_id;
  return new;
end;
$$;

-- AI hints are never part of the conversation.
create trigger on_message_created
  after insert on public.messages
  for each row
  when (not new.from_assistant)
  execute function public.touch_thread_on_message();

-- ── 2. Library search over the whole ranked set ─────────────────────────
drop function public.match_innovations(text, extensions.vector, int, public.challenge_category[]);

create function public.match_innovations(
  query_text text,
  query_embedding extensions.vector(1536),
  match_count int default 5,
  filter_categories public.challenge_category[] default null,
  filter_stage public.innovation_stage default null,
  filter_target_group public.target_group default null,
  match_offset int default 0
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
  with published as (
    select count(*) as total from public.innovations where published
  ),
  candidates as (
    select i.*
    from public.innovations i
    where i.published
      and (filter_categories is null or i.categories && filter_categories)
      and (filter_stage is null or i.stage = filter_stage)
      and (filter_target_group is null or i.target_groups @> array[filter_target_group])
  ),
  prefixes as (
    select p, to_tsquery('simple', p || ':*') as q
    from unnest(public.keyword_prefixes(query_text)) as p
  ),
  keywords as (
    select to_tsquery('simple', string_agg(x.p || ':*', ' | ')) as q
    from prefixes x, published
    where (
      select count(*) from public.innovations i where i.published and i.fts @@ x.q
    ) <= greatest(3, published.total / 4)
  ),
  text_ranks as (
    select
      c.id,
      row_number() over (order by ts_rank_cd(c.fts, k.q) desc) as rank
    from candidates c, keywords k
    where k.q is not null and c.fts @@ k.q
  ),
  vector_ranks as (
    select
      c.id,
      row_number() over (order by c.embedding <=> query_embedding) as rank
    from candidates c
  ),
  combined as (
    select
      c.id,
      c.slug,
      c.title,
      c.lead,
      c.categories,
      c.stage,
      coalesce(sum(1.0 / (60 + t.rank)), 0.0) * 0.5 +
      coalesce(sum(1.0 / (60 + v.rank)), 0.0) * 0.5 as score
    from candidates c
    left join text_ranks t on t.id = c.id
    left join vector_ranks v on v.id = c.id
    where t.id is not null or v.id is not null
    group by c.id, c.slug, c.title, c.lead, c.categories, c.stage
  )
  select * from combined
  -- `id` breaks ties, so neighbouring pages never repeat or skip a row.
  order by score desc, id
  limit match_count
  offset match_offset;
$$;

grant execute on function public.match_innovations to anon, authenticated;

-- ── 3. Indexes behind the list orders ───────────────────────────────────
create index on public.submissions (created_at desc, id);
create index on public.submissions (author_id, created_at desc);
create index on public.innovations (updated_at desc, id);
create index on public.pilots (created_at desc, id);
create index on public.pilot_reviews (created_at, id);
create index on public.connection_requests (status, created_at desc);
create index on public.grant_calls (closes_at desc, id);
