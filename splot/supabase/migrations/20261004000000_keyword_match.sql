-- D7 Keyword matching in match_innovations (SPL-65).
-- plainto_tsquery ANDs every word with no stemming, so a query like
-- "samotność seniorów na wsi" never hit the full-text index. Keywords are
-- now OR-ed and prefix-matched on their first 5 letters, a cheap stand-in for
-- a Polish stemmer (there is no stock `polish` text search config).

create function public.keyword_tsquery(query_text text)
returns tsquery
language sql immutable parallel safe set search_path = ''
as $$
  select to_tsquery('simple', string_agg(distinct left(word, 5) || ':*', ' | '))
  from regexp_split_to_table(lower(public.immutable_unaccent(coalesce(query_text, ''))), '[^a-z0-9]+') as word
  where length(word) >= 3
    and word <> all (array[
      'ale', 'albo', 'aby', 'bardzo', 'bez', 'byc', 'byl', 'byla', 'bylo', 'cos', 'czy', 'dla', 'gdy',
      'ich', 'jak', 'jako', 'jednak', 'jego', 'jej', 'jest', 'jestem', 'juz', 'kiedy', 'ktora',
      'ktore', 'ktorego', 'ktory', 'ktorzy', 'ktos', 'lub', 'mam', 'mamy', 'mnie', 'moj', 'moja',
      'moje', 'moim', 'mojej', 'nad', 'nam', 'nas', 'nasz', 'nasza', 'nasze', 'naszej', 'naszym',
      'nie', 'oraz', 'pod', 'przez', 'przy', 'sie', 'sobie', 'tak', 'tam', 'tego', 'tej', 'temu',
      'ten', 'tez', 'tylko', 'tym', 'umie', 'wiec', 'zeby'
    ])
$$;

create or replace function public.match_innovations(
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
  with keywords as (
    select public.keyword_tsquery(query_text) as q
  ),
  text_ranks as (
    select
      i.id,
      row_number() over (order by ts_rank_cd(i.fts, k.q) desc) as rank
    from public.innovations i, keywords k
    where k.q is not null
      and i.fts @@ k.q
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

grant execute on function public.keyword_tsquery to anon, authenticated;
grant execute on function public.match_innovations to anon, authenticated;
