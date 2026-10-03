-- D6 part 2 (SPL-21): live submission counts per county and challenge
-- category for the Challenge Map. Aggregates only: no ids, bodies, authors or
-- contact data, so anonymous visitors may call it.

create function public.county_submission_counts()
returns table (
  county text,
  category public.challenge_category,
  count int
)
language sql stable security definer set search_path = ''
as $$
  select s.county, s.category, count(*)::int
  from public.submissions s
  where s.county is not null
    and s.category is not null
  group by s.county, s.category
  order by s.county, s.category
$$;

revoke execute on function public.county_submission_counts from public;
grant execute on function public.county_submission_counts to anon, authenticated;
