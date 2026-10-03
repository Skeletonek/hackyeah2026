-- Supabase projects created after 2026-05-30 no longer grant API roles access
-- to new public tables by default. Grant the minimum per table here; RLS
-- policies still decide which rows each role can see or change.
-- Every new table needs its own grants in the migration that creates it.

-- service_role (lib/supabase/admin.ts) bypasses RLS but still needs privileges.
grant select, insert, update, delete on
  public.profiles, public.innovations, public.submissions, public.pilots,
  public.pilot_reviews, public.threads, public.thread_participants, public.messages
  to service_role;
grant usage, select on sequence public.submissions_case_number_seq to service_role;

-- profiles: rows are created by a trigger; users edit only descriptive fields.
grant select on public.profiles to authenticated;
grant update (display_name, organization, municipality) on public.profiles to authenticated;

-- innovations: public catalogue; writes are admin-only via RLS.
grant select on public.innovations to anon;
grant select, insert, update, delete on public.innovations to authenticated;

-- submissions: authors insert content columns only (case number, token and
-- triage come from defaults or admins). Anonymous visitors use track_submission().
grant select, update, delete on public.submissions to authenticated;
grant insert (kind, body, municipality, county, contact_email) on public.submissions to authenticated;
-- The case_number default calls nextval() as the inserting role.
grant usage on sequence public.submissions_case_number_seq to authenticated;

-- pilots: applicants insert their application; status changes are admin-only via RLS.
grant select, update, delete on public.pilots to authenticated;
grant insert (innovation_id, organization_type, municipality, plan, contact_email) on public.pilots to authenticated;

-- pilot_reviews: approved public reviews are visible on innovation pages.
grant select on public.pilot_reviews to anon;
grant select, insert, update, delete on public.pilot_reviews to authenticated;

-- threads and messages: participants only (RLS); no anonymous visitors.
grant select, insert, update, delete on public.threads to authenticated;
grant select, insert, delete on public.thread_participants to authenticated;
grant select, insert on public.messages to authenticated;

-- set_user_role() checks is_admin() inside; signed-in users may call it.
grant execute on function public.set_user_role to authenticated;
