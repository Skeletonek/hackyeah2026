-- The "grant_calls: admin manages" policy had no table privilege behind it:
-- `authenticated` could only select, so the configurator (/admin/calls) got
-- permission denied. RLS still limits the writes to admins.
grant insert, update on public.grant_calls to authenticated;
