alter table public.profiles
add column if not exists ms_store_plus_active boolean not null default false,
add column if not exists ms_store_plus_store_id text,
add column if not exists ms_store_plus_checked_at timestamptz;

create or replace function public.get_transcription_context()
returns table(
  user_id uuid,
  daily_credits integer,
  bonus_credits integer,
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
    p.daily_credits,
    p.bonus_credits,
    case
      when p.plan = 'plus' or p.ms_store_plus_active then null
      else coalesce(p.daily_credits, 0) + coalesce(p.bonus_credits, 0)
    end,
    case
      when p.plan = 'plus' or p.ms_store_plus_active then 'plus'
      else 'free'
    end,
    (p.plan = 'plus' or p.ms_store_plus_active)
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
  profile_plan text;
  has_store_plus boolean;
  plus_daily_count integer;
begin
  if credits_used_param <= 0 then
    raise exception 'credits_used must be positive';
  end if;

  select plan, ms_store_plus_active
  into profile_plan, has_store_plus
  from public.profiles
  where id = user_id_param
  for update;

  if profile_plan is null then
    raise exception 'profile_unavailable';
  end if;

  if profile_plan = 'plus' or has_store_plus then
    select count(*)::integer
    into plus_daily_count
    from public.transcription_history
    where user_id = user_id_param
      and created_at >= timezone('utc', current_date);

    if plus_daily_count >= 999 then
      raise exception 'daily_limit_exceeded';
    end if;

    new_remaining_credits := null;
  else
    new_remaining_credits := public.consume_transcription_credit(user_id_param, credits_used_param);
  end if;

  insert into public.transcription_history (user_id, transcribed_text, credits_used)
  values (user_id_param, coalesce(transcribed_text_param, ''), credits_used_param)
  returning id into new_history_id;

  return query
  select new_history_id, new_remaining_credits;
end;
$$;

create or replace function public.sync_ms_store_plus_entitlement(
  user_id_param uuid,
  store_id_param text,
  active_param boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set ms_store_plus_active = active_param,
      ms_store_plus_store_id = nullif(store_id_param, ''),
      ms_store_plus_checked_at = timezone('utc', now()),
      updated_at = timezone('utc', now())
  where id = user_id_param;

  if not found then
    raise exception 'profile_unavailable';
  end if;
end;
$$;

revoke execute on function public.get_transcription_context() from public, anon;
revoke execute on function public.record_transcription(uuid, text, integer) from public, anon, authenticated;
revoke execute on function public.sync_ms_store_plus_entitlement(uuid, text, boolean) from public, anon, authenticated;
grant execute on function public.get_transcription_context() to authenticated;
grant execute on function public.record_transcription(uuid, text, integer) to service_role;
grant execute on function public.sync_ms_store_plus_entitlement(uuid, text, boolean) to service_role;
