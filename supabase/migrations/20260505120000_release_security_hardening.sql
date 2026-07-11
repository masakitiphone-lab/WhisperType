create or replace function public.refund_credit(user_id_param uuid, amount integer)
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
  set bonus_credits = bonus_credits + amount
  where id = user_id_param
  returning bonus_credits into remaining_credits;

  if remaining_credits is null then
    raise exception 'profile not found';
  end if;

  return remaining_credits;
end;
$$;

revoke execute on function public.ensure_profile(uuid, text, text, text) from public, anon;
revoke execute on function public.decrement_credits(uuid, integer) from public, anon, authenticated;
revoke execute on function public.refresh_daily_credits_if_needed(uuid) from public, anon;
revoke execute on function public.consume_transcription_credit(uuid, integer) from public, anon, authenticated;
revoke execute on function public.get_transcription_context() from public, anon;
revoke execute on function public.record_transcription(uuid, text, integer) from public, anon, authenticated;
revoke execute on function public.redeem_promo_code(text) from public, anon;
revoke execute on function public.grant_welcome_credits() from public, anon;
revoke execute on function public.refund_credit(uuid, integer) from public, anon, authenticated;

grant execute on function public.ensure_profile(uuid, text, text, text) to authenticated;
grant execute on function public.refresh_daily_credits_if_needed(uuid) to authenticated, service_role;
grant execute on function public.consume_transcription_credit(uuid, integer) to service_role;
grant execute on function public.get_transcription_context() to authenticated;
grant execute on function public.record_transcription(uuid, text, integer) to service_role;
grant execute on function public.redeem_promo_code(text) to authenticated;
grant execute on function public.grant_welcome_credits() to authenticated;
grant execute on function public.refund_credit(uuid, integer) to service_role;

do $$
begin
  if to_regprocedure('public.record_transcription(text, integer)') is not null then
    revoke execute on function public.record_transcription(text, integer) from public, anon;
    grant execute on function public.record_transcription(text, integer) to authenticated;
  end if;
end $$;
