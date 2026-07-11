create table if not exists public.welcome_credit_grants (
  user_id uuid primary key references auth.users(id) on delete cascade,
  reward_credits integer not null default 300 check (reward_credits > 0),
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.welcome_credit_grants enable row level security;

drop policy if exists "Users can read own welcome credit grant" on public.welcome_credit_grants;
create policy "Users can read own welcome credit grant"
on public.welcome_credit_grants
for select
to authenticated
using (auth.uid() = user_id);

create or replace function public.grant_welcome_credits()
returns table(
  status text,
  reward_credits integer,
  remaining_credits integer,
  message text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid;
  grant_amount integer := 300;
  inserted_user_id uuid;
  updated_credits integer;
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    return query
    select 'auth_required'::text, null::integer, null::integer, 'Sign in is required.'::text;
    return;
  end if;

  insert into public.welcome_credit_grants (user_id, reward_credits)
  values (current_user_id, grant_amount)
  on conflict (user_id) do nothing
  returning user_id into inserted_user_id;

  if inserted_user_id is null then
    return query
    select
      'already_granted'::text,
      null::integer,
      (select credits from public.profiles where id = current_user_id),
      'Welcome credits have already been granted.'::text;
    return;
  end if;

  update public.profiles
  set credits = credits + grant_amount
  where id = current_user_id
  returning credits into updated_credits;

  if updated_credits is null then
    raise exception 'profile missing for welcome credits';
  end if;

  return query
  select
    'granted'::text,
    grant_amount,
    updated_credits,
    'Welcome credits granted.'::text;
end;
$$;

grant select on public.welcome_credit_grants to authenticated;
grant execute on function public.grant_welcome_credits() to authenticated;

comment on table public.welcome_credit_grants is
'Tracks one-time welcome credits per account.';

comment on function public.grant_welcome_credits() is
'Grants 300 welcome credits once per authenticated account.';
