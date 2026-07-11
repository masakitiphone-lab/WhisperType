alter table public.profiles
add column if not exists daily_credits integer not null default 50 check (daily_credits >= 0),
add column if not exists daily_credits_refreshed_on date not null default current_date;

update public.profiles
set daily_credits = coalesce(daily_credits, 50),
    daily_credits_refreshed_on = coalesce(daily_credits_refreshed_on, current_date);

create or replace function public.refresh_daily_credits_if_needed(user_id_param uuid)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_row public.profiles;
begin
  update public.profiles
  set daily_credits = 50,
      daily_credits_refreshed_on = current_date,
      updated_at = timezone('utc', now())
  where id = user_id_param
    and plan = 'free'
    and daily_credits_refreshed_on < current_date;

  select *
  into profile_row
  from public.profiles
  where id = user_id_param;

  return profile_row;
end;
$$;

create or replace function public.consume_transcription_credit(user_id_param uuid, amount integer default 1)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_row public.profiles;
  remaining_amount integer;
  next_daily_credits integer;
  next_bonus_credits integer;
begin
  if amount <= 0 then
    raise exception 'amount must be positive';
  end if;

  perform public.refresh_daily_credits_if_needed(user_id_param);

  select *
  into profile_row
  from public.profiles
  where id = user_id_param
  for update;

  if profile_row.id is null then
    raise exception 'profile_unavailable';
  end if;

  if profile_row.plan = 'plus' then
    return null;
  end if;

  if coalesce(profile_row.daily_credits, 0) + coalesce(profile_row.credits, 0) < amount then
    raise exception 'insufficient credits';
  end if;

  remaining_amount := amount;
  next_daily_credits := coalesce(profile_row.daily_credits, 0);
  next_bonus_credits := coalesce(profile_row.credits, 0);

  if next_daily_credits >= remaining_amount then
    next_daily_credits := next_daily_credits - remaining_amount;
    remaining_amount := 0;
  else
    remaining_amount := remaining_amount - next_daily_credits;
    next_daily_credits := 0;
  end if;

  if remaining_amount > 0 then
    next_bonus_credits := next_bonus_credits - remaining_amount;
  end if;

  update public.profiles
  set daily_credits = next_daily_credits,
      credits = next_bonus_credits,
      updated_at = timezone('utc', now())
  where id = user_id_param;

  return next_daily_credits + next_bonus_credits;
end;
$$;

create or replace function public.get_transcription_context()
returns table(
  user_id uuid,
  credits integer,
  daily_credits integer,
  available_credits integer,
  plan text,
  is_unlimited boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid;
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception 'authentication required';
  end if;

  perform public.refresh_daily_credits_if_needed(current_user_id);

  return query
  select
    p.id,
    p.credits,
    p.daily_credits,
    case
      when p.plan = 'plus' then null
      else coalesce(p.credits, 0) + coalesce(p.daily_credits, 0)
    end,
    p.plan,
    (p.plan = 'plus')
  from public.profiles p
  where p.id = current_user_id;
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
  new_remaining_credits := public.consume_transcription_credit(user_id_param, credits_used_param);

  insert into public.transcription_history (user_id, transcribed_text, credits_used)
  values (user_id_param, coalesce(transcribed_text_param, ''), credits_used_param)
  returning id into new_history_id;

  return query
  select new_history_id, new_remaining_credits;
end;
$$;

grant execute on function public.refresh_daily_credits_if_needed(uuid) to authenticated, service_role;
grant execute on function public.consume_transcription_credit(uuid, integer) to service_role;
grant execute on function public.get_transcription_context() to authenticated;
grant execute on function public.record_transcription(uuid, text, integer) to service_role;
