-- Public pilot reviews for the innovation page (SPL-38).
-- `pilots` is readable only by its owner and admins, so this RPC returns just
-- the approved, public reviews for one innovation.

create function public.public_pilot_reviews(p_innovation_id uuid)
returns table (
  id uuid,
  rating smallint,
  feedback text,
  improvement text,
  attribution text
)
language sql stable security definer set search_path = ''
as $$
  select r.id, r.rating, r.feedback, r.improvement, r.attribution
  from public.pilot_reviews r
  join public.pilots p on p.id = r.pilot_id
  where p.innovation_id = p_innovation_id
    and r.approved
    and r.is_public
  order by r.created_at desc
$$;

revoke execute on function public.public_pilot_reviews from public;
grant execute on function public.public_pilot_reviews to anon, authenticated;
