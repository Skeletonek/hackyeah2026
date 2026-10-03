-- C2 (SPL-57): the thread behind a tracking link, readable without an account.
-- Case number + token from the link, like track_submission(). Returns only the
-- text, the time and which side wrote it: no names, no ids.

create function public.track_submission_messages(p_case_number text, p_token uuid)
returns table (
  body text,
  created_at timestamptz,
  is_staff boolean
)
language sql stable security definer set search_path = ''
as $$
  select m.body, m.created_at, m.author_id is distinct from s.author_id
  from public.submissions s
  join public.threads t on t.submission_id = s.id
  join public.messages m on m.thread_id = t.id
  where s.case_number = p_case_number
    and s.tracking_token = p_token
    -- AI hints in a thread are for the people answering, not for the link.
    and not m.from_assistant
  order by m.created_at
$$;

revoke execute on function public.track_submission_messages from public;
grant execute on function public.track_submission_messages to anon, authenticated;
