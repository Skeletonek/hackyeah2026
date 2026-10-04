-- C1 (SPL-56): in-app notifications behind the header bell. Rows are written
-- only by notify() on the server (secret key); the recipient reads them and
-- marks them as read.

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  -- submission_received | thread_reply | status_changed | call_published
  type text not null,
  submission_id uuid references public.submissions (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 300),
  -- In-app path, e.g. a tracking link.
  link text not null check (link like '/%'),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index on public.notifications (user_id, created_at desc);
create index on public.notifications (user_id) where read_at is null;
alter table public.notifications enable row level security;

create policy "notifications: recipient reads own" on public.notifications
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "notifications: recipient marks own as read" on public.notifications
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- No client insert or delete. Recipients may only change read_at.
grant select, insert, update, delete on public.notifications to service_role;
grant select on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;

-- The bell refreshes on INSERT. RLS still decides who receives an event.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;
