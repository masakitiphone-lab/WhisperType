create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  name text,
  avatar_url text,
  credits integer not null default 100 check (credits >= 0),
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.transcription_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  transcribed_text text not null default '',
  credits_used integer not null default 1 check (credits_used >= 0),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists transcription_history_user_id_created_at_idx
  on public.transcription_history (user_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, avatar_url)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'name', split_part(coalesce(new.email, ''), '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', '')
  )
  on conflict (id) do update
  set email = excluded.email,
      name = coalesce(nullif(excluded.name, ''), public.profiles.name),
      avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
      updated_at = timezone('utc', now());

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

insert into public.profiles (id, email, name, avatar_url)
select
  u.id,
  coalesce(u.email, ''),
  coalesce(u.raw_user_meta_data ->> 'name', split_part(coalesce(u.email, ''), '@', 1)),
  coalesce(u.raw_user_meta_data ->> 'avatar_url', '')
from auth.users u
on conflict (id) do nothing;

create or replace function public.decrement_credits(user_id_param uuid, amount integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  remaining_credits integer;
begin
  if amount <= 0 then
    raise exception 'amount must be positive';
  end if;

  update public.profiles
  set credits = credits - amount
  where id = user_id_param
    and credits >= amount
  returning credits into remaining_credits;

  if remaining_credits is null then
    raise exception 'insufficient credits';
  end if;

  return remaining_credits;
end;
$$;

create or replace function public.ensure_profile(
  user_id_param uuid,
  email_param text,
  name_param text default null,
  avatar_url_param text default null
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_row public.profiles;
  current_user_id uuid;
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception 'authentication required';
  end if;

  if current_user_id <> user_id_param then
    raise exception 'forbidden';
  end if;

  insert into public.profiles (id, email, name, avatar_url)
  values (
    user_id_param,
    coalesce(email_param, ''),
    nullif(name_param, ''),
    nullif(avatar_url_param, '')
  )
  on conflict (id) do update
  set email = excluded.email,
      name = coalesce(excluded.name, public.profiles.name),
      avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
      updated_at = timezone('utc', now());

  select *
  into profile_row
  from public.profiles
  where id = user_id_param;

  return profile_row;
end;
$$;

create or replace function public.record_transcription(
  user_id_param uuid,
  transcribed_text_param text,
  credits_used_param integer default 1
)
returns table(history_id uuid, remaining_credits integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  new_history_id uuid;
  new_remaining_credits integer;
begin
  new_remaining_credits := public.decrement_credits(user_id_param, credits_used_param);

  insert into public.transcription_history (user_id, transcribed_text, credits_used)
  values (user_id_param, coalesce(transcribed_text_param, ''), credits_used_param)
  returning id into new_history_id;

  return query
  select new_history_id, new_remaining_credits;
end;
$$;

alter table public.profiles enable row level security;
alter table public.transcription_history enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "Users can read own transcription history" on public.transcription_history;
create policy "Users can read own transcription history"
on public.transcription_history
for select
to authenticated
using (auth.uid() = user_id);

grant usage on schema public to anon, authenticated, service_role;
grant select, update on public.profiles to authenticated;
grant select on public.transcription_history to authenticated;
grant execute on function public.ensure_profile(uuid, text, text, text) to authenticated;
grant execute on function public.decrement_credits(uuid, integer) to service_role;
grant execute on function public.record_transcription(uuid, text, integer) to service_role;
