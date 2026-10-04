-- L2 (SPL-37): public numbers and places for the innovation page.
-- `pilots` is readable only by its owner and admins, so these return just
-- aggregates and places, never user ids or e-mails. Published innovations only.

create function public.pilot_stats(p_innovation_id uuid)
returns table (
  avg_rating numeric,
  review_count int,
  active_pilots int
)
language sql stable security definer set search_path = ''
as $$
  select
    (
      select round(avg(r.rating), 1)
      from public.pilot_reviews r
      join public.pilots p on p.id = r.pilot_id
      where p.innovation_id = i.id and r.approved and r.is_public
    ),
    (
      select count(*)::int
      from public.pilot_reviews r
      join public.pilots p on p.id = r.pilot_id
      where p.innovation_id = i.id and r.approved and r.is_public
    ),
    (
      select count(*)::int
      from public.pilots p
      where p.innovation_id = i.id and p.status = 'in_progress'
    )
  from public.innovations i
  where i.id = p_innovation_id and i.published
$$;

revoke execute on function public.pilot_stats from public;
grant execute on function public.pilot_stats to anon, authenticated;

-- „Gdzie już działa”: places that are testing or have tested the innovation.
create function public.public_pilot_places(p_innovation_id uuid)
returns table (
  municipality text,
  organization_type public.organization_type,
  status public.pilot_status
)
language sql stable security definer set search_path = ''
as $$
  select p.municipality, p.organization_type, p.status
  from public.pilots p
  join public.innovations i on i.id = p.innovation_id
  where p.innovation_id = p_innovation_id
    and i.published
    and p.status in ('in_progress', 'completed')
  -- Finished pilots first: they are the stronger proof.
  order by p.status desc, p.municipality
$$;

revoke execute on function public.public_pilot_places from public;
grant execute on function public.public_pilot_places to anon, authenticated;
