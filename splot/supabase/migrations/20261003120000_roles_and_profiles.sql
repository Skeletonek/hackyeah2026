-- Global roles. Pilot participant, innovation author and thread participant
-- are relations (pilots, innovations.author_id, thread_participants), not roles.
create type public.user_role as enum ('user', 'expert', 'admin');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'user',
  display_name text,
  organization text,
  municipality text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Only admins (or SQL / the secret key) change roles. Users may edit only
-- their descriptive fields.
revoke insert, update on public.profiles from anon, authenticated;
grant update (display_name, organization, municipality) on public.profiles to authenticated;

-- RLS helpers. security definer reads profiles without RLS recursion;
-- an empty search_path prevents object shadowing.
create function public.current_user_role()
returns public.user_role
language sql stable security definer set search_path = ''
as $$
  select role from public.profiles where id = (select auth.uid())
$$;

create function public.is_admin()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select coalesce(public.current_user_role() = 'admin', false)
$$;

create policy "profiles: read own" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

create policy "profiles: update own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "profiles: admin reads all" on public.profiles
  for select to authenticated
  using ((select public.is_admin()));

-- Every account (anonymous ones too) gets a profile with the 'user' role.
create function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Lets an admin assign roles (e.g. from the admin panel) without the secret key.
create function public.set_user_role(p_user_id uuid, p_role public.user_role)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can assign roles' using errcode = '42501';
  end if;
  update public.profiles set role = p_role where id = p_user_id;
end;
$$;

revoke execute on function public.set_user_role from public, anon;
