create table if not exists public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  reward_credits integer not null default 999 check (reward_credits > 0),
  max_redemptions integer not null default 1 check (max_redemptions > 0),
  redeemed_count integer not null default 0 check (redeemed_count >= 0),
  is_active boolean not null default true,
  expires_at timestamptz null,
  note text null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.promo_redemptions (
  id uuid primary key default gen_random_uuid(),
  code_id uuid not null references public.promo_codes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  code text not null,
  reward_credits integer not null check (reward_credits > 0),
  created_at timestamptz not null default timezone('utc', now()),
  unique (code_id, user_id)
);

create index if not exists promo_codes_active_expires_idx
  on public.promo_codes (is_active, expires_at);

create index if not exists promo_redemptions_user_created_idx
  on public.promo_redemptions (user_id, created_at desc);

drop trigger if exists promo_codes_set_updated_at on public.promo_codes;
create trigger promo_codes_set_updated_at
before update on public.promo_codes
for each row
execute function public.set_updated_at();

alter table public.promo_codes enable row level security;
alter table public.promo_redemptions enable row level security;

drop policy if exists "Users can read own promo redemptions" on public.promo_redemptions;
create policy "Users can read own promo redemptions"
on public.promo_redemptions
for select
to authenticated
using (auth.uid() = user_id);

create unique index if not exists promo_redemptions_user_once_idx
  on public.promo_redemptions (user_id);

create or replace function public.redeem_promo_code(input_code text)
returns table(
  status text,
  message text,
  reward_credits integer,
  remaining_credits integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid;
  target_code public.promo_codes%rowtype;
  existing_redemption public.promo_redemptions%rowtype;
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    return query
    select
      'auth_required'::text,
      'You need to sign in before redeeming a promotion code.'::text,
      null::integer,
      null::integer;
    return;
  end if;

  if input_code is null or btrim(input_code) = '' then
    return query
    select
      'invalid_code'::text,
      'Enter a valid promotion code.'::text,
      null::integer,
      null::integer;
    return;
  end if;

  select *
  into existing_redemption
  from public.promo_redemptions
  where user_id = current_user_id
  limit 1;

  if found then
    return query
    select
      'already_redeemed'::text,
      'A promotion code has already been claimed on this account.'::text,
      existing_redemption.reward_credits,
      (select credits from public.profiles where id = current_user_id);
    return;
  end if;

  select *
  into target_code
  from public.promo_codes
  where code = input_code
  for update;

  if not found then
    return query
    select
      'invalid_code'::text,
      'This promotion code is not valid.'::text,
      null::integer,
      null::integer;
    return;
  end if;

  if not target_code.is_active then
    return query
    select
      'inactive_code'::text,
      'This promotion code is no longer active.'::text,
      null::integer,
      null::integer;
    return;
  end if;

  if target_code.expires_at is not null and target_code.expires_at <= timezone('utc', now()) then
    return query
    select
      'expired_code'::text,
      'This promotion code has expired.'::text,
      null::integer,
      null::integer;
    return;
  end if;

  if target_code.redeemed_count >= target_code.max_redemptions then
    return query
    select
      'fully_redeemed'::text,
      'This promotion code is no longer available.'::text,
      null::integer,
      null::integer;
    return;
  end if;

  update public.profiles
  set credits = credits + target_code.reward_credits
  where id = current_user_id;

  insert into public.promo_redemptions (
    code_id,
    user_id,
    code,
    reward_credits
  )
  values (
    target_code.id,
    current_user_id,
    target_code.code,
    target_code.reward_credits
  );

  update public.promo_codes
  set redeemed_count = redeemed_count + 1
  where id = target_code.id;

  return query
  select
    'redeemed'::text,
    'Promotion code applied successfully.'::text,
    target_code.reward_credits,
    (select credits from public.profiles where id = current_user_id);
end;
$$;

grant select on public.promo_redemptions to authenticated;
grant execute on function public.redeem_promo_code(text) to authenticated;

comment on table public.promo_codes is
'Admin-managed promotion codes. Edit reward_credits, expires_at, is_active, or delete rows directly from Supabase Studio.';

comment on function public.redeem_promo_code(text) is
'Redeems a promotion code exactly as entered. Code matching is case-sensitive.';
