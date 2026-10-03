-- Realtime: the admin inbox toast (A2) and the thread chat (C3) subscribe to
-- INSERTs on these tables. RLS still decides who receives an event.
--
-- `alter publication ... add table` is not idempotent, so membership is checked
-- first. This also repairs a hosted database where the statement in
-- 20261003120100_domain.sql never took effect: the channel subscribed and then
-- stayed silent, because the table was not in the publication.
do $$
declare
  target text;
begin
  foreach target in array array['submissions', 'messages'] loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = target
    ) then
      execute format('alter publication supabase_realtime add table public.%I', target);
    end if;
  end loop;
end $$;